// webVoiceService.ts — v0.5: refined voice selection (en-IN priority),
// updated speech settings, and an Indian-pronunciation normalization
// pass applied ONLY to spoken text (never to the visible chat message).
// Web-only; every browser API access is guarded so this file is safe
// to import on native without any crash risk. No new dependencies.

/* ---------------------------------------------------------------- */
/* Minimal Web Speech API type declarations (SpeechRecognition is    */
/* still experimental and not in the standard TS "dom" lib).         */
/* SpeechSynthesisUtterance / window.speechSynthesis / AudioContext  */
/* ARE part of the standard dom lib and are not redeclared.          */
/* ---------------------------------------------------------------- */

interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    webkitAudioContext?: typeof AudioContext;
  }
}

/* ---------------------------------------------------------------- */
/* Public types                                                      */
/* ---------------------------------------------------------------- */

export type VoiceActivityState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface WebVoiceCallbacks {
  onTranscript: (text: string) => void;
  onStateChange?: (state: VoiceActivityState) => void;
  onError?: (message: string) => void;
}

/* ---------------------------------------------------------------- */
/* Module state                                                       */
/* ---------------------------------------------------------------- */

let callbacks: WebVoiceCallbacks | null = null;
let activeRecognition: SpeechRecognition | null = null;
let speaking = false;

let audioContext: AudioContext | null = null;
let selectedVoice: SpeechSynthesisVoice | null = null;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

interface SentenceChunk {
  text: string;
  pauseAfterMs: number;
}

let utteranceQueue: SentenceChunk[] = [];
let queueIndex = 0;
let queueOnDone: (() => void) | undefined;

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isWebVoiceSupported(): boolean {
  return getRecognitionConstructor() !== null && hasSpeechSynthesis();
}

export function isSpeakingNow(): boolean {
  return speaking;
}

function mapRecognitionError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone access has not been authorized.';
    case 'no-speech':
      return 'No signal detected. Try again.';
    case 'network':
      return 'Voice uplink interrupted.';
    case 'aborted':
      return 'Listening interrupted.';
    case 'timeout':
      return 'Response delayed.';
    default:
      return 'Voice channel disrupted.';
  }
}

/* ---------------------------------------------------------------- */
/* Part E — Web Audio cues (synthesized, no audio files)             */
/* ---------------------------------------------------------------- */

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctor = window.AudioContext ?? window.webkitAudioContext ?? null;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

function playTone(freqStart: number, freqEnd: number, durationMs: number, type: OscillatorType, peakGain: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freqStart, now);
  oscillator.frequency.linearRampToValueAtTime(freqEnd, now + durationSec);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(peakGain, now + durationSec * 0.2);
  gainNode.gain.linearRampToValueAtTime(0, now + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSec);
}

function playListeningStartCue(): void {
  playTone(420, 880, 100, 'sine', 0.05);
}
function playListeningEndCue(): void {
  playTone(600, 480, 60, 'sine', 0.035);
}
function playSpeakingStartCue(): void {
  playTone(500, 640, 90, 'triangle', 0.045);
}
function playErrorCue(): void {
  playTone(180, 130, 110, 'sawtooth', 0.04);
}

/* ---------------------------------------------------------------- */
/* Part A — natural voice selection (en-IN, then Natural voices,     */
/* then Google fallbacks, then browser default)                     */
/* ---------------------------------------------------------------- */

const NAME_PREFERENCE_KEYWORDS = ['google english india','microsoft natural english india','google uk english male','google us english','ryan','guy','aria'];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    if (!hasSpeechSynthesis()) {
      resolve([]);
      return;
    }
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      clearInterval(pollInterval);
      resolve(voices);
    };
    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) finish(voices);
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    let attempts = 0;
    const pollInterval = setInterval(() => {
      attempts += 1;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 || attempts > 20) {
        finish(voices);
      }
    }, 150);
  });

  return voicesPromise;
}

/**
 * Preference order: (1) any voice whose lang is en-IN, (2) name match
 * against Ryan/Guy/Aria Online (Natural) in that order, (3) Google UK
 * English Male, (4) Google US English, (5) whatever the browser
 * reports first. Never uses a hardcoded array index into getVoices().
 */
async function getPreferredVoice(): Promise<SpeechSynthesisVoice | null> {
  if (selectedVoice) return selectedVoice;
  const voices = await loadVoices();
  if (voices.length === 0) return null;

  const enIndianVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en-in'));
  if (enIndianVoice) {
    selectedVoice = enIndianVoice;
    return enIndianVoice;
  }

  for (const keyword of NAME_PREFERENCE_KEYWORDS) {
    const match = voices.find((v) => v.name.toLowerCase().includes(keyword));
    if (match) {
      selectedVoice = match;
      return match;
    }
  }

  selectedVoice = voices[0] ?? null;
  return selectedVoice;
}

/* ---------------------------------------------------------------- */
/* Part B — Indian pronunciation dictionary (spoken text only,       */
/* NEVER applied to the visible chat message)                        */
/* ---------------------------------------------------------------- */

const PRONUNCIATION_MAP: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bPriyanshi\b/gi, replacement: 'Pri-yaan-shii' },
  { pattern: /\bJKLU\b/gi, replacement: 'J K L U' },
  { pattern: /\bDBMS\b/gi, replacement: 'D B M S' },
  { pattern: /\bDSA\b/gi, replacement: 'D S A' },
  { pattern: /\bCOA\b/gi, replacement: 'C O A' },
  { pattern: /\bPW\b/gi, replacement: 'P W' },
  { pattern: /\bAPI\b/gi, replacement: 'A P I' },
  { pattern: /\bUI\b/gi, replacement: 'U I' },
  { pattern: /\bUX\b/gi, replacement: 'U X' },
  { pattern: /\bAI\b/gi, replacement: 'A I' },
  { pattern: /\bJWT\b/gi, replacement: 'J W T' },
];

/**
 * Rewrites text for natural spoken pronunciation using word-boundary
 * replacements only. Returns a new string — the caller's original text
 * (the one shown in the chat bubble) is never mutated, since this
 * function is only ever called on a local copy inside speak().
 */
function normalizeForSpeech(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PRONUNCIATION_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/* ---------------------------------------------------------------- */
/* Part A — cinematic, sentence-paced speech                         */
/* ---------------------------------------------------------------- */

function splitIntoSentenceChunks(text: string): SentenceChunk[] {
  const matches = text.replace(/\n{2,}/g,'. ').match(/[^.!?,]+[.!?,]?/g);
  if (!matches) return [{ text, pauseAfterMs: 0 }];

  const chunks: SentenceChunk[] = [];
  for (const raw of matches) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    const lastChar = trimmed.charAt(trimmed.length - 1);
    let pause = 0;
    if (lastChar === ',') pause = 120;
    else if (lastChar === '.' || lastChar === '!' || lastChar === '?') pause = 260;
    chunks.push({ text: trimmed, pauseAfterMs: pause });
  }
  return chunks.length > 0 ? chunks : [{ text, pauseAfterMs: 0 }];
}

function speakNextChunk(): void {
  if (queueIndex >= utteranceQueue.length) {
    speaking = false;
    callbacks?.onStateChange?.('idle');
    const done = queueOnDone;
    queueOnDone = undefined;
    done?.();
    return;
  }

  const chunk = utteranceQueue[queueIndex];
  queueIndex += 1;

  const utterance = new SpeechSynthesisUtterance(chunk.text);
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  utterance.volume = 0.95;
  utterance.lang = selectedVoice?.lang ?? 'en-IN';
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onend = () => {
    if (chunk.pauseAfterMs > 0) {
      setTimeout(speakNextChunk, chunk.pauseAfterMs);
    } else {
      speakNextChunk();
    }
  };
  utterance.onerror = () => {
    speaking = false;
    callbacks?.onStateChange?.('idle');
    const done = queueOnDone;
    queueOnDone = undefined;
    done?.();
  };

  window.speechSynthesis.speak(utterance);
}

async function primeVoiceThenSpeak(): Promise<void> {
  try {
    selectedVoice = await getPreferredVoice();
  } catch {
    selectedVoice = null;
  }
  speakNextChunk();
}

/**
 * Speaks text aloud, split into sentence-paced chunks. The visible
 * chat text passed in by the caller is left completely untouched —
 * normalizeForSpeech() is applied to a LOCAL copy used only for the
 * utterance itself (Part B). Always cancels any currently-playing
 * speech first, so utterances never overlap.
 */
export function speak(text: string, onDone?: () => void): void {
  const clean = text.trim();

  if (!hasSpeechSynthesis() || clean.length === 0) {
    onDone?.();
    return;
  }

  window.speechSynthesis.cancel();
  speaking = true;
  callbacks?.onStateChange?.('speaking');
  playSpeakingStartCue();

  const spokenText = normalizeForSpeech(clean);
  utteranceQueue = splitIntoSentenceChunks(spokenText);
  queueIndex = 0;
  queueOnDone = onDone;

  void primeVoiceThenSpeak();
}

export function stopSpeaking(): void {
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel();
  }
  speaking = false;
  utteranceQueue = [];
  queueIndex = 0;
  queueOnDone = undefined;
}

/* ---------------------------------------------------------------- */
/* Recognition (Push-to-Talk) — unchanged mechanics                  */
/* ---------------------------------------------------------------- */

export function configureWebVoice(next: WebVoiceCallbacks): void {
  callbacks = next;
  if (hasSpeechSynthesis()) {
    void getPreferredVoice();
  }
}

export function teardownWebVoice(): void {
  callbacks = null;
}

export function startListening(): void {
  if (speaking) {
    stopSpeaking();
  }

  const Ctor = getRecognitionConstructor();
  if (!Ctor) {
    callbacks?.onError?.('Voice input is not available in this browser.');
    return;
  }

  if (activeRecognition) {
    try {
      activeRecognition.abort();
    } catch {
      // no-op
    }
    activeRecognition = null;
  }

  const instance = new Ctor();
  instance.lang = 'en-US';
  instance.continuous = false;
  instance.interimResults = false;
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    playListeningStartCue();
    callbacks?.onStateChange?.('listening');
  };

  instance.onresult = (event) => {
    const result = event.results.item(event.resultIndex);
    const best = result.item(0);
    const transcript = best.transcript.trim();
    if (transcript.length > 0) {
      callbacks?.onTranscript(transcript);
    } else {
      playErrorCue();
      callbacks?.onError?.('No signal detected. Try again.');
    }
  };

  instance.onerror = (event) => {
    playErrorCue();
    callbacks?.onError?.(mapRecognitionError(event.error));
  };

  instance.onend = () => {
    playListeningEndCue();
    activeRecognition = null;
  };

  activeRecognition = instance;

  try {
    instance.start();
  } catch {
    activeRecognition = null;
    playErrorCue();
    callbacks?.onError?.('Voice channel disrupted.');
  }
}

export function stopListening(): void {
  if (!activeRecognition) return;
  try {
    activeRecognition.stop();
  } catch {
    // no-op
  }
  activeRecognition = null;
}
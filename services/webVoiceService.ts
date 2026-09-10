// webVoiceService.ts — Browser-only Push-to-Talk layer for Expo Web
// (Chrome/Edge). Uses window.SpeechRecognition /
// window.webkitSpeechRecognition and window.speechSynthesis directly —
// no external packages, no native modules. Safe to import on native
// platforms: every browser API access is guarded by `typeof window`
// checks, so nothing here can crash Expo Go.
//
// This file owns ONLY the browser mic/TTS mechanics. It never touches
// the chat pipeline, memory, router, or weather logic — callers (the
// mic button) forward recognized transcripts into the existing
// services/chatBus.ts pipeline, exactly like a typed message.

/* ---------------------------------------------------------------- */
/* Minimal Web Speech API type declarations (not present in the     */
/* standard TS "dom" lib — SpeechRecognition is still experimental). */
/* SpeechSynthesisUtterance / window.speechSynthesis ARE part of the */
/* standard dom lib and are NOT redeclared here to avoid conflicts.  */
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

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function hasSpeechSynthesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** True only on a browser that supports both recognition and synthesis. */
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
    default:
      return 'Voice channel disrupted.';
  }
}

/** Registers callbacks for transcript/state/error events. Call once per mounted mic component. */
export function configureWebVoice(next: WebVoiceCallbacks): void {
  callbacks = next;
}

/** Clears registered callbacks — call on unmount to avoid stale closures. */
export function teardownWebVoice(): void {
  callbacks = null;
}

/**
 * Starts a single-utterance push-to-talk session. Always stops any
 * currently-playing speech first (per spec). Never throws — unsupported
 * browsers or start failures report through onError instead.
 */
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
    callbacks?.onStateChange?.('listening');
  };

  instance.onresult = (event) => {
    const result = event.results.item(event.resultIndex);
    const best = result.item(0);
    const transcript = best.transcript.trim();
    if (transcript.length > 0) {
      callbacks?.onTranscript(transcript);
    } else {
      callbacks?.onError?.('No signal detected. Try again.');
    }
  };

  instance.onerror = (event) => {
    callbacks?.onError?.(mapRecognitionError(event.error));
  };

  instance.onend = () => {
    activeRecognition = null;
  };

  activeRecognition = instance;

  try {
    instance.start();
  } catch {
    activeRecognition = null;
    callbacks?.onError?.('Voice channel disrupted.');
  }
}

/** Stops an in-progress listening session, if any. Safe to call when idle. */
export function stopListening(): void {
  if (!activeRecognition) return;
  try {
    activeRecognition.stop();
  } catch {
    // no-op
  }
  activeRecognition = null;
}

/**
 * Speaks text aloud via window.speechSynthesis. Always cancels any
 * currently-playing utterance first, so speech never overlaps.
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

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  utterance.onend = () => {
    speaking = false;
    callbacks?.onStateChange?.('idle');
    onDone?.();
  };
  utterance.onerror = () => {
    speaking = false;
    callbacks?.onStateChange?.('idle');
    onDone?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (hasSpeechSynthesis()) {
    window.speechSynthesis.cancel();
  }
  speaking = false;
}
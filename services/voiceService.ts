// voiceService.ts — Phase 17A: Voice Foundation only.
//
// Wraps expo-speech-recognition (STT) and expo-speech (TTS) behind a
// small typed API with a single source of truth for voice state. This
// phase intentionally stops at the plumbing:
//   - startListening()/stopListening() work and report real state.
//   - speak()/stopSpeaking() work in isolation.
//   - onTranscript is a prepared callback slot, not yet connected to
//     chat — Phase 17B will forward it into the conversation pipeline.
//   - Nothing here touches Groq, ConversationPanel's message list, or
//     the Arc Reactor.
//
// Requires a custom dev build — expo-speech-recognition ships native
// code and does not run inside Expo Go.

import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export type VoiceState = 'idle' | 'listening' | 'speaking';

export interface VoiceServiceCallbacks {
  onStateChange?: (state: VoiceState) => void;
  /** Reserved for Phase 17B — recognized speech is not yet forwarded anywhere. */
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
}

export interface VoiceActionResult {
  success: boolean;
  error?: string;
}

interface SpeechRecognitionResultItem {
  transcript?: string;
}

interface SpeechRecognitionResultEvent {
  results?: SpeechRecognitionResultItem[];
  isFinal?: boolean;
}

interface SpeechRecognitionErrorEvent {
  error?: string;
}

let state: VoiceState = 'idle';
let callbacks: VoiceServiceCallbacks = {};
let listenersRegistered = false;

function setState(next: VoiceState): void {
  state = next;
  callbacks.onStateChange?.(next);
}

function mapRecognitionError(code: string | undefined): string {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone access has not been authorized.';
    case 'no-speech':
      return 'No signal detected. Try again.';
    case 'network':
      return 'Voice uplink interrupted.';
    default:
      return 'Voice channel disrupted.';
  }
}

function registerListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  ExpoSpeechRecognitionModule.addListener('start', () => {
    setState('listening');
  });

  ExpoSpeechRecognitionModule.addListener('end', () => {
    if (state === 'listening') setState('idle');
  });

  ExpoSpeechRecognitionModule.addListener('result', (event) => {
    const typed = event as unknown as SpeechRecognitionResultEvent;
    const transcript = typed.results?.[0]?.transcript?.trim();
    if (transcript && typed.isFinal !== false) {
      // Phase 17B will decide what to do with this. In this phase the
      // callback simply exists — nothing currently consumes it to send
      // a chat message.
      callbacks.onTranscript?.(transcript);
    }
  });

  ExpoSpeechRecognitionModule.addListener('error', (event) => {
    const typed = event as unknown as SpeechRecognitionErrorEvent;
    setState('idle');
    callbacks.onError?.(mapRecognitionError(typed.error));
  });
}

/**
 * Registers callbacks for state/transcript/error events. Safe to call
 * on every mount of a consuming component — native listeners are only
 * ever attached once (registerListeners is idempotent).
 */
export function configureVoiceService(next: VoiceServiceCallbacks): void {
  callbacks = next;
  registerListeners();
}

/**
 * Clears registered callbacks (Task 4 — safe cleanup). Call this from a
 * component's unmount effect so it stops receiving events and holds no
 * stale closures. Native listeners themselves stay attached for the
 * app's lifetime (the underlying module has no "remove all" API), but
 * become inert once callbacks are cleared here.
 */
export function teardownVoiceService(): void {
  callbacks = {};
}

export function getVoiceState(): VoiceState {
  return state;
}

/** Never throws — resolves false on any failure so callers can show an immersive message instead of crashing. */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const result = (await ExpoSpeechRecognitionModule.requestPermissionsAsync()) as unknown as {
      granted?: boolean;
    };
    return Boolean(result?.granted);
  } catch {
    return false;
  }
}

export async function startListening(): Promise<VoiceActionResult> {
  registerListeners();

  if (state === 'speaking') {
    stopSpeaking();
  }

  const granted = await requestMicPermission();
  if (!granted) {
    const message = 'Microphone access has not been authorized.';
    callbacks.onError?.(message);
    return { success: false, error: message };
  }

  try {
    ExpoSpeechRecognitionModule.start(
      {
        lang: 'en-US',
        interimResults: false,
        continuous: false,
        maxAlternatives: 1,
      }
    );
    return { success: true };
  } catch {
    const message = 'Voice channel disrupted.';
    callbacks.onError?.(message);
    return { success: false, error: message };
  }
}

export function stopListening(): void {
  try {
    ExpoSpeechRecognitionModule.stop();
  } catch {
    // Nothing to stop — safe no-op.
  }
  if (state === 'listening') setState('idle');
}

/** Not invoked anywhere yet in this phase — reserved for Phase 17B (speaking JARVIS's reply aloud). */
export function speak(text: string, onDone?: () => void): void {
  const clean = text.trim();
  if (!clean) return;

  if (state === 'speaking') {
    void Speech.stop();
  }
  setState('speaking');

  Speech.speak(clean, {
    rate: 1.0,
    pitch: 1.0,
    onDone: () => {
      setState('idle');
      onDone?.();
    },
    onStopped: () => {
      setState('idle');
    },
    onError: () => {
      setState('idle');
    },
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
  if (state === 'speaking') setState('idle');
}
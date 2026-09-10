// voice/index.ts
// Real Voice Engine — Phase 18. Uses expo-speech-recognition (STT) and
// expo-speech (TTS) only, per spec. Requires a custom dev build (not
// Expo Go) since expo-speech-recognition ships native code — see the
// project notes for the app.json plugin entry that must be added.
//
// TypeScript note: expo-speech-recognition's exact event payload shape
// can vary slightly by installed version. To stay strictly typed
// without using `any`, event objects are received as the module's own
// inferred type and cast through `unknown` into the small local
// interfaces below before being read. If your installed version's
// event fields differ, only these two interfaces need updating.

import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export interface VoiceCallbacks {
  onTranscript: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
  onError: (message: string) => void;
}

export interface VoiceResult {
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

let callbacks: VoiceCallbacks | null = null;
let listenersRegistered = false;
let listening = false;
let speaking = false;

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

function ensureListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  ExpoSpeechRecognitionModule.addListener('start', () => {
    listening = true;
    callbacks?.onListeningChange(true);
  });

  ExpoSpeechRecognitionModule.addListener('end', () => {
    listening = false;
    callbacks?.onListeningChange(false);
  });

  ExpoSpeechRecognitionModule.addListener('result', (event) => {
    const typed = event as unknown as SpeechRecognitionResultEvent;
    const transcript = typed.results?.[0]?.transcript?.trim();
    if (transcript && typed.isFinal !== false) {
      callbacks?.onTranscript(transcript);
    }
  });

  ExpoSpeechRecognitionModule.addListener('error', (event) => {
    const typed = event as unknown as SpeechRecognitionErrorEvent;
    listening = false;
    callbacks?.onListeningChange(false);
    callbacks?.onError(mapRecognitionError(typed.error));
  });
}

/** Registers callbacks used by every start/stop/result/error event. Safe to call from a component's useEffect on every mount — internal listeners are only ever attached once. */
export function configureVoice(next: VoiceCallbacks): void {
  callbacks = next;
  ensureListeners();
}

export function isListening(): boolean {
  return listening;
}

export function isSpeakingNow(): boolean {
  return speaking;
}

/** Requests microphone + speech-recognition permission. Never throws — returns false on any failure so callers can show an immersive message instead of crashing. */
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

/**
 * Starts a listening session. Always stops any in-progress speech first
 * (per spec: pressing mic while JARVIS is speaking stops speech and
 * starts listening). Requests permission if needed; on denial, reports
 * an immersive error and does not start.
 */
export async function startListening(): Promise<VoiceResult> {
  ensureListeners();

  if (speaking) {
    stopSpeaking();
  }

  const granted = await requestMicPermission();

  if (!granted) {
    const message = "Microphone access has not been authorized.";
    callbacks?.onError(message);
    return { success: false, error: message };
  }

  try {
  ExpoSpeechRecognitionModule.start({
    lang: "en-US",
    interimResults: false,
    continuous: false,
    maxAlternatives: 1,
  });

  listening = true;
  callbacks?.onListeningChange(true);

  return { success: true };
} catch {
  const message = "Voice channel disrupted.";
  callbacks?.onError(message);

  return { success: false, error: message };
}
}

export function stopListening(): void {
  try {
    void ExpoSpeechRecognitionModule.stop();
  } catch {
    // Nothing to stop — safe no-op.
  }

  listening = false;
  callbacks?.onListeningChange(false);
}

/**
 * Speaks text aloud. Never overlaps — any currently-playing speech is
 * stopped before the new utterance begins.
 */
export function speak(text: string, onDone?: () => void): void {
  const clean = text.trim();

  if (!clean) return;

  if (speaking) {
  void Speech.stop();
}

  speaking = true;

  Speech.speak(clean, {
    rate: 1.0,
    pitch: 1.0,

    onDone: () => {
      speaking = false;
      onDone?.();
    },

    onStopped: () => {
      speaking = false;
    },

    onError: () => {
      speaking = false;
    },
  });
}

export function stopSpeaking(): void {
  void Speech.stop();
  speaking = false;
}
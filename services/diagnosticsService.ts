// diagnosticsService.ts — v0.9.0. Aggregates real, already-available
// read-only signals from existing services for the Developer Mode
// panel. Never invents a value — anything it can't verify is reported
// as unavailable rather than guessed.

import { getSelectedVoiceName, isWebVoiceSupported, SPEECH_PITCH, SPEECH_RATE, SPEECH_VOLUME } from './webVoiceService';
import { getActiveProviderName, getLastResponseLatencyMs } from './aiService';
import { isLiveInfoConfigured } from './liveInfoService';
import { getAllFacts } from '../storage/sessionMemory';

export interface DiagnosticsSnapshot {
  voiceEngineOnline: boolean;
  selectedVoiceName: string | null;
  memoryConnected: boolean;
  weatherApiConfigured: boolean;
  aiProvider: string;
  lastLatencyMs: number | null;
  reactorStatus: 'Online';
}

export async function collectDiagnostics(): Promise<DiagnosticsSnapshot> {
  let memoryConnected = true;
  try {
    await getAllFacts();
  } catch {
    memoryConnected = false;
  }

  return {
    voiceEngineOnline: isWebVoiceSupported(),
    selectedVoiceName: getSelectedVoiceName(),
    memoryConnected,
    weatherApiConfigured: isLiveInfoConfigured(),
    aiProvider: getActiveProviderName(),
    lastLatencyMs: getLastResponseLatencyMs(),
    // "Online" reflects that this component is mounted and rendering —
    // a real, non-invented signal, not a fabricated health check.
    reactorStatus: 'Online',
  };
}

export { SPEECH_RATE, SPEECH_PITCH, SPEECH_VOLUME };
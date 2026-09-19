// aiService.ts — v0.9.0: added a try/finally latency timer around the
// EXISTING provider dispatch (same conditions, same order, same
// returns — only wrapped for timing) plus two new read-only diagnostic
// getters. This is the one file in this patch where an existing
// function body was touched, flagged explicitly per the task's rules.

import { ChatTurn } from './aiTypes';
import { askGemini } from './providers/gemini';
import { askGroq } from './providers/groq';
import { askOpenAI } from './providers/openai';

export type { ChatTurn } from './aiTypes';
export { AIServiceError } from './aiTypes';

type ProviderName = 'gemini' | 'groq' | 'openai';

function resolveProvider(): ProviderName {
  const configured = process.env
    .EXPO_PUBLIC_AI_PROVIDER as string | undefined;

  switch (configured) {
    case "groq":
    case "openai":
    case "gemini":
      return configured;
    default:
      return "groq";
  }
}

let lastLatencyMs: number | null = null;

/** v0.9.0 — Developer Mode diagnostics, read-only. Does not affect provider selection. */
export function getActiveProviderName(): string {
  return resolveProvider();
}

/** v0.9.0 — Developer Mode diagnostics, read-only. Null until the first request completes this session. */
export function getLastResponseLatencyMs(): number | null {
  return lastLatencyMs;
}

export async function askJarvis(history: ChatTurn[]): Promise<string> {
  const provider = resolveProvider();
  const startedAt = Date.now();
  try {
    if (provider === 'gemini') return await askGemini(history);
    if (provider === 'openai') return await askOpenAI(history);
    return await askGroq(history);
  } finally {
    lastLatencyMs = Date.now() - startedAt;
  }
}
// aiService.ts
// Provider-agnostic entry point. Consumers (ConversationPanel) import
// askJarvis/ChatTurn/AIServiceError from HERE, never from a specific
// provider file — swapping the active AI backend is a single env var
// change (EXPO_PUBLIC_AI_PROVIDER), no code edits required.

import { ChatTurn } from './aiTypes';
import { askGemini } from './providers/gemini';
import { askGroq } from './providers/groq';
import { askOpenAI } from './providers/openai';

export type { ChatTurn } from './aiTypes';
export { AIServiceError } from './aiTypes';

type ProviderName = 'gemini' | 'groq' | 'openai';

function resolveProvider(): ProviderName {
  const configured = process.env.EXPO_PUBLIC_AI_PROVIDER;
  if (configured === 'groq' || configured === 'openai' || configured === 'gemini') {
    return configured;
  }
  return 'groq'; // current active provider
}

export async function askJarvis(history: ChatTurn[]): Promise<string> {
  const provider = resolveProvider();
  if (provider === 'gemini') return askGemini(history);
  if (provider === 'openai') return askOpenAI(history);
  return askGroq(history);
}
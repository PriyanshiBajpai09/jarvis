// aiService.ts
// Provider-agnostic entry point. Consumers (ConversationPanel) import
// askJarvis/ChatTurn/AIServiceError from HERE, never from a specific
// provider file — swapping the active AI backend is a single env var
// change (EXPO_PUBLIC_AI_PROVIDER), no code edits required.

import type { ChatTurn } from "./aiTypes";
import { AIServiceError } from "./aiTypes";

import { askGemini } from "./providers/gemini";
import { askGroq } from "./providers/groq";
import { askOpenAI } from "./providers/openai";

export type { ChatTurn };
export { AIServiceError };

type ProviderName = "gemini" | "groq" | "openai";

function resolveProvider(): ProviderName {
  const env = process.env as Record<string, string | undefined>;
  const configured = env.EXPO_PUBLIC_AI_PROVIDER;

  switch (configured) {
    case "gemini":
    case "openai":
    case "groq":
      return configured;
    default:
      return "groq"; // current active provider
  }
}

export async function askJarvis(history: ChatTurn[]): Promise<string> {
  const provider = resolveProvider();

  switch (provider) {
    case "gemini":
      return await askGemini(history);

    case "openai":
      return await askOpenAI(history);

    case "groq":
    default:
      return await askGroq(history);
  }
}
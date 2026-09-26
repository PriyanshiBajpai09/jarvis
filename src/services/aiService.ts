import { askGemini } from "./providers/gemini";
import { askGroq } from "./providers/groq";
import type { ChatTurn } from "./aiTypes";

export type ProviderName = "gemini" | "groq";

function resolveProvider(): ProviderName {
  const configured = import.meta.env.VITE_AI_PROVIDER;

  if (configured === "groq") return "groq";
  return "gemini";
}

let lastLatency: number | null = null;

export function getLastLatency() {
  return lastLatency;
}

export async function askJarvis(history: ChatTurn[]): Promise<string> {
  const start = Date.now();

  try {
    if (resolveProvider() === "gemini") {
      try {
        return await askGemini(history);
      } catch {
        return await askGroq(history);
      }
    }

    return await askGroq(history);
  } finally {
    lastLatency = Date.now() - start;
  }
}
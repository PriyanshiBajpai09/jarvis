// geminiService.ts
// DEPRECATED shim — the real implementation now lives in
// services/providers/gemini.ts, and the provider-agnostic entry point
// is services/aiService.ts. This file only re-exports so nothing that
// still imports the old path breaks. New code should import from
// '../services/aiService' instead.

export type { ChatTurn } from './aiTypes';
export { AIServiceError, AIServiceError as GeminiServiceError } from './aiTypes';
export { askGemini as askJarvis } from './providers/gemini';
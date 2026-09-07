// providers/gemini.ts — v2.0: returns trimmed raw text (see groq.ts
// comment). Not the active provider. Everything else unchanged.

import { AIServiceError, ChatTurn, pickImmersiveMessage } from '../aiTypes';
import { getSystemPromptWithContext } from '../systemPrompt';

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 15000;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return key && key.length > 0 ? key : null;
}

function buildContents(history: ChatTurn[]) {
  return history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));
}

export async function askGemini(history: ChatTurn[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AIServiceError(
      'config',
      'Gemini API key missing. Add EXPO_PUBLIC_GEMINI_API_KEY to a .env file (see .env.example).'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const systemPrompt = getSystemPromptWithContext();

  let response: Response;
  try {
    response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: buildContents(history),
        generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AIServiceError('timeout', pickImmersiveMessage('timeout'));
    }
    throw new AIServiceError('network', pickImmersiveMessage('network'));
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429) {
      throw new AIServiceError('quota', pickImmersiveMessage('quota'));
    }
    throw new AIServiceError('http', pickImmersiveMessage('http'));
  }

  let data: GeminiResponse;
  try {
    data = (await response.json()) as GeminiResponse;
  } catch {
    throw new AIServiceError('empty', pickImmersiveMessage('empty'));
  }

  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const rawText = parts.map((p) => p.text ?? '').join('');

  if (!rawText.trim()) {
    throw new AIServiceError('empty', pickImmersiveMessage('empty'));
  }

  return rawText.trim();
}
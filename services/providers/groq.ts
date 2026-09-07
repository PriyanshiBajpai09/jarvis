// providers/groq.ts — v2.0: returns lightly-trimmed raw text instead of
// cleanAIText output, since cleaning/code-block extraction now happens
// at render time (see utils/textFormat.ts) so fenced code blocks
// survive intact for rich rendering. Everything else — model-from-env,
// reasoning never read, no debug logs, immersive errors — unchanged.

import { AIServiceError, ChatTurn, pickImmersiveMessage } from '../aiTypes';
import { getSystemPromptWithContext } from '../systemPrompt';

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_MODEL = 'openai/gpt-oss-20b';

interface GroqMessage {
  content?: string;
  reasoning?: string;
}

interface GroqResponse {
  choices?: Array<{ message?: GroqMessage }>;
}

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  return key && key.length > 0 ? key : null;
}

function getModel(): string {
  return process.env.EXPO_PUBLIC_GROQ_MODEL || DEFAULT_MODEL;
}

function toChatRole(role: ChatTurn['role']): 'user' | 'assistant' {
  return role === 'user' ? 'user' : 'assistant';
}

export async function askGroq(history: ChatTurn[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AIServiceError(
      'config',
      'Groq API key missing. Add EXPO_PUBLIC_GROQ_API_KEY to a .env file to activate this provider.'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const systemPrompt = getSystemPromptWithContext();

  let response: Response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((turn) => ({ role: toChatRole(turn.role), content: turn.text })),
        ],
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

  let data: GroqResponse;
  try {
    data = (await response.json()) as GroqResponse;
  } catch {
    throw new AIServiceError('empty', pickImmersiveMessage('empty'));
  }

  // Only `content` is read — `reasoning` is never touched.
  const text = data.choices?.[0]?.message?.content ?? '';

  if (!text.trim()) {
    throw new AIServiceError('empty', pickImmersiveMessage('empty'));
  }

  return text.trim();
}
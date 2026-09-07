// providers/openai.ts — v2.0: returns trimmed raw text (see groq.ts
// comment). Not the active provider. Everything else unchanged.

import { AIServiceError, ChatTurn, pickImmersiveMessage } from '../aiTypes';
import { getSystemPromptWithContext } from '../systemPrompt';

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 15000;

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  return key && key.length > 0 ? key : null;
}

function toChatRole(role: ChatTurn['role']): 'user' | 'assistant' {
  return role === 'user' ? 'user' : 'assistant';
}

export async function askOpenAI(history: ChatTurn[]): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new AIServiceError(
      'config',
      'OpenAI API key missing. Add EXPO_PUBLIC_OPENAI_API_KEY to a .env file to activate this provider.'
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const systemPrompt = getSystemPromptWithContext();

  let response: Response;
  try {
    response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
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

  let data: OpenAIResponse;
  try {
    data = (await response.json()) as OpenAIResponse;
  } catch {
    throw new AIServiceError('empty', pickImmersiveMessage('empty'));
  }

  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text.trim()) {
    throw new AIServiceError('empty', pickImmersiveMessage('empty'));
  }

  return text.trim();
}
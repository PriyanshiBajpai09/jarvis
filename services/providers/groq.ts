// providers/groq.ts — ESLint + TypeScript strict safe

import { AIServiceError, ChatTurn, pickImmersiveMessage } from "../aiTypes";
import { getSystemPromptWithContext } from "../systemPrompt";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_MODEL = "openai/gpt-oss-20b";

interface GroqMessage {
  content?: string;
  reasoning?: string;
}

interface GroqResponse {
  choices?: Array<{
    message?: GroqMessage;
  }>;
}

function getApiKey(): string | null {
  const env = process.env as Record<string, string | undefined>;
  const key = env.EXPO_PUBLIC_GROQ_API_KEY;
  return typeof key === "string" && key.length > 0 ? key : null;
}

function getModel(): string {
  const env = process.env as Record<string, string | undefined>;
  return env.EXPO_PUBLIC_GROQ_MODEL ?? DEFAULT_MODEL;
}

function toChatRole(role: ChatTurn["role"]): "user" | "assistant" {
  return role === "user" ? "user" : "assistant";
}

/**
 * Runtime type guard so response.json() never becomes an unsafe `any`.
 */
function isGroqResponse(value: unknown): value is GroqResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    !("choices" in record) ||
    Array.isArray(record.choices)
  );
}

export async function askGroq(history: ChatTurn[]): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new AIServiceError(
      "config",
      "Groq API key missing. Add EXPO_PUBLIC_GROQ_API_KEY to a .env file."
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  const systemPrompt = getSystemPromptWithContext();

  let response: Response;

  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: getModel(),
        temperature: 0.7,
        max_tokens: 700,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((turn) => ({
            role: toChatRole(turn.role),
            content: turn.text,
          })),
        ],
      }),
    });
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError") {
      throw new AIServiceError(
        "timeout",
        pickImmersiveMessage("timeout")
      );
    }

    throw new AIServiceError(
      "network",
      pickImmersiveMessage("network")
    );
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429) {
      throw new AIServiceError(
        "quota",
        pickImmersiveMessage("quota")
      );
    }

    throw new AIServiceError(
      "http",
      pickImmersiveMessage("http")
    );
  }

  let json: unknown;

  try {
    json = await response.json();
  } catch {
    throw new AIServiceError(
      "empty",
      pickImmersiveMessage("empty")
    );
  }

  if (!isGroqResponse(json)) {
    throw new AIServiceError(
      "empty",
      pickImmersiveMessage("empty")
    );
  }

  // Only `content` is read — `reasoning` is intentionally ignored.
  const text = json.choices?.[0]?.message?.content ?? "";

  if (!text.trim()) {
    throw new AIServiceError(
      "empty",
      pickImmersiveMessage("empty")
    );
  }

  return text.trim();
}
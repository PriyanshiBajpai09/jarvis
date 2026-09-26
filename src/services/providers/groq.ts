import { AIServiceError, pickImmersiveMessage } from "../aiTypes";
import type { ChatTurn } from "../aiTypes";
import { getSystemPromptWithContext } from "../systemPrompt";

const DEFAULT_MODEL = "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 15000;

function buildSystemPrompt(): string {
  const storedName = localStorage.getItem("jarvis_name") || "Commander";

  return `${getSystemPromptWithContext()}

========================
JARVIS IDENTITY PROFILE
========================

You are JARVIS (Mark LXXXV Operating System).

Current user: ${storedName}

Core personality:
- Calm, precise and intelligent.
- Speak like Tony Stark's laboratory AI.
- Address the user by their stored name naturally.
- Never sound like a generic chatbot.
- Never reply with "Request received" or "Standing by for further instructions."
- Prefer short complete sentences.
- Be warm without being overly emotional.

Greeting examples:
- "Good evening, ${storedName}. I'm online."
- "Welcome back. Reactor stable."
- "All systems are operational."

Keep responses concise unless the user asks for detail.
`;
}

export async function askGroq(history: ChatTurn[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const model = import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw new AIServiceError(
      "config",
      "Missing VITE_GROQ_API_KEY in .env"
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(),
            },
            ...history.map((turn) => ({
              role: turn.role,
              content: turn.text,
            })),
          ],
        }),
      }
    );

    window.clearTimeout(timeout);

    if (!response.ok) {
  if (response.status === 401) {
    throw new AIServiceError(
      "config",
      "Authorization failed. Secure uplink credentials are invalid."
    );
  }

  if (response.status === 429) {
    throw new AIServiceError("quota", pickImmersiveMessage("quota"));
  }

  throw new AIServiceError("http", pickImmersiveMessage("http"));
}

    const data = await response.json();

    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";

    if (!text) {
      throw new AIServiceError("empty", pickImmersiveMessage("empty"));
    }

    return text;
  } catch (error) {
    window.clearTimeout(timeout);

    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AIServiceError("timeout", pickImmersiveMessage("timeout"));
    }

    throw new AIServiceError("network", pickImmersiveMessage("network"));
  }
}
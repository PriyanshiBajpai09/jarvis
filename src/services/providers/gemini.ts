import { AIServiceError, pickImmersiveMessage } from "../aiTypes";
import type { ChatTurn } from "../aiTypes";
import { getSystemPromptWithContext } from "../systemPrompt";

const GEMINI_MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 15000;

export async function askGemini(history: ChatTurn[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new AIServiceError(
      "config",
      "Missing VITE_GEMINI_API_KEY in .env"
    );
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: getSystemPromptWithContext() }],
          },
          contents: history.map((turn) => ({
            role: turn.role,
            parts: [{ text: turn.text }],
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 700,
          },
        }),
      }
    );

    window.clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        throw new AIServiceError("quota", pickImmersiveMessage("quota"));
      }
      throw new AIServiceError("http", pickImmersiveMessage("http"));
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
        .trim() ?? "";

    if (!text) {
      throw new AIServiceError("empty", pickImmersiveMessage("empty"));
    }

    return text;
  } catch (error) {
    window.clearTimeout(timeout);

    if (error instanceof AIServiceError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new AIServiceError("timeout", pickImmersiveMessage("timeout"));
    }

    throw new AIServiceError("network", pickImmersiveMessage("network"));
  }
}
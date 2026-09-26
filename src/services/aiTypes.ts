export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export type AIErrorKind =
  | "timeout"
  | "http"
  | "network"
  | "empty"
  | "config"
  | "quota";

export class AIServiceError extends Error {
  kind: AIErrorKind;

  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "AIServiceError";
  }
}

const IMMERSIVE_MESSAGES: Record<
  Exclude<AIErrorKind, "config">,
  string[]
> = {
  timeout: [
    "Response delayed. Recalibrating neural relay...",
    "Signal delay detected. Stabilizing reactor uplink..."
  ],

  http: [
    "External relay disruption detected.",
    "Primary uplink responded unexpectedly."
  ],

  network: [
    "Connection interrupted. Restoring uplink...",
    "Network instability detected. Retrying..."
  ],

  empty: [
    "Transmission returned empty.",
    "Response packet incomplete."
  ],

  quota: [
    "Core processors are occupied.",
    "Priority channel is temporarily congested."
  ],
};

export function pickImmersiveMessage(
  kind: Exclude<AIErrorKind, "config">
): string {
  const list = IMMERSIVE_MESSAGES[kind];
  return list[Math.floor(Math.random() * list.length)];
}
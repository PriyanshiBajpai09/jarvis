// aiTypes.ts — Part I: strengthened error recovery. Immersive copy
// updated to the exact requested phrasing per error category. No HTTP
// status, provider error body, or stack trace is ever surfaced.

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export type AIErrorKind = 'timeout' | 'http' | 'network' | 'empty' | 'config' | 'quota';

export class AIServiceError extends Error {
  kind: AIErrorKind;
  constructor(kind: AIErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'AIServiceError';
  }
}

const IMMERSIVE_MESSAGES: Record<Exclude<AIErrorKind, 'config'>, string[]> = {
  timeout: ['Response delayed.', 'Signal delay detected. Recalibrating...'],
  http: ['Signal disrupted.', 'Relay disruption detected. Attempting to stabilize.'],
  network: ['Signal disrupted.', 'Connection interrupted. Retrying...'],
  empty: ['Transmission incomplete.', 'No response received. Signal may be degraded.'],
  quota: ['Core processors are occupied.', 'Priority channel congested. Standing by.'],
};

export function pickImmersiveMessage(kind: Exclude<AIErrorKind, 'config'>): string {
  const options = IMMERSIVE_MESSAGES[kind];
  return options[Math.floor(Math.random() * options.length)];
}
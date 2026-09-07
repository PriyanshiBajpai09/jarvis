// contextBuilder.ts — Part C: smart context memory.
// Trims the conversation history sent to the AI provider on long
// conversations, keeping only the most recent exchanges. This never
// alters what's displayed on screen — it only shapes the request
// payload, preventing unbounded token growth as a conversation grows.

import { ChatTurn } from '../services/aiTypes';

const DEFAULT_MAX_EXCHANGES = 25; // ~25 user+reply pairs = 50 turns

export function trimHistoryForRequest(
  history: ChatTurn[],
  maxExchanges: number = DEFAULT_MAX_EXCHANGES
): ChatTurn[] {
  const maxTurns = maxExchanges * 2;
  if (history.length <= maxTurns) return history;
  return history.slice(history.length - maxTurns);
}
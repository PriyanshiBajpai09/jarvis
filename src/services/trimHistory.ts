import type { ChatTurn } from "./aiTypes";

const MAX_HISTORY = 20;

export function trimHistoryForRequest(history: ChatTurn[]): ChatTurn[] {
  return history.slice(-MAX_HISTORY);
}
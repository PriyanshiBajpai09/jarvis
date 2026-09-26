"use strict";
// contextBuilder.ts — Part C: smart context memory.
// Trims the conversation history sent to the AI provider on long
// conversations, keeping only the most recent exchanges. This never
// alters what's displayed on screen — it only shapes the request
// payload, preventing unbounded token growth as a conversation grows.
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimHistoryForRequest = trimHistoryForRequest;
var DEFAULT_MAX_EXCHANGES = 25; // ~25 user+reply pairs = 50 turns
function trimHistoryForRequest(history, maxExchanges) {
    if (maxExchanges === void 0) { maxExchanges = DEFAULT_MAX_EXCHANGES; }
    var maxTurns = maxExchanges * 2;
    if (history.length <= maxTurns)
        return history;
    return history.slice(history.length - maxTurns);
}

"use strict";
// replyBus.ts
// Tiny pub-sub notifying subscribers when a complete JARVIS reply is
// ready. This is the seam voice uses to speak the finished text
// without touching ConversationPanel's streaming/reveal mechanics —
// the full reply is published once, independent of how it's visually
// revealed on screen.
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToReplyReady = subscribeToReplyReady;
exports.publishReplyReady = publishReplyReady;
var listeners = new Set();
function subscribeToReplyReady(listener) {
    listeners.add(listener);
    return function () { return listeners.delete(listener); };
}
function publishReplyReady(text) {
    listeners.forEach(function (listener) { return listener(text); });
}

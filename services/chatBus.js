"use strict";
// chatBus.ts
// Minimal pub-sub so the floating mic button (voice input, once real
// speech-to-text is wired into voice/index.ts) can hand a recognized
// transcript to ConversationPanel and have it sent exactly like a typed
// message — without lifting chat state up into HomeScreen and
// restructuring the existing component tree.
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToExternalMessages = subscribeToExternalMessages;
exports.publishExternalMessage = publishExternalMessage;
var listeners = new Set();
/** ConversationPanel calls this once on mount to receive external sends. */
function subscribeToExternalMessages(listener) {
    listeners.add(listener);
    return function () { return listeners.delete(listener); };
}
/** Anything (currently: future voice input) calls this to send a message. */
function publishExternalMessage(text) {
    listeners.forEach(function (listener) { return listener(text); });
}

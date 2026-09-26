"use strict";
// voiceStateBus.ts
// Minimal pub-sub so HomeScreen can subtly intensify the Arc Reactor's
// existing bloom animation while the mic is listening, without lifting
// mic/voice state up into HomeScreen's props or restructuring the
// component tree. Mirrors the pattern already used by chatBus.ts.
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToListeningState = subscribeToListeningState;
exports.publishListeningState = publishListeningState;
var listeners = new Set();
function subscribeToListeningState(listener) {
    listeners.add(listener);
    return function () { return listeners.delete(listener); };
}
function publishListeningState(isListening) {
    listeners.forEach(function (listener) { return listener(isListening); });
}

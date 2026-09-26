"use strict";
// activityStateBus.ts
// Tiny pub-sub carrying the reactor's 5-state activity model
// (idle/listening/thinking/speaking/error) from the voice layer to
// HomeScreen, which maps it onto ArcReactorMobile's existing
// activityState prop. Mirrors the existing chatBus.ts pattern.
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeToActivityState = subscribeToActivityState;
exports.publishActivityState = publishActivityState;
var listeners = new Set();
function subscribeToActivityState(listener) {
    listeners.add(listener);
    return function () { return listeners.delete(listener); };
}
function publishActivityState(state) {
    listeners.forEach(function (listener) { return listener(state); });
}

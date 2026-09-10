// activityStateBus.ts
// Tiny pub-sub carrying the reactor's 5-state activity model
// (idle/listening/thinking/speaking/error) from the voice layer to
// HomeScreen, which maps it onto ArcReactorMobile's existing
// activityState prop. Mirrors the existing chatBus.ts pattern.

export type ActivityState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

type ActivityListener = (state: ActivityState) => void;

const listeners = new Set<ActivityListener>();

export function subscribeToActivityState(listener: ActivityListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishActivityState(state: ActivityState): void {
  listeners.forEach((listener) => listener(state));
}
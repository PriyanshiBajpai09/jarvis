// voiceStateBus.ts
// Minimal pub-sub so HomeScreen can subtly intensify the Arc Reactor's
// existing bloom animation while the mic is listening, without lifting
// mic/voice state up into HomeScreen's props or restructuring the
// component tree. Mirrors the pattern already used by chatBus.ts.

type ListeningListener = (isListening: boolean) => void;

const listeners = new Set<ListeningListener>();

export function subscribeToListeningState(listener: ListeningListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishListeningState(isListening: boolean): void {
  listeners.forEach((listener) => listener(isListening));
}
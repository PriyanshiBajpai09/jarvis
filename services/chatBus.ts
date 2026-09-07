// chatBus.ts
// Minimal pub-sub so the floating mic button (voice input, once real
// speech-to-text is wired into voice/index.ts) can hand a recognized
// transcript to ConversationPanel and have it sent exactly like a typed
// message — without lifting chat state up into HomeScreen and
// restructuring the existing component tree.

type SendMessageListener = (text: string) => void;

const listeners = new Set<SendMessageListener>();

/** ConversationPanel calls this once on mount to receive external sends. */
export function subscribeToExternalMessages(listener: SendMessageListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Anything (currently: future voice input) calls this to send a message. */
export function publishExternalMessage(text: string): void {
  listeners.forEach((listener) => listener(text));
}
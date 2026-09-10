// replyBus.ts
// Tiny pub-sub notifying subscribers when a complete JARVIS reply is
// ready. This is the seam voice uses to speak the finished text
// without touching ConversationPanel's streaming/reveal mechanics —
// the full reply is published once, independent of how it's visually
// revealed on screen.

type ReplyListener = (text: string) => void;

const listeners = new Set<ReplyListener>();

export function subscribeToReplyReady(listener: ReplyListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishReplyReady(text: string): void {
  listeners.forEach((listener) => listener(text));
}
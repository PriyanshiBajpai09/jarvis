// conversationStore.ts
// Persistent memory for the Conversation Panel (Phase 19). Sits on top
// of storage/localStore.ts's generic AsyncStorage wrapper. Stores the
// message list plus a "last opened" timestamp under one key, capped at
// MAX_STORED_MESSAGES to avoid unbounded growth. All functions are
// defensive — a storage failure never throws into the UI; callers get
// null/void and the chat simply continues from its in-memory state.

import { getItem, setItem, removeItem } from "./localStore";
export interface StoredMessage {
  id: string;
  sender: 'jarvis' | 'user';
  text: string;
  time: string;
}

interface ConversationRecord {
  messages: StoredMessage[];
  lastOpenedAt: number;
}

const CONVERSATION_KEY = 'jarvis:conversation:v1';
const MAX_STORED_MESSAGES = 100;

/**
 * Restores the saved conversation, if any. Returns null when nothing is
 * stored yet, the stored shape is unexpected, or reading fails for any
 * reason — callers should treat null as "start fresh" rather than an
 * error condition.
 */
export async function loadConversation(): Promise<StoredMessage[] | null> {
  try {
    const record = await getItem<ConversationRecord>(CONVERSATION_KEY);
    if (!record || !Array.isArray(record.messages) || record.messages.length === 0) {
      return null;
    }
    return record.messages;
  } catch {
    return null;
  }
}

/**
 * Persists the given messages, keeping only the newest
 * MAX_STORED_MESSAGES. Updates the "last opened" timestamp alongside
 * them. Intended to be called after a debounce, not per keystroke.
 * Failures are swallowed — persistence is a background convenience,
 * never something that should interrupt the chat experience.
 */
export async function saveConversation(messages: StoredMessage[]): Promise<void> {
  try {
    const capped = messages.slice(-MAX_STORED_MESSAGES);
    const record: ConversationRecord = {
      messages: capped,
      lastOpenedAt: Date.now(),
    };
    await setItem<ConversationRecord>(CONVERSATION_KEY, record);
  } catch {
    // Swallow — a failed save should never crash or interrupt the chat.
  }
}

/**
 * Erases stored chat memory entirely. Does not touch any Groq/provider
 * configuration — those live under separate env vars and are untouched
 * by this module.
 */
export async function clearConversation(): Promise<void> {
  try {
    await removeItem(CONVERSATION_KEY);
  } catch {
    // no-op — nothing to clear, or storage is unavailable.
  }
}
// sessionMemory.ts — Part C: lightweight session facts, separate from
// full conversation history (conversationStore.ts). Stores at most 20
// recent facts (city asked about, news topic, last protocol run) so
// follow-up questions like "what about tomorrow?" can resolve context
// without re-asking. Never replaces or touches conversation memory.

import { getItem, setItem } from '../storage/localStore';
interface SessionFact {
  key: string;
  value: string;
  timestamp: number;
}

const SESSION_KEY = 'jarvis:sessionMemory:v1';
const MAX_FACTS = 20;

async function readFacts(): Promise<SessionFact[]> {
  try {
    const facts = await getItem<SessionFact[]>(SESSION_KEY);
    return Array.isArray(facts) ? facts : [];
  } catch {
    return [];
  }
}

/** Records a fact (e.g. key: "lastCity", value: "Barabanki"). Capped at MAX_FACTS total, oldest dropped first. Never throws. */
export async function recordFact(key: string, value: string): Promise<void> {
  if (!value || value.trim().length === 0) return;
  try {
    const facts = await readFacts();
    facts.push({ key, value: value.trim(), timestamp: Date.now() });
    const capped = facts.slice(-MAX_FACTS);
    await setItem<SessionFact[]>(SESSION_KEY, capped);
  } catch {
    // Swallow — session memory is a convenience, not critical path.
  }
}

/** Returns the most recently recorded value for a given key, or null if none exists. */
export async function getLatestFact(key: string): Promise<string | null> {
  try {
    const facts = await readFacts();
    for (let i = facts.length - 1; i >= 0; i -= 1) {
      if (facts[i].key === key) return facts[i].value;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearSessionMemory(): Promise<void> {
  try {
    await setItem<SessionFact[]>(SESSION_KEY, []);
  } catch {
    // no-op
  }
}
// sessionMemory.ts — v0.9.0: same storage architecture, still one
// capped array under one AsyncStorage key. New (additive only):
// exported SessionFact interface, getAllFacts() and deleteFact() for
// the Developer Mode Memory Inspector. recordFact/pinNote/
// getLatestFact/getPinnedNotes/clearSessionMemory are UNCHANGED.

import { getItem, setItem } from './localStore';

export interface SessionFact {
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

async function writeFacts(facts: SessionFact[]): Promise<void> {
  const capped = facts.slice(-MAX_FACTS);
  await setItem<SessionFact[]>(SESSION_KEY, capped);
}

export async function recordFact(key: string, value: string): Promise<void> {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) return;

  try {
    const facts = await readFacts();
    const latestForKey = [...facts].reverse().find((f) => f.key === key);
    if (latestForKey && latestForKey.value === trimmedValue) {
      return;
    }
    facts.push({ key, value: trimmedValue, timestamp: Date.now() });
    await writeFacts(facts);
  } catch {
    // Swallow — session memory is a convenience, not critical path.
  }
}

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

function slugifyNote(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 40);
}

export async function pinNote(text: string): Promise<boolean> {
  const clean = text.trim();
  if (clean.length === 0) return false;

  const key = `pinned:${slugifyNote(clean)}`;

  try {
    const facts = await readFacts();
    const alreadyPinned = facts.some((f) => f.key === key);
    if (alreadyPinned) return false;

    facts.push({ key, value: clean, timestamp: Date.now() });
    await writeFacts(facts);
    return true;
  } catch {
    return false;
  }
}

export async function getPinnedNotes(): Promise<string[]> {
  try {
    const facts = await readFacts();
    return facts.filter((f) => f.key.startsWith('pinned:')).map((f) => f.value);
  } catch {
    return [];
  }
}

export async function clearSessionMemory(): Promise<void> {
  try {
    await setItem<SessionFact[]>(SESSION_KEY, []);
  } catch {
    // no-op
  }
}

/** v0.9.0 — Developer Mode Memory Inspector: returns every stored fact (pinned notes and regular facts alike), oldest first. Read-only, no new storage. */
export async function getAllFacts(): Promise<SessionFact[]> {
  return readFacts();
}

/** v0.9.0 — Developer Mode Memory Inspector: deletes one specific entry, identified by its exact key+timestamp pair (since a key can have multiple historical values). Never throws. */
export async function deleteFact(key: string, timestamp: number): Promise<void> {
  try {
    const facts = await readFacts();
    const filtered = facts.filter((f) => !(f.key === key && f.timestamp === timestamp));
    await writeFacts(filtered);
  } catch {
    // no-op
  }
}
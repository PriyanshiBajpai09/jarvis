export interface SessionFact {
  key: string;
  value: string;
  timestamp: number;
}

const SESSION_KEY = "jarvis:sessionMemory:v1";
const MAX_FACTS = 20;

async function readFacts(): Promise<SessionFact[]> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const facts = raw ? (JSON.parse(raw) as SessionFact[]) : [];
    return Array.isArray(facts) ? facts : [];
  } catch {
    return [];
  }
}

async function writeFacts(facts: SessionFact[]): Promise<void> {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(facts.slice(-MAX_FACTS))
  );
}

export async function recordFact(
  key: string,
  value: string
): Promise<void> {
  const clean = value.trim();
  if (!clean) return;

  const facts = await readFacts();

  const latest = [...facts].reverse().find((f) => f.key === key);

  if (latest?.value === clean) return;

  facts.push({
    key,
    value: clean,
    timestamp: Date.now(),
  });

  await writeFacts(facts);
}

export async function getLatestFact(
  key: string
): Promise<string | null> {
  const facts = await readFacts();

  for (let i = facts.length - 1; i >= 0; i--) {
    if (facts[i].key === key) return facts[i].value;
  }

  return null;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 40);
}

export async function pinNote(text: string): Promise<boolean> {
  const clean = text.trim();
  if (!clean) return false;

  const key = `pinned:${slugify(clean)}`;

  const facts = await readFacts();

  if (facts.some((f) => f.key === key)) return false;

  facts.push({
    key,
    value: clean,
    timestamp: Date.now(),
  });

  await writeFacts(facts);

  return true;
}

export async function getPinnedNotes(): Promise<string[]> {
  const facts = await readFacts();

  return facts
    .filter((f) => f.key.startsWith("pinned:"))
    .map((f) => f.value);
}

export async function clearSessionMemory(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
}

export async function getAllFacts(): Promise<SessionFact[]> {
  return readFacts();
}

export async function deleteFact(
  key: string,
  timestamp: number
): Promise<void> {
  const facts = await readFacts();

  await writeFacts(
    facts.filter(
      (f) => !(f.key === key && f.timestamp === timestamp)
    )
  );
}
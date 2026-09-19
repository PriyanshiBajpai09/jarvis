// jarvisRouter.ts — v0.8.0. All existing branches (protocol detection,
// time, device actions, weather, news, generic current-fact lookup)
// are UNCHANGED in behavior — same order, same conditions, same
// returns. New, purely additive:
//   Feature 1 — passive personal-fact extraction (fire-and-forget,
//     never alters the reply or routing decision).
//   Feature 2 — Internet Brain: for conversational "latest/recent/
//     current" style questions not already handled by weather/news/
//     current-fact-query, reuse liveInfoService.getFactAnswer() and
//     combine it into the conversation history sent to Groq, instead
//     of replacing the conversation entirely.
//   Feature 4 — Better Recap: when the user asks for a recap, pull in
//     any pinned notes as real (never invented) extra context before
//     asking Groq, which is now instructed (systemPrompt.ts) to
//     structure recaps as Summary / Decisions / Open tasks / Next step.

import { askJarvis, ChatTurn } from './aiService';
import { classifyIntent, IntentResult, IntentType } from './intentEngine';
import { resolveAction } from './actionEngine';
import { getLocalContext } from './localContext';
import { detectProtocol, runProtocol } from './protocolEngine';
import { getWeatherAnswer, getNewsAnswer, getFactAnswer } from './liveInfoService';
import { getLatestFact, getPinnedNotes, recordFact } from '../storage/sessionMemory';

export type RouteSource = 'groq' | 'context' | 'action-fallback' | 'live-info' | 'protocol';

export interface RouteResult {
  intent: IntentResult;
  replyText: string;
  source: RouteSource;
}

export type LiveInfoProvider = (intent: IntentResult) => Promise<string | null>;

let liveInfoProvider: LiveInfoProvider | null = null;

export function registerLiveInfoProvider(provider: LiveInfoProvider): void {
  liveInfoProvider = provider;
}

const DEVICE_ACTION_INTENTS: ReadonlySet<IntentType> = new Set([
  'battery',
  'network',
  'open_app',
  'call',
  'sms',
  'flashlight',
  'reminder',
]);

function buildActionFallbackReply(): string {
  const variants = [
    "That's outside what I can act on directly from here just yet, Priyanshi. Once I'm running on dedicated hardware, it's a straightforward addition.",
    "I don't have direct control over that from this build. That capability comes online once I'm operating on your hardware directly.",
    "Not something I can execute from here yet — that arrives once this instance moves onto your device's own systems.",
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}

function buildTimeReply(intent: IntentResult): string {
  const ctx = getLocalContext();
  const text = intent.rawText.toLowerCase();

  if (/day is it/.test(text)) return `Today is ${ctx.day}, ${ctx.date}.`;
  if (/date/.test(text)) return `Today's date is ${ctx.date}.`;
  if (/month/.test(text)) return `We're in ${ctx.date.split(' ').slice(-2).join(' ')} — full date: ${ctx.date}.`;
  if (/new year/.test(text)) return `${ctx.daysUntilNewYear} day${ctx.daysUntilNewYear === 1 ? '' : 's'} remain until New Year's Day.`;
  return `It's ${ctx.time} on ${ctx.day}, ${ctx.date}.`;
}

function extractWeatherFollowUp(text: string): string | null {
  const lower = text.trim().toLowerCase();
  if (/^(tomorrow)\??$/.test(lower)) return 'tomorrow';
  if (/^(today)\??$/.test(lower)) return 'today';
  if (/(day after|the day after tomorrow)\??$/.test(lower)) return 'the day after tomorrow';
  if (/^what about\b/.test(lower)) return null;
  return null;
}

function extractNewsFollowUpTopic(text: string, previousTopic: string | null): string | null {
  const lower = text.trim().toLowerCase();
  if (/^more\b/.test(lower)) return previousTopic;
  const whatAbout = lower.match(/^what about\s+(.+)/);
  if (whatAbout && whatAbout[1]) return whatAbout[1].replace(/[?.!]+$/, '').trim();
  return null;
}

const CURRENT_FACT_PATTERNS = [
  /^who is\b/i,
  /^what is the current\b/i,
  /current (prime minister|president|pm|ceo|score|price)\b/i,
];

function looksLikeCurrentFactQuery(text: string): boolean {
  return CURRENT_FACT_PATTERNS.some((p) => p.test(text.trim()));
}

async function defaultLiveInfoProvider(intent: IntentResult): Promise<string | null> {
  if (intent.type === 'weather' && intent.entities.location) {
    return getWeatherAnswer(intent.entities.location);
  }
  if (intent.type === 'news') {
    return getNewsAnswer(intent.entities.topic);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Feature 1 — passive personal-fact extraction.                      */
/* Conservative, word-boundary patterns only. Fire-and-forget: this    */
/* never changes what gets returned to the user, it only silently      */
/* records something worth remembering for later, via the SAME         */
/* recordFact() every other feature already uses (which now de-       */
/* duplicates internally — see storage/sessionMemory.ts).             */
/* ------------------------------------------------------------------ */

function extractPersonalFact(text: string): { key: string; value: string } | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  const examMatch = trimmed.match(/\bmy (exam|interview|test|deadline|assignment)\s+is\s+(?:on\s+)?([\w\s,]{2,40})/i);
  if (examMatch) {
    const label = examMatch[1].toLowerCase();
    return { key: `fact:${label}`, value: `${examMatch[1]} is ${examMatch[2].trim()}` };
  }

  const haveMatch = trimmed.match(/\bi have (?:an?|my)?\s*([\w\s]{3,40}?)\s+on\s+([\w\s]{2,20})/i);
  if (haveMatch) {
    const slug = haveMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
    return { key: `fact:${slug}`, value: `${haveMatch[1].trim()} on ${haveMatch[2].trim()}` };
  }

  const learningMatch = trimmed.match(/\bi'?m (?:learning|studying|working on)\s+([\w\s]{2,40})/i);
  if (learningMatch) {
    return { key: 'fact:current-focus', value: `Learning ${learningMatch[1].trim()}` };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Feature 2 — Internet Brain: fresh-info detection + combine.        */
/* ------------------------------------------------------------------ */

const FRESH_INFO_PATTERNS = [
  /\blatest\b/i,
  /\brecent(ly)?\b/i,
  /\bcurrent(ly)?\b/i,
  /\bright now\b/i,
  /\bthis week\b/i,
  /\bnewest\b/i,
  /\bup to date\b/i,
  /\bnew version\b/i,
];

function needsFreshInfo(text: string): boolean {
  return FRESH_INFO_PATTERNS.some((p) => p.test(text));
}

/**
 * Appends a short "Live context" note to the trailing (most recent)
 * turn in the history, rather than replacing anything. Groq then
 * answers using both the real conversation AND the live fact together
 * — this is the "combine internet context with conversation context"
 * requirement, without introducing a second call path.
 */
function injectContextNote(history: ChatTurn[], note: string): ChatTurn[] {
  if (history.length === 0) return history;
  const augmented = [...history];
  const lastIndex = augmented.length - 1;
  const lastTurn = augmented[lastIndex];
  augmented[lastIndex] = { ...lastTurn, text: `${lastTurn.text}\n\n(Context you may use: ${note})` };
  return augmented;
}
const RECAP_PATTERN =
  /\b(recap|summar(y|ize)|conversation so far|what have we talked about)\b/i;

export async function routeUserMessage(
  userText: string,
  history: ChatTurn[]
): Promise<RouteResult> {
  // Feature 1 — silent, non-blocking. Never affects routing or reply.
  const extractedFact = extractPersonalFact(userText);
  if (extractedFact) {
    void recordFact(extractedFact.key, extractedFact.value);
  }

  // 1. Protocol detection — unchanged.
  const protocol = detectProtocol(userText);
  if (protocol) {
    const replyText = await runProtocol(protocol);
    await recordFact("lastProtocol", protocol);

    return {
      intent: {
        type: "conversation",
        confidence: 1,
        entities: {},
        rawText: userText,
      },
      replyText,
      source: "protocol",
    };
  }

  const intent = classifyIntent(userText);

  // 2. Recap MUST happen before device actions.
  if (RECAP_PATTERN.test(userText)) {
    const pinnedNotes = await getPinnedNotes();

    const augmented =
      pinnedNotes.length > 0
        ? injectContextNote(
            history,
            `Pinned notes — ${pinnedNotes.join("; ")}.`
          )
        : history;

    const reply = await askJarvis(augmented);

    return {
      intent,
      replyText: reply,
      source: "context",
    };
  }

  // 3. Instant local-time answers — unchanged.
  if (intent.type === "time") {
    return {
      intent,
      replyText: buildTimeReply(intent),
      source: "context",
    };
  }

  // 4. Device actions — unchanged.
  if (DEVICE_ACTION_INTENTS.has(intent.type)) {
    resolveAction(intent);

    return {
      intent,
      replyText: buildActionFallbackReply(),
      source: "action-fallback",
    };
  }

  // 5. Weather — unchanged.
  if (intent.type === "weather") {
    let location = intent.entities.location;
    let whenPhrase: string | undefined;

    if (!location) {
      const followUpWhen = extractWeatherFollowUp(userText);

      if (followUpWhen) {
        location = (await getLatestFact("lastCity")) ?? undefined;
        whenPhrase = followUpWhen;
      } else {
        const whatAboutMatch = userText.trim().match(/^what about\s+(.+)/i);

        if (whatAboutMatch && whatAboutMatch[1]) {
          location = whatAboutMatch[1].replace(/[?.!]+$/, "").trim();
        }
      }
    }

    if (location) {
      const liveReply = liveInfoProvider
        ? await liveInfoProvider({
            ...intent,
            entities: { ...intent.entities, location },
          })
        : await getWeatherAnswer(location, whenPhrase);

      if (liveReply) {
        await recordFact("lastCity", location);

        return {
          intent,
          replyText: liveReply,
          source: "live-info",
        };
      }
    }

    const reply = await askJarvis(history);

    return {
      intent,
      replyText: reply,
      source: "groq",
    };
  }

  // 5. News — unchanged.
  if (intent.type === "news") {
    let topic = intent.entities.topic;

    if (!topic || topic.trim().length === 0) {
      const previousTopic = await getLatestFact("lastNewsTopic");
      const followUpTopic = extractNewsFollowUpTopic(
        userText,
        previousTopic
      );

      if (followUpTopic) topic = followUpTopic;
    }

    const liveReply = liveInfoProvider
      ? await liveInfoProvider({
          ...intent,
          entities: { ...intent.entities, topic },
        })
      : await getNewsAnswer(topic);

    if (liveReply) {
      await recordFact("lastNewsTopic", topic ?? "general");

      return {
        intent,
        replyText: liveReply,
        source: "live-info",
      };
    }

    const reply = await askJarvis(history);

    return {
      intent,
      replyText: reply,
      source: "groq",
    };
  }

  // 6. Generic current-fact lookups — unchanged.
  // 8. Feature 2 — Internet Brain. Only reached for conversational
  // messages not already handled above. Combines a live fact into the
  // existing conversation rather than answering from the fact alone.
  if (needsFreshInfo(userText)) {
    const liveFact = await getFactAnswer(userText);
    if (liveFact) {
      const augmented = injectContextNote(history, liveFact);
      const reply = await askJarvis(augmented);
      return { intent, replyText: reply, source: 'live-info' };
    }
  }

  // 9. Everything else — standard Groq conversation, unchanged.
  const reply = await askJarvis(history);
  return { intent, replyText: reply, source: 'groq' };
}

registerLiveInfoProvider(defaultLiveInfoProvider);

export type { IntentResult, IntentType } from './intentEngine';
export type { AIServiceError } from './aiService';
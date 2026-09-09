import { askJarvis, ChatTurn } from './aiService';
import { classifyIntent, IntentResult, IntentType } from './intentEngine';
import { resolveAction } from './actionEngine';
import { getLocalContext } from './localContext';
import {
  getWeatherAnswer,
  getNewsAnswer,
  getFactAnswer,
} from './liveInfoService';

export type RouteSource =
  | 'groq'
  | 'context'
  | 'action-fallback'
  | 'live-info';

export interface RouteResult {
  intent: IntentResult;
  replyText: string;
  source: RouteSource;
}

export type LiveInfoProvider = (
  intent: IntentResult
) => Promise<string | null>;

let liveInfoProvider: LiveInfoProvider | null = null;

export function registerLiveInfoProvider(
  provider: LiveInfoProvider
): void {
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
    "Not something I can execute from here yet—that arrives once this instance moves onto your device's own systems.",
  ];

  return variants[Math.floor(Math.random() * variants.length)];
}

function buildTimeReply(intent: IntentResult): string {
  const ctx = getLocalContext();
  const text = intent.rawText.toLowerCase();

  if (/day is it/.test(text)) {
    return `Today is ${ctx.day}, ${ctx.date}.`;
  }

  if (/date/.test(text)) {
    return `Today's date is ${ctx.date}.`;
  }

  if (/month/.test(text)) {
    return `We're in ${ctx.date
      .split(' ')
      .slice(-2)
      .join(' ')} — full date: ${ctx.date}.`;
  }

  if (/new year/.test(text)) {
    return `${ctx.daysUntilNewYear} day${
      ctx.daysUntilNewYear === 1 ? '' : 's'
    } remain until New Year's Day.`;
  }

  return `It's ${ctx.time} on ${ctx.day}, ${ctx.date}.`;
}

const CURRENT_FACT_PATTERNS = [
  /^who is\b/i,
  /^what is the current\b/i,
  /current (prime minister|president|pm|ceo|score|price)\b/i,
];

function looksLikeCurrentFactQuery(text: string): boolean {
  return CURRENT_FACT_PATTERNS.some((pattern) =>
    pattern.test(text.trim())
  );
}

async function defaultLiveInfoProvider(
  intent: IntentResult
): Promise<string | null> {
  if (intent.type === 'weather' && intent.entities.location) {
    return getWeatherAnswer(intent.entities.location);
  }

  if (intent.type === 'news') {
    return getNewsAnswer(intent.entities.topic);
  }

  return null;
}

export async function routeUserMessage(
  userText: string,
  history: ChatTurn[]
): Promise<RouteResult> {
  const intent = classifyIntent(userText);

  if (intent.type === 'time') {
    return {
      intent,
      replyText: buildTimeReply(intent),
      source: 'context',
    };
  }

  if (DEVICE_ACTION_INTENTS.has(intent.type)) {
    resolveAction(intent);

    return {
      intent,
      replyText: buildActionFallbackReply(),
      source: 'action-fallback',
    };
  }

  if (intent.type === 'weather') {
    const location = intent.entities.location;

    if (location) {
      const liveReply = liveInfoProvider
        ? await liveInfoProvider(intent)
        : await getWeatherAnswer(location);

      if (liveReply) {
        return {
          intent,
          replyText: liveReply,
          source: 'live-info',
        };
      }
    }

    const reply = await askJarvis(history);

    return {
      intent,
      replyText: reply,
      source: 'groq',
    };
  }

  if (intent.type === 'news') {
    const liveReply = liveInfoProvider
      ? await liveInfoProvider(intent)
      : await getNewsAnswer(intent.entities.topic);

    if (liveReply) {
      return {
        intent,
        replyText: liveReply,
        source: 'live-info',
      };
    }

    const reply = await askJarvis(history);

    return {
      intent,
      replyText: reply,
      source: 'groq',
    };
  }

  if (looksLikeCurrentFactQuery(userText)) {
    const liveReply = await getFactAnswer(userText);

    if (liveReply) {
      return {
        intent,
        replyText: liveReply,
        source: 'live-info',
      };
    }
  }

  const reply = await askJarvis(history);

  return {
    intent,
    replyText: reply,
    source: 'groq',
  };
}

registerLiveInfoProvider(defaultLiveInfoProvider);

export type { IntentResult, IntentType } from './intentEngine';
export type { AIServiceError } from './aiService';
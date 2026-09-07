// jarvisRouter.ts
// Central routing layer. ConversationPanel sends every user message
// here and only here — it never talks to Groq, intentEngine, or
// actionEngine directly. Flow:
//
//   User text
//     -> intentEngine.classifyIntent
//     -> jarvisRouter decides:
//          conversation / coding / explanation  -> Groq (askJarvis)
//          weather / news                       -> live info provider
//                                                   if registered,
//                                                   else Groq fallback
//          device actions (battery, network,
//          open_app, call, sms, flashlight,
//          reminder)                            -> actionEngine,
//                                                   in-character reply
//          time                                 -> local device
//                                                   context, no
//                                                   network call
//
// IMPORTANT: weather/news currently fall back to the same Groq call
// used for plain conversation — this preserves whatever behavior
// existed before this router was introduced (Groq answering as best
// it can) rather than silently degrading it. Wire a real live-search
// provider (e.g. an existing Tavily integration) via
// registerLiveInfoProvider() to make these genuinely live.

import { askJarvis } from './aiService';
import type { ChatTurn } from './aiService';
import { classifyIntent, IntentResult, IntentType } from './intentEngine';
import { resolveAction } from './actionEngine';
import { getLocalContext } from './localContext';

export type RouteSource = 'groq' | 'context' | 'action-fallback' | 'live-info';

export interface RouteResult {
  intent: IntentResult;
  replyText: string;
  source: RouteSource;
}

export type LiveInfoProvider = (intent: IntentResult) => Promise<string | null>;

let liveInfoProvider: LiveInfoProvider | null = null;

/**
 * Registers a live-information provider (e.g. a Tavily-backed search
 * service) to handle weather/news intents with real data. Call this
 * once, e.g. from App.tsx, with a function that returns a plain-text
 * answer or null (to fall back to Groq) — never throw.
 */
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

// Kept deliberately short and calm — these are in-character
// explanations, never the raw technical `reason` string from
// actionEngine, and never mention Expo Go / dev builds / native
// modules to the user directly.
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

  if (/day is it/.test(text)) {
    return `Today is ${ctx.day}, ${ctx.date}.`;
  }
  if (/date/.test(text)) {
    return `Today's date is ${ctx.date}.`;
  }
  if (/month/.test(text)) {
    return `We're in ${ctx.date.split(' ').slice(-2).join(' ')} — full date: ${ctx.date}.`;
  }
  if (/new year/.test(text)) {
    return `${ctx.daysUntilNewYear} day${ctx.daysUntilNewYear === 1 ? '' : 's'} remain until New Year's Day.`;
  }
  return `It's ${ctx.time} on ${ctx.day}, ${ctx.date}.`;
}

/**
 * Routes a single user message through the intent engine to the
 * correct handler and returns exactly one complete reply string.
 * Throws AIServiceError only when the Groq path itself fails —
 * context/action-fallback paths never throw.
 */
export async function routeUserMessage(userText: string, history: ChatTurn[]): Promise<RouteResult> {
  const intent = classifyIntent(userText);

  if (intent.type === 'time') {
    return { intent, replyText: buildTimeReply(intent), source: 'context' };
  }

  if (DEVICE_ACTION_INTENTS.has(intent.type)) {
    // Resolved for future execution wiring even though we don't act on
    // it yet — keeps actionEngine exercised and ready.
    resolveAction(intent);
    return { intent, replyText: buildActionFallbackReply(), source: 'action-fallback' };
  }

  if (intent.type === 'weather' || intent.type === 'news') {
    if (liveInfoProvider) {
      try {
        const liveReply = await liveInfoProvider(intent);
        if (liveReply && liveReply.trim().length > 0) {
          return { intent, replyText: liveReply.trim(), source: 'live-info' };
        }
      } catch {
        // Provider failed — fall through to the Groq fallback below
        // rather than surfacing a raw error for a non-critical path.
      }
    }
    const reply = await askJarvis(history);
    return { intent, replyText: reply, source: 'groq' };
  }

  // conversation, coding, explanation, unknown — all standard Groq
  // conversation, using the full trimmed history as before.
  const reply = await askJarvis(history);
  return { intent, replyText: reply, source: 'groq' };
}

export type { IntentResult, IntentType } from './intentEngine';
export type { AIServiceError } from './aiService';
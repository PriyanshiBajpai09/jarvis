// intentEngine.ts
// Reusable, local, heuristic intent classifier — no network call, no
// ML model (none of that is feasible/needed in Expo Go), just ordered
// pattern matching with entity extraction. This is the single place
// intent logic lives; ConversationPanel and jarvisRouter never
// hardcode any of this themselves.

export type IntentType =
  | 'conversation'
  | 'coding'
  | 'explanation'
  | 'weather'
  | 'news'
  | 'time'
  | 'battery'
  | 'network'
  | 'open_app'
  | 'call'
  | 'sms'
  | 'flashlight'
  | 'reminder'
  | 'unknown';

export interface IntentEntities {
  location?: string;
  appName?: string;
  contactName?: string;
  message?: string;
  reminderText?: string;
  topic?: string;
}

export interface IntentResult {
  type: IntentType;
  confidence: number;
  entities: IntentEntities;
  rawText: string;
}

interface PatternRule {
  type: IntentType;
  patterns: RegExp[];
  confidence: number;
}

// Ordered by specificity — earlier rules win. Generic conversational
// rules (coding/explanation) are deliberately last among the "matched"
// rules, before the unmatched fallback.
const RULES: PatternRule[] = [
  {
    type: 'weather',
    patterns: [/\bweather\b/i, /\btemperature\b/i, /\bforecast\b/i, /\bis it raining\b/i, /\bhumidity\b/i],
    confidence: 0.9,
  },
  {
    type: 'news',
    patterns: [/\bnews\b/i, /\bheadlines?\b/i, /what'?s happening/i, /latest (updates?|events?)/i],
    confidence: 0.85,
  },
  {
    type: 'time',
    patterns: [
      /what time is it/i,
      /current time/i,
      /what'?s the time/i,
      /what day is it/i,
      /what'?s today'?s date/i,
      /what month is it/i,
      /days? until new year/i,
    ],
    confidence: 0.92,
  },
  {
    type: 'battery',
    patterns: [/battery (level|percentage|status)/i, /how much battery/i, /phone battery/i],
    confidence: 0.88,
  },
  {
    type: 'network',
    patterns: [/wifi status/i, /network status/i, /am i (online|connected)/i, /internet connection/i],
    confidence: 0.85,
  },
  {
    type: 'flashlight',
    patterns: [/turn (on|off) (the )?flashlight/i, /toggle (the )?flashlight/i, /\btorch\b/i],
    confidence: 0.9,
  },
  {
    type: 'call',
    patterns: [/\bcall\s+([a-z][a-z\s]{1,30})/i, /\bdial\s+([a-z][a-z\s]{1,30})/i, /\bphone\s+([a-z][a-z\s]{1,30})/i],
    confidence: 0.82,
  },
  {
    type: 'sms',
    patterns: [/\btext\s+([a-z][a-z\s]{1,30})/i, /send (a )?message to\s+([a-z][a-z\s]{1,30})/i, /\bsms\s+([a-z][a-z\s]{1,30})/i],
    confidence: 0.82,
  },
  {
    type: 'open_app',
    patterns: [/\bopen\s+([a-z][a-z0-9\s]{1,30})/i, /\blaunch\s+([a-z][a-z0-9\s]{1,30})/i],
    confidence: 0.8,
  },
  {
    type: 'reminder',
    patterns: [/remind me (to|about)\s+(.+)/i, /set a reminder/i, /don'?t forget to\s+(.+)/i],
    confidence: 0.85,
  },
  {
    type: 'coding',
    patterns: [
      /\bwrite (a|the) function\b/i,
      /\bdebug\b/i,
      /\btypescript\b/i,
      /\bjavascript\b/i,
      /\bpython\b/i,
      /\balgorithm\b/i,
      /\bregex\b/i,
      /\bcode\b/i,
    ],
    confidence: 0.72,
  },
  {
    type: 'explanation',
    patterns: [/^explain\b/i, /^what is\b/i, /^how does\b.*\bwork\b/i, /^why does\b/i, /^define\b/i],
    confidence: 0.68,
  },
];

function toTitleCase(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extracts a location for weather/forecast-style queries. Handles both
 * "weather in Barabanki" (preposition before location) and "Barabanki
 * weather" (location before keyword) — the latter is exactly the
 * pattern that previously caused weather-intent misses.
 */
function extractLocation(text: string): string | undefined {
  const prepMatch = text.match(/\b(?:in|for|at)\s+([a-zA-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F\s]{1,39})(?=[?.!,]|$)/i);
  if (prepMatch && prepMatch[1]) {
    const loc = prepMatch[1].trim();
    if (loc.length > 1) return toTitleCase(loc);
  }

  const beforeMatch = text.match(
    /^([a-zA-Z\u00C0-\u024F]+(?:\s[a-zA-Z\u00C0-\u024F]+)?)\s+(?:weather|temperature|forecast|humidity)\b/i
  );
  if (beforeMatch && beforeMatch[1]) {
    return toTitleCase(beforeMatch[1].trim());
  }

  return undefined;
}

function extractAppName(text: string): string | undefined {
  const match = text.match(/\b(?:open|launch)\s+([a-zA-Z0-9][a-zA-Z0-9\s]{1,29})/i);
  if (!match || !match[1]) return undefined;
  return match[1].trim().replace(/[?.!]+$/, '');
}

function extractContactName(text: string): string | undefined {
  const match = text.match(/\b(?:call|dial|phone|text|sms|message to)\s+([a-zA-Z][a-zA-Z\s]{1,29})/i);
  if (!match || !match[1]) return undefined;
  return toTitleCase(match[1].trim().replace(/[?.!]+$/, ''));
}

function extractReminderText(text: string): string | undefined {
  const match = text.match(/remind me (?:to|about)\s+(.+)/i) ?? text.match(/don'?t forget to\s+(.+)/i);
  if (!match || !match[1]) return undefined;
  return match[1].trim().replace(/[?.!]+$/, '');
}

function extractEntities(type: IntentType, text: string): IntentEntities {
  switch (type) {
    case 'weather':
      return { location: extractLocation(text) };
    case 'news':
      return { topic: text.replace(/\bnews\b/i, '').trim() || undefined };
    case 'open_app':
      return { appName: extractAppName(text) };
    case 'call':
    case 'sms':
      return { contactName: extractContactName(text) };
    case 'reminder':
      return { reminderText: extractReminderText(text) };
    default:
      return {};
  }
}

/**
 * Classifies free-form user text into a structured intent. Purely
 * local — synchronous, no network call, safe to run on every keystroke
 * if ever needed (though it's currently only invoked once per send).
 */
export function classifyIntent(rawText: string): IntentResult {
  const text = rawText.trim();

  if (text.length === 0) {
    return { type: 'unknown', confidence: 0.3, entities: {}, rawText };
  }

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return {
          type: rule.type,
          confidence: rule.confidence,
          entities: extractEntities(rule.type, text),
          rawText,
        };
      }
    }
  }

  return { type: 'conversation', confidence: 0.45, entities: {}, rawText };
}
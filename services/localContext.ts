// localContext.ts
// Single source of truth for device-derived context: time, date, day,
// timezone, plus placeholders for battery/network until those native
// modules are added in a future custom-dev-build phase. Both
// systemPrompt.ts (for Groq's injected context) and jarvisRouter.ts
// (for instant, no-network replies to "what time is it?") read from
// here — no duplicated date-math logic anywhere else in the project.

export interface LocalContext {
  time: string;
  date: string;
  day: string;
  timezone: string;
  tomorrowDate: string;
  yesterdayDate: string;
  daysUntilNewYear: number;
  /** Placeholder — real value requires expo-battery (custom dev build). */
  battery: null;
  /** Placeholder — real value requires expo-network (custom dev build). */
  network: null;
}

const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/** Pure computation from Date/Intl — no network, no caching. Call fresh whenever current context is needed. */
export function getLocalContext(): LocalContext {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const date = now.toLocaleDateString('en-US', FULL_DATE_FORMAT);
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const tomorrowDate = tomorrow.toLocaleDateString('en-US', FULL_DATE_FORMAT);
  const yesterdayDate = yesterday.toLocaleDateString('en-US', FULL_DATE_FORMAT);

  const nextNewYear = new Date(now.getFullYear() + 1, 0, 1);
  const daysUntilNewYear = Math.ceil((nextNewYear.getTime() - now.getTime()) / 86400000);

  return {
    time,
    date,
    day,
    timezone: timeZone,
    tomorrowDate,
    yesterdayDate,
    daysUntilNewYear,
    battery: null,
    network: null,
  };
}

/** Formats the current context as a plain-text block suitable for injection into an AI system prompt. */
export function buildContextPromptBlock(): string {
  const ctx = getLocalContext();
  return [
    `Current local date: ${ctx.date}`,
    `Current local time: ${ctx.time}`,
    `Timezone: ${ctx.timezone}`,
    `Tomorrow's date: ${ctx.tomorrowDate}`,
    `Yesterday's date: ${ctx.yesterdayDate}`,
    `Days remaining until New Year's Day: ${ctx.daysUntilNewYear}`,
  ].join('\n');
}
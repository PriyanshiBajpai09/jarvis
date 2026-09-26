export interface LocalContext {
  time: string;
  date: string;
  day: string;
  timezone: string;
  tomorrowDate: string;
  yesterdayDate: string;
  daysUntilNewYear: number;
  battery: null;
  network: null;
}

const FULL_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
};

export function getLocalContext(): LocalContext {
  const now = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const date = now.toLocaleDateString("en-US", FULL_DATE_FORMAT);
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const tomorrowDate = tomorrow.toLocaleDateString("en-US", FULL_DATE_FORMAT);
  const yesterdayDate = yesterday.toLocaleDateString(
    "en-US",
    FULL_DATE_FORMAT
  );

  const nextNewYear = new Date(now.getFullYear() + 1, 0, 1);

  const daysUntilNewYear = Math.ceil(
    (nextNewYear.getTime() - now.getTime()) / 86400000
  );

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

export function buildContextPromptBlock(): string {
  const ctx = getLocalContext();

  return [
    `Current local date: ${ctx.date}`,
    `Current local time: ${ctx.time}`,
    `Timezone: ${ctx.timezone}`,
    `Tomorrow's date: ${ctx.tomorrowDate}`,
    `Yesterday's date: ${ctx.yesterdayDate}`,
    `Days remaining until New Year's Day: ${ctx.daysUntilNewYear}`,
  ].join("\n");
}
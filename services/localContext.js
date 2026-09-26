"use strict";
// localContext.ts
// Single source of truth for device-derived context: time, date, day,
// timezone, plus placeholders for battery/network until those native
// modules are added in a future custom-dev-build phase. Both
// systemPrompt.ts (for Groq's injected context) and jarvisRouter.ts
// (for instant, no-network replies to "what time is it?") read from
// here — no duplicated date-math logic anywhere else in the project.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalContext = getLocalContext;
exports.buildContextPromptBlock = buildContextPromptBlock;
var FULL_DATE_FORMAT = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
};
/** Pure computation from Date/Intl — no network, no caching. Call fresh whenever current context is needed. */
function getLocalContext() {
    var now = new Date();
    var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var date = now.toLocaleDateString('en-US', FULL_DATE_FORMAT);
    var day = now.toLocaleDateString('en-US', { weekday: 'long' });
    var time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    var tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    var yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    var tomorrowDate = tomorrow.toLocaleDateString('en-US', FULL_DATE_FORMAT);
    var yesterdayDate = yesterday.toLocaleDateString('en-US', FULL_DATE_FORMAT);
    var nextNewYear = new Date(now.getFullYear() + 1, 0, 1);
    var daysUntilNewYear = Math.ceil((nextNewYear.getTime() - now.getTime()) / 86400000);
    return {
        time: time,
        date: date,
        day: day,
        timezone: timeZone,
        tomorrowDate: tomorrowDate,
        yesterdayDate: yesterdayDate,
        daysUntilNewYear: daysUntilNewYear,
        battery: null,
        network: null,
    };
}
/** Formats the current context as a plain-text block suitable for injection into an AI system prompt. */
function buildContextPromptBlock() {
    var ctx = getLocalContext();
    return [
        "Current local date: ".concat(ctx.date),
        "Current local time: ".concat(ctx.time),
        "Timezone: ".concat(ctx.timezone),
        "Tomorrow's date: ".concat(ctx.tomorrowDate),
        "Yesterday's date: ".concat(ctx.yesterdayDate),
        "Days remaining until New Year's Day: ".concat(ctx.daysUntilNewYear),
    ].join('\n');
}

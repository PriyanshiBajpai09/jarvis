"use strict";
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLiveInfoProvider = registerLiveInfoProvider;
exports.routeUserMessage = routeUserMessage;
var aiService_1 = require("./aiService");
var intentEngine_1 = require("./intentEngine");
var actionEngine_1 = require("./actionEngine");
var localContext_1 = require("./localContext");
var protocolEngine_1 = require("./protocolEngine");
var liveInfoService_1 = require("./liveInfoService");
var sessionMemory_1 = require("../storage/sessionMemory");
var liveInfoProvider = null;
function registerLiveInfoProvider(provider) {
    liveInfoProvider = provider;
}
var DEVICE_ACTION_INTENTS = new Set([
    'battery',
    'network',
    'open_app',
    'call',
    'sms',
    'flashlight',
    'reminder',
]);
function buildActionFallbackReply() {
    var variants = [
        "That's outside what I can act on directly from here just yet, Priyanshi. Once I'm running on dedicated hardware, it's a straightforward addition.",
        "I don't have direct control over that from this build. That capability comes online once I'm operating on your hardware directly.",
        "Not something I can execute from here yet — that arrives once this instance moves onto your device's own systems.",
    ];
    return variants[Math.floor(Math.random() * variants.length)];
}
function buildTimeReply(intent) {
    var ctx = (0, localContext_1.getLocalContext)();
    var text = intent.rawText.toLowerCase();
    if (/day is it/.test(text))
        return "Today is ".concat(ctx.day, ", ").concat(ctx.date, ".");
    if (/date/.test(text))
        return "Today's date is ".concat(ctx.date, ".");
    if (/month/.test(text))
        return "We're in ".concat(ctx.date.split(' ').slice(-2).join(' '), " \u2014 full date: ").concat(ctx.date, ".");
    if (/new year/.test(text))
        return "".concat(ctx.daysUntilNewYear, " day").concat(ctx.daysUntilNewYear === 1 ? '' : 's', " remain until New Year's Day.");
    return "It's ".concat(ctx.time, " on ").concat(ctx.day, ", ").concat(ctx.date, ".");
}
function extractWeatherFollowUp(text) {
    var lower = text.trim().toLowerCase();
    if (/^(tomorrow)\??$/.test(lower))
        return 'tomorrow';
    if (/^(today)\??$/.test(lower))
        return 'today';
    if (/(day after|the day after tomorrow)\??$/.test(lower))
        return 'the day after tomorrow';
    if (/^what about\b/.test(lower))
        return null;
    return null;
}
function extractNewsFollowUpTopic(text, previousTopic) {
    var lower = text.trim().toLowerCase();
    if (/^more\b/.test(lower))
        return previousTopic;
    var whatAbout = lower.match(/^what about\s+(.+)/);
    if (whatAbout && whatAbout[1])
        return whatAbout[1].replace(/[?.!]+$/, '').trim();
    return null;
}
var CURRENT_FACT_PATTERNS = [
    /^who is\b/i,
    /^what is the current\b/i,
    /current (prime minister|president|pm|ceo|score|price)\b/i,
];
function looksLikeCurrentFactQuery(text) {
    return CURRENT_FACT_PATTERNS.some(function (p) { return p.test(text.trim()); });
}
function defaultLiveInfoProvider(intent) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (intent.type === 'weather' && intent.entities.location) {
                return [2 /*return*/, (0, liveInfoService_1.getWeatherAnswer)(intent.entities.location)];
            }
            if (intent.type === 'news') {
                return [2 /*return*/, (0, liveInfoService_1.getNewsAnswer)(intent.entities.topic)];
            }
            return [2 /*return*/, null];
        });
    });
}
/* ------------------------------------------------------------------ */
/* Feature 1 — passive personal-fact extraction.                      */
/* Conservative, word-boundary patterns only. Fire-and-forget: this    */
/* never changes what gets returned to the user, it only silently      */
/* records something worth remembering for later, via the SAME         */
/* recordFact() every other feature already uses (which now de-       */
/* duplicates internally — see storage/sessionMemory.ts).             */
/* ------------------------------------------------------------------ */
function extractPersonalFact(text) {
    var trimmed = text.trim();
    if (trimmed.length === 0)
        return null;
    var examMatch = trimmed.match(/\bmy (exam|interview|test|deadline|assignment)\s+is\s+(?:on\s+)?([\w\s,]{2,40})/i);
    if (examMatch) {
        var label = examMatch[1].toLowerCase();
        return { key: "fact:".concat(label), value: "".concat(examMatch[1], " is ").concat(examMatch[2].trim()) };
    }
    var haveMatch = trimmed.match(/\bi have (?:an?|my)?\s*([\w\s]{3,40}?)\s+on\s+([\w\s]{2,20})/i);
    if (haveMatch) {
        var slug = haveMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
        return { key: "fact:".concat(slug), value: "".concat(haveMatch[1].trim(), " on ").concat(haveMatch[2].trim()) };
    }
    var learningMatch = trimmed.match(/\bi'?m (?:learning|studying|working on)\s+([\w\s]{2,40})/i);
    if (learningMatch) {
        return { key: 'fact:current-focus', value: "Learning ".concat(learningMatch[1].trim()) };
    }
    return null;
}
/* ------------------------------------------------------------------ */
/* Feature 2 — Internet Brain: fresh-info detection + combine.        */
/* ------------------------------------------------------------------ */
var FRESH_INFO_PATTERNS = [
    /\blatest\b/i,
    /\brecent(ly)?\b/i,
    /\bcurrent(ly)?\b/i,
    /\bright now\b/i,
    /\bthis week\b/i,
    /\bnewest\b/i,
    /\bup to date\b/i,
    /\bnew version\b/i,
];
function needsFreshInfo(text) {
    return FRESH_INFO_PATTERNS.some(function (p) { return p.test(text); });
}
/**
 * Appends a short "Live context" note to the trailing (most recent)
 * turn in the history, rather than replacing anything. Groq then
 * answers using both the real conversation AND the live fact together
 * — this is the "combine internet context with conversation context"
 * requirement, without introducing a second call path.
 */
function injectContextNote(history, note) {
    if (history.length === 0)
        return history;
    var augmented = __spreadArray([], history, true);
    var lastIndex = augmented.length - 1;
    var lastTurn = augmented[lastIndex];
    augmented[lastIndex] = __assign(__assign({}, lastTurn), { text: "".concat(lastTurn.text, "\n\n(Context you may use: ").concat(note, ")") });
    return augmented;
}
var RECAP_PATTERN = /\b(recap|summar(y|ize)|conversation so far|what have we talked about)\b/i;
function routeUserMessage(userText, history) {
    return __awaiter(this, void 0, void 0, function () {
        var extractedFact, protocol, replyText, intent, pinnedNotes, augmented, reply_1, location_1, whenPhrase, followUpWhen, whatAboutMatch, liveReply, _a, reply_2, topic, previousTopic, followUpTopic, liveReply, _b, reply_3, liveFact, augmented, reply_4, reply;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    extractedFact = extractPersonalFact(userText);
                    if (extractedFact) {
                        void (0, sessionMemory_1.recordFact)(extractedFact.key, extractedFact.value);
                    }
                    protocol = (0, protocolEngine_1.detectProtocol)(userText);
                    if (!protocol) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, protocolEngine_1.runProtocol)(protocol)];
                case 1:
                    replyText = _d.sent();
                    return [4 /*yield*/, (0, sessionMemory_1.recordFact)("lastProtocol", protocol)];
                case 2:
                    _d.sent();
                    return [2 /*return*/, {
                            intent: {
                                type: "conversation",
                                confidence: 1,
                                entities: {},
                                rawText: userText,
                            },
                            replyText: replyText,
                            source: "protocol",
                        }];
                case 3:
                    intent = (0, intentEngine_1.classifyIntent)(userText);
                    if (!RECAP_PATTERN.test(userText)) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, sessionMemory_1.getPinnedNotes)()];
                case 4:
                    pinnedNotes = _d.sent();
                    augmented = pinnedNotes.length > 0
                        ? injectContextNote(history, "Pinned notes \u2014 ".concat(pinnedNotes.join("; "), "."))
                        : history;
                    return [4 /*yield*/, (0, aiService_1.askJarvis)(augmented)];
                case 5:
                    reply_1 = _d.sent();
                    return [2 /*return*/, {
                            intent: intent,
                            replyText: reply_1,
                            source: "context",
                        }];
                case 6:
                    // 3. Instant local-time answers — unchanged.
                    if (intent.type === "time") {
                        return [2 /*return*/, {
                                intent: intent,
                                replyText: buildTimeReply(intent),
                                source: "context",
                            }];
                    }
                    // 4. Device actions — unchanged.
                    if (DEVICE_ACTION_INTENTS.has(intent.type)) {
                        (0, actionEngine_1.resolveAction)(intent);
                        return [2 /*return*/, {
                                intent: intent,
                                replyText: buildActionFallbackReply(),
                                source: "action-fallback",
                            }];
                    }
                    if (!(intent.type === "weather")) return [3 /*break*/, 17];
                    location_1 = intent.entities.location;
                    whenPhrase = void 0;
                    if (!!location_1) return [3 /*break*/, 9];
                    followUpWhen = extractWeatherFollowUp(userText);
                    if (!followUpWhen) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, sessionMemory_1.getLatestFact)("lastCity")];
                case 7:
                    location_1 = (_c = (_d.sent())) !== null && _c !== void 0 ? _c : undefined;
                    whenPhrase = followUpWhen;
                    return [3 /*break*/, 9];
                case 8:
                    whatAboutMatch = userText.trim().match(/^what about\s+(.+)/i);
                    if (whatAboutMatch && whatAboutMatch[1]) {
                        location_1 = whatAboutMatch[1].replace(/[?.!]+$/, "").trim();
                    }
                    _d.label = 9;
                case 9:
                    if (!location_1) return [3 /*break*/, 15];
                    if (!liveInfoProvider) return [3 /*break*/, 11];
                    return [4 /*yield*/, liveInfoProvider(__assign(__assign({}, intent), { entities: __assign(__assign({}, intent.entities), { location: location_1 }) }))];
                case 10:
                    _a = _d.sent();
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, (0, liveInfoService_1.getWeatherAnswer)(location_1, whenPhrase)];
                case 12:
                    _a = _d.sent();
                    _d.label = 13;
                case 13:
                    liveReply = _a;
                    if (!liveReply) return [3 /*break*/, 15];
                    return [4 /*yield*/, (0, sessionMemory_1.recordFact)("lastCity", location_1)];
                case 14:
                    _d.sent();
                    return [2 /*return*/, {
                            intent: intent,
                            replyText: liveReply,
                            source: "live-info",
                        }];
                case 15: return [4 /*yield*/, (0, aiService_1.askJarvis)(history)];
                case 16:
                    reply_2 = _d.sent();
                    return [2 /*return*/, {
                            intent: intent,
                            replyText: reply_2,
                            source: "groq",
                        }];
                case 17:
                    if (!(intent.type === "news")) return [3 /*break*/, 27];
                    topic = intent.entities.topic;
                    if (!(!topic || topic.trim().length === 0)) return [3 /*break*/, 19];
                    return [4 /*yield*/, (0, sessionMemory_1.getLatestFact)("lastNewsTopic")];
                case 18:
                    previousTopic = _d.sent();
                    followUpTopic = extractNewsFollowUpTopic(userText, previousTopic);
                    if (followUpTopic)
                        topic = followUpTopic;
                    _d.label = 19;
                case 19:
                    if (!liveInfoProvider) return [3 /*break*/, 21];
                    return [4 /*yield*/, liveInfoProvider(__assign(__assign({}, intent), { entities: __assign(__assign({}, intent.entities), { topic: topic }) }))];
                case 20:
                    _b = _d.sent();
                    return [3 /*break*/, 23];
                case 21: return [4 /*yield*/, (0, liveInfoService_1.getNewsAnswer)(topic)];
                case 22:
                    _b = _d.sent();
                    _d.label = 23;
                case 23:
                    liveReply = _b;
                    if (!liveReply) return [3 /*break*/, 25];
                    return [4 /*yield*/, (0, sessionMemory_1.recordFact)("lastNewsTopic", topic !== null && topic !== void 0 ? topic : "general")];
                case 24:
                    _d.sent();
                    return [2 /*return*/, {
                            intent: intent,
                            replyText: liveReply,
                            source: "live-info",
                        }];
                case 25: return [4 /*yield*/, (0, aiService_1.askJarvis)(history)];
                case 26:
                    reply_3 = _d.sent();
                    return [2 /*return*/, {
                            intent: intent,
                            replyText: reply_3,
                            source: "groq",
                        }];
                case 27:
                    if (!needsFreshInfo(userText)) return [3 /*break*/, 30];
                    return [4 /*yield*/, (0, liveInfoService_1.getFactAnswer)(userText)];
                case 28:
                    liveFact = _d.sent();
                    if (!liveFact) return [3 /*break*/, 30];
                    augmented = injectContextNote(history, liveFact);
                    return [4 /*yield*/, (0, aiService_1.askJarvis)(augmented)];
                case 29:
                    reply_4 = _d.sent();
                    return [2 /*return*/, { intent: intent, replyText: reply_4, source: 'live-info' }];
                case 30: return [4 /*yield*/, (0, aiService_1.askJarvis)(history)];
                case 31:
                    reply = _d.sent();
                    return [2 /*return*/, { intent: intent, replyText: reply, source: 'groq' }];
            }
        });
    });
}
registerLiveInfoProvider(defaultLiveInfoProvider);

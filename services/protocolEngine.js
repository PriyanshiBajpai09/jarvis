"use strict";
// protocolEngine.ts — Part B: named routines (Morning/Study/Night
// Protocol). Detection must run BEFORE intent classification and
// Groq, per spec — jarvisRouter checks detectProtocol() first thing.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProtocol = detectProtocol;
exports.runProtocol = runProtocol;
var localContext_1 = require("./localContext");
var liveInfoService_1 = require("./liveInfoService");
var sessionMemory_1 = require("./sessionMemory");
var MORNING_TRIGGERS = [/morning protocol/i, /^start my day\b/i];
var STUDY_TRIGGERS = [/study mode/i, /study protocol/i, /^activate study/i];
var NIGHT_TRIGGERS = [/^good night\b/i, /night protocol/i];
function detectProtocol(text) {
    var clean = text.trim();
    if (MORNING_TRIGGERS.some(function (p) { return p.test(clean); }))
        return 'morning';
    if (STUDY_TRIGGERS.some(function (p) { return p.test(clean); }))
        return 'study';
    if (NIGHT_TRIGGERS.some(function (p) { return p.test(clean); }))
        return 'night';
    return null;
}
var MOTIVATIONAL_LINES = [
    "Everything is calibrated. Let's make today count.",
    "Systems green across the board. Ready when you are.",
    "A clean slate, Priyanshi. Use it well.",
];
var STUDY_FOCUS_LINES = [
    "One task at a time gets the best results. Shall we begin?",
    "Focus mode is the objective. I'll keep distractions to a minimum on my end.",
    "Clear mind, clear priorities. Let's get into it.",
];
var NIGHT_LINES = [
    "Rest well. I'll keep watch until morning.",
    "Powering down the noise, not the readiness. Sleep well.",
    "Everything that needs handling can wait until you're rested.",
];
function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
}
function buildMorningReply() {
    return __awaiter(this, void 0, void 0, function () {
        var ctx, lines, lastCity, weather, headline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx = (0, localContext_1.getLocalContext)();
                    lines = ["Good morning, Priyanshi. It's ".concat(ctx.time, " on ").concat(ctx.day, ", ").concat(ctx.date, ".")];
                    return [4 /*yield*/, (0, sessionMemory_1.getLatestFact)('lastCity')];
                case 1:
                    lastCity = _a.sent();
                    if (!lastCity) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, liveInfoService_1.getWeatherAnswer)(lastCity)];
                case 2:
                    weather = _a.sent();
                    if (weather)
                        lines.push(weather);
                    _a.label = 3;
                case 3: return [4 /*yield*/, (0, liveInfoService_1.getNewsAnswer)()];
                case 4:
                    headline = _a.sent();
                    if (headline)
                        lines.push(headline);
                    lines.push(pick(MOTIVATIONAL_LINES));
                    return [2 /*return*/, lines.join(' ')];
            }
        });
    });
}
function buildStudyReply() {
    var ctx = (0, localContext_1.getLocalContext)();
    return "Study mode engaged. It's ".concat(ctx.time, ", ").concat(ctx.day, " ").concat(ctx.date, ". ").concat(pick(STUDY_FOCUS_LINES));
}
function buildNightReply() {
    var ctx = (0, localContext_1.getLocalContext)();
    return "It's ".concat(ctx.time, ". ").concat(pick(NIGHT_LINES), " I'll have things in order for you tomorrow.");
}
function runProtocol(type) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (type) {
                case 'morning':
                    return [2 /*return*/, buildMorningReply()];
                case 'study':
                    return [2 /*return*/, buildStudyReply()];
                case 'night':
                    return [2 /*return*/, buildNightReply()];
                default:
                    return [2 /*return*/, "Protocol not recognized."];
            }
            return [2 /*return*/];
        });
    });
}

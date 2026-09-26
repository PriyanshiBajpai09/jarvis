"use strict";
// sessionMemory.ts — Part C: lightweight session facts, separate from
// full conversation history (conversationStore.ts). Stores at most 20
// recent facts (city asked about, news topic, last protocol run) so
// follow-up questions like "what about tomorrow?" can resolve context
// without re-asking. Never replaces or touches conversation memory.
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
exports.recordFact = recordFact;
exports.getLatestFact = getLatestFact;
exports.clearSessionMemory = clearSessionMemory;
var localStore_1 = require("../storage/localStore");
var SESSION_KEY = 'jarvis:sessionMemory:v1';
var MAX_FACTS = 20;
function readFacts() {
    return __awaiter(this, void 0, void 0, function () {
        var facts, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, localStore_1.getItem)(SESSION_KEY)];
                case 1:
                    facts = _b.sent();
                    return [2 /*return*/, Array.isArray(facts) ? facts : []];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/** Records a fact (e.g. key: "lastCity", value: "Barabanki"). Capped at MAX_FACTS total, oldest dropped first. Never throws. */
function recordFact(key, value) {
    return __awaiter(this, void 0, void 0, function () {
        var facts, capped, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!value || value.trim().length === 0)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, readFacts()];
                case 2:
                    facts = _b.sent();
                    facts.push({ key: key, value: value.trim(), timestamp: Date.now() });
                    capped = facts.slice(-MAX_FACTS);
                    return [4 /*yield*/, (0, localStore_1.setItem)(SESSION_KEY, capped)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/** Returns the most recently recorded value for a given key, or null if none exists. */
function getLatestFact(key) {
    return __awaiter(this, void 0, void 0, function () {
        var facts, i, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, readFacts()];
                case 1:
                    facts = _b.sent();
                    for (i = facts.length - 1; i >= 0; i -= 1) {
                        if (facts[i].key === key)
                            return [2 /*return*/, facts[i].value];
                    }
                    return [2 /*return*/, null];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function clearSessionMemory() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, localStore_1.setItem)(SESSION_KEY, [])];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}

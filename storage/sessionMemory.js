"use strict";
// sessionMemory.ts — v0.9.0: same storage architecture, still one
// capped array under one AsyncStorage key. New (additive only):
// exported SessionFact interface, getAllFacts() and deleteFact() for
// the Developer Mode Memory Inspector. recordFact/pinNote/
// getLatestFact/getPinnedNotes/clearSessionMemory are UNCHANGED.
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
exports.recordFact = recordFact;
exports.getLatestFact = getLatestFact;
exports.pinNote = pinNote;
exports.getPinnedNotes = getPinnedNotes;
exports.clearSessionMemory = clearSessionMemory;
exports.getAllFacts = getAllFacts;
exports.deleteFact = deleteFact;
var localStore_1 = require("./localStore");
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
function writeFacts(facts) {
    return __awaiter(this, void 0, void 0, function () {
        var capped;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    capped = facts.slice(-MAX_FACTS);
                    return [4 /*yield*/, (0, localStore_1.setItem)(SESSION_KEY, capped)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function recordFact(key, value) {
    return __awaiter(this, void 0, void 0, function () {
        var trimmedValue, facts, latestForKey, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    trimmedValue = value.trim();
                    if (trimmedValue.length === 0)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, readFacts()];
                case 2:
                    facts = _b.sent();
                    latestForKey = __spreadArray([], facts, true).reverse().find(function (f) { return f.key === key; });
                    if (latestForKey && latestForKey.value === trimmedValue) {
                        return [2 /*return*/];
                    }
                    facts.push({ key: key, value: trimmedValue, timestamp: Date.now() });
                    return [4 /*yield*/, writeFacts(facts)];
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
function slugifyNote(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, '')
        .slice(0, 40);
}
function pinNote(text) {
    return __awaiter(this, void 0, void 0, function () {
        var clean, key, facts, alreadyPinned, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    clean = text.trim();
                    if (clean.length === 0)
                        return [2 /*return*/, false];
                    key = "pinned:".concat(slugifyNote(clean));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, readFacts()];
                case 2:
                    facts = _b.sent();
                    alreadyPinned = facts.some(function (f) { return f.key === key; });
                    if (alreadyPinned)
                        return [2 /*return*/, false];
                    facts.push({ key: key, value: clean, timestamp: Date.now() });
                    return [4 /*yield*/, writeFacts(facts)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, true];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getPinnedNotes() {
    return __awaiter(this, void 0, void 0, function () {
        var facts, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, readFacts()];
                case 1:
                    facts = _b.sent();
                    return [2 /*return*/, facts.filter(function (f) { return f.key.startsWith('pinned:'); }).map(function (f) { return f.value; })];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, []];
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
/** v0.9.0 — Developer Mode Memory Inspector: returns every stored fact (pinned notes and regular facts alike), oldest first. Read-only, no new storage. */
function getAllFacts() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, readFacts()];
        });
    });
}
/** v0.9.0 — Developer Mode Memory Inspector: deletes one specific entry, identified by its exact key+timestamp pair (since a key can have multiple historical values). Never throws. */
function deleteFact(key, timestamp) {
    return __awaiter(this, void 0, void 0, function () {
        var facts, filtered, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, readFacts()];
                case 1:
                    facts = _b.sent();
                    filtered = facts.filter(function (f) { return !(f.key === key && f.timestamp === timestamp); });
                    return [4 /*yield*/, writeFacts(filtered)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}

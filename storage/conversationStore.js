"use strict";
// conversationStore.ts
// Persistent memory for the Conversation Panel (Phase 19). Sits on top
// of storage/localStore.ts's generic AsyncStorage wrapper. Stores the
// message list plus a "last opened" timestamp under one key, capped at
// MAX_STORED_MESSAGES to avoid unbounded growth. All functions are
// defensive — a storage failure never throws into the UI; callers get
// null/void and the chat simply continues from its in-memory state.
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
exports.loadConversation = loadConversation;
exports.saveConversation = saveConversation;
exports.clearConversation = clearConversation;
var localStore_1 = require("./localStore");
var CONVERSATION_KEY = 'jarvis:conversation:v1';
var MAX_STORED_MESSAGES = 100;
/**
 * Restores the saved conversation, if any. Returns null when nothing is
 * stored yet, the stored shape is unexpected, or reading fails for any
 * reason — callers should treat null as "start fresh" rather than an
 * error condition.
 */
function loadConversation() {
    return __awaiter(this, void 0, void 0, function () {
        var record, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, localStore_1.getItem)(CONVERSATION_KEY)];
                case 1:
                    record = _b.sent();
                    if (!record || !Array.isArray(record.messages) || record.messages.length === 0) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, record.messages];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Persists the given messages, keeping only the newest
 * MAX_STORED_MESSAGES. Updates the "last opened" timestamp alongside
 * them. Intended to be called after a debounce, not per keystroke.
 * Failures are swallowed — persistence is a background convenience,
 * never something that should interrupt the chat experience.
 */
function saveConversation(messages) {
    return __awaiter(this, void 0, void 0, function () {
        var capped, record, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    capped = messages.slice(-MAX_STORED_MESSAGES);
                    record = {
                        messages: capped,
                        lastOpenedAt: Date.now(),
                    };
                    return [4 /*yield*/, (0, localStore_1.setItem)(CONVERSATION_KEY, record)];
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
/**
 * Erases stored chat memory entirely. Does not touch any Groq/provider
 * configuration — those live under separate env vars and are untouched
 * by this module.
 */
function clearConversation() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, localStore_1.removeItem)(CONVERSATION_KEY)];
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

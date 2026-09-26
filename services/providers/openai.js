"use strict";
// providers/openai.ts — ESLint + TypeScript strict safe
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
exports.askOpenAI = askOpenAI;
var aiTypes_1 = require("../aiTypes");
var systemPrompt_1 = require("../systemPrompt");
var OPENAI_MODEL = "gpt-4o-mini";
var OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
var REQUEST_TIMEOUT_MS = 15000;
function getApiKey() {
    var env = process.env;
    var key = env.EXPO_PUBLIC_OPENAI_API_KEY;
    return typeof key === "string" && key.length > 0 ? key : null;
}
function toChatRole(role) {
    return role === "user" ? "user" : "assistant";
}
function isOpenAIResponse(value) {
    if (typeof value !== "object" || value === null)
        return false;
    var record = value;
    return (!("choices" in record) ||
        Array.isArray(record.choices));
}
function askOpenAI(history) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, controller, timeoutId, systemPrompt, response, err_1, json, _a, text;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    apiKey = getApiKey();
                    if (!apiKey) {
                        throw new aiTypes_1.AIServiceError("config", "OpenAI API key missing. Add EXPO_PUBLIC_OPENAI_API_KEY to a .env file.");
                    }
                    controller = new AbortController();
                    timeoutId = setTimeout(function () { return controller.abort(); }, REQUEST_TIMEOUT_MS);
                    systemPrompt = (0, systemPrompt_1.getSystemPromptWithContext)();
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch(OPENAI_ENDPOINT, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(apiKey),
                            },
                            signal: controller.signal,
                            body: JSON.stringify({
                                model: OPENAI_MODEL,
                                temperature: 0.7,
                                max_tokens: 700,
                                messages: __spreadArray([
                                    { role: "system", content: systemPrompt }
                                ], history.map(function (turn) { return ({
                                    role: toChatRole(turn.role),
                                    content: turn.text,
                                }); }), true),
                            }),
                        })];
                case 2:
                    response = _f.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _f.sent();
                    clearTimeout(timeoutId);
                    if (err_1 instanceof Error && err_1.name === "AbortError") {
                        throw new aiTypes_1.AIServiceError("timeout", (0, aiTypes_1.pickImmersiveMessage)("timeout"));
                    }
                    throw new aiTypes_1.AIServiceError("network", (0, aiTypes_1.pickImmersiveMessage)("network"));
                case 4:
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        if (response.status === 429) {
                            throw new aiTypes_1.AIServiceError("quota", (0, aiTypes_1.pickImmersiveMessage)("quota"));
                        }
                        throw new aiTypes_1.AIServiceError("http", (0, aiTypes_1.pickImmersiveMessage)("http"));
                    }
                    _f.label = 5;
                case 5:
                    _f.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, response.json()];
                case 6:
                    json = _f.sent();
                    return [3 /*break*/, 8];
                case 7:
                    _a = _f.sent();
                    throw new aiTypes_1.AIServiceError("empty", (0, aiTypes_1.pickImmersiveMessage)("empty"));
                case 8:
                    if (!isOpenAIResponse(json)) {
                        throw new aiTypes_1.AIServiceError("empty", (0, aiTypes_1.pickImmersiveMessage)("empty"));
                    }
                    text = (_e = (_d = (_c = (_b = json.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : "";
                    if (!text.trim()) {
                        throw new aiTypes_1.AIServiceError("empty", (0, aiTypes_1.pickImmersiveMessage)("empty"));
                    }
                    return [2 /*return*/, text.trim()];
            }
        });
    });
}

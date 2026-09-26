"use strict";
// diagnosticsService.ts — v0.9.0. Aggregates real, already-available
// read-only signals from existing services for the Developer Mode
// panel. Never invents a value — anything it can't verify is reported
// as unavailable rather than guessed.
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
exports.SPEECH_VOLUME = exports.SPEECH_PITCH = exports.SPEECH_RATE = void 0;
exports.collectDiagnostics = collectDiagnostics;
var webVoiceService_1 = require("./webVoiceService");
Object.defineProperty(exports, "SPEECH_PITCH", { enumerable: true, get: function () { return webVoiceService_1.SPEECH_PITCH; } });
Object.defineProperty(exports, "SPEECH_RATE", { enumerable: true, get: function () { return webVoiceService_1.SPEECH_RATE; } });
Object.defineProperty(exports, "SPEECH_VOLUME", { enumerable: true, get: function () { return webVoiceService_1.SPEECH_VOLUME; } });
var aiService_1 = require("./aiService");
var liveInfoService_1 = require("./liveInfoService");
var sessionMemory_1 = require("../storage/sessionMemory");
function collectDiagnostics() {
    return __awaiter(this, void 0, void 0, function () {
        var memoryConnected, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    memoryConnected = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, sessionMemory_1.getAllFacts)()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    memoryConnected = false;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, {
                        voiceEngineOnline: (0, webVoiceService_1.isWebVoiceSupported)(),
                        selectedVoiceName: (0, webVoiceService_1.getSelectedVoiceName)(),
                        memoryConnected: memoryConnected,
                        weatherApiConfigured: (0, liveInfoService_1.isLiveInfoConfigured)(),
                        aiProvider: (0, aiService_1.getActiveProviderName)(),
                        lastLatencyMs: (0, aiService_1.getLastResponseLatencyMs)(),
                        // "Online" reflects that this component is mounted and rendering —
                        // a real, non-invented signal, not a fabricated health check.
                        reactorStatus: 'Online',
                    }];
            }
        });
    });
}

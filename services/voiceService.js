"use strict";
// voiceService.ts — Phase 17A: Voice Foundation only.
//
// Wraps expo-speech-recognition (STT) and expo-speech (TTS) behind a
// small typed API with a single source of truth for voice state. This
// phase intentionally stops at the plumbing:
//   - startListening()/stopListening() work and report real state.
//   - speak()/stopSpeaking() work in isolation.
//   - onTranscript is a prepared callback slot, not yet connected to
//     chat — Phase 17B will forward it into the conversation pipeline.
//   - Nothing here touches Groq, ConversationPanel's message list, or
//     the Arc Reactor.
//
// Requires a custom dev build — expo-speech-recognition ships native
// code and does not run inside Expo Go.
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
exports.configureVoiceService = configureVoiceService;
exports.teardownVoiceService = teardownVoiceService;
exports.getVoiceState = getVoiceState;
exports.requestMicPermission = requestMicPermission;
exports.startListening = startListening;
exports.stopListening = stopListening;
exports.speak = speak;
exports.stopSpeaking = stopSpeaking;
var Speech = require("expo-speech");
var expo_speech_recognition_1 = require("expo-speech-recognition");
var state = 'idle';
var callbacks = {};
var listenersRegistered = false;
function setState(next) {
    var _a;
    state = next;
    (_a = callbacks.onStateChange) === null || _a === void 0 ? void 0 : _a.call(callbacks, next);
}
function mapRecognitionError(code) {
    switch (code) {
        case 'not-allowed':
        case 'permission-denied':
            return 'Microphone access has not been authorized.';
        case 'no-speech':
            return 'No signal detected. Try again.';
        case 'network':
            return 'Voice uplink interrupted.';
        default:
            return 'Voice channel disrupted.';
    }
}
function registerListeners() {
    if (listenersRegistered)
        return;
    listenersRegistered = true;
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('start', function () {
        setState('listening');
    });
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('end', function () {
        if (state === 'listening')
            setState('idle');
    });
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('result', function (event) {
        var _a, _b, _c, _d;
        var typed = event;
        var transcript = (_c = (_b = (_a = typed.results) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript) === null || _c === void 0 ? void 0 : _c.trim();
        if (transcript && typed.isFinal !== false) {
            // Phase 17B will decide what to do with this. In this phase the
            // callback simply exists — nothing currently consumes it to send
            // a chat message.
            (_d = callbacks.onTranscript) === null || _d === void 0 ? void 0 : _d.call(callbacks, transcript);
        }
    });
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('error', function (event) {
        var _a;
        var typed = event;
        setState('idle');
        (_a = callbacks.onError) === null || _a === void 0 ? void 0 : _a.call(callbacks, mapRecognitionError(typed.error));
    });
}
/**
 * Registers callbacks for state/transcript/error events. Safe to call
 * on every mount of a consuming component — native listeners are only
 * ever attached once (registerListeners is idempotent).
 */
function configureVoiceService(next) {
    callbacks = next;
    registerListeners();
}
/**
 * Clears registered callbacks (Task 4 — safe cleanup). Call this from a
 * component's unmount effect so it stops receiving events and holds no
 * stale closures. Native listeners themselves stay attached for the
 * app's lifetime (the underlying module has no "remove all" API), but
 * become inert once callbacks are cleared here.
 */
function teardownVoiceService() {
    callbacks = {};
}
function getVoiceState() {
    return state;
}
/** Never throws — resolves false on any failure so callers can show an immersive message instead of crashing. */
function requestMicPermission() {
    return __awaiter(this, void 0, void 0, function () {
        var result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, expo_speech_recognition_1.ExpoSpeechRecognitionModule.requestPermissionsAsync()];
                case 1:
                    result = (_b.sent());
                    return [2 /*return*/, Boolean(result === null || result === void 0 ? void 0 : result.granted)];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function startListening() {
    return __awaiter(this, void 0, void 0, function () {
        var granted, message, message;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    registerListeners();
                    if (state === 'speaking') {
                        stopSpeaking();
                    }
                    return [4 /*yield*/, requestMicPermission()];
                case 1:
                    granted = _c.sent();
                    if (!granted) {
                        message = 'Microphone access has not been authorized.';
                        (_a = callbacks.onError) === null || _a === void 0 ? void 0 : _a.call(callbacks, message);
                        return [2 /*return*/, { success: false, error: message }];
                    }
                    try {
                        expo_speech_recognition_1.ExpoSpeechRecognitionModule.start({
                            lang: 'en-US',
                            interimResults: false,
                            continuous: false,
                            maxAlternatives: 1,
                        });
                        return [2 /*return*/, { success: true }];
                    }
                    catch (_d) {
                        message = 'Voice channel disrupted.';
                        (_b = callbacks.onError) === null || _b === void 0 ? void 0 : _b.call(callbacks, message);
                        return [2 /*return*/, { success: false, error: message }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function stopListening() {
    try {
        expo_speech_recognition_1.ExpoSpeechRecognitionModule.stop();
    }
    catch (_a) {
        // Nothing to stop — safe no-op.
    }
    if (state === 'listening')
        setState('idle');
}
/** Not invoked anywhere yet in this phase — reserved for Phase 17B (speaking JARVIS's reply aloud). */
function speak(text, onDone) {
    var clean = text.trim();
    if (!clean)
        return;
    if (state === 'speaking') {
        void Speech.stop();
    }
    setState('speaking');
    Speech.speak(clean, {
        rate: 1.0,
        pitch: 1.0,
        onDone: function () {
            setState('idle');
            onDone === null || onDone === void 0 ? void 0 : onDone();
        },
        onStopped: function () {
            setState('idle');
        },
        onError: function () {
            setState('idle');
        },
    });
}
function stopSpeaking() {
    void Speech.stop();
    if (state === 'speaking')
        setState('idle');
}

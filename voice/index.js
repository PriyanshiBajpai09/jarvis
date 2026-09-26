"use strict";
// voice/index.ts
// Real Voice Engine — Phase 18. Uses expo-speech-recognition (STT) and
// expo-speech (TTS) only, per spec. Requires a custom dev build (not
// Expo Go) since expo-speech-recognition ships native code — see the
// project notes for the app.json plugin entry that must be added.
//
// TypeScript note: expo-speech-recognition's exact event payload shape
// can vary slightly by installed version. To stay strictly typed
// without using `any`, event objects are received as the module's own
// inferred type and cast through `unknown` into the small local
// interfaces below before being read. If your installed version's
// event fields differ, only these two interfaces need updating.
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
exports.configureVoice = configureVoice;
exports.isListening = isListening;
exports.isSpeakingNow = isSpeakingNow;
exports.requestMicPermission = requestMicPermission;
exports.startListening = startListening;
exports.stopListening = stopListening;
exports.speak = speak;
exports.stopSpeaking = stopSpeaking;
var Speech = require("expo-speech");
var expo_speech_recognition_1 = require("expo-speech-recognition");
var callbacks = null;
var listenersRegistered = false;
var listening = false;
var speaking = false;
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
function ensureListeners() {
    if (listenersRegistered)
        return;
    listenersRegistered = true;
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('start', function () {
        listening = true;
        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onListeningChange(true);
    });
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('end', function () {
        listening = false;
        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onListeningChange(false);
    });
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('result', function (event) {
        var _a, _b, _c;
        var typed = event;
        var transcript = (_c = (_b = (_a = typed.results) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript) === null || _c === void 0 ? void 0 : _c.trim();
        if (transcript && typed.isFinal !== false) {
            callbacks === null || callbacks === void 0 ? void 0 : callbacks.onTranscript(transcript);
        }
    });
    expo_speech_recognition_1.ExpoSpeechRecognitionModule.addListener('error', function (event) {
        var typed = event;
        listening = false;
        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onListeningChange(false);
        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError(mapRecognitionError(typed.error));
    });
}
/** Registers callbacks used by every start/stop/result/error event. Safe to call from a component's useEffect on every mount — internal listeners are only ever attached once. */
function configureVoice(next) {
    callbacks = next;
    ensureListeners();
}
function isListening() {
    return listening;
}
function isSpeakingNow() {
    return speaking;
}
/** Requests microphone + speech-recognition permission. Never throws — returns false on any failure so callers can show an immersive message instead of crashing. */
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
/**
 * Starts a listening session. Always stops any in-progress speech first
 * (per spec: pressing mic while JARVIS is speaking stops speech and
 * starts listening). Requests permission if needed; on denial, reports
 * an immersive error and does not start.
 */
function startListening() {
    return __awaiter(this, void 0, void 0, function () {
        var granted, message, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ensureListeners();
                    if (speaking) {
                        stopSpeaking();
                    }
                    return [4 /*yield*/, requestMicPermission()];
                case 1:
                    granted = _a.sent();
                    if (!granted) {
                        message = "Microphone access has not been authorized.";
                        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError(message);
                        return [2 /*return*/, { success: false, error: message }];
                    }
                    try {
                        expo_speech_recognition_1.ExpoSpeechRecognitionModule.start({
                            lang: "en-US",
                            interimResults: false,
                            continuous: false,
                            maxAlternatives: 1,
                        });
                        listening = true;
                        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onListeningChange(true);
                        return [2 /*return*/, { success: true }];
                    }
                    catch (_b) {
                        message = "Voice channel disrupted.";
                        callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError(message);
                        return [2 /*return*/, { success: false, error: message }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function stopListening() {
    try {
        void expo_speech_recognition_1.ExpoSpeechRecognitionModule.stop();
    }
    catch (_a) {
        // Nothing to stop — safe no-op.
    }
    listening = false;
    callbacks === null || callbacks === void 0 ? void 0 : callbacks.onListeningChange(false);
}
/**
 * Speaks text aloud. Never overlaps — any currently-playing speech is
 * stopped before the new utterance begins.
 */
function speak(text, onDone) {
    var clean = text.trim();
    if (!clean)
        return;
    if (speaking) {
        void Speech.stop();
    }
    speaking = true;
    Speech.speak(clean, {
        rate: 1.0,
        pitch: 1.0,
        onDone: function () {
            speaking = false;
            onDone === null || onDone === void 0 ? void 0 : onDone();
        },
        onStopped: function () {
            speaking = false;
        },
        onError: function () {
            speaking = false;
        },
    });
}
function stopSpeaking() {
    void Speech.stop();
    speaking = false;
}

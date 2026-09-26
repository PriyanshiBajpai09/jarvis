"use strict";
// webVoiceService.ts — v0.5: refined voice selection (en-IN priority),
// updated speech settings, and an Indian-pronunciation normalization
// pass applied ONLY to spoken text (never to the visible chat message).
// Web-only; every browser API access is guarded so this file is safe
// to import on native without any crash risk. No new dependencies.
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
exports.isWebVoiceSupported = isWebVoiceSupported;
exports.isSpeakingNow = isSpeakingNow;
exports.speak = speak;
exports.stopSpeaking = stopSpeaking;
exports.configureWebVoice = configureWebVoice;
exports.teardownWebVoice = teardownWebVoice;
exports.startListening = startListening;
exports.stopListening = stopListening;
exports.getSelectedVoiceName = getSelectedVoiceName;
exports.reloadVoiceEngine = reloadVoiceEngine;
exports.previewPronunciation = previewPronunciation;
/* ---------------------------------------------------------------- */
/* Module state                                                       */
/* ---------------------------------------------------------------- */
var callbacks = null;
var activeRecognition = null;
var speaking = false;
var audioContext = null;
var selectedVoice = null;
var voicesPromise = null;
var utteranceQueue = [];
var queueIndex = 0;
var queueOnDone;
function getRecognitionConstructor() {
    var _a, _b;
    if (typeof window === 'undefined')
        return null;
    return (_b = (_a = window.SpeechRecognition) !== null && _a !== void 0 ? _a : window.webkitSpeechRecognition) !== null && _b !== void 0 ? _b : null;
}
function hasSpeechSynthesis() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
function isWebVoiceSupported() {
    return getRecognitionConstructor() !== null && hasSpeechSynthesis();
}
function isSpeakingNow() {
    return speaking;
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
        case 'aborted':
            return 'Listening interrupted.';
        case 'timeout':
            return 'Response delayed.';
        default:
            return 'Voice channel disrupted.';
    }
}
/* ---------------------------------------------------------------- */
/* Part E — Web Audio cues (synthesized, no audio files)             */
/* ---------------------------------------------------------------- */
function getAudioContext() {
    var _a, _b;
    if (typeof window === 'undefined')
        return null;
    if (!audioContext) {
        var Ctor = (_b = (_a = window.AudioContext) !== null && _a !== void 0 ? _a : window.webkitAudioContext) !== null && _b !== void 0 ? _b : null;
        if (!Ctor)
            return null;
        audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended') {
        void audioContext.resume();
    }
    return audioContext;
}
function playTone(freqStart, freqEnd, durationMs, type, peakGain) {
    var ctx = getAudioContext();
    if (!ctx)
        return;
    var oscillator = ctx.createOscillator();
    var gainNode = ctx.createGain();
    var now = ctx.currentTime;
    var durationSec = durationMs / 1000;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freqStart, now);
    oscillator.frequency.linearRampToValueAtTime(freqEnd, now + durationSec);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + durationSec * 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + durationSec);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + durationSec);
}
function playListeningStartCue() {
    playTone(420, 880, 100, 'sine', 0.05);
}
function playListeningEndCue() {
    playTone(600, 480, 60, 'sine', 0.035);
}
function playSpeakingStartCue() {
    playTone(500, 640, 90, 'triangle', 0.045);
}
function playErrorCue() {
    playTone(180, 130, 110, 'sawtooth', 0.04);
}
/* ---------------------------------------------------------------- */
/* Part A — natural voice selection (en-IN, then Natural voices,     */
/* then Google fallbacks, then browser default)                     */
/* ---------------------------------------------------------------- */
var NAME_PREFERENCE_KEYWORDS = ['google english india', 'microsoft natural english india', 'google uk english male', 'google us english', 'ryan', 'guy', 'aria'];
function loadVoices() {
    if (voicesPromise)
        return voicesPromise;
    voicesPromise = new Promise(function (resolve) {
        if (!hasSpeechSynthesis()) {
            resolve([]);
            return;
        }
        var existing = window.speechSynthesis.getVoices();
        if (existing.length > 0) {
            resolve(existing);
            return;
        }
        var settled = false;
        var finish = function (voices) {
            if (settled)
                return;
            settled = true;
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            clearInterval(pollInterval);
            resolve(voices);
        };
        var handleVoicesChanged = function () {
            var voices = window.speechSynthesis.getVoices();
            if (voices.length > 0)
                finish(voices);
        };
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        var attempts = 0;
        var pollInterval = setInterval(function () {
            attempts += 1;
            var voices = window.speechSynthesis.getVoices();
            if (voices.length > 0 || attempts > 20) {
                finish(voices);
            }
        }, 150);
    });
    return voicesPromise;
}
/**
 * Preference order: (1) any voice whose lang is en-IN, (2) name match
 * against Ryan/Guy/Aria Online (Natural) in that order, (3) Google UK
 * English Male, (4) Google US English, (5) whatever the browser
 * reports first. Never uses a hardcoded array index into getVoices().
 */
function getPreferredVoice() {
    return __awaiter(this, void 0, void 0, function () {
        var voices, enIndianVoice, _loop_1, _i, NAME_PREFERENCE_KEYWORDS_1, keyword, state_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (selectedVoice)
                        return [2 /*return*/, selectedVoice];
                    return [4 /*yield*/, loadVoices()];
                case 1:
                    voices = _b.sent();
                    if (voices.length === 0)
                        return [2 /*return*/, null];
                    enIndianVoice = voices.find(function (v) { return v.lang.toLowerCase().startsWith('en-in'); });
                    if (enIndianVoice) {
                        selectedVoice = enIndianVoice;
                        return [2 /*return*/, enIndianVoice];
                    }
                    _loop_1 = function (keyword) {
                        var match = voices.find(function (v) { return v.name.toLowerCase().includes(keyword); });
                        if (match) {
                            selectedVoice = match;
                            return { value: match };
                        }
                    };
                    for (_i = 0, NAME_PREFERENCE_KEYWORDS_1 = NAME_PREFERENCE_KEYWORDS; _i < NAME_PREFERENCE_KEYWORDS_1.length; _i++) {
                        keyword = NAME_PREFERENCE_KEYWORDS_1[_i];
                        state_1 = _loop_1(keyword);
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                    }
                    selectedVoice = (_a = voices[0]) !== null && _a !== void 0 ? _a : null;
                    return [2 /*return*/, selectedVoice];
            }
        });
    });
}
/* ---------------------------------------------------------------- */
/* Part B — Indian pronunciation dictionary (spoken text only,       */
/* NEVER applied to the visible chat message)                        */
/* ---------------------------------------------------------------- */
var PRONUNCIATION_MAP = [
    { pattern: /\bPriyanshi\b/gi, replacement: 'Pri-yaan-shii' },
    { pattern: /\bJKLU\b/gi, replacement: 'J K L U' },
    { pattern: /\bDBMS\b/gi, replacement: 'D B M S' },
    { pattern: /\bDSA\b/gi, replacement: 'D S A' },
    { pattern: /\bCOA\b/gi, replacement: 'C O A' },
    { pattern: /\bPW\b/gi, replacement: 'P W' },
    { pattern: /\bAPI\b/gi, replacement: 'A P I' },
    { pattern: /\bUI\b/gi, replacement: 'U I' },
    { pattern: /\bUX\b/gi, replacement: 'U X' },
    { pattern: /\bAI\b/gi, replacement: 'A I' },
    { pattern: /\bJWT\b/gi, replacement: 'J W T' },
];
/**
 * Rewrites text for natural spoken pronunciation using word-boundary
 * replacements only. Returns a new string — the caller's original text
 * (the one shown in the chat bubble) is never mutated, since this
 * function is only ever called on a local copy inside speak().
 */
function normalizeForSpeech(text) {
    var result = text;
    for (var _i = 0, PRONUNCIATION_MAP_1 = PRONUNCIATION_MAP; _i < PRONUNCIATION_MAP_1.length; _i++) {
        var _a = PRONUNCIATION_MAP_1[_i], pattern = _a.pattern, replacement = _a.replacement;
        result = result.replace(pattern, replacement);
    }
    return result;
}
/* ---------------------------------------------------------------- */
/* Part A — cinematic, sentence-paced speech                         */
/* ---------------------------------------------------------------- */
function splitIntoSentenceChunks(text) {
    var matches = text.replace(/\n{2,}/g, '. ').match(/[^.!?,]+[.!?,]?/g);
    if (!matches)
        return [{ text: text, pauseAfterMs: 0 }];
    var chunks = [];
    for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
        var raw = matches_1[_i];
        var trimmed = raw.trim();
        if (trimmed.length === 0)
            continue;
        var lastChar = trimmed.charAt(trimmed.length - 1);
        var pause = 0;
        if (lastChar === ',')
            pause = 120;
        else if (lastChar === '.' || lastChar === '!' || lastChar === '?')
            pause = 260;
        chunks.push({ text: trimmed, pauseAfterMs: pause });
    }
    return chunks.length > 0 ? chunks : [{ text: text, pauseAfterMs: 0 }];
}
function speakNextChunk() {
    var _a, _b;
    if (queueIndex >= utteranceQueue.length) {
        speaking = false;
        (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onStateChange) === null || _a === void 0 ? void 0 : _a.call(callbacks, 'idle');
        var done = queueOnDone;
        queueOnDone = undefined;
        done === null || done === void 0 ? void 0 : done();
        return;
    }
    var chunk = utteranceQueue[queueIndex];
    queueIndex += 1;
    var utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = 0.96;
    utterance.pitch = 0.92;
    utterance.volume = 0.95;
    utterance.lang = (_b = selectedVoice === null || selectedVoice === void 0 ? void 0 : selectedVoice.lang) !== null && _b !== void 0 ? _b : 'en-IN';
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    utterance.onend = function () {
        if (chunk.pauseAfterMs > 0) {
            setTimeout(speakNextChunk, chunk.pauseAfterMs);
        }
        else {
            speakNextChunk();
        }
    };
    utterance.onerror = function () {
        var _a;
        speaking = false;
        (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onStateChange) === null || _a === void 0 ? void 0 : _a.call(callbacks, 'idle');
        var done = queueOnDone;
        queueOnDone = undefined;
        done === null || done === void 0 ? void 0 : done();
    };
    window.speechSynthesis.speak(utterance);
}
function primeVoiceThenSpeak() {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getPreferredVoice()];
                case 1:
                    selectedVoice = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    selectedVoice = null;
                    return [3 /*break*/, 3];
                case 3:
                    speakNextChunk();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Speaks text aloud, split into sentence-paced chunks. The visible
 * chat text passed in by the caller is left completely untouched —
 * normalizeForSpeech() is applied to a LOCAL copy used only for the
 * utterance itself (Part B). Always cancels any currently-playing
 * speech first, so utterances never overlap.
 */
function speak(text, onDone) {
    var _a;
    var clean = text.trim();
    if (!hasSpeechSynthesis() || clean.length === 0) {
        onDone === null || onDone === void 0 ? void 0 : onDone();
        return;
    }
    window.speechSynthesis.cancel();
    speaking = true;
    (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onStateChange) === null || _a === void 0 ? void 0 : _a.call(callbacks, 'speaking');
    playSpeakingStartCue();
    var spokenText = normalizeForSpeech(clean);
    utteranceQueue = splitIntoSentenceChunks(spokenText);
    queueIndex = 0;
    queueOnDone = onDone;
    void primeVoiceThenSpeak();
}
function stopSpeaking() {
    if (hasSpeechSynthesis()) {
        window.speechSynthesis.cancel();
    }
    speaking = false;
    utteranceQueue = [];
    queueIndex = 0;
    queueOnDone = undefined;
}
/* ---------------------------------------------------------------- */
/* Recognition (Push-to-Talk) — unchanged mechanics                  */
/* ---------------------------------------------------------------- */
function configureWebVoice(next) {
    callbacks = next;
    if (hasSpeechSynthesis()) {
        void getPreferredVoice();
    }
}
function teardownWebVoice() {
    callbacks = null;
}
function startListening() {
    var _a, _b;
    if (speaking) {
        stopSpeaking();
    }
    var Ctor = getRecognitionConstructor();
    if (!Ctor) {
        (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError) === null || _a === void 0 ? void 0 : _a.call(callbacks, 'Voice input is not available in this browser.');
        return;
    }
    if (activeRecognition) {
        try {
            activeRecognition.abort();
        }
        catch (_c) {
            // no-op
        }
        activeRecognition = null;
    }
    var instance = new Ctor();
    instance.lang = 'en-US';
    instance.continuous = false;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onstart = function () {
        var _a;
        playListeningStartCue();
        (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onStateChange) === null || _a === void 0 ? void 0 : _a.call(callbacks, 'listening');
    };
    instance.onresult = function (event) {
        var _a;
        var result = event.results.item(event.resultIndex);
        var best = result.item(0);
        var transcript = best.transcript.trim();
        if (transcript.length > 0) {
            callbacks === null || callbacks === void 0 ? void 0 : callbacks.onTranscript(transcript);
        }
        else {
            playErrorCue();
            (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError) === null || _a === void 0 ? void 0 : _a.call(callbacks, 'No signal detected. Try again.');
        }
    };
    instance.onerror = function (event) {
        var _a;
        playErrorCue();
        (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError) === null || _a === void 0 ? void 0 : _a.call(callbacks, mapRecognitionError(event.error));
    };
    instance.onend = function () {
        playListeningEndCue();
        activeRecognition = null;
    };
    activeRecognition = instance;
    try {
        instance.start();
    }
    catch (_d) {
        activeRecognition = null;
        playErrorCue();
        (_b = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onError) === null || _b === void 0 ? void 0 : _b.call(callbacks, 'Voice channel disrupted.');
    }
}
function stopListening() {
    if (!activeRecognition)
        return;
    try {
        activeRecognition.stop();
    }
    catch (_a) {
        // no-op
    }
    activeRecognition = null;
}
/* ---------------------------------------------------------------- */
/* v0.9.0 — Developer Mode Voice Lab. Purely additive: these read     */
/* existing module state or reset a cache, without changing selection */
/* logic, chunking, pacing, or interruption behavior.                 */
/* ---------------------------------------------------------------- */
exports.SPEECH_RATE = 0.9;
exports.SPEECH_PITCH = 0.82;
exports.SPEECH_VOLUME = 0.95;
/** Read-only — the name of the currently selected voice, or null if none has been chosen yet this session. */
function getSelectedVoiceName() {
    var _a;
    return (_a = selectedVoice === null || selectedVoice === void 0 ? void 0 : selectedVoice.name) !== null && _a !== void 0 ? _a : null;
}
/** Clears the cached voice selection so the next spoken reply re-runs getPreferredVoice()'s existing selection logic from scratch. Does not change that logic. */
function reloadVoiceEngine() {
    selectedVoice = null;
    voicesPromise = null;
}
/** Read-only preview of the pronunciation dictionary's effect on a given string, for the Developer Mode Voice Lab. Does not speak anything. */
function previewPronunciation(text) {
    return normalizeForSpeech(text);
}

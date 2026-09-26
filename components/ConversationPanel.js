"use strict";
// ConversationPanel.tsx — Part G: streaming now pauses slightly longer
// after sentence-ending punctuation and commas, for a more natural
// reading rhythm. This is the ONLY logic change in this file — routing
// via jarvisRouter, persistent memory, long-press actions, code block
// rendering, the keyboard-overlap fix, and nested-scroll fix are all
// unchanged.
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
var react_1 = require("react");
var react_native_1 = require("react-native");
var Clipboard = require("expo-clipboard");
var theme_1 = require("../theme/theme");
var GlassPanel_1 = require("./GlassPanel");
var CodeBlock_1 = require("./CodeBlock");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var useThinkingPhrase_1 = require("../hooks/useThinkingPhrase");
var aiService_1 = require("../services/aiService");
var jarvisRouter_1 = require("../services/jarvisRouter");
var chatBus_1 = require("../services/chatBus");
var conversationStore_1 = require("../storage/conversationStore");
var contextBuilder_1 = require("../utils/contextBuilder");
var textFormat_1 = require("../utils/textFormat");
var replyBus_1 = require("../services/replyBus");
var CommandDock_1 = require("./CommandDock");
var sessionMemory_1 = require("../storage/sessionMemory");
var AT_BOTTOM_THRESHOLD = 48;
var SAVE_DEBOUNCE_MS = 400;
var WORD_DELAY_MIN_MS = 25;
var WORD_DELAY_RANGE_MS = 15; // base delay = 25-40ms
var PUNCTUATION_PAUSE_MS = 130; // extra pause after . ! ? ,
function timestamp() {
    var d = new Date();
    return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}
function createId() {
    return "".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8));
}
function defaultGreeting() {
    return [
        {
            id: createId(),
            sender: "jarvis",
            text: "Good morning, Priyanshi.",
            time: timestamp(),
        },
        {
            id: createId(),
            sender: "jarvis",
            text: "All systems are operational.",
            time: timestamp(),
        },
    ];
}
function toChatHistory(messages) {
    return messages
        .filter(function (m) { return !m.isError; })
        .map(function (m) { return ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
    }); });
}
function toStoredMessages(messages) {
    return messages
        .filter(function (m) { return !m.isError; })
        .map(function (m) { return ({ id: m.id, sender: m.sender, text: m.text, time: m.time }); });
}
function BlinkCursor(_a) {
    var reducedMotion = _a.reducedMotion;
    var blink = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(1); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(blink, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(blink, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]));
        loop.start();
        return function () { return loop.stop(); };
    }, [reducedMotion, blink]);
    return <react_native_1.Animated.View style={[styles.cursor, { opacity: blink }]}/>;
}
var MessageRow = react_1.default.memo(function MessageRow(_a) {
    var _b;
    var message = _a.message, isStreamingThis = _a.isStreamingThis, visibleWordIndex = _a.visibleWordIndex, reducedMotion = _a.reducedMotion, onLongPress = _a.onLongPress;
    var entrance = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var glow = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion) {
            entrance.setValue(1);
            return;
        }
        react_native_1.Animated.timing(entrance, {
            toValue: 1,
            duration: 260,
            easing: react_native_1.Easing.out(react_native_1.Easing.ease),
            useNativeDriver: true,
        }).start();
        if (message.sender === "jarvis" && !message.isError) {
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(glow, {
                    toValue: 1,
                    duration: 220,
                    easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(glow, {
                    toValue: 0,
                    duration: 700,
                    easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, []);
    var opacity = entrance;
    var translateY = (0, react_1.useMemo)(function () { return entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }); }, [entrance]);
    var glowOpacity = (0, react_1.useMemo)(function () { return glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.28] }); }, [glow]);
    var wordSteps = (0, react_1.useMemo)(function () { return (isStreamingThis ? (0, textFormat_1.buildWordRevealSteps)(message.text) : null); }, [isStreamingThis, message.text]);
    var segments = (0, react_1.useMemo)(function () { return (isStreamingThis ? null : (0, textFormat_1.parseMessageSegments)(message.text)); }, [isStreamingThis, message.text]);
    var displayText = wordSteps
        ? ((_b = wordSteps[Math.min(visibleWordIndex, wordSteps.length - 1)]) !== null && _b !== void 0 ? _b : "")
        : message.text;
    function handleLongPress() {
        onLongPress(message);
    }
    return (<react_native_1.Animated.View style={{ opacity: opacity, transform: [{ translateY: translateY }] }}>
      <react_native_1.Pressable onLongPress={handleLongPress} delayLongPress={420}>
        <react_native_1.View style={styles.messageRow}>
          <react_native_1.View style={[
            styles.rail,
            message.sender === "user" ? styles.railUser : null,
            message.isError ? styles.railError : null,
        ]}/>
          <react_native_1.View style={styles.messageBody}>
            {message.sender === "jarvis" && !message.isError && (<react_native_1.Animated.View style={[styles.glowOverlay, { opacity: glowOpacity }]} pointerEvents="none"/>)}
            <react_native_1.View style={styles.meta}>
              <react_native_1.Text style={styles.tag}>
                {message.sender === "user" ? "YOU" : "JARVIS"}
              </react_native_1.Text>
              <react_native_1.Text style={styles.time}>{message.time}</react_native_1.Text>
            </react_native_1.View>

            {isStreamingThis || !segments ? (<react_native_1.View style={styles.textRow}>
                <react_native_1.Text style={[
                styles.text,
                message.isError ? styles.textError : null,
            ]}>
                  {displayText}
                </react_native_1.Text>
                {isStreamingThis && (<BlinkCursor reducedMotion={reducedMotion}/>)}
              </react_native_1.View>) : (segments.map(function (seg, idx) {
            return seg.type === "code" ? (<CodeBlock_1.default key={"".concat(message.id, "-seg-").concat(idx)} code={seg.content} language={seg.language}/>) : (<react_native_1.Text key={"".concat(message.id, "-seg-").concat(idx)} style={[
                    styles.text,
                    message.isError ? styles.textError : null,
                ]}>
                    {seg.content}
                  </react_native_1.Text>);
        }))}
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Pressable>
    </react_native_1.Animated.View>);
});
function ConversationPanel(_a) {
    var _this = this;
    var onInputFocus = _a.onInputFocus;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var _b = (0, react_1.useState)(defaultGreeting), messages = _b[0], setMessages = _b[1];
    var _c = (0, react_1.useState)(""), draft = _c[0], setDraft = _c[1];
    var _d = (0, react_1.useState)(false), isTyping = _d[0], setIsTyping = _d[1];
    var _e = (0, react_1.useState)(null), streamingId = _e[0], setStreamingId = _e[1];
    var _f = (0, react_1.useState)(0), visibleWordIndex = _f[0], setVisibleWordIndex = _f[1];
    var thinkingPhrase = (0, useThinkingPhrase_1.useThinkingPhrase)(isTyping);
    var scrollRef = (0, react_1.useRef)(null);
    var messagesRef = (0, react_1.useRef)(messages);
    var sendInFlightRef = (0, react_1.useRef)(false);
    var atBottomRef = (0, react_1.useRef)(true);
    var streamTimeoutRef = (0, react_1.useRef)(null);
    var hasLoadedRef = (0, react_1.useRef)(false);
    var saveTimeoutRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        return function () {
            if (streamTimeoutRef.current)
                clearTimeout(streamTimeoutRef.current);
            if (saveTimeoutRef.current)
                clearTimeout(saveTimeoutRef.current);
        };
    }, []);
    (0, react_1.useEffect)(function () {
        var cancelled = false;
        void (function () { return __awaiter(_this, void 0, void 0, function () {
            var restored;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, conversationStore_1.loadConversation)()];
                    case 1:
                        restored = _a.sent();
                        if (!cancelled && restored && restored.length > 0) {
                            messagesRef.current = restored;
                            setMessages(restored);
                            atBottomRef.current = true;
                            requestAnimationFrame(function () {
                                var _a;
                                (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: false });
                            });
                        }
                        hasLoadedRef.current = true;
                        return [2 /*return*/];
                }
            });
        }); })();
        return function () {
            cancelled = true;
        };
    }, []);
    (0, react_1.useEffect)(function () {
        if (!hasLoadedRef.current)
            return undefined;
        if (saveTimeoutRef.current)
            clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(function () {
            void (0, conversationStore_1.saveConversation)(toStoredMessages(messages));
        }, SAVE_DEBOUNCE_MS);
        return function () {
            if (saveTimeoutRef.current)
                clearTimeout(saveTimeoutRef.current);
        };
    }, [messages]);
    var scrollToEndIfAppropriate = (0, react_1.useCallback)(function (force) {
        if (force || atBottomRef.current) {
            requestAnimationFrame(function () { var _a; return (_a = scrollRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true }); });
        }
    }, []);
    function handleScroll(e) {
        var _a = e.nativeEvent, contentOffset = _a.contentOffset, contentSize = _a.contentSize, layoutMeasurement = _a.layoutMeasurement;
        var distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
        atBottomRef.current = distanceFromBottom < AT_BOTTOM_THRESHOLD;
    }
    var cancelStreaming = (0, react_1.useCallback)(function () {
        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }
        setStreamingId(null);
    }, []);
    // Part G — adds a longer pause after a word ending in sentence
    // punctuation or a comma, so streaming reads with natural rhythm
    // rather than a flat metronome pace.
    var beginStreaming = (0, react_1.useCallback)(function (messageId, fullText) {
        cancelStreaming();
        if (reducedMotion) {
            setStreamingId(null);
            return;
        }
        var steps = (0, textFormat_1.buildWordRevealSteps)(fullText);
        var totalWords = steps.length - 1;
        if (totalWords <= 0) {
            setStreamingId(null);
            return;
        }
        setStreamingId(messageId);
        setVisibleWordIndex(0);
        var index = 0;
        function delayForStep(stepText) {
            var base = WORD_DELAY_MIN_MS + Math.random() * WORD_DELAY_RANGE_MS;
            var trimmed = stepText.trimEnd();
            var lastChar = trimmed.charAt(trimmed.length - 1);
            if (lastChar === "." || lastChar === "!" || lastChar === "?") {
                return base + PUNCTUATION_PAUSE_MS;
            }
            if (lastChar === "," || lastChar === ";") {
                return base + PUNCTUATION_PAUSE_MS * 0.5;
            }
            return base;
        }
        function tick() {
            index += 1;
            setVisibleWordIndex(index);
            scrollToEndIfAppropriate(false);
            if (index >= totalWords) {
                streamTimeoutRef.current = null;
                setStreamingId(null);
                return;
            }
            var delay = delayForStep(steps[index]);
            streamTimeoutRef.current = setTimeout(tick, delay);
        }
        streamTimeoutRef.current = setTimeout(tick, WORD_DELAY_MIN_MS + Math.random() * WORD_DELAY_RANGE_MS);
    }, [cancelStreaming, reducedMotion, scrollToEndIfAppropriate]);
    var sendText = (0, react_1.useCallback)(function (rawText) { return __awaiter(_this, void 0, void 0, function () {
        var clean, userMessage, withUser, historyForRequest, routed, jarvisMessage, withReply, err_1, message, errorMessage, withError;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    clean = rawText.trim();
                    if (!clean || sendInFlightRef.current)
                        return [2 /*return*/];
                    sendInFlightRef.current = true;
                    cancelStreaming();
                    userMessage = {
                        id: createId(),
                        sender: "user",
                        text: clean,
                        time: timestamp(),
                    };
                    withUser = __spreadArray(__spreadArray([], messagesRef.current, true), [userMessage], false);
                    messagesRef.current = withUser;
                    setMessages(withUser);
                    setDraft("");
                    setIsTyping(true);
                    atBottomRef.current = true;
                    scrollToEndIfAppropriate(true);
                    historyForRequest = (0, contextBuilder_1.trimHistoryForRequest)(toChatHistory(withUser));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, jarvisRouter_1.routeUserMessage)(clean, historyForRequest)];
                case 2:
                    routed = _a.sent();
                    jarvisMessage = {
                        id: createId(),
                        sender: "jarvis",
                        text: routed.replyText,
                        time: timestamp(),
                    };
                    withReply = __spreadArray(__spreadArray([], messagesRef.current, true), [jarvisMessage], false);
                    messagesRef.current = withReply;
                    setIsTyping(false);
                    setMessages(withReply);
                    beginStreaming(jarvisMessage.id, routed.replyText);
                    // Web-only side channel for browser speech.
                    if (react_native_1.Platform.OS === "web") {
                        (0, replyBus_1.publishReplyReady)(routed.replyText);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    message = err_1 instanceof aiService_1.AIServiceError ? err_1.message : "Signal disrupted.";
                    errorMessage = {
                        id: createId(),
                        sender: "jarvis",
                        text: message,
                        time: timestamp(),
                        isError: true,
                    };
                    withError = __spreadArray(__spreadArray([], messagesRef.current, true), [errorMessage], false);
                    messagesRef.current = withError;
                    setIsTyping(false);
                    setMessages(withError);
                    return [3 /*break*/, 5];
                case 4:
                    sendInFlightRef.current = false;
                    scrollToEndIfAppropriate(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [beginStreaming, cancelStreaming, scrollToEndIfAppropriate]);
    var handleWeatherAction = (0, react_1.useCallback)(function () {
        void sendText("What's the weather?");
    }, [sendText]);
    var handleFocusAction = (0, react_1.useCallback)(function () {
        void sendText("Let's study.");
    }, [sendText]);
    var handleRecapAction = (0, react_1.useCallback)(function () {
        void sendText("Give me a structured recap of our conversation so far: a short summary, decisions made, open tasks, and a next suggested step.");
    }, [sendText]);
    var handleRememberAction = (0, react_1.useCallback)(function (text) {
        void (0, sessionMemory_1.pinNote)(text);
        void sendText("Remember this: ".concat(text));
    }, [sendText]);
    function handleSend() {
        void sendText(draft);
    }
    var handleClearMemory = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var fresh;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, conversationStore_1.clearConversation)()];
                case 1:
                    _a.sent();
                    cancelStreaming();
                    fresh = defaultGreeting();
                    messagesRef.current = fresh;
                    setMessages(fresh);
                    setDraft("");
                    setIsTyping(false);
                    atBottomRef.current = true;
                    return [2 /*return*/];
            }
        });
    }); }, [cancelStreaming]);
    var handleCopyMessage = (0, react_1.useCallback)(function (text) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Clipboard.setStringAsync(text)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, []);
    var handleDeleteMessage = (0, react_1.useCallback)(function (messageId) {
        var updated = messagesRef.current.filter(function (m) { return m.id !== messageId; });
        messagesRef.current = updated;
        setMessages(updated);
    }, []);
    var handleRegenerate = (0, react_1.useCallback)(function (messageId) { return __awaiter(_this, void 0, void 0, function () {
        var index, target, priorMessages, historyForRequest, triggeringUserMessage, routed, updated, err_2, message;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    index = messagesRef.current.findIndex(function (m) { return m.id === messageId; });
                    if (index === -1)
                        return [2 /*return*/];
                    target = messagesRef.current[index];
                    if (target.sender !== "jarvis" ||
                        target.isError ||
                        sendInFlightRef.current) {
                        return [2 /*return*/];
                    }
                    sendInFlightRef.current = true;
                    cancelStreaming();
                    setIsTyping(true);
                    priorMessages = messagesRef.current.slice(0, index);
                    historyForRequest = (0, contextBuilder_1.trimHistoryForRequest)(toChatHistory(priorMessages));
                    triggeringUserMessage = __spreadArray([], priorMessages, true).reverse()
                        .find(function (m) { return m.sender === "user"; });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, jarvisRouter_1.routeUserMessage)((_a = triggeringUserMessage === null || triggeringUserMessage === void 0 ? void 0 : triggeringUserMessage.text) !== null && _a !== void 0 ? _a : "", historyForRequest)];
                case 2:
                    routed = _b.sent();
                    updated = __spreadArray([], messagesRef.current, true);
                    updated[index] = __assign(__assign({}, target), { text: routed.replyText, time: timestamp() });
                    messagesRef.current = updated;
                    setIsTyping(false);
                    setMessages(updated);
                    beginStreaming(target.id, routed.replyText);
                    // Web-only side channel for browser speech.
                    if (react_native_1.Platform.OS === "web") {
                        (0, replyBus_1.publishReplyReady)(routed.replyText);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _b.sent();
                    setIsTyping(false);
                    message = err_2 instanceof aiService_1.AIServiceError ? err_2.message : "Signal disrupted.";
                    react_native_1.Alert.alert("Regeneration failed", message);
                    return [3 /*break*/, 5];
                case 4:
                    sendInFlightRef.current = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [beginStreaming, cancelStreaming]);
    var handleLongPressMessage = (0, react_1.useCallback)(function (message) {
        var buttons = [
            { text: "Copy", onPress: function () { return void handleCopyMessage(message.text); } },
        ];
        if (message.sender === "jarvis" && !message.isError) {
            buttons.push({
                text: "Regenerate",
                onPress: function () { return void handleRegenerate(message.id); },
            });
        }
        buttons.push({
            text: "Delete",
            style: "destructive",
            onPress: function () { return handleDeleteMessage(message.id); },
        });
        buttons.push({ text: "Cancel", style: "cancel" });
        react_native_1.Alert.alert("Message", undefined, buttons);
    }, [handleCopyMessage, handleRegenerate, handleDeleteMessage]);
    (0, react_1.useEffect)(function () {
        var unsubscribe = (0, chatBus_1.subscribeToExternalMessages)(function (text) {
            void sendText(text);
        });
        return unsubscribe;
    }, [sendText]);
    (0, react_1.useEffect)(function () {
        var showEventName = react_native_1.Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        var subscription = react_native_1.Keyboard.addListener(showEventName, function () {
            scrollToEndIfAppropriate(false);
            onInputFocus === null || onInputFocus === void 0 ? void 0 : onInputFocus();
        });
        return function () { return subscription.remove(); };
    }, [scrollToEndIfAppropriate, onInputFocus]);
    return (<GlassPanel_1.default style={styles.panel}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.title}>Conversation</react_native_1.Text>
        <react_native_1.View style={styles.headerRight}>
          <react_native_1.TouchableOpacity onPress={function () {
            void handleClearMemory();
        }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <react_native_1.Text style={styles.clearLabel}>Clear</react_native_1.Text>
          </react_native_1.TouchableOpacity>
          <react_native_1.View style={styles.pulseDot}/>
        </react_native_1.View>
      </react_native_1.View>

      <react_native_1.ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={32} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {messages.map(function (m, i) { return (<react_1.default.Fragment key={m.id}>
            {i > 0 && <react_native_1.View style={styles.divider}/>}
            <MessageRow message={m} isStreamingThis={m.id === streamingId} visibleWordIndex={visibleWordIndex} reducedMotion={reducedMotion} onLongPress={handleLongPressMessage}/>
          </react_1.default.Fragment>); })}

        {isTyping && (<>
            <react_native_1.View style={styles.divider}/>
            <react_native_1.View style={styles.messageRow}>
              <react_native_1.View style={styles.rail}/>
              <react_native_1.View style={styles.messageBody}>
                <react_native_1.View style={styles.meta}>
                  <react_native_1.Text style={styles.tag}>JARVIS</react_native_1.Text>
                </react_native_1.View>
                <react_native_1.View style={styles.textRow}>
                  <react_native_1.Text style={styles.text}>{thinkingPhrase}</react_native_1.Text>
                  <BlinkCursor reducedMotion={reducedMotion}/>
                </react_native_1.View>
              </react_native_1.View>
            </react_native_1.View>
          </>)}
      </react_native_1.ScrollView>
      <CommandDock_1.default onWeather={handleWeatherAction} onFocus={handleFocusAction} onRecap={handleRecapAction} onRemember={handleRememberAction}/>
      <react_native_1.View style={styles.inputRow}>
        <react_native_1.TextInput style={styles.input} placeholder="Message Jarvis..." placeholderTextColor={theme_1.colors.textDim} value={draft} onChangeText={setDraft} onSubmitEditing={handleSend} onFocus={onInputFocus} returnKeyType="send" maxLength={500}/>
        <react_native_1.TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!draft.trim()} activeOpacity={0.7}>
          <react_native_1.View style={[
            styles.sendGlyph,
            !draft.trim() ? styles.sendGlyphDisabled : null,
        ]}/>
        </react_native_1.TouchableOpacity>
      </react_native_1.View>

      <react_native_1.View style={styles.footer}>
        <react_native_1.View style={styles.footerDot}/>
        <react_native_1.Text style={styles.footerText}>Link Stable</react_native_1.Text>
      </react_native_1.View>
    </GlassPanel_1.default>);
}
var styles = react_native_1.StyleSheet.create({
    panel: { gap: 12 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,234,255,0.22)",
        paddingBottom: 8,
        marginBottom: 2,
    },
    title: {
        fontFamily: theme_1.fonts.display,
        fontSize: 11,
        letterSpacing: 2,
        color: theme_1.colors.cyanSoft,
        textTransform: "uppercase",
    },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    clearLabel: {
        fontFamily: theme_1.fonts.body,
        fontSize: 10,
        letterSpacing: 1,
        color: theme_1.colors.textDim,
        textTransform: "uppercase",
    },
    pulseDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: theme_1.colors.cyan,
    },
    scroll: { maxHeight: 220 },
    scrollContent: { gap: 12 },
    messageRow: { flexDirection: "row", gap: 10 },
    rail: {
        width: 2,
        borderRadius: 1,
        backgroundColor: "rgba(0,234,255,0.4)",
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    railUser: { backgroundColor: "rgba(125,249,255,0.5)" },
    railError: { backgroundColor: theme_1.colors.warnAmber },
    messageBody: { flex: 1, gap: 3, position: "relative" },
    glowOverlay: {
        position: "absolute",
        top: -4,
        left: -6,
        right: -6,
        bottom: -4,
        backgroundColor: theme_1.colors.cyan,
        borderRadius: 4,
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    tag: {
        fontFamily: theme_1.fonts.display,
        fontSize: 9,
        letterSpacing: 1.5,
        color: theme_1.colors.cyanSoft,
    },
    time: { fontFamily: theme_1.fonts.body, fontSize: 9, color: theme_1.colors.textDim },
    textRow: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" },
    text: {
        fontFamily: theme_1.fonts.body,
        fontSize: 13,
        lineHeight: 19,
        color: theme_1.colors.textPrimary,
    },
    textError: { color: theme_1.colors.warnAmber },
    cursor: {
        width: 6,
        height: 13,
        backgroundColor: theme_1.colors.cyan,
        marginLeft: 2,
        marginBottom: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(0,234,255,0.15)",
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.4,
        shadowRadius: 4,
        marginVertical: 4,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 10,
    },
    input: {
        flex: 1,
        height: 48,
        backgroundColor: "rgba(0,234,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(0,234,255,0.28)",
        borderRadius: 4,
        paddingHorizontal: 14,
        fontFamily: theme_1.fonts.body,
        fontSize: 14,
        color: theme_1.colors.textPrimary,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: theme_1.colors.glassBorder,
        backgroundColor: "rgba(0,234,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    sendGlyph: {
        width: 0,
        height: 0,
        borderTopWidth: 6,
        borderBottomWidth: 6,
        borderLeftWidth: 10,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: theme_1.colors.cyanSoft,
    },
    sendGlyphDisabled: { borderLeftColor: theme_1.colors.textDim },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingTop: 10,
    },
    footerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme_1.colors.cyan,
    },
    footerText: {
        fontFamily: theme_1.fonts.body,
        fontSize: 10,
        letterSpacing: 1.2,
        color: theme_1.colors.textDim,
        textTransform: "uppercase",
    },
});
exports.default = ConversationPanel;

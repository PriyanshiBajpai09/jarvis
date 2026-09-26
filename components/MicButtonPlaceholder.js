"use strict";
// MicButtonPlaceholder.tsx — v0.4: clear mic states (Part C). Visual
// design (halos, ring, ripple, core, mic glyph) is UNCHANGED. Native
// behavior is UNCHANGED — a decorative toggle with no service imports
// executed. On web with SpeechRecognition support, a local voiceState
// now tracks idle/listening/thinking/speaking/ready/error and displays
// a matching label above the mic at all times (not just on error),
// using the same absolutely-positioned slot as before — no layout
// change.
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var theme_1 = require("../theme/theme");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var webVoiceService_1 = require("../services/webVoiceService");
var chatBus_1 = require("../services/chatBus");
var replyBus_1 = require("../services/replyBus");
var activityStateBus_1 = require("../services/activityStateBus");
var SIZE = 80;
var STATUS_DISPLAY_MS = 3200;
var READY_DISPLAY_MS = 1200;
var IS_WEB = react_native_1.Platform.OS === 'web';
function getDisplayLabel(state, supported) {
    if (!supported)
        return 'Tap to Talk';
    switch (state) {
        case 'listening':
            return 'Listening...';
        case 'thinking':
            return 'Processing...';
        case 'speaking':
            return 'Speaking...';
        case 'ready':
            return 'Ready';
        case 'error':
        case 'idle':
        default:
            return 'Tap to Talk';
    }
}
function MicButtonPlaceholder(_a) {
    var onPress = _a.onPress;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var _b = (0, react_1.useState)('idle'), voiceState = _b[0], setVoiceState = _b[1];
    var _c = (0, react_1.useState)(null), statusMessage = _c[0], setStatusMessage = _c[1];
    var _d = (0, react_1.useState)(false), webSupported = _d[0], setWebSupported = _d[1];
    var breathe = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var scale = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(1); }, []);
    var ringSpin = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var pressRipple = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rippleKeyRef = (0, react_1.useRef)(0);
    var statusTimeoutRef = (0, react_1.useRef)(null);
    var readyTimeoutRef = (0, react_1.useRef)(null);
    var isListening = voiceState === 'listening';
    (0, react_1.useEffect)(function () {
        setWebSupported(IS_WEB && (0, webVoiceService_1.isWebVoiceSupported)());
    }, []);
    (0, react_1.useEffect)(function () {
        if (!webSupported)
            return undefined;
        (0, webVoiceService_1.configureWebVoice)({
            onTranscript: function (text) {
                setVoiceState('thinking');
                (0, activityStateBus_1.publishActivityState)('thinking');
                (0, chatBus_1.publishExternalMessage)(text);
            },
            onStateChange: function (state) {
                setVoiceState(state);
                (0, activityStateBus_1.publishActivityState)(state);
            },
            onError: function (message) {
                setVoiceState('idle');
                (0, activityStateBus_1.publishActivityState)('error');
                setStatusMessage(message);
                if (statusTimeoutRef.current)
                    clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = setTimeout(function () {
                    setStatusMessage(null);
                    (0, activityStateBus_1.publishActivityState)('idle');
                }, STATUS_DISPLAY_MS);
            },
        });
        return function () {
            (0, webVoiceService_1.teardownWebVoice)();
        };
    }, [webSupported]);
    (0, react_1.useEffect)(function () {
        if (!webSupported)
            return undefined;
        var unsubscribe = (0, replyBus_1.subscribeToReplyReady)(function (text) {
            (0, webVoiceService_1.speak)(text, function () {
                (0, activityStateBus_1.publishActivityState)('idle');
                setVoiceState('ready');
                if (readyTimeoutRef.current)
                    clearTimeout(readyTimeoutRef.current);
                readyTimeoutRef.current = setTimeout(function () { return setVoiceState('idle'); }, READY_DISPLAY_MS);
            });
        });
        return unsubscribe;
    }, [webSupported]);
    (0, react_1.useEffect)(function () {
        return function () {
            if (statusTimeoutRef.current)
                clearTimeout(statusTimeoutRef.current);
            if (readyTimeoutRef.current)
                clearTimeout(readyTimeoutRef.current);
        };
    }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var breatheLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(breathe, { toValue: 1, duration: isListening ? 900 : 1800, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }),
            react_native_1.Animated.timing(breathe, { toValue: 0, duration: isListening ? 900 : 1800, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }),
        ]));
        breatheLoop.start();
        return function () { return breatheLoop.stop(); };
    }, [reducedMotion, breathe, isListening]);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var ringLoop = react_native_1.Animated.loop(react_native_1.Animated.timing(ringSpin, { toValue: 1, duration: isListening ? 3000 : 10000, easing: react_native_1.Easing.linear, useNativeDriver: true }));
        ringLoop.start();
        return function () { return ringLoop.stop(); };
    }, [reducedMotion, ringSpin, isListening]);
    var haloScale = (0, react_1.useMemo)(function () { return breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }); }, [breathe]);
    var haloOpacity = (0, react_1.useMemo)(function () { return breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }); }, [breathe]);
    var ringRotate = (0, react_1.useMemo)(function () { return ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); }, [ringSpin]);
    var rippleScale = (0, react_1.useMemo)(function () { return pressRipple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }); }, [pressRipple]);
    var rippleOpacity = (0, react_1.useMemo)(function () { return pressRipple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }); }, [pressRipple]);
    function handlePressIn() {
        react_native_1.Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
    }
    function handlePressOut() {
        react_native_1.Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
    function handlePress() {
        rippleKeyRef.current += 1;
        pressRipple.setValue(0);
        react_native_1.Animated.timing(pressRipple, { toValue: 1, duration: 620, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }).start();
        if (!webSupported) {
            if (IS_WEB) {
                setStatusMessage('Voice input is not available in this browser.');
                if (statusTimeoutRef.current)
                    clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = setTimeout(function () { return setStatusMessage(null); }, STATUS_DISPLAY_MS);
            }
            else {
                setVoiceState(function (prev) { return (prev === 'listening' ? 'idle' : 'listening'); });
            }
            onPress === null || onPress === void 0 ? void 0 : onPress();
            return;
        }
        setStatusMessage(null);
        if (isListening) {
            (0, webVoiceService_1.stopListening)();
            setVoiceState('idle');
            (0, activityStateBus_1.publishActivityState)('idle');
        }
        else {
            if ((0, webVoiceService_1.isSpeakingNow)()) {
                (0, webVoiceService_1.stopSpeaking)();
            }
            (0, webVoiceService_1.startListening)();
        }
        onPress === null || onPress === void 0 ? void 0 : onPress();
    }
    var isError = Boolean(statusMessage);
    var labelText = statusMessage !== null && statusMessage !== void 0 ? statusMessage : getDisplayLabel(voiceState, webSupported);
    return (<react_native_1.View style={styles.wrap} pointerEvents="box-none">
      <react_native_1.Text style={[styles.statusLabel, isError ? styles.statusLabelError : null]}>{labelText}</react_native_1.Text>

      <react_native_1.Animated.View pointerEvents="none" style={[styles.outerBloom, { transform: [{ scale: haloScale }], opacity: react_native_1.Animated.multiply(haloOpacity, 0.55) }]}/>
      <react_native_1.Animated.View pointerEvents="none" style={[styles.innerBloom, { transform: [{ scale: haloScale }], opacity: haloOpacity }]}/>
      <react_native_1.Animated.View pointerEvents="none" style={[styles.outerRing, { transform: [{ rotate: ringRotate }] }, isListening ? styles.outerRingActive : null]}/>
      <react_native_1.Animated.View pointerEvents="none" style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]}/>

      <react_native_1.Animated.View style={{ transform: [{ scale: scale }] }}>
        <react_native_1.Pressable onPress={function () {
            handlePress();
        }} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.core, isListening ? styles.coreActive : null]} accessibilityRole="button" accessibilityLabel={isListening ? 'Stop listening' : 'Activate voice input'}>
          <react_native_1.View style={styles.micBody}/>
          <react_native_1.View style={styles.micArc}/>
        </react_native_1.Pressable>
      </react_native_1.Animated.View>
    </react_native_1.View>);
}
var OUTER_HALO = SIZE + 76;
var INNER_HALO = SIZE + 38;
var RING = SIZE + 22;
var styles = react_native_1.StyleSheet.create({
    wrap: { width: OUTER_HALO, height: OUTER_HALO, alignItems: 'center', justifyContent: 'center' },
    statusLabel: {
        position: 'absolute',
        top: -22,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: theme_1.fonts.body,
        fontSize: 10,
        letterSpacing: 1,
        color: theme_1.colors.cyanSoft,
    },
    statusLabelError: { color: theme_1.colors.warnAmber },
    outerBloom: { position: 'absolute', width: OUTER_HALO, height: OUTER_HALO, borderRadius: OUTER_HALO / 2, backgroundColor: 'rgba(0,234,255,0.16)' },
    innerBloom: { position: 'absolute', width: INNER_HALO, height: INNER_HALO, borderRadius: INNER_HALO / 2, backgroundColor: 'rgba(0,234,255,0.24)' },
    outerRing: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 1.3, borderStyle: 'dashed', borderColor: 'rgba(0,234,255,0.52)' },
    outerRingActive: { borderColor: theme_1.colors.cyan, borderWidth: 1.8 },
    ripple: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 1.5, borderColor: theme_1.colors.cyan },
    core: {
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        borderWidth: 1.5,
        borderColor: theme_1.colors.cyan,
        backgroundColor: 'rgba(6,16,34,0.93)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.85,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 5 },
        elevation: 12,
    },
    coreActive: { shadowOpacity: 1, shadowRadius: 30 },
    micBody: { width: 17, height: 28, borderRadius: 8.5, backgroundColor: theme_1.colors.cyanSoft },
    micArc: {
        position: 'absolute',
        bottom: 15,
        width: 32,
        height: 17,
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: theme_1.colors.cyanSoft,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
});
exports.default = MicButtonPlaceholder;

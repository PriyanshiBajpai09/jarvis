"use strict";
// HomeScreen.tsx — v0.9.0: two additions only, both additive.
//   1. ArcReactorMobile is wrapped in a Pressable calling
//      registerReactorTap() — same visual position, same size, no
//      layout change, since Pressable renders as a plain View.
//   2. DeveloperPanel is mounted at root level, absolutely positioned,
//      identical pattern to the existing dockLayer overlay.
// Everything else — layout, keyboard wiring, greeting, reactor sizing,
// activity-state mapping — is UNCHANGED from the locked version.
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_safe_area_context_1 = require("react-native-safe-area-context");
var theme_1 = require("../theme/theme");
var BackgroundLayers_1 = require("../components/BackgroundLayers");
var HoloHeaderMobile_1 = require("../components/HoloHeaderMobile");
var GlassPanel_1 = require("../components/GlassPanel");
var ArcReactorMobile_1 = require("../components/ArcReactorMobile");
var ReactorStageBackdrop_1 = require("../components/ReactorStageBackdrop");
var SystemStatusPanel_1 = require("../components/SystemStatusPanel");
var ConversationPanel_1 = require("../components/ConversationPanel");
var MicButtonPlaceholder_1 = require("../components/MicButtonPlaceholder");
var DeveloperPanel_1 = require("../components/DeveloperPanel");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var useKeyboardAnimation_1 = require("../hooks/useKeyboardAnimation");
var useDevModeUnlock_1 = require("../hooks/useDevModeUnlock");
var activityStateBus_1 = require("../services/activityStateBus");
function useFadeUp(delay, reducedMotion) {
    var value = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        react_native_1.Animated.timing(value, {
            toValue: 1,
            duration: reducedMotion ? 0 : 520,
            delay: reducedMotion ? 0 : delay,
            easing: react_native_1.Easing.out(react_native_1.Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [value, delay, reducedMotion]);
    var translateY = (0, react_1.useMemo)(function () { return value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }); }, [value]);
    return { opacity: value, transform: [{ translateY: translateY }] };
}
function getGreeting() {
    var hour = new Date().getHours();
    if (hour < 12)
        return 'Good morning, Priyanshi.';
    if (hour < 18)
        return 'Good afternoon, Priyanshi.';
    return 'Good evening, Priyanshi.';
}
function mapToReactorState(state) {
    switch (state) {
        case 'listening':
            return 'listening';
        case 'thinking':
            return 'thinking';
        case 'speaking':
            return 'streaming';
        case 'error':
            return 'error';
        case 'idle':
        default:
            return 'idle';
    }
}
var DOCK_BOTTOM_OFFSET = 28;
var DOCK_RESERVED_SPACE = 130;
var REACTOR_SIZE = 240;
var BACKDROP_SIZE = 305;
function HomeScreen() {
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    var greeting = (0, react_1.useMemo)(function () { return getGreeting(); }, []);
    var scrollViewRef = (0, react_1.useRef)(null);
    var headerAnim = useFadeUp(0, reducedMotion);
    var welcomeAnim = useFadeUp(140, reducedMotion);
    var reactorAnim = useFadeUp(280, reducedMotion);
    var statusAnim = useFadeUp(420, reducedMotion);
    var convoAnim = useFadeUp(560, reducedMotion);
    var dockAnim = useFadeUp(700, reducedMotion);
    var handleKeyboardShow = (0, react_1.useCallback)(function () {
        setTimeout(function () {
            var _a;
            (_a = scrollViewRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true });
        }, 80);
    }, []);
    var keyboardHeight = (0, useKeyboardAnimation_1.useKeyboardAnimation)({ onShow: handleKeyboardShow });
    var spacerHeight = (0, react_1.useMemo)(function () { return react_native_1.Animated.add(keyboardHeight, DOCK_RESERVED_SPACE); }, [keyboardHeight]);
    var dockBottom = (0, react_1.useMemo)(function () { return react_native_1.Animated.add(keyboardHeight, DOCK_BOTTOM_OFFSET + insets.bottom); }, [keyboardHeight, insets.bottom]);
    var handleInputFocus = (0, react_1.useCallback)(function () {
        setTimeout(function () {
            var _a;
            (_a = scrollViewRef.current) === null || _a === void 0 ? void 0 : _a.scrollToEnd({ animated: true });
        }, 120);
    }, []);
    var _a = (0, react_1.useState)('idle'), reactorActivityState = _a[0], setReactorActivityState = _a[1];
    (0, react_1.useEffect)(function () {
        var unsubscribe = (0, activityStateBus_1.subscribeToActivityState)(function (state) {
            setReactorActivityState(mapToReactorState(state));
        });
        return unsubscribe;
    }, []);
    var _b = (0, useDevModeUnlock_1.useDevModeUnlock)(), isDevModeOpen = _b.isOpen, closeDevMode = _b.closeDevMode, registerReactorTap = _b.registerReactorTap;
    return (<react_native_1.View style={styles.root}>
      <BackgroundLayers_1.default />

      <react_native_1.Animated.View style={[styles.headerLayer, headerAnim]}>
        <HoloHeaderMobile_1.default />
      </react_native_1.Animated.View>

      <react_native_1.ScrollView ref={scrollViewRef} style={styles.flexOne} contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + insets.bottom }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <react_native_1.Animated.View style={welcomeAnim}>
          <GlassPanel_1.default style={styles.welcomePanel}>
            <react_native_1.Text style={styles.welcomeLine}>{greeting}</react_native_1.Text>
            <react_native_1.Text style={styles.welcomeAccent}>I'm Jarvis.</react_native_1.Text>
            <react_native_1.Text style={styles.welcomeLine}>Everything is ready.</react_native_1.Text>
            <react_native_1.Text style={styles.welcomeLine}>What are we building today?</react_native_1.Text>
          </GlassPanel_1.default>
        </react_native_1.Animated.View>

        <react_native_1.Animated.View style={[styles.reactorStage, reactorAnim]}>
          <ReactorStageBackdrop_1.default size={BACKDROP_SIZE}/>
          <react_native_1.Pressable onPress={registerReactorTap} accessibilityRole="button" accessibilityLabel="Arc Reactor">
            <ArcReactorMobile_1.default size={REACTOR_SIZE} activityState={reactorActivityState}/>
          </react_native_1.Pressable>
        </react_native_1.Animated.View>

        <react_native_1.Animated.View style={statusAnim}>
          <SystemStatusPanel_1.default />
        </react_native_1.Animated.View>

        <react_native_1.Animated.View style={convoAnim}>
          <ConversationPanel_1.default onInputFocus={handleInputFocus}/>
        </react_native_1.Animated.View>

        <react_native_1.Animated.View style={{ height: spacerHeight }}/>
      </react_native_1.ScrollView>

      <react_native_1.Animated.View style={[styles.dockLayer, dockAnim, { bottom: dockBottom }]} pointerEvents="box-none">
        <MicButtonPlaceholder_1.default onPress={function () { }}/>
      </react_native_1.Animated.View>

      <DeveloperPanel_1.default visible={isDevModeOpen} onClose={closeDevMode}/>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    root: { flex: 1, backgroundColor: theme_1.colors.bgBlack },
    flexOne: { flex: 1 },
    headerLayer: { zIndex: 5 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
    welcomePanel: { gap: 4 },
    welcomeLine: { fontFamily: theme_1.fonts.body, fontSize: 15, color: theme_1.colors.textPrimary },
    welcomeAccent: { fontFamily: theme_1.fonts.display, fontSize: 18, color: theme_1.colors.cyan, marginVertical: 4 },
    reactorStage: { position: 'relative', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    dockLayer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 6,
    },
});
exports.default = HomeScreen;

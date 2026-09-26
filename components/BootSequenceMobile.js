"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var theme_1 = require("../theme/theme");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var ArcReactorMobile_1 = require("./ArcReactorMobile");
var GlassPanel_1 = require("./GlassPanel");
var DIAG_LINES = [
    "Initializing Neural Core...",
    "Loading Cognitive Matrix...",
    "Calibrating Holographic Systems...",
];
var CHECKLIST = ["Prompt Shield", "Memory Vault", "Voice Engine", "System Integrity"];
var TOTAL_MS = 2900, REDUCED_TOTAL_MS = 800, FADE_OUT_MS = 450, REDUCED_FADE_OUT_MS = 150;
function BootSequenceMobile(_a) {
    var onComplete = _a.onComplete;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var duration = reducedMotion ? REDUCED_TOTAL_MS : TOTAL_MS;
    var opacity = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(1); }, []);
    var progressAnim = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var reactorScale = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(.85); }, []);
    var bloomAnim = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var sweepAnim = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var _b = (0, react_1.useState)(0), progress = _b[0], setProgress = _b[1];
    var _c = (0, react_1.useState)(0), bloom = _c[0], setBloom = _c[1];
    var done = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        var p = progressAnim.addListener(function (_a) {
            var value = _a.value;
            return setProgress(value);
        });
        var b = bloomAnim.addListener(function (_a) {
            var value = _a.value;
            return setBloom(value);
        });
        react_native_1.Animated.timing(progressAnim, { toValue: 100, duration: duration, easing: react_native_1.Easing.linear, useNativeDriver: false }).start(function () {
            if (done.current)
                return;
            done.current = true;
            setTimeout(function () { return react_native_1.Animated.timing(opacity, { toValue: 0, duration: reducedMotion ? REDUCED_FADE_OUT_MS : FADE_OUT_MS, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }).start(onComplete); }, reducedMotion ? 120 : 350);
        });
        react_native_1.Animated.loop(react_native_1.Animated.timing(sweepAnim, { toValue: 1, duration: 1400, easing: react_native_1.Easing.linear, useNativeDriver: false })).start();
        return function () { progressAnim.removeListener(p); bloomAnim.removeListener(b); };
    }, []);
    var stage = progress < 10 ? 0 : progress < 22 ? 1 : progress < 34 ? 2 : progress < 70 ? 3 : progress < 96 ? 4 : 5;
    (0, react_1.useEffect)(function () {
        if (stage >= 4) {
            react_native_1.Animated.sequence([
                react_native_1.Animated.timing(reactorScale, { toValue: 1.05, duration: 220, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }),
                react_native_1.Animated.timing(reactorScale, { toValue: 1, duration: 170, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: true }),
            ]).start();
            react_native_1.Animated.timing(bloomAnim, { toValue: 1, duration: 650, easing: react_native_1.Easing.out(react_native_1.Easing.ease), useNativeDriver: false }).start();
        }
    }, [stage]);
    var sweep = sweepAnim.interpolate({ inputRange: [0, 1], outputRange: [-70, 300] });
    return (<react_native_1.Animated.View style={[s.container, { opacity: opacity }]}>
  <react_native_1.View style={s.bgGrid}/>
  <react_native_1.View style={s.bgGlow}/>
  <react_native_1.View style={s.particles}>
    {Array.from({ length: 18 }).map(function (_, i) { return <react_native_1.View key={i} style={[s.dot, { left: (i * 23) % 320 + 20, top: (i * 67) % 620 + 60 }]}/>; })}
  </react_native_1.View>

  <react_native_1.View style={s.title}>
    <react_native_1.Text style={s.jarvis}>JARVIS</react_native_1.Text>
    <react_native_1.Text style={s.sub}>MARK LXXXV OPERATING SYSTEM</react_native_1.Text>
  </react_native_1.View>

  {stage === 3 && <GlassPanel_1.default style={s.panel}>{DIAG_LINES.map(function (l, i) { return i < Math.ceil(((progress - 34) / 36) * 3) && <react_native_1.Text key={l} style={s.diag}>{"> "}{l}</react_native_1.Text>; })}</GlassPanel_1.default>}

  {stage === 4 && <>
    <react_native_1.Animated.View style={{ transform: [{ scale: reactorScale }] }}>
      <ArcReactorMobile_1.default size={110} showFloor={false} bloomBoost={bloom}/>
    </react_native_1.Animated.View>
    <GlassPanel_1.default style={s.panel}>{CHECKLIST.map(function (c, i) { return i < Math.ceil(((progress - 70) / 26) * 4) && <react_native_1.View key={c} style={s.row}><react_native_1.View style={s.circle}><react_native_1.Text style={s.tick}>✓</react_native_1.Text></react_native_1.View><react_native_1.Text style={s.label}>{c}</react_native_1.Text></react_native_1.View>; })}</GlassPanel_1.default>
  </>}

  {stage === 5 && <react_native_1.View style={s.welcome}><react_native_1.Animated.View style={{ transform: [{ scale: reactorScale }] }}><ArcReactorMobile_1.default size={90} showFloor={false} bloomBoost={bloom}/></react_native_1.Animated.View><react_native_1.Text style={s.w1}>WELCOME, PRIYANSHI.</react_native_1.Text><react_native_1.Text style={s.w2}>JARVIS ONLINE..</react_native_1.Text></react_native_1.View>}

  <react_native_1.View style={s.bottom}><react_native_1.Text style={s.percent}>{Math.floor(progress)}%</react_native_1.Text><react_native_1.View style={s.bar}><react_native_1.Animated.View style={[s.fill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] }) }]}/><react_native_1.Animated.View style={[s.sweep, { transform: [{ translateX: sweep }] }]}/></react_native_1.View></react_native_1.View>
 </react_native_1.Animated.View>);
}
var s = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: theme_1.colors.bgBlack, justifyContent: "center", alignItems: "center", paddingHorizontal: 26 },
    bgGrid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#02060B" },
    bgGlow: { position: "absolute", top: -180, left: -180, right: -180, bottom: -180, borderRadius: 500, backgroundColor: "rgba(0,234,255,0.08)" },
    particles: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    dot: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(0,234,255,0.55)" },
    title: { alignItems: "center", marginBottom: 20 },
    jarvis: { fontFamily: theme_1.fonts.displayBlack, fontSize: 36, letterSpacing: 8, color: theme_1.colors.textPrimary, textShadowColor: theme_1.colors.cyan, textShadowRadius: 18 },
    sub: { marginTop: 6, fontFamily: theme_1.fonts.body, fontSize: 10, letterSpacing: 3, color: theme_1.colors.cyanSoft },
    panel: { width: "100%", maxWidth: 320 },
    diag: { fontFamily: theme_1.fonts.body, fontSize: 13, color: theme_1.colors.cyanSoft, marginBottom: 8 },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: theme_1.colors.cyan, alignItems: "center", justifyContent: "center", marginRight: 10 },
    tick: { color: theme_1.colors.cyan, fontSize: 10 },
    label: { fontFamily: theme_1.fonts.body, fontSize: 13, color: theme_1.colors.textPrimary },
    welcome: { alignItems: "center", gap: 12 },
    w1: { fontFamily: theme_1.fonts.display, fontSize: 16, letterSpacing: 3, color: theme_1.colors.textPrimary },
    w2: { fontFamily: theme_1.fonts.display, fontSize: 24, letterSpacing: 3, color: theme_1.colors.cyan },
    bottom: { width: "100%", maxWidth: 320, alignItems: "center", marginTop: 24 },
    percent: { fontFamily: theme_1.fonts.display, fontSize: 28, color: theme_1.colors.cyan, textShadowColor: theme_1.colors.cyan, textShadowRadius: 18, marginBottom: 14 },
    bar: { width: "100%", height: 7, borderRadius: 2, overflow: "hidden", borderWidth: 1, borderColor: "rgba(0,234,255,.35)", backgroundColor: "rgba(0,234,255,.08)" },
    fill: { height: "100%", backgroundColor: theme_1.colors.cyan },
    sweep: { position: "absolute", top: 0, bottom: 0, width: 55, backgroundColor: "rgba(255,255,255,.35)" }
});
exports.default = BootSequenceMobile;

"use strict";
// SystemStatusPanel.tsx — v0.6.0, Feature 3: the footer status line now
// fades out/in on each rotation instead of swapping instantly, and the
// message pool matches the v0.6.0 spec. Metrics, animated bars, and
// waveform are UNCHANGED. Layout is unchanged — the fade only affects
// the existing Text's opacity, no new elements, no size change.
// Respects reduced motion: when enabled, the message stays fixed on
// the first entry with no animation and no interval running.
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_svg_1 = require("react-native-svg");
var theme_1 = require("../theme/theme");
var GlassPanel_1 = require("./GlassPanel");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var METRICS = [
    { label: 'CPU Load', value: 47, display: '47%' },
    { label: 'Core Temperature', value: 38, display: '38°C' },
    { label: 'Shield Integrity', value: 78, display: '78%', tone: 'safe' },
    { label: 'Neural Sync', value: 100, display: '100%', tone: 'safe' },
    { label: 'Network', value: 91, display: '91%' },
    { label: 'Power Reserve', value: 64, display: '64%', tone: 'warn' },
];
var STATUS_MESSAGES = [
    'Systems online.',
    'Arc Reactor stable.',
    'Mission queue clear.',
    'Weather uplink stable.',
    'Focus mode available.',
    'Standing by.',
];
var STATUS_CYCLE_MS = 4000;
var STATUS_FADE_MS = 300;
function buildWavePath(seed, points) {
    var coords = [];
    var width = 200;
    for (var i = 0; i <= points; i += 1) {
        var x = (width / points) * i;
        var noise = Math.sin(i * 0.7 + seed) * 7 + Math.sin(i * 1.9 + seed * 1.6) * 3.5;
        var y = 18 + noise;
        coords.push("".concat(x.toFixed(1), ",").concat(y.toFixed(1)));
    }
    return "M".concat(coords.join(' L'));
}
var wavePath = buildWavePath(1.2, 32);
function StatusBar(_a) {
    var metric = _a.metric, index = _a.index, reducedMotion = _a.reducedMotion;
    var fill = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        react_native_1.Animated.timing(fill, {
            toValue: metric.value,
            duration: reducedMotion ? 0 : 1100,
            delay: reducedMotion ? 0 : 250 + index * 130,
            easing: react_native_1.Easing.out(react_native_1.Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [fill, metric.value, index, reducedMotion]);
    var width = (0, react_1.useMemo)(function () { return fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }); }, [fill]);
    var barColor = metric.tone === 'warn' ? theme_1.colors.warnAmber : metric.tone === 'safe' ? theme_1.colors.safeGreen : theme_1.colors.cyan;
    return (<react_native_1.View style={styles.row}>
      <react_native_1.View style={styles.rowTop}>
        <react_native_1.Text style={styles.label}>{metric.label}</react_native_1.Text>
        <react_native_1.Text style={[styles.value, { color: barColor }]}>{metric.display}</react_native_1.Text>
      </react_native_1.View>
      <react_native_1.View style={styles.track}>
        <react_native_1.Animated.View style={[styles.fillBar, { width: width, backgroundColor: barColor, shadowColor: barColor }]}/>
      </react_native_1.View>
    </react_native_1.View>);
}
/**
 * Feature 3 — Living Status Line. Cycles through STATUS_MESSAGES,
 * fading the text out then in on each transition (never an instant
 * swap). Respects reduced motion: message stays fixed, opacity fixed
 * at 1, no interval runs.
 */
function useFadingStatusMessage(reducedMotion) {
    var _a = (0, react_1.useState)(STATUS_MESSAGES[0]), message = _a[0], setMessage = _a[1];
    var indexRef = (0, react_1.useRef)(0);
    var opacity = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(1); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion) {
            indexRef.current = 0;
            setMessage(STATUS_MESSAGES[0]);
            opacity.setValue(1);
            return undefined;
        }
        var interval = setInterval(function () {
            react_native_1.Animated.timing(opacity, {
                toValue: 0,
                duration: STATUS_FADE_MS,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }).start(function () {
                indexRef.current = (indexRef.current + 1) % STATUS_MESSAGES.length;
                setMessage(STATUS_MESSAGES[indexRef.current]);
                react_native_1.Animated.timing(opacity, {
                    toValue: 1,
                    duration: STATUS_FADE_MS,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                    useNativeDriver: true,
                }).start();
            });
        }, STATUS_CYCLE_MS);
        return function () { return clearInterval(interval); };
    }, [reducedMotion, opacity]);
    return { message: message, opacity: opacity };
}
function SystemStatusPanel() {
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var blink = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(1); }, []);
    var _a = useFadingStatusMessage(reducedMotion), statusMessage = _a.message, statusOpacity = _a.opacity;
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(blink, { toValue: 0.3, duration: 700, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }),
            react_native_1.Animated.timing(blink, { toValue: 1, duration: 700, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }),
        ]));
        loop.start();
        return function () { return loop.stop(); };
    }, [reducedMotion, blink]);
    return (<GlassPanel_1.default style={styles.panel}>
      <react_native_1.View style={styles.header}>
        <react_native_1.Text style={styles.title}>System Status</react_native_1.Text>
        <react_native_1.Animated.View style={[styles.pulseDot, { opacity: blink }]}/>
      </react_native_1.View>

      {METRICS.map(function (m, i) { return (<StatusBar key={m.label} metric={m} index={i} reducedMotion={reducedMotion}/>); })}

      <react_native_1.View style={styles.waveformBlock}>
        <react_native_1.Text style={styles.waveformLabel}>Live Telemetry</react_native_1.Text>
        <react_native_svg_1.default width="100%" height={32} viewBox="0 0 200 36" preserveAspectRatio="none">
          <react_native_svg_1.Path d={wavePath} fill="none" stroke={theme_1.colors.cyan} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>
        </react_native_svg_1.default>
      </react_native_1.View>

      <react_native_1.View style={styles.footer}>
        <react_native_1.Animated.View style={[styles.footerDot, { opacity: blink }]}/>
        <react_native_1.Animated.Text style={[styles.footerText, { opacity: statusOpacity }]}>{statusMessage}</react_native_1.Animated.Text>
      </react_native_1.View>
    </GlassPanel_1.default>);
}
var styles = react_native_1.StyleSheet.create({
    panel: { gap: 14, paddingBottom: 4 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,234,255,0.22)',
        paddingBottom: 9,
        marginBottom: 2,
    },
    title: { fontFamily: theme_1.fonts.display, fontSize: 11, letterSpacing: 2, color: theme_1.colors.cyanSoft, textTransform: 'uppercase' },
    pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: theme_1.colors.cyan, shadowColor: theme_1.colors.cyan, shadowOpacity: 0.9, shadowRadius: 5 },
    row: { gap: 7 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { fontFamily: theme_1.fonts.body, fontSize: 11.5, color: theme_1.colors.textDim, textTransform: 'uppercase' },
    value: { fontFamily: theme_1.fonts.display, fontSize: 12 },
    track: { height: 7, borderRadius: 3.5, backgroundColor: 'rgba(0,234,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,234,255,0.22)', overflow: 'hidden' },
    fillBar: { height: '100%', borderRadius: 3.5, shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
    waveformBlock: { gap: 5, paddingTop: 4 },
    waveformLabel: { fontFamily: theme_1.fonts.body, fontSize: 9.5, letterSpacing: 1.2, color: theme_1.colors.textDim, textTransform: 'uppercase' },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,234,255,0.15)' },
    footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme_1.colors.cyan },
    footerText: { fontFamily: theme_1.fonts.body, fontSize: 10, letterSpacing: 1.2, color: theme_1.colors.textDim, textTransform: 'uppercase' },
});
exports.default = SystemStatusPanel;

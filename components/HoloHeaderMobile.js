"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HoloHeaderMobile;
var react_1 = require("react");
var react_native_1 = require("react-native");
var expo_blur_1 = require("expo-blur");
var expo_linear_gradient_1 = require("expo-linear-gradient");
var theme_1 = require("../theme/theme");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var EMBLEM = 34;
var time = function (d) { return "".concat(String(d.getHours()).padStart(2, "0"), ":").concat(String(d.getMinutes()).padStart(2, "0"), ":").concat(String(d.getSeconds()).padStart(2, "0")); };
var date = function (d) { return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase(); };
function HoloHeaderMobile() {
    var reduced = (0, useReducedMotion_1.useReducedMotion)();
    var _a = (0, react_1.useState)(new Date()), now = _a[0], setNow = _a[1];
    (0, react_1.useEffect)(function () { var t = setInterval(function () { return setNow(new Date()); }, 1000); return function () { return clearInterval(t); }; }, []);
    var sweep = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var pulse = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var spin = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reduced)
            return;
        var a = react_native_1.Animated.loop(react_native_1.Animated.timing(sweep, { toValue: 1, duration: 4200, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }));
        var b = react_native_1.Animated.loop(react_native_1.Animated.sequence([react_native_1.Animated.timing(pulse, { toValue: 1, duration: 900, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }), react_native_1.Animated.timing(pulse, { toValue: 0, duration: 900, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true })]));
        var c = react_native_1.Animated.loop(react_native_1.Animated.timing(spin, { toValue: 1, duration: 8000, easing: react_native_1.Easing.linear, useNativeDriver: true }));
        a.start();
        b.start();
        c.start();
        return function () { a.stop(); b.stop(); c.stop(); };
    }, [reduced, sweep, pulse, spin]);
    return <react_native_1.View style={s.wrap}><expo_blur_1.BlurView intensity={55} tint="dark" style={s.fill}/><react_native_1.View style={s.tint}/>
  <react_native_1.Animated.View style={[s.sweep, { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-160, 420] }) }] }]}><expo_linear_gradient_1.LinearGradient colors={["rgba(0,234,255,0)", "rgba(0,234,255,0.16)", "rgba(0,234,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.fill}/></react_native_1.Animated.View>
  <react_native_1.View style={s.row}><react_native_1.View style={s.left}><react_native_1.Animated.View style={[s.ring, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]}/><react_native_1.View style={s.emblem}><react_native_1.Animated.View style={[s.core, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.4, 1] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [.85, 1.15] }) }] }]}/></react_native_1.View></react_native_1.View>
  <react_native_1.View style={s.center}><react_native_1.Text style={s.title}>JARVIS</react_native_1.Text><react_native_1.Text style={s.sub}>MARK LXXXV OPERATING SYSTEM</react_native_1.Text></react_native_1.View>
  <react_native_1.View style={s.right}><react_native_1.Text style={s.clock}>{time(now)}</react_native_1.Text><react_native_1.Text style={s.date}>{date(now)}</react_native_1.Text><react_native_1.View style={s.pill}><react_native_1.Animated.View style={[s.dot, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [.5, 1] }) }]}/><react_native_1.Text style={s.online}>ONLINE</react_native_1.Text></react_native_1.View></react_native_1.View></react_native_1.View></react_native_1.View>;
}
var s = react_native_1.StyleSheet.create({ wrap: { height: 76, overflow: "hidden", borderBottomWidth: 1, borderBottomColor: theme_1.colors.glassBorder }, fill: __assign({}, react_native_1.StyleSheet.absoluteFill), tint: __assign(__assign({}, react_native_1.StyleSheet.absoluteFill), { backgroundColor: "rgba(6,16,34,.6)" }), sweep: { position: "absolute", top: 0, bottom: 0, width: 140 }, row: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }, left: { width: 46, height: 46, alignItems: "center", justifyContent: "center" }, ring: { position: "absolute", width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(0,234,255,.45)" }, emblem: { width: EMBLEM, height: EMBLEM, borderRadius: 17, borderWidth: 1.5, borderColor: theme_1.colors.cyan, alignItems: "center", justifyContent: "center" }, core: { width: 11, height: 11, borderRadius: 6, backgroundColor: theme_1.colors.cyan }, center: { flex: 1, alignItems: "center" }, title: { fontFamily: theme_1.fonts.displayBlack, fontSize: 17, letterSpacing: 5, color: theme_1.colors.textPrimary }, sub: { fontFamily: theme_1.fonts.body, fontSize: 8, color: theme_1.colors.textDim }, right: { alignItems: "flex-end" }, clock: { fontFamily: theme_1.fonts.display, fontSize: 12, color: theme_1.colors.cyanSoft }, date: { fontFamily: theme_1.fonts.body, fontSize: 8, color: theme_1.colors.textDim }, pill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: theme_1.colors.glassBorder, borderRadius: 3 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme_1.colors.safeGreen }, online: { fontFamily: theme_1.fonts.display, fontSize: 8, color: theme_1.colors.safeGreen } });

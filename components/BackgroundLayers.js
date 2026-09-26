"use strict";
// BackgroundLayers.tsx — Phase 13, Priority 5: adds one new ambient
// layer — a very soft, slow-moving holographic shimmer band — on top of
// the existing grid/vignette/scanline/particles/radar-sweep/radar-circles/
// fog/noise/light-shafts stack. Single element, one Animated loop, low
// FPS cost. No layout change — everything remains absolutely positioned
// background, exactly as before.
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_native_svg_1 = require("react-native-svg");
var expo_linear_gradient_1 = require("expo-linear-gradient");
var theme_1 = require("../theme/theme");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var _a = react_native_1.Dimensions.get('window'), SCREEN_W = _a.width, SCREEN_H = _a.height;
var GRID_CELL = 42;
var RADAR_SIZE = Math.max(SCREEN_W, SCREEN_H) * 1.3;
function HoloGrid() {
    var verticals = (0, react_1.useMemo)(function () { return Array.from({ length: Math.ceil(SCREEN_W / GRID_CELL) + 1 }, function (_, i) { return i * GRID_CELL; }); }, []);
    var horizontals = (0, react_1.useMemo)(function () { return Array.from({ length: Math.ceil(SCREEN_H / GRID_CELL) + 1 }, function (_, i) { return i * GRID_CELL; }); }, []);
    return (<react_native_svg_1.default width={SCREEN_W} height={SCREEN_H} style={styles.fill}>
      {verticals.map(function (x) { return (<react_native_svg_1.Line key={"v-".concat(x)} x1={x} y1={0} x2={x} y2={SCREEN_H} stroke="rgba(0,200,255,0.06)" strokeWidth={1}/>); })}
      {horizontals.map(function (y) { return (<react_native_svg_1.Line key={"h-".concat(y)} x1={0} y1={y} x2={SCREEN_W} y2={y} stroke="rgba(0,200,255,0.06)" strokeWidth={1}/>); })}
    </react_native_svg_1.default>);
}
function Vignette() {
    return (<react_native_svg_1.default width={SCREEN_W} height={SCREEN_H} style={styles.fill}>
      <react_native_svg_1.Defs>
        <react_native_svg_1.RadialGradient id="vignette" cx="50%" cy="42%" r="70%">
          <react_native_svg_1.Stop offset="45%" stopColor="#02040A" stopOpacity={0}/>
          <react_native_svg_1.Stop offset="100%" stopColor="#02040A" stopOpacity={0.85}/>
        </react_native_svg_1.RadialGradient>
      </react_native_svg_1.Defs>
      <react_native_svg_1.Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#vignette)"/>
    </react_native_svg_1.default>);
}
var NOISE_DOTS = Array.from({ length: 60 }, function (_, i) { return ({
    key: "noise-".concat(i),
    left: Math.random() * SCREEN_W,
    top: Math.random() * SCREEN_H,
    size: Math.random() < 0.7 ? 1 : 1.5,
    opacity: 0.03 + Math.random() * 0.05,
}); });
function HoloNoise() {
    return (<react_native_1.View style={styles.fill} pointerEvents="none">
      {NOISE_DOTS.map(function (d) { return (<react_native_1.View key={d.key} style={{ position: 'absolute', left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: theme_1.colors.cyanSoft, opacity: d.opacity }}/>); })}
    </react_native_1.View>);
}
var SHAFT_DEFS = [
    { key: 'shaft-a', left: SCREEN_W * 0.15, rotate: '18deg', height: SCREEN_H * 1.4 },
    { key: 'shaft-b', left: SCREEN_W * 0.7, rotate: '-14deg', height: SCREEN_H * 1.2 },
];
function LightShafts() {
    return (<react_native_1.View style={styles.fill} pointerEvents="none">
      {SHAFT_DEFS.map(function (s) { return (<react_native_1.View key={s.key} style={[styles.shaftWrap, { left: s.left, height: s.height, transform: [{ rotate: s.rotate }] }]}>
          <expo_linear_gradient_1.LinearGradient colors={['rgba(0,234,255,0)', 'rgba(0,234,255,0.05)', 'rgba(0,234,255,0)']} style={styles.fill}/>
        </react_native_1.View>); })}
    </react_native_1.View>);
}
var RADAR_CIRCLE_RADII = [90, 160, 230, 300];
function RadarCircles(_a) {
    var reducedMotion = _a.reducedMotion;
    var breathe = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(breathe, { toValue: 1, duration: 3400, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }),
            react_native_1.Animated.timing(breathe, { toValue: 0, duration: 3400, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }),
        ]));
        loop.start();
        return function () { return loop.stop(); };
    }, [reducedMotion, breathe]);
    var opacity = (0, react_1.useMemo)(function () { return breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }); }, [breathe]);
    return (<react_native_1.Animated.View style={[styles.fill, { opacity: opacity }]} pointerEvents="none">
      {RADAR_CIRCLE_RADII.map(function (r) { return (<react_native_1.View key={"radar-circle-".concat(r)} style={{
                position: 'absolute',
                top: SCREEN_H * 0.3 - r,
                left: SCREEN_W / 2 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                borderWidth: 1,
                borderColor: 'rgba(0,234,255,0.06)',
            }}/>); })}
    </react_native_1.Animated.View>);
}
// NEW — Priority 5: very soft, slow holographic shimmer band sweeping
// diagonally across the whole screen. Single element, single loop.
function HoloShimmer(_a) {
    var reducedMotion = _a.reducedMotion;
    var sweep = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var loop = react_native_1.Animated.loop(react_native_1.Animated.timing(sweep, { toValue: 1, duration: 9000, easing: react_native_1.Easing.inOut(react_native_1.Easing.ease), useNativeDriver: true }));
        loop.start();
        return function () { return loop.stop(); };
    }, [reducedMotion, sweep]);
    var translateX = (0, react_1.useMemo)(function () { return sweep.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W * 0.6, SCREEN_W * 1.2] }); }, [sweep]);
    return (<react_native_1.Animated.View style={[styles.shimmerWrap, { transform: [{ translateX: translateX }, { rotate: '22deg' }] }]} pointerEvents="none">
      <expo_linear_gradient_1.LinearGradient colors={['rgba(0,234,255,0)', 'rgba(0,234,255,0.035)', 'rgba(0,234,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.4 }} style={styles.fill}/>
    </react_native_1.Animated.View>);
}
function ScanlineSweep(_a) {
    var reducedMotion = _a.reducedMotion;
    var translateY = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var loop = react_native_1.Animated.loop(react_native_1.Animated.timing(translateY, { toValue: 1, duration: 7000, easing: react_native_1.Easing.linear, useNativeDriver: true }));
        loop.start();
        return function () { return loop.stop(); };
    }, [reducedMotion, translateY]);
    var y = (0, react_1.useMemo)(function () { return translateY.interpolate({ inputRange: [0, 1], outputRange: [-140, SCREEN_H] }); }, [translateY]);
    return (<react_native_1.Animated.View style={[styles.scanBand, { transform: [{ translateY: y }] }]} pointerEvents="none">
      <expo_linear_gradient_1.LinearGradient colors={['rgba(0,234,255,0)', 'rgba(0,234,255,0.09)', 'rgba(0,234,255,0)']} style={styles.fill}/>
    </react_native_1.Animated.View>);
}
function buildParticles(count) {
    return Array.from({ length: count }, function (_, i) { return ({
        id: i,
        left: Math.random() * SCREEN_W,
        size: 2 + Math.random() * 2.5,
        duration: 7000 + Math.random() * 6000,
        delay: Math.random() * 5000,
        drift: (Math.random() - 0.5) * 60,
    }); });
}
function Particle(_a) {
    var def = _a.def, reducedMotion = _a.reducedMotion;
    var progress = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var cancelled = false;
        function run() {
            progress.setValue(0);
            react_native_1.Animated.timing(progress, { toValue: 1, duration: def.duration, delay: def.delay, easing: react_native_1.Easing.linear, useNativeDriver: true }).start(function (_a) {
                var finished = _a.finished;
                if (finished && !cancelled)
                    run();
            });
        }
        run();
        return function () {
            cancelled = true;
            progress.stopAnimation();
        };
    }, [reducedMotion, progress, def]);
    var translateY = (0, react_1.useMemo)(function () { return progress.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_H * 1.05] }); }, [progress]);
    var translateX = (0, react_1.useMemo)(function () { return progress.interpolate({ inputRange: [0, 1], outputRange: [0, def.drift] }); }, [progress, def.drift]);
    var opacity = (0, react_1.useMemo)(function () { return progress.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.9, 0.4, 0] }); }, [progress]);
    return (<react_native_1.Animated.View style={[styles.particle, { left: def.left, width: def.size, height: def.size, borderRadius: def.size / 2, opacity: opacity, transform: [{ translateY: translateY }, { translateX: translateX }] }]}/>);
}
function RadarSweep(_a) {
    var reducedMotion = _a.reducedMotion;
    var rotate = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var loop = react_native_1.Animated.loop(react_native_1.Animated.timing(rotate, { toValue: 1, duration: 14000, easing: react_native_1.Easing.linear, useNativeDriver: true }));
        loop.start();
        return function () { return loop.stop(); };
    }, [reducedMotion, rotate]);
    var spin = (0, react_1.useMemo)(function () { return rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); }, [rotate]);
    return (<react_native_1.Animated.View style={[styles.radarWedge, { width: RADAR_SIZE, height: RADAR_SIZE, borderRadius: RADAR_SIZE / 2, transform: [{ rotate: spin }] }]} pointerEvents="none">
      <expo_linear_gradient_1.LinearGradient colors={['rgba(0,234,255,0.10)', 'rgba(0,234,255,0)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 0 }} style={styles.fill}/>
    </react_native_1.Animated.View>);
}
function BackgroundLayers() {
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var particles = (0, react_1.useMemo)(function () { return buildParticles(18); }, []);
    return (<react_native_1.View style={styles.fill} pointerEvents="none">
      <react_native_1.View style={styles.base}/>
      <HoloGrid />
      <RadarCircles reducedMotion={reducedMotion}/>
      <LightShafts />
      <HoloShimmer reducedMotion={reducedMotion}/>
      <RadarSweep reducedMotion={reducedMotion}/>
      <expo_linear_gradient_1.LinearGradient colors={['rgba(0,90,160,0.12)', 'rgba(0,90,160,0)']} style={styles.fog}/>
      <expo_linear_gradient_1.LinearGradient colors={['rgba(0,60,140,0.08)', 'rgba(0,60,140,0)']} style={styles.fogB}/>
      <HoloNoise />
      {particles.map(function (p) { return (<Particle key={p.id} def={p} reducedMotion={reducedMotion}/>); })}
      <Vignette />
      <ScanlineSweep reducedMotion={reducedMotion}/>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    base: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme_1.colors.bgBlack },
    fog: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.35 },
    fogB: { position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_H * 0.22 },
    shaftWrap: { position: 'absolute', top: -SCREEN_H * 0.2, width: 90 },
    shimmerWrap: { position: 'absolute', top: -SCREEN_H * 0.2, width: SCREEN_W * 0.5, height: SCREEN_H * 1.6 },
    particle: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: theme_1.colors.cyanSoft,
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.8,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 0 },
    },
    scanBand: { position: 'absolute', left: 0, right: 0, height: 140 },
    radarWedge: { position: 'absolute', top: SCREEN_H * 0.3 - RADAR_SIZE / 2, left: SCREEN_W / 2 - RADAR_SIZE / 2, overflow: 'hidden' },
});
exports.default = BackgroundLayers;

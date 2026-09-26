"use strict";
// ArcReactorMobile.tsx — Cinematic 3D upgrade (visual polish only).
// Public prop interface is backward-compatible: `size`, `showFloor`,
// `bloomBoost`, `floorIntensity` behave exactly as before. One new
// OPTIONAL prop, `activityState`, defaults to 'idle' and is not wired
// into any caller yet — existing usage in HomeScreen.tsx and
// BootSequenceMobile.tsx requires zero changes.
//
// All 8 original independently-rotating ring layers, LEDs, bolts,
// ripples, and lens flare are preserved with identical geometry and
// timing. New in this pass: animated diagonal glass-reflection sweep,
// a real 3D-tilted floating platform (native perspective + rotateX,
// not manual ellipse squashing), directional bevel/shadow highlights
// for physical depth, a brighter metallic housing rim, a continuous
// hover bob, a faint outer atmosphere ring, and activity-state-driven
// core pulse behavior (idle / thinking / streaming / error).
//
// No Animated.createAnimatedComponent() on react-native-svg
// primitives anywhere — every rotation/scale/opacity is a plain
// Animated.View wrapping static <Svg> content, exactly as in the
// working prior version. Every Animated.Value and every
// .interpolate() result is created via useMemo (React 19 safe).
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
var react_native_svg_1 = require("react-native-svg");
var expo_linear_gradient_1 = require("expo-linear-gradient");
var theme_1 = require("../theme/theme");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
var VIEWBOX_SIZE = 200;
var CENTER = 100;
var DEG_TO_RAD = Math.PI / 180;
function polar(cx, cy, r, angleDeg) {
    var rad = (angleDeg - 90) * DEG_TO_RAD;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function segmentPath(cx, cy, rInner, rOuter, start, end) {
    var outerStart = polar(cx, cy, rOuter, end);
    var outerEnd = polar(cx, cy, rOuter, start);
    var innerEnd = polar(cx, cy, rInner, start);
    var innerStart = polar(cx, cy, rInner, end);
    var largeArc = end - start <= 180 ? 0 : 1;
    return [
        "M",
        outerStart.x,
        outerStart.y,
        "A",
        rOuter,
        rOuter,
        0,
        largeArc,
        0,
        outerEnd.x,
        outerEnd.y,
        "L",
        innerEnd.x,
        innerEnd.y,
        "A",
        rInner,
        rInner,
        0,
        largeArc,
        1,
        innerStart.x,
        innerStart.y,
        "Z",
    ].join(" ");
}
function arcPath(cx, cy, r, start, end) {
    var s = polar(cx, cy, r, end);
    var e = polar(cx, cy, r, start);
    var largeArc = end - start <= 180 ? 0 : 1;
    return "M ".concat(s.x, " ").concat(s.y, " A ").concat(r, " ").concat(r, " 0 ").concat(largeArc, " 0 ").concat(e.x, " ").concat(e.y);
}
/* ---------------- static geometry, computed once at module load ---------------- */
var SEGMENT_COUNT = 12;
var GAP = 5;
var SPAN = 360 / SEGMENT_COUNT - GAP;
var segments = Array.from({ length: SEGMENT_COUNT }, function (_, i) {
    var start = i * (360 / SEGMENT_COUNT) + GAP / 2;
    var end = start + SPAN;
    return {
        key: "seg-".concat(i),
        d: segmentPath(CENTER, CENTER, 58, 86, start, end),
    };
});
var ticks = Array.from({ length: 36 }, function (_, i) {
    var angle = i * 10;
    var isMajor = angle % 30 === 0;
    var outer = polar(CENTER, CENTER, 42, angle);
    var inner = polar(CENTER, CENTER, isMajor ? 34 : 38, angle);
    return {
        key: "tick-".concat(i),
        x1: outer.x,
        y1: outer.y,
        x2: inner.x,
        y2: inner.y,
        isMajor: isMajor,
    };
});
var turbineBlades = Array.from({ length: 20 }, function (_, i) {
    var angle = (360 / 20) * i;
    var outer = polar(CENTER, CENTER, 48, angle);
    var inner = polar(CENTER, CENTER, 40, angle + 5);
    return {
        key: "blade-".concat(i),
        x1: outer.x,
        y1: outer.y,
        x2: inner.x,
        y2: inner.y,
    };
});
var bolts = Array.from({ length: 12 }, function (_, i) {
    var pos = polar(CENTER, CENTER, 95, i * 30);
    return { key: "bolt-".concat(i), dx: pos.x - CENTER, dy: pos.y - CENTER };
});
var leds = Array.from({ length: 16 }, function (_, i) {
    var pos = polar(CENTER, CENTER, 79, i * 22.5);
    return {
        key: "led-".concat(i),
        dx: pos.x - CENTER,
        dy: pos.y - CENTER,
        delay: (i % 6) * 380,
    };
});
var orbitDots = Array.from({ length: 6 }, function (_, i) {
    var pos = polar(CENTER, CENTER, 91, i * 60);
    return { key: "orbit-".concat(i), dx: pos.x - CENTER, dy: pos.y - CENTER };
});
var calibrationDots = Array.from({ length: 10 }, function (_, i) {
    var pos = polar(CENTER, CENTER, 71, i * 36);
    return { key: "caldot-".concat(i), dx: pos.x - CENTER, dy: pos.y - CENTER };
});
var radarWedgeD = arcPath(CENTER, CENTER, 88, 0, 32);
var calibrationDashes = Array.from({ length: 18 }, function (_, i) {
    var start = i * 20;
    return { key: "dash-".concat(i), d: arcPath(CENTER, CENTER, 98, start, start + 8) };
});
var hudArcs = [
    { key: "hud-a", d: arcPath(CENTER, CENTER, 68, 10, 95) },
    { key: "hud-b", d: arcPath(CENTER, CENTER, 68, 130, 200) },
    { key: "hud-c", d: arcPath(CENTER, CENTER, 68, 235, 290) },
    { key: "hud-d", d: arcPath(CENTER, CENTER, 68, 315, 350) },
];
var outerDashes = Array.from({ length: 10 }, function (_, i) {
    var start = i * 36;
    return {
        key: "outer-dash-".concat(i),
        d: arcPath(CENTER, CENTER, 96.5, start, start + 14),
    };
});
var beamTrapezoidD = "M 70 4 L 130 4 L 112 150 L 88 150 Z";
// Directional lighting arcs — upper-left bright bevel highlight, lower-
// right dark shadow arc — simulate a physical, curved metal surface
// catching light from one direction, rather than a flat painted ring.
var bevelHighlightD = arcPath(CENTER, CENTER, 90, 200, 258);
var bevelShadowD = arcPath(CENTER, CENTER, 90, 18, 76);
// Faint atmosphere ring, larger than the housing, drawn behind
// everything — pure HUD dressing, kept deliberately subtle.
var atmosphereRingA = arcPath(CENTER, CENTER, 118, 0, 360 - 0.01);
var atmosphereRingB = arcPath(CENTER, CENTER, 130, 0, 360 - 0.01);
// Platform ring dashes (used inside the tilted 3D platform).
var platformDashesOuter = Array.from({ length: 24 }, function (_, i) {
    var start = i * 15;
    return { key: "plat-outer-".concat(i), d: arcPath(100, 100, 92, start, start + 7) };
});
var platformDashesInner = Array.from({ length: 16 }, function (_, i) {
    var start = i * 22.5;
    return {
        key: "plat-inner-".concat(i),
        d: arcPath(100, 100, 70, start, start + 10),
    };
});
function getCorePulseConfig(state) {
    switch (state) {
        case "listening":
            return {
                breatheDuration: 850,
                breatheScaleRange: [1, 1.18],
                breatheOpacityRange: [0.78, 1],
                flickerDuration: 900,
                flickerScaleRange: [1, 1.09],
            };
        case "thinking":
            return {
                breatheDuration: 900,
                breatheScaleRange: [1, 1.16],
                breatheOpacityRange: [0.75, 1],
                flickerDuration: 1000,
                flickerScaleRange: [1, 1.08],
            };
        case "streaming":
            return {
                breatheDuration: 650,
                breatheScaleRange: [1, 1.22],
                breatheOpacityRange: [0.85, 1],
                flickerDuration: 700,
                flickerScaleRange: [1, 1.12],
            };
        case "error":
            return {
                breatheDuration: 2100,
                breatheScaleRange: [1, 1.08],
                breatheOpacityRange: [0.5, 0.85],
                flickerDuration: 1300,
                flickerScaleRange: [1, 1.06],
            };
        case "idle":
        default:
            return {
                breatheDuration: 2100,
                breatheScaleRange: [1, 1.12],
                breatheOpacityRange: [0.65, 1],
                flickerDuration: 1300,
                flickerScaleRange: [1, 1.06],
            };
    }
}
function getStateBloomBaseline(state) {
    switch (state) {
        case "listening":
            return 0.32;
        case "thinking":
            return 0.48;
        case "streaming":
            return 0.62;
        case "error":
        case "idle":
        default:
            return 0;
    }
}
function ArcReactorMobile(_a) {
    var _b = _a.size, size = _b === void 0 ? 240 : _b, _c = _a.showFloor, showFloor = _c === void 0 ? true : _c, _d = _a.bloomBoost, bloomBoost = _d === void 0 ? 0 : _d, _e = _a.floorIntensity, floorIntensity = _e === void 0 ? 1 : _e, _f = _a.activityState, activityState = _f === void 0 ? "idle" : _f;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var scale = size / VIEWBOX_SIZE;
    var pulseConfig = getCorePulseConfig(activityState);
    // --- rotation drivers (unchanged geometry/timing from prior pass) ---
    var segRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var tickRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var turbineRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var orbitRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var calibrationDotRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var radarRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var calibrationRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var hudArcRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var outerDashRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var atmosphereRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var platformRotation = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    // --- core / bloom / floor drivers ---
    var coreBreathe = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var coreFlicker = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var errorFlicker = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var flareTwinkle = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rippleA = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rippleB = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rippleC = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var ledValues = (0, react_1.useMemo)(function () { return leds.map(function () { return new react_native_1.Animated.Value(0.25); }); }, []);
    var coneFlicker = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    // --- new: glass reflection sweep + continuous hover bob ---
    var glassSweep = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var hoverBob = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var running = [];
        var spinLoop = function (v, d) {
            return react_native_1.Animated.loop(react_native_1.Animated.timing(v, {
                toValue: 1,
                duration: d,
                easing: react_native_1.Easing.linear,
                useNativeDriver: true,
            }));
        };
        // NEW: stronger ring energy during Thinking/Streaming
        var isEnergized = activityState === "listening" ||
            activityState === "thinking" ||
            activityState === "streaming";
        // Listening = fast but slightly calmer than speaking
        var radarDuration = activityState === "streaming" ? 2200 : isEnergized ? 2600 : 4000;
        var hudArcDuration = activityState === "streaming" ? 10000 : isEnergized ? 14000 : 20000;
        // Reset rotation values before restarting loops
        segRotation.setValue(0);
        tickRotation.setValue(0);
        turbineRotation.setValue(0);
        orbitRotation.setValue(0);
        calibrationDotRotation.setValue(0);
        radarRotation.setValue(0);
        calibrationRotation.setValue(0);
        hudArcRotation.setValue(0);
        outerDashRotation.setValue(0);
        atmosphereRotation.setValue(0);
        platformRotation.setValue(0);
        running.push(spinLoop(segRotation, 14000), spinLoop(tickRotation, 9000), spinLoop(turbineRotation, 11000), spinLoop(orbitRotation, 6000), spinLoop(calibrationDotRotation, 15000), spinLoop(radarRotation, radarDuration), // changed
        spinLoop(calibrationRotation, 26000), spinLoop(hudArcRotation, hudArcDuration), // changed
        spinLoop(outerDashRotation, 34000), spinLoop(atmosphereRotation, 55000), spinLoop(platformRotation, 40000));
        var breatheLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(coreBreathe, {
                toValue: 1,
                duration: pulseConfig.breatheDuration,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(coreBreathe, {
                toValue: 0,
                duration: pulseConfig.breatheDuration,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
        ]));
        var flickerLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(coreFlicker, {
                toValue: 1,
                duration: pulseConfig.flickerDuration,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(coreFlicker, {
                toValue: 0,
                duration: pulseConfig.flickerDuration,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
        ]));
        var flareLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(flareTwinkle, {
                toValue: 1,
                duration: 2200,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(flareTwinkle, {
                toValue: 0,
                duration: 2200,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
        ]));
        var coneLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(coneFlicker, {
                toValue: 1,
                duration: 1700,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(coneFlicker, {
                toValue: 0,
                duration: 1700,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
        ]));
        var glassSweepLoop = react_native_1.Animated.loop(react_native_1.Animated.timing(glassSweep, {
            toValue: 1,
            duration: 5200,
            easing: react_native_1.Easing.linear,
            useNativeDriver: true,
        }));
        var hoverBobLoop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(hoverBob, {
                toValue: 1,
                duration: 3400,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.quad),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(hoverBob, {
                toValue: 0,
                duration: 3400,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.quad),
                useNativeDriver: true,
            }),
        ]));
        function rippleLoop(v, delay) {
            return react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.delay(delay),
                react_native_1.Animated.timing(v, {
                    toValue: 1,
                    duration: 3600,
                    easing: react_native_1.Easing.out(react_native_1.Easing.ease),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(v, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ]));
        }
        var rA = rippleLoop(rippleA, 0);
        var rB = rippleLoop(rippleB, 1200);
        var rC = rippleLoop(rippleC, 2400);
        var ledLoops = ledValues.map(function (v, i) {
            return react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.delay(leds[i].delay),
                react_native_1.Animated.timing(v, {
                    toValue: 1,
                    duration: 420,
                    easing: react_native_1.Easing.bezier(0.42, 0, 0.25, 1),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(v, {
                    toValue: 0.25,
                    duration: 720,
                    easing: react_native_1.Easing.bezier(0.42, 0, 0.25, 1),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.delay(2200),
            ]));
        });
        running.push.apply(running, __spreadArray([breatheLoop,
            flickerLoop,
            flareLoop,
            coneLoop,
            glassSweepLoop,
            hoverBobLoop,
            rA,
            rB,
            rC], ledLoops, false));
        if (activityState === "error") {
            running.push(react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.timing(errorFlicker, {
                    toValue: 1,
                    duration: 260,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                    useNativeDriver: true,
                }),
                react_native_1.Animated.timing(errorFlicker, {
                    toValue: 0,
                    duration: 260,
                    easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                    useNativeDriver: true,
                }),
            ])));
        }
        else {
            errorFlicker.setValue(0);
        }
        running.forEach(function (a) { return a.start(); });
        return function () { return running.forEach(function (a) { return a.stop(); }); };
    }, [
        reducedMotion,
        activityState,
        pulseConfig.breatheDuration,
        pulseConfig.flickerDuration,
        segRotation,
        tickRotation,
        turbineRotation,
        orbitRotation,
        calibrationDotRotation,
        radarRotation,
        calibrationRotation,
        hudArcRotation,
        outerDashRotation,
        atmosphereRotation,
        platformRotation,
        coreBreathe,
        coreFlicker,
        errorFlicker,
        flareTwinkle,
        coneFlicker,
        glassSweep,
        hoverBob,
        rippleA,
        rippleB,
        rippleC,
        ledValues,
    ]);
    var segSpin = (0, react_1.useMemo)(function () {
        return segRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });
    }, [segRotation]);
    var tickSpin = (0, react_1.useMemo)(function () {
        return tickRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "-360deg"],
        });
    }, [tickRotation]);
    var turbineSpin = (0, react_1.useMemo)(function () {
        return turbineRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });
    }, [turbineRotation]);
    var orbitSpin = (0, react_1.useMemo)(function () {
        return orbitRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "-360deg"],
        });
    }, [orbitRotation]);
    var calDotSpin = (0, react_1.useMemo)(function () {
        return calibrationDotRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });
    }, [calibrationDotRotation]);
    var radarSpin = (0, react_1.useMemo)(function () {
        return radarRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });
    }, [radarRotation]);
    var calibrationSpin = (0, react_1.useMemo)(function () {
        return calibrationRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "-360deg"],
        });
    }, [calibrationRotation]);
    var hudArcSpin = (0, react_1.useMemo)(function () {
        return hudArcRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });
    }, [hudArcRotation]);
    var outerDashSpin = (0, react_1.useMemo)(function () {
        return outerDashRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "-360deg"],
        });
    }, [outerDashRotation]);
    var atmosphereSpin = (0, react_1.useMemo)(function () {
        return atmosphereRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "-360deg"],
        });
    }, [atmosphereRotation]);
    var platformSpin = (0, react_1.useMemo)(function () {
        return platformRotation.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
        });
    }, [platformRotation]);
    var coreScale = (0, react_1.useMemo)(function () {
        return coreBreathe.interpolate({
            inputRange: [0, 1],
            outputRange: pulseConfig.breatheScaleRange,
        });
    }, [coreBreathe, pulseConfig.breatheScaleRange]);
    var coreOpacity = (0, react_1.useMemo)(function () {
        return coreBreathe.interpolate({
            inputRange: [0, 1],
            outputRange: pulseConfig.breatheOpacityRange,
        });
    }, [coreBreathe, pulseConfig.breatheOpacityRange]);
    var flickerScale = (0, react_1.useMemo)(function () {
        return coreFlicker.interpolate({
            inputRange: [0, 1],
            outputRange: pulseConfig.flickerScaleRange,
        });
    }, [coreFlicker, pulseConfig.flickerScaleRange]);
    var errorOverlayOpacity = (0, react_1.useMemo)(function () {
        return errorFlicker.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
    }, [errorFlicker]);
    var flareOpacity = (0, react_1.useMemo)(function () {
        return flareTwinkle.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.85],
        });
    }, [flareTwinkle]);
    var coneOpacity = (0, react_1.useMemo)(function () {
        return coneFlicker.interpolate({
            inputRange: [0, 1],
            outputRange: [0.32 * floorIntensity, 0.6 * floorIntensity],
        });
    }, [coneFlicker, floorIntensity]);
    var rippleScaleA = (0, react_1.useMemo)(function () { return rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }); }, [rippleA]);
    var rippleOpacityA = (0, react_1.useMemo)(function () { return rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }); }, [rippleA]);
    var rippleScaleB = (0, react_1.useMemo)(function () { return rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }); }, [rippleB]);
    var rippleOpacityB = (0, react_1.useMemo)(function () { return rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }); }, [rippleB]);
    var rippleScaleC = (0, react_1.useMemo)(function () { return rippleC.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }); }, [rippleC]);
    var rippleOpacityC = (0, react_1.useMemo)(function () { return rippleC.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }); }, [rippleC]);
    // Glass sweep: diagonal band travels from off-canvas left to
    // off-canvas right, clipped to the reactor's circular bounds.
    var glassSweepTranslate = (0, react_1.useMemo)(function () {
        return glassSweep.interpolate({
            inputRange: [0, 1],
            outputRange: [-size * 0.9, size * 1.1],
        });
    }, [glassSweep, size]);
    var hoverBobTranslate = (0, react_1.useMemo)(function () {
        return hoverBob.interpolate({
            inputRange: [0, 1],
            outputRange: [-Math.max(4, size * 0.025), Math.max(4, size * 0.025)],
        });
    }, [hoverBob, size]);
    var rippleDiameter = 44 * scale;
    var boltSize = 5 * scale;
    var ledSize = 3.2 * scale;
    var flickerDiameter = 14 * scale;
    var flareSize = 4.5 * scale;
    var orbitDotSize = 4.5 * scale;
    var calDotSize = 2.6 * scale;
    var bloomExtra = Math.max(0, Math.min(1, Math.max(bloomBoost, getStateBloomBaseline(activityState))));
    var bloomAnim = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(bloomExtra); }, []);
    var beamHeight = size * 0.85;
    var shadowWidth = size * 0.62;
    var beamStopA = Math.min(1, 0.4 * floorIntensity);
    var beamStopB = Math.min(1, 0.12 * floorIntensity);
    var floorStopA = Math.min(1, 0.32 * floorIntensity);
    var floorStopB = Math.min(1, 0.1 * floorIntensity);
    var platformSize = size * 0.72;
    var platformGlowSize = size * 0.9;
    (0, react_1.useEffect)(function () {
        react_native_1.Animated.spring(bloomAnim, {
            toValue: bloomExtra,
            stiffness: 120,
            damping: 18,
            mass: 0.9,
            useNativeDriver: true,
        }).start();
    }, [bloomExtra, bloomAnim]);
    return (<react_native_1.View style={styles.stageWrap}>
      {/* --- Faint outer atmosphere ring, behind everything --- */}
      <react_native_1.Animated.View pointerEvents="none" style={[
            styles.atmosphereWrap,
            {
                width: size * 1.35,
                height: size * 1.35,
                top: -(size * 0.175),
                left: -(size * 0.175),
                transform: [{ rotate: atmosphereSpin }],
            },
        ]}>
        <react_native_svg_1.default width={size * 1.35} height={size * 1.35} viewBox="0 0 200 200">
          <react_native_svg_1.Path d={atmosphereRingA} fill="none" stroke="rgba(0,234,255,0.05)" strokeWidth={0.6}/>
          <react_native_svg_1.Path d={atmosphereRingB} fill="none" stroke="rgba(0,234,255,0.03)" strokeWidth={0.5} strokeDasharray="2,6"/>
        </react_native_svg_1.default>
      </react_native_1.Animated.View>

      {/* --- Reactor body: continuous hover bob wraps everything --- */}
      <react_native_1.Animated.View style={{ transform: [{ translateY: hoverBobTranslate }] }}>
        <react_native_1.View style={[styles.wrap, { width: size, height: size }]}>
          {/* Layered bloom halo */}
          <react_native_1.View style={[
            styles.bloomFar,
            {
                width: size * 2.1,
                height: size * 2.1,
                borderRadius: (size * 2.1) / 2,
                top: -(size * 0.55),
                left: -(size * 0.55),
            },
        ]} pointerEvents="none"/>
          <react_native_1.View style={[
            styles.bloomOuter,
            {
                width: size * 1.75,
                height: size * 1.75,
                borderRadius: (size * 1.75) / 2,
                top: -(size * 0.375),
                left: -(size * 0.375),
            },
        ]} pointerEvents="none"/>
          <react_native_1.View style={[
            styles.bloomInner,
            {
                width: size * 1.3,
                height: size * 1.3,
                borderRadius: (size * 1.3) / 2,
                top: -(size * 0.15),
                left: -(size * 0.15),
            },
        ]} pointerEvents="none"/>
          {bloomExtra > 0 && (<react_native_1.View pointerEvents="none" style={[
                styles.bloomBoost,
                {
                    width: size * 1.5,
                    height: size * 1.5,
                    borderRadius: (size * 1.5) / 2,
                    top: -(size * 0.25),
                    left: -(size * 0.25),
                    opacity: 0.28 * bloomExtra,
                },
            ]}/>)}

          {/* Static housing with metallic rim + directional bevel lighting */}
          <react_native_1.View style={[
            styles.housingOuterShade,
            {
                width: 199 * scale,
                height: 199 * scale,
                borderRadius: (199 * scale) / 2,
                top: (size - 199 * scale) / 2,
                left: (size - 199 * scale) / 2,
            },
        ]} pointerEvents="none"/>
          <react_native_1.View style={styles.fill} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              <react_native_svg_1.Defs>
                <react_native_svg_1.LinearGradient id="metallicRim" x1="10%" y1="0%" x2="90%" y2="100%">
                  <react_native_svg_1.Stop offset="0%" stopColor="#dff6ff" stopOpacity={0.7}/>
                  <react_native_svg_1.Stop offset="45%" stopColor="#0a1424" stopOpacity={0.9}/>
                  <react_native_svg_1.Stop offset="100%" stopColor="#7df9ff" stopOpacity={0.5}/>
                </react_native_svg_1.LinearGradient>
              </react_native_svg_1.Defs>
              {/* metallic rim ring */}
              <react_native_svg_1.Circle cx={CENTER} cy={CENTER} r={97.5} fill="none" stroke="url(#metallicRim)" strokeWidth={3.5}/>
              {/* directional bevel: bright upper-left, dark lower-right */}
              <react_native_svg_1.Path d={bevelHighlightD} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2.6} strokeLinecap="round"/>
              <react_native_svg_1.Path d={bevelShadowD} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={2.6} strokeLinecap="round"/>
            </react_native_svg_1.default>
          </react_native_1.View>
          <react_native_1.View style={[
            styles.housingChamfer,
            {
                width: 194 * scale,
                height: 194 * scale,
                borderRadius: (194 * scale) / 2,
                top: (size - 194 * scale) / 2,
                left: (size - 194 * scale) / 2,
            },
        ]} pointerEvents="none"/>
          <react_native_1.View style={[
            styles.housingRing,
            {
                width: 188 * scale,
                height: 188 * scale,
                borderRadius: (188 * scale) / 2,
                top: (size - 188 * scale) / 2,
                left: (size - 188 * scale) / 2,
                borderWidth: 3.4 * scale,
            },
        ]} pointerEvents="none"/>

          {bolts.map(function (b) { return (<react_native_1.View key={b.key} style={[
                styles.bolt,
                {
                    width: boltSize,
                    height: boltSize,
                    borderRadius: boltSize / 2,
                    top: size / 2 + b.dy * scale - boltSize / 2,
                    left: size / 2 + b.dx * scale - boltSize / 2,
                },
            ]} pointerEvents="none">
              <react_native_1.View style={styles.boltHighlight}/>
            </react_native_1.View>); })}

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: outerDashSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              {outerDashes.map(function (d) { return (<react_native_svg_1.Path key={d.key} d={d.d} fill="none" stroke="rgba(0,234,255,0.18)" strokeWidth={1.1} strokeLinecap="round"/>); })}
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: calibrationSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              {calibrationDashes.map(function (d) { return (<react_native_svg_1.Path key={d.key} d={d.d} fill="none" stroke="rgba(0,234,255,0.24)" strokeWidth={1.5} strokeLinecap="round"/>); })}
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: hudArcSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              {hudArcs.map(function (a) { return (<react_native_svg_1.Path key={a.key} d={a.d} fill="none" stroke={theme_1.colors.cyanSoft} strokeWidth={2.1} strokeLinecap="round" opacity={0.8}/>); })}
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: radarSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              <react_native_svg_1.Path d={radarWedgeD} fill="none" stroke={theme_1.colors.cyanSoft} strokeWidth={2.8} strokeLinecap="round" opacity={0.7}/>
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: segSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              {segments.map(function (s) { return (<react_native_svg_1.Path key={s.key} d={s.d} fill="rgba(0,234,255,0.19)" stroke="rgba(0,234,255,0.68)" strokeWidth={1.7}/>); })}
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: tickSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              <react_native_svg_1.Circle cx={CENTER} cy={CENTER} r={42} fill="none" stroke="rgba(0,234,255,0.25)" strokeWidth={0.75}/>
              {ticks.map(function (t) { return (<react_native_svg_1.Line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.isMajor ? theme_1.colors.cyan : "rgba(0,234,255,0.4)"} strokeWidth={t.isMajor ? 1.4 : 0.7}/>); })}
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: turbineSpin }] }]} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              {turbineBlades.map(function (b) { return (<react_native_svg_1.Line key={b.key} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="rgba(0,234,255,0.32)" strokeWidth={1.1}/>); })}
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: orbitSpin }] }]} pointerEvents="none">
            {orbitDots.map(function (o) { return (<react_native_1.View key={o.key} style={[
                styles.orbitDot,
                {
                    width: orbitDotSize,
                    height: orbitDotSize,
                    borderRadius: orbitDotSize / 2,
                    top: size / 2 + o.dy * scale - orbitDotSize / 2,
                    left: size / 2 + o.dx * scale - orbitDotSize / 2,
                },
            ]}/>); })}
          </react_native_1.Animated.View>

          <react_native_1.Animated.View style={[styles.fill, { transform: [{ rotate: calDotSpin }] }]} pointerEvents="none">
            {calibrationDots.map(function (c) { return (<react_native_1.View key={c.key} style={[
                styles.calDot,
                {
                    width: calDotSize,
                    height: calDotSize,
                    borderRadius: calDotSize / 2,
                    top: size / 2 + c.dy * scale - calDotSize / 2,
                    left: size / 2 + c.dx * scale - calDotSize / 2,
                },
            ]}/>); })}
          </react_native_1.Animated.View>

          {leds.map(function (l, i) { return (<react_native_1.Animated.View key={l.key} pointerEvents="none" style={[
                styles.led,
                {
                    width: ledSize,
                    height: ledSize,
                    borderRadius: ledSize / 2,
                    top: size / 2 + l.dy * scale - ledSize / 2,
                    left: size / 2 + l.dx * scale - ledSize / 2,
                    opacity: ledValues[i],
                },
            ]}/>); })}

          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.ripple,
            {
                width: rippleDiameter,
                height: rippleDiameter,
                borderRadius: rippleDiameter / 2,
                top: (size - rippleDiameter) / 2,
                left: (size - rippleDiameter) / 2,
                opacity: rippleOpacityA,
                transform: [{ scale: rippleScaleA }],
            },
        ]}/>
          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.ripple,
            {
                width: rippleDiameter,
                height: rippleDiameter,
                borderRadius: rippleDiameter / 2,
                top: (size - rippleDiameter) / 2,
                left: (size - rippleDiameter) / 2,
                opacity: rippleOpacityB,
                transform: [{ scale: rippleScaleB }],
            },
        ]}/>
          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.ripple,
            {
                width: rippleDiameter,
                height: rippleDiameter,
                borderRadius: rippleDiameter / 2,
                top: (size - rippleDiameter) / 2,
                left: (size - rippleDiameter) / 2,
                opacity: rippleOpacityC,
                transform: [{ scale: rippleScaleC }],
            },
        ]}/>

          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.fill,
            { transform: [{ scale: coreScale }], opacity: coreOpacity },
        ]}>
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              <react_native_svg_1.Defs>
                <react_native_svg_1.RadialGradient id="mHalo" cx="50%" cy="50%" r="50%">
                  <react_native_svg_1.Stop offset="0%" stopColor={theme_1.colors.cyan} stopOpacity={Math.min(1, 0.88 + bloomExtra * 0.12)}/>
                  <react_native_svg_1.Stop offset="60%" stopColor={theme_1.colors.cyan} stopOpacity={0.22 + bloomExtra * 0.18}/>
                  <react_native_svg_1.Stop offset="100%" stopColor={theme_1.colors.cyan} stopOpacity={0}/>
                </react_native_svg_1.RadialGradient>
              </react_native_svg_1.Defs>
              <react_native_svg_1.Circle cx={CENTER} cy={CENTER} r={34 + bloomExtra * 8} fill="url(#mHalo)"/>
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          <react_native_1.View style={styles.fill} pointerEvents="none">
            <react_native_svg_1.default width={size} height={size} viewBox="0 0 200 200">
              <react_native_svg_1.Defs>
                <react_native_svg_1.RadialGradient id="mCore" cx="50%" cy="50%" r="50%">
                  <react_native_svg_1.Stop offset="0%" stopColor="#ffffff"/>
                  <react_native_svg_1.Stop offset="30%" stopColor="#aef6ff"/>
                  <react_native_svg_1.Stop offset="65%" stopColor={theme_1.colors.cyan}/>
                  <react_native_svg_1.Stop offset="100%" stopColor={theme_1.colors.neonBlueDeep} stopOpacity={0}/>
                </react_native_svg_1.RadialGradient>
              </react_native_svg_1.Defs>
              <react_native_svg_1.Circle cx={CENTER} cy={CENTER} r={18} fill="url(#mCore)"/>
            </react_native_svg_1.default>
          </react_native_1.View>

          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.flickerDot,
            {
                width: flickerDiameter,
                height: flickerDiameter,
                borderRadius: flickerDiameter / 2,
                top: (size - flickerDiameter) / 2,
                left: (size - flickerDiameter) / 2,
                transform: [{ scale: flickerScale }],
            },
        ]}/>

          {/* Error-state amber flicker overlay — inert unless activityState === 'error' */}
          {activityState === "error" && (<react_native_1.Animated.View pointerEvents="none" style={[
                styles.errorOverlay,
                {
                    width: flickerDiameter * 2.4,
                    height: flickerDiameter * 2.4,
                    borderRadius: (flickerDiameter * 2.4) / 2,
                    top: (size - flickerDiameter * 2.4) / 2,
                    left: (size - flickerDiameter * 2.4) / 2,
                    opacity: errorOverlayOpacity,
                },
            ]}/>)}

          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.flareDot,
            {
                width: flareSize,
                height: flareSize,
                borderRadius: flareSize / 2,
                top: size / 2 - 15 * scale - flareSize / 2,
                left: size / 2 - 13 * scale - flareSize / 2,
                opacity: flareOpacity,
            },
        ]}/>
          <react_native_1.Animated.View pointerEvents="none" style={[
            styles.flareDotSm,
            {
                width: flareSize * 0.5,
                height: flareSize * 0.5,
                borderRadius: (flareSize * 0.5) / 2,
                top: size / 2 + 20 * scale,
                left: size / 2 + 24 * scale,
                opacity: flareOpacity,
            },
        ]}/>

          {/* Animated diagonal glass reflection sweep, clipped to the reactor's circular bounds */}
          <react_native_1.View style={[
            styles.glassSweepClip,
            { width: size, height: size, borderRadius: size / 2 },
        ]} pointerEvents="none">
            <react_native_1.Animated.View style={[
            styles.glassSweepBand,
            {
                width: size * 0.5,
                height: size * 1.7,
                top: -size * 0.35,
                transform: [
                    { translateX: glassSweepTranslate },
                    { rotate: "18deg" },
                ],
            },
        ]}>
              <expo_linear_gradient_1.LinearGradient colors={[
            "rgba(255,255,255,0)",
            "rgba(255,255,255,0.22)",
            "rgba(255,255,255,0)",
        ]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fill}/>
            </react_native_1.Animated.View>
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.Animated.View>

      {showFloor && (<>
          <react_native_1.Animated.View style={[
                styles.floorWrap,
                { width: shadowWidth, height: beamHeight, opacity: coneOpacity },
            ]} pointerEvents="none">
            <react_native_svg_1.default width={shadowWidth} height={beamHeight} viewBox="0 0 200 150">
              <react_native_svg_1.Defs>
                <react_native_svg_1.LinearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <react_native_svg_1.Stop offset="0%" stopColor={theme_1.colors.cyan} stopOpacity={beamStopA}/>
                  <react_native_svg_1.Stop offset="60%" stopColor={theme_1.colors.cyan} stopOpacity={beamStopB}/>
                  <react_native_svg_1.Stop offset="100%" stopColor={theme_1.colors.cyan} stopOpacity={0}/>
                </react_native_svg_1.LinearGradient>
              </react_native_svg_1.Defs>
              <react_native_svg_1.Path d={beamTrapezoidD} fill="url(#beamGrad)"/>
            </react_native_svg_1.default>
          </react_native_1.Animated.View>

          {/* --- 3D floating platform: real perspective + rotateX tilt, not manual ellipse squashing --- */}
          <react_native_1.View style={styles.platformStage} pointerEvents="none">
            <react_native_1.View style={[
                styles.platformGlow,
                {
                    width: platformGlowSize,
                    height: platformGlowSize * 0.32,
                    borderRadius: platformGlowSize / 2,
                },
            ]}/>
            <react_native_1.View style={[
                styles.platformPerspective,
                { width: platformSize, height: platformSize },
            ]}>
              <react_native_1.Animated.View style={[
                styles.fill,
                {
                    transform: [{ rotateX: "68deg" }, { rotate: platformSpin }],
                },
            ]}>
                <react_native_svg_1.default width={platformSize} height={platformSize} viewBox="0 0 200 200">
                  <react_native_svg_1.Defs>
                    <react_native_svg_1.RadialGradient id="platformFill" cx="50%" cy="50%" r="50%">
                      <react_native_svg_1.Stop offset="0%" stopColor={theme_1.colors.cyan} stopOpacity={0.06}/>
                      <react_native_svg_1.Stop offset="100%" stopColor={theme_1.colors.cyan} stopOpacity={0}/>
                    </react_native_svg_1.RadialGradient>
                  </react_native_svg_1.Defs>
                  <react_native_svg_1.Circle cx={100} cy={100} r={94} fill="url(#platformFill)"/>
                  <react_native_svg_1.Circle cx={100} cy={100} r={94} fill="none" stroke="rgba(0,234,255,0.35)" strokeWidth={1.4}/>
                  {platformDashesOuter.map(function (d) { return (<react_native_svg_1.Path key={d.key} d={d.d} fill="none" stroke="rgba(0,234,255,0.5)" strokeWidth={1.6} strokeLinecap="round"/>); })}
                  {platformDashesInner.map(function (d) { return (<react_native_svg_1.Path key={d.key} d={d.d} fill="none" stroke="rgba(0,234,255,0.3)" strokeWidth={1.1} strokeLinecap="round"/>); })}
                </react_native_svg_1.default>
              </react_native_1.Animated.View>
            </react_native_1.View>
            <react_native_1.View style={[
                styles.platformShadow,
                {
                    width: platformSize * 0.9,
                    height: platformSize * 0.9 * 0.16,
                },
            ]}/>
          </react_native_1.View>
        </>)}
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    stageWrap: { alignItems: "center", position: "relative" },
    atmosphereWrap: { position: "absolute" },
    wrap: { position: "relative" },
    fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    bloomFar: { position: "absolute", backgroundColor: "rgba(0,234,255,0.035)" },
    bloomOuter: { position: "absolute", backgroundColor: "rgba(0,234,255,0.06)" },
    bloomInner: { position: "absolute", backgroundColor: "rgba(0,234,255,0.1)" },
    bloomBoost: { position: "absolute", backgroundColor: theme_1.colors.cyan },
    housingOuterShade: {
        position: "absolute",
        borderWidth: 2,
        borderColor: "rgba(0,234,255,0.14)",
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
    housingChamfer: {
        position: "absolute",
        borderWidth: 1.5,
        borderColor: "rgba(191,233,255,0.42)",
    },
    housingRing: { position: "absolute", borderColor: "rgba(0,234,255,0.4)" },
    bolt: {
        position: "absolute",
        backgroundColor: "#0e1c33",
        borderWidth: 0.5,
        borderColor: "rgba(0,234,255,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    boltHighlight: {
        width: "35%",
        height: "35%",
        borderRadius: 9999,
        backgroundColor: "rgba(200,240,255,0.7)",
    },
    led: { position: "absolute", backgroundColor: theme_1.colors.cyanSoft },
    orbitDot: {
        position: "absolute",
        backgroundColor: theme_1.colors.cyanSoft,
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.95,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
    },
    calDot: {
        position: "absolute",
        backgroundColor: theme_1.colors.cyan,
        shadowColor: theme_1.colors.cyan,
        shadowOpacity: 0.8,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 0 },
    },
    ripple: {
        position: "absolute",
        borderWidth: 1.3,
        borderColor: "rgba(0,234,255,0.55)",
        backgroundColor: "transparent",
    },
    flickerDot: { position: "absolute", backgroundColor: "#ffffff" },
    errorOverlay: { position: "absolute", backgroundColor: "#ffb300" },
    flareDot: { position: "absolute", backgroundColor: "#ffffff" },
    flareDotSm: { position: "absolute", backgroundColor: "#ffffff" },
    glassSweepClip: { position: "absolute", top: 0, left: 0, overflow: "hidden" },
    glassSweepBand: { position: "absolute", left: 0 },
    floorWrap: { marginTop: -6, alignItems: "center" },
    platformStage: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: -4,
    },
    platformGlow: {
        position: "absolute",
        backgroundColor: "rgba(0,234,255,0.12)",
    },
    platformPerspective: {
        alignItems: "center",
        justifyContent: "center",
        transform: [{ perspective: 700 }, { rotateX: "68deg" }],
    },
    platformShadow: {
        position: "absolute",
        bottom: -6,
        backgroundColor: "rgba(0,0,0,0.45)",
        borderRadius: 9999,
    },
});
exports.default = ArcReactorMobile;

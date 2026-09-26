"use strict";
// ReactorStageBackdrop.tsx — Phase A: expanded to match the desktop's
// .stage-backdrop more closely. Now renders 4 oversized rings (was 2)
// plus crosshairs plus a rotating targeting-glyph reticle, all larger
// than the reactor itself, sitting behind it in the reactor stage.
//
// Every Animated.Value via useMemo (React 19 safe). No react-native-svg
// used here — pure View/border geometry, same as before.
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("react-native");
var useReducedMotion_1 = require("../hooks/useReducedMotion");
function ReactorStageBackdrop(_a) {
    var _b = _a.size, size = _b === void 0 ? 320 : _b;
    var reducedMotion = (0, useReducedMotion_1.useReducedMotion)();
    var rotateOuter = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rotateDotted = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rotateCalibration = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    var rotateReticle = (0, react_1.useMemo)(function () { return new react_native_1.Animated.Value(0); }, []);
    (0, react_1.useEffect)(function () {
        if (reducedMotion)
            return undefined;
        var spinLoop = function (value, duration) {
            return react_native_1.Animated.loop(react_native_1.Animated.timing(value, { toValue: 1, duration: duration, easing: react_native_1.Easing.linear, useNativeDriver: true }));
        };
        var loopOuter = spinLoop(rotateOuter, 40000);
        var loopDotted = spinLoop(rotateDotted, 55000);
        var loopCalibration = spinLoop(rotateCalibration, 30000);
        var loopReticle = spinLoop(rotateReticle, 45000);
        loopOuter.start();
        loopDotted.start();
        loopCalibration.start();
        loopReticle.start();
        return function () {
            loopOuter.stop();
            loopDotted.stop();
            loopCalibration.stop();
            loopReticle.stop();
        };
    }, [reducedMotion, rotateOuter, rotateDotted, rotateCalibration, rotateReticle]);
    var spinOuter = (0, react_1.useMemo)(function () { return rotateOuter.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); }, [rotateOuter]);
    var spinDotted = (0, react_1.useMemo)(function () { return rotateDotted.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }); }, [rotateDotted]);
    var spinCalibration = (0, react_1.useMemo)(function () { return rotateCalibration.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); }, [rotateCalibration]);
    var spinReticle = (0, react_1.useMemo)(function () { return rotateReticle.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }); }, [rotateReticle]);
    var outer = size;
    var dotted = size * 0.82;
    var calibration = size * 0.66;
    var reticle = size * 0.5;
    return (<react_native_1.View style={[styles.wrap, { width: outer, height: outer }]} pointerEvents="none">
      {/* Ring 1 — outer solid, slow */}
      <react_native_1.Animated.View style={[styles.ring, styles.ringOuter, { width: outer, height: outer, borderRadius: outer / 2, transform: [{ rotate: spinOuter }] }]}/>
      {/* Ring 2 — dotted, slower, counter-direction */}
      <react_native_1.Animated.View style={[styles.ring, styles.ringDotted, { width: dotted, height: dotted, borderRadius: dotted / 2, transform: [{ rotate: spinDotted }] }]}/>
      {/* Ring 3 — calibration dashed */}
      <react_native_1.Animated.View style={[styles.ring, styles.ringCalibration, { width: calibration, height: calibration, borderRadius: calibration / 2, transform: [{ rotate: spinCalibration }] }]}/>
      {/* Ring 4 — targeting reticle: cross-hair ring, counter-direction */}
      <react_native_1.Animated.View style={[styles.reticleWrap, { width: reticle, height: reticle, transform: [{ rotate: spinReticle }] }]}>
        <react_native_1.View style={styles.reticleRing}/>
        <react_native_1.View style={styles.reticleTickTop}/>
        <react_native_1.View style={styles.reticleTickBottom}/>
        <react_native_1.View style={styles.reticleTickLeft}/>
        <react_native_1.View style={styles.reticleTickRight}/>
      </react_native_1.Animated.View>

      {/* Static crosshair lines spanning the whole stage */}
      <react_native_1.View style={[styles.crosshairH, { width: outer * 1.1 }]}/>
      <react_native_1.View style={[styles.crosshairV, { height: outer * 1.1 }]}/>
    </react_native_1.View>);
}
var styles = react_native_1.StyleSheet.create({
    wrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
    },
    ringOuter: {
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.14)',
    },
    ringDotted: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,234,255,0.2)',
    },
    ringCalibration: {
        borderWidth: 1,
        borderStyle: 'dotted',
        borderColor: 'rgba(0,234,255,0.28)',
    },
    reticleWrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reticleRing: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: 'rgba(0,234,255,0.22)',
    },
    reticleTickTop: {
        position: 'absolute',
        top: -6,
        width: 1.5,
        height: 12,
        backgroundColor: 'rgba(0,234,255,0.4)',
    },
    reticleTickBottom: {
        position: 'absolute',
        bottom: -6,
        width: 1.5,
        height: 12,
        backgroundColor: 'rgba(0,234,255,0.4)',
    },
    reticleTickLeft: {
        position: 'absolute',
        left: -6,
        width: 12,
        height: 1.5,
        backgroundColor: 'rgba(0,234,255,0.4)',
    },
    reticleTickRight: {
        position: 'absolute',
        right: -6,
        width: 12,
        height: 1.5,
        backgroundColor: 'rgba(0,234,255,0.4)',
    },
    crosshairH: {
        position: 'absolute',
        height: 1,
        backgroundColor: 'rgba(0,234,255,0.12)',
    },
    crosshairV: {
        position: 'absolute',
        width: 1,
        backgroundColor: 'rgba(0,234,255,0.12)',
    },
});
exports.default = ReactorStageBackdrop;

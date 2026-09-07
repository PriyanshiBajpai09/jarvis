// ReactorStageBackdrop.tsx — Phase A: expanded to match the desktop's
// .stage-backdrop more closely. Now renders 4 oversized rings (was 2)
// plus crosshairs plus a rotating targeting-glyph reticle, all larger
// than the reactor itself, sitting behind it in the reactor stage.
//
// Every Animated.Value via useMemo (React 19 safe). No react-native-svg
// used here — pure View/border geometry, same as before.

import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ReactorStageBackdropProps {
  size?: number;
}

function ReactorStageBackdrop({ size = 320 }: ReactorStageBackdropProps) {
  const reducedMotion = useReducedMotion();

  const rotateOuter = useMemo(() => new Animated.Value(0), []);
  const rotateDotted = useMemo(() => new Animated.Value(0), []);
  const rotateCalibration = useMemo(() => new Animated.Value(0), []);
  const rotateReticle = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const spinLoop = (value: Animated.Value, duration: number) =>
      Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));

    const loopOuter = spinLoop(rotateOuter, 40000);
    const loopDotted = spinLoop(rotateDotted, 55000);
    const loopCalibration = spinLoop(rotateCalibration, 30000);
    const loopReticle = spinLoop(rotateReticle, 45000);

    loopOuter.start();
    loopDotted.start();
    loopCalibration.start();
    loopReticle.start();

    return () => {
      loopOuter.stop();
      loopDotted.stop();
      loopCalibration.stop();
      loopReticle.stop();
    };
  }, [reducedMotion, rotateOuter, rotateDotted, rotateCalibration, rotateReticle]);

  const spinOuter = useMemo(() => rotateOuter.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [rotateOuter]);
  const spinDotted = useMemo(() => rotateDotted.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }), [rotateDotted]);
  const spinCalibration = useMemo(() => rotateCalibration.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [rotateCalibration]);
  const spinReticle = useMemo(() => rotateReticle.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }), [rotateReticle]);

  const outer = size;
  const dotted = size * 0.82;
  const calibration = size * 0.66;
  const reticle = size * 0.5;

  return (
    <View style={[styles.wrap, { width: outer, height: outer }]} pointerEvents="none">
      {/* Ring 1 — outer solid, slow */}
      <Animated.View
        style={[styles.ring, styles.ringOuter, { width: outer, height: outer, borderRadius: outer / 2, transform: [{ rotate: spinOuter }] }]}
      />
      {/* Ring 2 — dotted, slower, counter-direction */}
      <Animated.View
        style={[styles.ring, styles.ringDotted, { width: dotted, height: dotted, borderRadius: dotted / 2, transform: [{ rotate: spinDotted }] }]}
      />
      {/* Ring 3 — calibration dashed */}
      <Animated.View
        style={[styles.ring, styles.ringCalibration, { width: calibration, height: calibration, borderRadius: calibration / 2, transform: [{ rotate: spinCalibration }] }]}
      />
      {/* Ring 4 — targeting reticle: cross-hair ring, counter-direction */}
      <Animated.View
        style={[styles.reticleWrap, { width: reticle, height: reticle, transform: [{ rotate: spinReticle }] }]}
      >
        <View style={styles.reticleRing} />
        <View style={styles.reticleTickTop} />
        <View style={styles.reticleTickBottom} />
        <View style={styles.reticleTickLeft} />
        <View style={styles.reticleTickRight} />
      </Animated.View>

      {/* Static crosshair lines spanning the whole stage */}
      <View style={[styles.crosshairH, { width: outer * 1.1 }]} />
      <View style={[styles.crosshairV, { height: outer * 1.1 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
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

export default ReactorStageBackdrop;
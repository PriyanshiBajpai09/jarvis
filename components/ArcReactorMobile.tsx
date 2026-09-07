// ArcReactorMobile.tsx — Phase 12 refinements:
//   - default size trimmed 260 -> 240 (~8%) for the Home Screen (Priority 4).
//   - new `floorIntensity` prop (0-1) softens the light-cone/floor-glow
//     opacity without changing geometry — lets BootSequenceMobile request
//     a subtler "holographic cone" instead of a heavy spotlight
//     (Priority 1) while Home Screen keeps the default full intensity.
//   - stronger radar sweep wedge, brighter orbit-dot glow, and a static
//     (non-rotating) pair of glass-reflection arcs for "layered
//     reflections" (Priority 4).
//   - all 8 rotating ring layers, LEDs, ripples, bolts, core breathe/
//     flicker, lens flare, and floor-beam/ellipse geometry preserved.
//
// Every Animated.Value / interpolation via useMemo (React 19 safe).
// No Animated.createAnimatedComponent() on react-native-svg primitives.

import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

const VIEWBOX_SIZE = 200;
const CENTER = 100;
const DEG_TO_RAD = Math.PI / 180;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx: number, cy: number, rInner: number, rOuter: number, start: number, end: number) {
  const outerStart = polar(cx, cy, rOuter, end);
  const outerEnd = polar(cx, cy, rOuter, start);
  const innerEnd = polar(cx, cy, rInner, start);
  const innerStart = polar(cx, cy, rInner, end);
  const largeArc = end - start <= 180 ? 0 : 1;
  return [
    'M', outerStart.x, outerStart.y,
    'A', rOuter, rOuter, 0, largeArc, 0, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', rInner, rInner, 0, largeArc, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const largeArc = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

const SEGMENT_COUNT = 12;
const GAP = 5;
const SPAN = 360 / SEGMENT_COUNT - GAP;

const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const start = i * (360 / SEGMENT_COUNT) + GAP / 2;
  const end = start + SPAN;
  return { key: `seg-${i}`, d: segmentPath(CENTER, CENTER, 58, 86, start, end) };
});

const ticks = Array.from({ length: 36 }, (_, i) => {
  const angle = i * 10;
  const isMajor = angle % 30 === 0;
  const outer = polar(CENTER, CENTER, 42, angle);
  const inner = polar(CENTER, CENTER, isMajor ? 34 : 38, angle);
  return { key: `tick-${i}`, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, isMajor };
});

const turbineBlades = Array.from({ length: 20 }, (_, i) => {
  const angle = (360 / 20) * i;
  const outer = polar(CENTER, CENTER, 48, angle);
  const inner = polar(CENTER, CENTER, 40, angle + 5);
  return { key: `blade-${i}`, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y };
});

const bolts = Array.from({ length: 12 }, (_, i) => {
  const pos = polar(CENTER, CENTER, 95, i * 30);
  return { key: `bolt-${i}`, dx: pos.x - CENTER, dy: pos.y - CENTER };
});

const leds = Array.from({ length: 16 }, (_, i) => {
  const pos = polar(CENTER, CENTER, 79, i * 22.5);
  return { key: `led-${i}`, dx: pos.x - CENTER, dy: pos.y - CENTER, delay: (i % 6) * 380 };
});

const orbitDots = Array.from({ length: 6 }, (_, i) => {
  const pos = polar(CENTER, CENTER, 91, i * 60);
  return { key: `orbit-${i}`, dx: pos.x - CENTER, dy: pos.y - CENTER };
});

const calibrationDots = Array.from({ length: 10 }, (_, i) => {
  const pos = polar(CENTER, CENTER, 71, i * 36);
  return { key: `caldot-${i}`, dx: pos.x - CENTER, dy: pos.y - CENTER };
});

const radarWedgeD = arcPath(CENTER, CENTER, 88, 0, 32);

const calibrationDashes = Array.from({ length: 18 }, (_, i) => {
  const start = i * 20;
  return { key: `dash-${i}`, d: arcPath(CENTER, CENTER, 98, start, start + 8) };
});

const hudArcs = [
  { key: 'hud-a', d: arcPath(CENTER, CENTER, 68, 10, 95) },
  { key: 'hud-b', d: arcPath(CENTER, CENTER, 68, 130, 200) },
  { key: 'hud-c', d: arcPath(CENTER, CENTER, 68, 235, 290) },
  { key: 'hud-d', d: arcPath(CENTER, CENTER, 68, 315, 350) },
];

const outerDashes = Array.from({ length: 10 }, (_, i) => {
  const start = i * 36;
  return { key: `outer-dash-${i}`, d: arcPath(CENTER, CENTER, 96.5, start, start + 14) };
});

const beamTrapezoidD = 'M 70 4 L 130 4 L 112 150 L 88 150 Z';

// NEW — static (non-rotating) glass reflection highlight arcs, layered
// beneath the rotating rings, for a subtle glassy sheen.
const reflectionArcA = arcPath(CENTER, CENTER, 90, 200, 258);
const reflectionArcB = arcPath(CENTER, CENTER, 90, 18, 54);

interface ArcReactorMobileProps {
  size?: number;
  showFloor?: boolean;
  bloomBoost?: number;
  /** 0-1 multiplier softening the light-cone/floor-glow opacity. Default 1 (full). */
  floorIntensity?: number;
}

// Priority 4: default trimmed from 260 -> 240 (~8% smaller) for Home Screen.
function ArcReactorMobile({ size = 240, showFloor = true, bloomBoost = 0, floorIntensity = 1 }: ArcReactorMobileProps) {
  const reducedMotion = useReducedMotion();
  const scale = size / VIEWBOX_SIZE;

  const segRotation = useMemo(() => new Animated.Value(0), []);
  const tickRotation = useMemo(() => new Animated.Value(0), []);
  const turbineRotation = useMemo(() => new Animated.Value(0), []);
  const orbitRotation = useMemo(() => new Animated.Value(0), []);
  const calibrationDotRotation = useMemo(() => new Animated.Value(0), []);
  const radarRotation = useMemo(() => new Animated.Value(0), []);
  const calibrationRotation = useMemo(() => new Animated.Value(0), []);
  const hudArcRotation = useMemo(() => new Animated.Value(0), []);
  const outerDashRotation = useMemo(() => new Animated.Value(0), []);

  const coreBreathe = useMemo(() => new Animated.Value(0), []);
  const coreFlicker = useMemo(() => new Animated.Value(0), []);
  const flareTwinkle = useMemo(() => new Animated.Value(0), []);
  const rippleA = useMemo(() => new Animated.Value(0), []);
  const rippleB = useMemo(() => new Animated.Value(0), []);
  const rippleC = useMemo(() => new Animated.Value(0), []);
  const ledValues = useMemo(() => leds.map(() => new Animated.Value(0.25)), []);
  const coneFlicker = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const running: Animated.CompositeAnimation[] = [];
    const spinLoop = (v: Animated.Value, d: number) =>
      Animated.loop(Animated.timing(v, { toValue: 1, duration: d, easing: Easing.linear, useNativeDriver: true }));

    const segLoop = spinLoop(segRotation, 14000);
    const tickLoop = spinLoop(tickRotation, 9000);
    const turbineLoop = spinLoop(turbineRotation, 11000);
    const orbitLoop = spinLoop(orbitRotation, 6000);
    const calDotLoop = spinLoop(calibrationDotRotation, 15000);
    const radarLoop = spinLoop(radarRotation, 4000);
    const calibrationLoop = spinLoop(calibrationRotation, 26000);
    const hudArcLoop = spinLoop(hudArcRotation, 20000);
    const outerDashLoop = spinLoop(outerDashRotation, 34000);

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coreBreathe, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(coreBreathe, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coreFlicker, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(coreFlicker, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const flareLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flareTwinkle, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flareTwinkle, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const coneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coneFlicker, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(coneFlicker, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    function rippleLoop(v: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 3600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    }
    const rA = rippleLoop(rippleA, 0);
    const rB = rippleLoop(rippleB, 1200);
    const rC = rippleLoop(rippleC, 2400);

    const ledLoops = ledValues.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(leds[i].delay),
          Animated.timing(v, { toValue: 1, duration: 220, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 400, useNativeDriver: true }),
          Animated.delay(2600),
        ])
      )
    );

    running.push(
      segLoop, tickLoop, turbineLoop, orbitLoop, calDotLoop, radarLoop, calibrationLoop, hudArcLoop, outerDashLoop,
      breatheLoop, flickerLoop, flareLoop, coneLoop, rA, rB, rC, ...ledLoops
    );
    running.forEach((a) => a.start());
    return () => running.forEach((a) => a.stop());
  }, [
    reducedMotion, segRotation, tickRotation, turbineRotation, orbitRotation, calibrationDotRotation, radarRotation,
    calibrationRotation, hudArcRotation, outerDashRotation, coreBreathe, coreFlicker, flareTwinkle,
    coneFlicker, rippleA, rippleB, rippleC, ledValues,
  ]);

  const segSpin = useMemo(() => segRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [segRotation]);
  const tickSpin = useMemo(() => tickRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }), [tickRotation]);
  const turbineSpin = useMemo(() => turbineRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [turbineRotation]);
  const orbitSpin = useMemo(() => orbitRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }), [orbitRotation]);
  const calDotSpin = useMemo(() => calibrationDotRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [calibrationDotRotation]);
  const radarSpin = useMemo(() => radarRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [radarRotation]);
  const calibrationSpin = useMemo(() => calibrationRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }), [calibrationRotation]);
  const hudArcSpin = useMemo(() => hudArcRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [hudArcRotation]);
  const outerDashSpin = useMemo(() => outerDashRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }), [outerDashRotation]);

  const coreScale = useMemo(() => coreBreathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }), [coreBreathe]);
  const coreOpacity = useMemo(() => coreBreathe.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }), [coreBreathe]);
  const flickerScale = useMemo(() => coreFlicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }), [coreFlicker]);
  const flareOpacity = useMemo(() => flareTwinkle.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] }), [flareTwinkle]);
  const coneOpacity = useMemo(
    () => coneFlicker.interpolate({ inputRange: [0, 1], outputRange: [0.32 * floorIntensity, 0.6 * floorIntensity] }),
    [coneFlicker, floorIntensity]
  );

  const rippleScaleA = useMemo(() => rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }), [rippleA]);
  const rippleOpacityA = useMemo(() => rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }), [rippleA]);
  const rippleScaleB = useMemo(() => rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }), [rippleB]);
  const rippleOpacityB = useMemo(() => rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }), [rippleB]);
  const rippleScaleC = useMemo(() => rippleC.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }), [rippleC]);
  const rippleOpacityC = useMemo(() => rippleC.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }), [rippleC]);

  const rippleDiameter = 44 * scale;
  const boltSize = 5 * scale;
  const ledSize = 3.2 * scale;
  const flickerDiameter = 14 * scale;
  const flareSize = 4.5 * scale;
  const orbitDotSize = 4.5 * scale;
  const calDotSize = 2.6 * scale;

  const bloomExtra = Math.max(0, Math.min(1, bloomBoost));
  const beamHeight = size * 0.85;
  const shadowWidth = size * 0.62;
  const beamStopA = Math.min(1, 0.4 * floorIntensity);
  const beamStopB = Math.min(1, 0.12 * floorIntensity);
  const floorStopA = Math.min(1, 0.32 * floorIntensity);
  const floorStopB = Math.min(1, 0.1 * floorIntensity);

  return (
    <View style={styles.stageWrap}>
      <View style={[styles.wrap, { width: size, height: size }]}>
        {/* Layered bloom halo */}
        <View
          style={[styles.bloomFar, { width: size * 2.1, height: size * 2.1, borderRadius: (size * 2.1) / 2, top: -(size * 0.55), left: -(size * 0.55) }]}
          pointerEvents="none"
        />
        <View
          style={[styles.bloomOuter, { width: size * 1.75, height: size * 1.75, borderRadius: (size * 1.75) / 2, top: -(size * 0.375), left: -(size * 0.375) }]}
          pointerEvents="none"
        />
        <View
          style={[styles.bloomInner, { width: size * 1.3, height: size * 1.3, borderRadius: (size * 1.3) / 2, top: -(size * 0.15), left: -(size * 0.15) }]}
          pointerEvents="none"
        />
        {bloomExtra > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.bloomBoost,
              { width: size * 1.5, height: size * 1.5, borderRadius: (size * 1.5) / 2, top: -(size * 0.25), left: -(size * 0.25), opacity: 0.28 * bloomExtra },
            ]}
          />
        )}

        {/* Static housing */}
        <View
          style={[styles.housingOuterShade, { width: 199 * scale, height: 199 * scale, borderRadius: (199 * scale) / 2, top: (size - 199 * scale) / 2, left: (size - 199 * scale) / 2 }]}
          pointerEvents="none"
        />
        <View
          style={[styles.housingChamfer, { width: 194 * scale, height: 194 * scale, borderRadius: (194 * scale) / 2, top: (size - 194 * scale) / 2, left: (size - 194 * scale) / 2 }]}
          pointerEvents="none"
        />
        <View
          style={[styles.housingRing, { width: 188 * scale, height: 188 * scale, borderRadius: (188 * scale) / 2, top: (size - 188 * scale) / 2, left: (size - 188 * scale) / 2, borderWidth: 3.2 * scale }]}
          pointerEvents="none"
        />

        {/* NEW — static glass reflection arcs ("layered reflections") */}
        <View style={styles.fill} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Path d={reflectionArcA} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={3} strokeLinecap="round" opacity={0.55} />
            <Path d={reflectionArcB} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} strokeLinecap="round" opacity={0.45} />
          </Svg>
        </View>

        {bolts.map((b) => (
          <View
            key={b.key}
            style={[styles.bolt, { width: boltSize, height: boltSize, borderRadius: boltSize / 2, top: size / 2 + b.dy * scale - boltSize / 2, left: size / 2 + b.dx * scale - boltSize / 2 }]}
            pointerEvents="none"
          />
        ))}

        <Animated.View style={[styles.fill, { transform: [{ rotate: outerDashSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {outerDashes.map((d) => (
              <Path key={d.key} d={d.d} fill="none" stroke="rgba(0,234,255,0.18)" strokeWidth={1.1} strokeLinecap="round" />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: calibrationSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {calibrationDashes.map((d) => (
              <Path key={d.key} d={d.d} fill="none" stroke="rgba(0,234,255,0.24)" strokeWidth={1.5} strokeLinecap="round" />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: hudArcSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {hudArcs.map((a) => (
              <Path key={a.key} d={a.d} fill="none" stroke={colors.cyanSoft} strokeWidth={2.1} strokeLinecap="round" opacity={0.8} />
            ))}
          </Svg>
        </Animated.View>

        {/* Radar sweep wedge — Priority 4: stronger */}
        <Animated.View style={[styles.fill, { transform: [{ rotate: radarSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Path d={radarWedgeD} fill="none" stroke={colors.cyanSoft} strokeWidth={3.2} strokeLinecap="round" opacity={0.8} />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: segSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {segments.map((s) => (
              <Path key={s.key} d={s.d} fill="rgba(0,234,255,0.19)" stroke="rgba(0,234,255,0.68)" strokeWidth={1.7} />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: tickSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Circle cx={CENTER} cy={CENTER} r={42} fill="none" stroke="rgba(0,234,255,0.25)" strokeWidth={0.75} />
            {ticks.map((t) => (
              <Line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.isMajor ? colors.cyan : 'rgba(0,234,255,0.4)'} strokeWidth={t.isMajor ? 1.4 : 0.7} />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: turbineSpin }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            {turbineBlades.map((b) => (
              <Line key={b.key} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="rgba(0,234,255,0.32)" strokeWidth={1.1} />
            ))}
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: orbitSpin }] }]} pointerEvents="none">
          {orbitDots.map((o) => (
            <View
              key={o.key}
              style={[styles.orbitDot, { width: orbitDotSize, height: orbitDotSize, borderRadius: orbitDotSize / 2, top: size / 2 + o.dy * scale - orbitDotSize / 2, left: size / 2 + o.dx * scale - orbitDotSize / 2 }]}
            />
          ))}
        </Animated.View>

        <Animated.View style={[styles.fill, { transform: [{ rotate: calDotSpin }] }]} pointerEvents="none">
          {calibrationDots.map((c) => (
            <View
              key={c.key}
              style={[styles.calDot, { width: calDotSize, height: calDotSize, borderRadius: calDotSize / 2, top: size / 2 + c.dy * scale - calDotSize / 2, left: size / 2 + c.dx * scale - calDotSize / 2 }]}
            />
          ))}
        </Animated.View>

        {leds.map((l, i) => (
          <Animated.View
            key={l.key}
            pointerEvents="none"
            style={[styles.led, { width: ledSize, height: ledSize, borderRadius: ledSize / 2, top: size / 2 + l.dy * scale - ledSize / 2, left: size / 2 + l.dx * scale - ledSize / 2, opacity: ledValues[i] }]}
          />
        ))}

        <Animated.View pointerEvents="none" style={[styles.ripple, { width: rippleDiameter, height: rippleDiameter, borderRadius: rippleDiameter / 2, top: (size - rippleDiameter) / 2, left: (size - rippleDiameter) / 2, opacity: rippleOpacityA, transform: [{ scale: rippleScaleA }] }]} />
        <Animated.View pointerEvents="none" style={[styles.ripple, { width: rippleDiameter, height: rippleDiameter, borderRadius: rippleDiameter / 2, top: (size - rippleDiameter) / 2, left: (size - rippleDiameter) / 2, opacity: rippleOpacityB, transform: [{ scale: rippleScaleB }] }]} />
        <Animated.View pointerEvents="none" style={[styles.ripple, { width: rippleDiameter, height: rippleDiameter, borderRadius: rippleDiameter / 2, top: (size - rippleDiameter) / 2, left: (size - rippleDiameter) / 2, opacity: rippleOpacityC, transform: [{ scale: rippleScaleC }] }]} />

        <Animated.View pointerEvents="none" style={[styles.fill, { transform: [{ scale: coreScale }], opacity: coreOpacity }]}>
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id="mHalo" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.cyan} stopOpacity={Math.min(1, 0.88 + bloomExtra * 0.12)} />
                <Stop offset="60%" stopColor={colors.cyan} stopOpacity={0.22 + bloomExtra * 0.18} />
                <Stop offset="100%" stopColor={colors.cyan} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={CENTER} cy={CENTER} r={34 + bloomExtra * 8} fill="url(#mHalo)" />
          </Svg>
        </Animated.View>

        <View style={styles.fill} pointerEvents="none">
          <Svg width={size} height={size} viewBox="0 0 200 200">
            <Defs>
              <RadialGradient id="mCore" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ffffff" />
                <Stop offset="30%" stopColor="#aef6ff" />
                <Stop offset="65%" stopColor={colors.cyan} />
                <Stop offset="100%" stopColor={colors.neonBlueDeep} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={CENTER} cy={CENTER} r={18} fill="url(#mCore)" />
          </Svg>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[styles.flickerDot, { width: flickerDiameter, height: flickerDiameter, borderRadius: flickerDiameter / 2, top: (size - flickerDiameter) / 2, left: (size - flickerDiameter) / 2, transform: [{ scale: flickerScale }] }]}
        />

        <Animated.View
          pointerEvents="none"
          style={[styles.flareDot, { width: flareSize, height: flareSize, borderRadius: flareSize / 2, top: size / 2 - 15 * scale - flareSize / 2, left: size / 2 - 13 * scale - flareSize / 2, opacity: flareOpacity }]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.flareDotSm, { width: flareSize * 0.5, height: flareSize * 0.5, borderRadius: (flareSize * 0.5) / 2, top: size / 2 + 20 * scale, left: size / 2 + 24 * scale, opacity: flareOpacity }]}
        />
      </View>

      {showFloor && (
        <Animated.View style={[styles.floorWrap, { width: shadowWidth, height: beamHeight, opacity: coneOpacity }]} pointerEvents="none">
          <Svg width={shadowWidth} height={beamHeight} viewBox="0 0 200 150">
            <Defs>
              <SvgLinearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={colors.cyan} stopOpacity={beamStopA} />
                <Stop offset="60%" stopColor={colors.cyan} stopOpacity={beamStopB} />
                <Stop offset="100%" stopColor={colors.cyan} stopOpacity={0} />
              </SvgLinearGradient>
              <RadialGradient id="floorGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.cyan} stopOpacity={floorStopA} />
                <Stop offset="70%" stopColor={colors.cyan} stopOpacity={floorStopB} />
                <Stop offset="100%" stopColor={colors.cyan} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Path d={beamTrapezoidD} fill="url(#beamGrad)" />
            <Circle cx={100} cy={140} r={72} fill="url(#floorGrad)" transform="scale(1, 0.32) translate(0, 300)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stageWrap: { alignItems: 'center' },
  wrap: { position: 'relative' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bloomFar: { position: 'absolute', backgroundColor: 'rgba(0,234,255,0.035)' },
  bloomOuter: { position: 'absolute', backgroundColor: 'rgba(0,234,255,0.06)' },
  bloomInner: { position: 'absolute', backgroundColor: 'rgba(0,234,255,0.1)' },
  bloomBoost: { position: 'absolute', backgroundColor: colors.cyan },
  housingOuterShade: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(0,234,255,0.14)' },
  housingChamfer: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(191,233,255,0.42)' },
  housingRing: { position: 'absolute', borderColor: 'rgba(0,234,255,0.36)' },
  bolt: { position: 'absolute', backgroundColor: '#0e1c33', borderWidth: 0.5, borderColor: 'rgba(0,234,255,0.45)' },
  led: { position: 'absolute', backgroundColor: colors.cyanSoft },
  orbitDot: {
    position: 'absolute',
    backgroundColor: colors.cyanSoft,
    shadowColor: colors.cyan,
    shadowOpacity: 0.95,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  calDot: {
    position: 'absolute',
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  ripple: { position: 'absolute', borderWidth: 1.3, borderColor: 'rgba(0,234,255,0.55)', backgroundColor: 'transparent' },
  flickerDot: { position: 'absolute', backgroundColor: '#ffffff' },
  flareDot: { position: 'absolute', backgroundColor: '#ffffff' },
  flareDotSm: { position: 'absolute', backgroundColor: '#ffffff' },
  floorWrap: { marginTop: -6, alignItems: 'center' },
});

export default ArcReactorMobile;
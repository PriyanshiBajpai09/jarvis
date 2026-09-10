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

import React, { useEffect, useMemo } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";

const VIEWBOX_SIZE = 200;
const CENTER = 100;
const DEG_TO_RAD = Math.PI / 180;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  start: number,
  end: number,
): string {
  const outerStart = polar(cx, cy, rOuter, end);
  const outerEnd = polar(cx, cy, rOuter, start);
  const innerEnd = polar(cx, cy, rInner, start);
  const innerStart = polar(cx, cy, rInner, end);
  const largeArc = end - start <= 180 ? 0 : 1;
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

function arcPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const s = polar(cx, cy, r, end);
  const e = polar(cx, cy, r, start);
  const largeArc = end - start <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

/* ---------------- static geometry, computed once at module load ---------------- */

const SEGMENT_COUNT = 12;
const GAP = 5;
const SPAN = 360 / SEGMENT_COUNT - GAP;

const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const start = i * (360 / SEGMENT_COUNT) + GAP / 2;
  const end = start + SPAN;
  return {
    key: `seg-${i}`,
    d: segmentPath(CENTER, CENTER, 58, 86, start, end),
  };
});

const ticks = Array.from({ length: 36 }, (_, i) => {
  const angle = i * 10;
  const isMajor = angle % 30 === 0;
  const outer = polar(CENTER, CENTER, 42, angle);
  const inner = polar(CENTER, CENTER, isMajor ? 34 : 38, angle);
  return {
    key: `tick-${i}`,
    x1: outer.x,
    y1: outer.y,
    x2: inner.x,
    y2: inner.y,
    isMajor,
  };
});

const turbineBlades = Array.from({ length: 20 }, (_, i) => {
  const angle = (360 / 20) * i;
  const outer = polar(CENTER, CENTER, 48, angle);
  const inner = polar(CENTER, CENTER, 40, angle + 5);
  return {
    key: `blade-${i}`,
    x1: outer.x,
    y1: outer.y,
    x2: inner.x,
    y2: inner.y,
  };
});

const bolts = Array.from({ length: 12 }, (_, i) => {
  const pos = polar(CENTER, CENTER, 95, i * 30);
  return { key: `bolt-${i}`, dx: pos.x - CENTER, dy: pos.y - CENTER };
});

const leds = Array.from({ length: 16 }, (_, i) => {
  const pos = polar(CENTER, CENTER, 79, i * 22.5);
  return {
    key: `led-${i}`,
    dx: pos.x - CENTER,
    dy: pos.y - CENTER,
    delay: (i % 6) * 380,
  };
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
  { key: "hud-a", d: arcPath(CENTER, CENTER, 68, 10, 95) },
  { key: "hud-b", d: arcPath(CENTER, CENTER, 68, 130, 200) },
  { key: "hud-c", d: arcPath(CENTER, CENTER, 68, 235, 290) },
  { key: "hud-d", d: arcPath(CENTER, CENTER, 68, 315, 350) },
];

const outerDashes = Array.from({ length: 10 }, (_, i) => {
  const start = i * 36;
  return {
    key: `outer-dash-${i}`,
    d: arcPath(CENTER, CENTER, 96.5, start, start + 14),
  };
});

const beamTrapezoidD = "M 70 4 L 130 4 L 112 150 L 88 150 Z";

// Directional lighting arcs — upper-left bright bevel highlight, lower-
// right dark shadow arc — simulate a physical, curved metal surface
// catching light from one direction, rather than a flat painted ring.
const bevelHighlightD = arcPath(CENTER, CENTER, 90, 200, 258);
const bevelShadowD = arcPath(CENTER, CENTER, 90, 18, 76);

// Faint atmosphere ring, larger than the housing, drawn behind
// everything — pure HUD dressing, kept deliberately subtle.
const atmosphereRingA = arcPath(CENTER, CENTER, 118, 0, 360 - 0.01);
const atmosphereRingB = arcPath(CENTER, CENTER, 130, 0, 360 - 0.01);

// Platform ring dashes (used inside the tilted 3D platform).
const platformDashesOuter = Array.from({ length: 24 }, (_, i) => {
  const start = i * 15;
  return { key: `plat-outer-${i}`, d: arcPath(100, 100, 92, start, start + 7) };
});
const platformDashesInner = Array.from({ length: 16 }, (_, i) => {
  const start = i * 22.5;
  return {
    key: `plat-inner-${i}`,
    d: arcPath(100, 100, 70, start, start + 10),
  };
});

export type ReactorActivityState = "idle" | "thinking" | "streaming" | "error";

interface ArcReactorMobileProps {
  size?: number;
  showFloor?: boolean;
  bloomBoost?: number;
  floorIntensity?: number;
  /** Optional — defaults to 'idle'. Not wired to any router/streaming logic here; callers may pass it in a future pass. */
  activityState?: ReactorActivityState;
}

interface CorePulseConfig {
  breatheDuration: number;
  breatheScaleRange: [number, number];
  breatheOpacityRange: [number, number];
  flickerDuration: number;
  flickerScaleRange: [number, number];
}

function getCorePulseConfig(state: ReactorActivityState): CorePulseConfig {
  switch (state) {
    case "thinking":
      return {
        breatheDuration: 900,
        breatheScaleRange: [1, 1.16],
        breatheOpacityRange: [0.7, 1],
        flickerDuration: 1000,
        flickerScaleRange: [1, 1.08],
      };
    case "streaming":
      return {
        breatheDuration: 650,
        breatheScaleRange: [1, 1.2],
        breatheOpacityRange: [0.8, 1],
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

function ArcReactorMobile({
  size = 240,
  showFloor = true,
  bloomBoost = 0,
  floorIntensity = 1,
  activityState = "idle",
}: ArcReactorMobileProps) {
  const reducedMotion = useReducedMotion();
  const scale = size / VIEWBOX_SIZE;
  const pulseConfig = getCorePulseConfig(activityState);

  // --- rotation drivers (unchanged geometry/timing from prior pass) ---
  const segRotation = useMemo(() => new Animated.Value(0), []);
  const tickRotation = useMemo(() => new Animated.Value(0), []);
  const turbineRotation = useMemo(() => new Animated.Value(0), []);
  const orbitRotation = useMemo(() => new Animated.Value(0), []);
  const calibrationDotRotation = useMemo(() => new Animated.Value(0), []);
  const radarRotation = useMemo(() => new Animated.Value(0), []);
  const calibrationRotation = useMemo(() => new Animated.Value(0), []);
  const hudArcRotation = useMemo(() => new Animated.Value(0), []);
  const outerDashRotation = useMemo(() => new Animated.Value(0), []);
  const atmosphereRotation = useMemo(() => new Animated.Value(0), []);
  const platformRotation = useMemo(() => new Animated.Value(0), []);

  // --- core / bloom / floor drivers ---
  const coreBreathe = useMemo(() => new Animated.Value(0), []);
  const coreFlicker = useMemo(() => new Animated.Value(0), []);
  const errorFlicker = useMemo(() => new Animated.Value(0), []);
  const flareTwinkle = useMemo(() => new Animated.Value(0), []);
  const rippleA = useMemo(() => new Animated.Value(0), []);
  const rippleB = useMemo(() => new Animated.Value(0), []);
  const rippleC = useMemo(() => new Animated.Value(0), []);
  const ledValues = useMemo(() => leds.map(() => new Animated.Value(0.25)), []);
  const coneFlicker = useMemo(() => new Animated.Value(0), []);

  // --- new: glass reflection sweep + continuous hover bob ---
  const glassSweep = useMemo(() => new Animated.Value(0), []);
  const hoverBob = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const running: Animated.CompositeAnimation[] = [];
    const spinLoop = (v: Animated.Value, d: number) =>
      Animated.loop(
        Animated.timing(v, {
          toValue: 1,
          duration: d,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

    running.push(
      spinLoop(segRotation, 14000),
      spinLoop(tickRotation, 9000),
      spinLoop(turbineRotation, 11000),
      spinLoop(orbitRotation, 6000),
      spinLoop(calibrationDotRotation, 15000),
      spinLoop(radarRotation, 4000),
      spinLoop(calibrationRotation, 26000),
      spinLoop(hudArcRotation, 20000),
      spinLoop(outerDashRotation, 34000),
      spinLoop(atmosphereRotation, 55000),
      spinLoop(platformRotation, 40000),
    );

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coreBreathe, {
          toValue: 1,
          duration: pulseConfig.breatheDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coreBreathe, {
          toValue: 0,
          duration: pulseConfig.breatheDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coreFlicker, {
          toValue: 1,
          duration: pulseConfig.flickerDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coreFlicker, {
          toValue: 0,
          duration: pulseConfig.flickerDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const flareLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flareTwinkle, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flareTwinkle, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const coneLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coneFlicker, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(coneFlicker, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const glassSweepLoop = Animated.loop(
      Animated.timing(glassSweep, {
        toValue: 1,
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const hoverBobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverBob, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(hoverBob, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    function rippleLoop(v: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 3600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    }
    const rA = rippleLoop(rippleA, 0);
    const rB = rippleLoop(rippleB, 1200);
    const rC = rippleLoop(rippleC, 2400);

    const ledLoops = ledValues.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(leds[i].delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.25,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(2600),
        ]),
      ),
    );

    running.push(
      breatheLoop,
      flickerLoop,
      flareLoop,
      coneLoop,
      glassSweepLoop,
      hoverBobLoop,
      rA,
      rB,
      rC,
      ...ledLoops,
    );

    if (activityState === "error") {
      running.push(
        Animated.loop(
          Animated.sequence([
            Animated.timing(errorFlicker, {
              toValue: 1,
              duration: 260,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(errorFlicker, {
              toValue: 0,
              duration: 260,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ),
      );
    } else {
      errorFlicker.setValue(0);
    }

    running.forEach((a) => a.start());
    return () => running.forEach((a) => a.stop());
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

  const segSpin = useMemo(
    () =>
      segRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [segRotation],
  );
  const tickSpin = useMemo(
    () =>
      tickRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-360deg"],
      }),
    [tickRotation],
  );
  const turbineSpin = useMemo(
    () =>
      turbineRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [turbineRotation],
  );
  const orbitSpin = useMemo(
    () =>
      orbitRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-360deg"],
      }),
    [orbitRotation],
  );
  const calDotSpin = useMemo(
    () =>
      calibrationDotRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [calibrationDotRotation],
  );
  const radarSpin = useMemo(
    () =>
      radarRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [radarRotation],
  );
  const calibrationSpin = useMemo(
    () =>
      calibrationRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-360deg"],
      }),
    [calibrationRotation],
  );
  const hudArcSpin = useMemo(
    () =>
      hudArcRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [hudArcRotation],
  );
  const outerDashSpin = useMemo(
    () =>
      outerDashRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-360deg"],
      }),
    [outerDashRotation],
  );
  const atmosphereSpin = useMemo(
    () =>
      atmosphereRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-360deg"],
      }),
    [atmosphereRotation],
  );
  const platformSpin = useMemo(
    () =>
      platformRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [platformRotation],
  );

  const coreScale = useMemo(
    () =>
      coreBreathe.interpolate({
        inputRange: [0, 1],
        outputRange: pulseConfig.breatheScaleRange,
      }),
    [coreBreathe, pulseConfig.breatheScaleRange],
  );
  const coreOpacity = useMemo(
    () =>
      coreBreathe.interpolate({
        inputRange: [0, 1],
        outputRange: pulseConfig.breatheOpacityRange,
      }),
    [coreBreathe, pulseConfig.breatheOpacityRange],
  );
  const flickerScale = useMemo(
    () =>
      coreFlicker.interpolate({
        inputRange: [0, 1],
        outputRange: pulseConfig.flickerScaleRange,
      }),
    [coreFlicker, pulseConfig.flickerScaleRange],
  );
  const errorOverlayOpacity = useMemo(
    () =>
      errorFlicker.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
    [errorFlicker],
  );
  const flareOpacity = useMemo(
    () =>
      flareTwinkle.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.85],
      }),
    [flareTwinkle],
  );
  const coneOpacity = useMemo(
    () =>
      coneFlicker.interpolate({
        inputRange: [0, 1],
        outputRange: [0.32 * floorIntensity, 0.6 * floorIntensity],
      }),
    [coneFlicker, floorIntensity],
  );

  const rippleScaleA = useMemo(
    () => rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }),
    [rippleA],
  );
  const rippleOpacityA = useMemo(
    () => rippleA.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
    [rippleA],
  );
  const rippleScaleB = useMemo(
    () => rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }),
    [rippleB],
  );
  const rippleOpacityB = useMemo(
    () => rippleB.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
    [rippleB],
  );
  const rippleScaleC = useMemo(
    () => rippleC.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.9] }),
    [rippleC],
  );
  const rippleOpacityC = useMemo(
    () => rippleC.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0] }),
    [rippleC],
  );

  // Glass sweep: diagonal band travels from off-canvas left to
  // off-canvas right, clipped to the reactor's circular bounds.
  const glassSweepTranslate = useMemo(
    () =>
      glassSweep.interpolate({
        inputRange: [0, 1],
        outputRange: [-size * 0.9, size * 1.1],
      }),
    [glassSweep, size],
  );
  const hoverBobTranslate = useMemo(
    () =>
      hoverBob.interpolate({
        inputRange: [0, 1],
        outputRange: [-Math.max(4, size * 0.025), Math.max(4, size * 0.025)],
      }),
    [hoverBob, size],
  );

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

  const platformSize = size * 0.72;
  const platformGlowSize = size * 0.9;

  return (
    <View style={styles.stageWrap}>
      {/* --- Faint outer atmosphere ring, behind everything --- */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.atmosphereWrap,
          {
            width: size * 1.35,
            height: size * 1.35,
            top: -(size * 0.175),
            left: -(size * 0.175),
            transform: [{ rotate: atmosphereSpin }],
          },
        ]}
      >
        <Svg width={size * 1.35} height={size * 1.35} viewBox="0 0 200 200">
          <Path
            d={atmosphereRingA}
            fill="none"
            stroke="rgba(0,234,255,0.05)"
            strokeWidth={0.6}
          />
          <Path
            d={atmosphereRingB}
            fill="none"
            stroke="rgba(0,234,255,0.03)"
            strokeWidth={0.5}
            strokeDasharray="2,6"
          />
        </Svg>
      </Animated.View>

      {/* --- Reactor body: continuous hover bob wraps everything --- */}
      <Animated.View style={{ transform: [{ translateY: hoverBobTranslate }] }}>
        <View style={[styles.wrap, { width: size, height: size }]}>
          {/* Layered bloom halo */}
          <View
            style={[
              styles.bloomFar,
              {
                width: size * 2.1,
                height: size * 2.1,
                borderRadius: (size * 2.1) / 2,
                top: -(size * 0.55),
                left: -(size * 0.55),
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.bloomOuter,
              {
                width: size * 1.75,
                height: size * 1.75,
                borderRadius: (size * 1.75) / 2,
                top: -(size * 0.375),
                left: -(size * 0.375),
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.bloomInner,
              {
                width: size * 1.3,
                height: size * 1.3,
                borderRadius: (size * 1.3) / 2,
                top: -(size * 0.15),
                left: -(size * 0.15),
              },
            ]}
            pointerEvents="none"
          />
          {bloomExtra > 0 && (
            <View
              pointerEvents="none"
              style={[
                styles.bloomBoost,
                {
                  width: size * 1.5,
                  height: size * 1.5,
                  borderRadius: (size * 1.5) / 2,
                  top: -(size * 0.25),
                  left: -(size * 0.25),
                  opacity: 0.28 * bloomExtra,
                },
              ]}
            />
          )}

          {/* Static housing with metallic rim + directional bevel lighting */}
          <View
            style={[
              styles.housingOuterShade,
              {
                width: 199 * scale,
                height: 199 * scale,
                borderRadius: (199 * scale) / 2,
                top: (size - 199 * scale) / 2,
                left: (size - 199 * scale) / 2,
              },
            ]}
            pointerEvents="none"
          />
          <View style={styles.fill} pointerEvents="none">
            <Svg width={size} height={size} viewBox="0 0 200 200">
              <Defs>
                <SvgLinearGradient
                  id="metallicRim"
                  x1="10%"
                  y1="0%"
                  x2="90%"
                  y2="100%"
                >
                  <Stop offset="0%" stopColor="#dff6ff" stopOpacity={0.7} />
                  <Stop offset="45%" stopColor="#0a1424" stopOpacity={0.9} />
                  <Stop offset="100%" stopColor="#7df9ff" stopOpacity={0.5} />
                </SvgLinearGradient>
              </Defs>
              {/* metallic rim ring */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={97.5}
                fill="none"
                stroke="url(#metallicRim)"
                strokeWidth={3.5}
              />
              {/* directional bevel: bright upper-left, dark lower-right */}
              <Path
                d={bevelHighlightD}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2.6}
                strokeLinecap="round"
              />
              <Path
                d={bevelShadowD}
                fill="none"
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={2.6}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <View
            style={[
              styles.housingChamfer,
              {
                width: 194 * scale,
                height: 194 * scale,
                borderRadius: (194 * scale) / 2,
                top: (size - 194 * scale) / 2,
                left: (size - 194 * scale) / 2,
              },
            ]}
            pointerEvents="none"
          />
          <View
            style={[
              styles.housingRing,
              {
                width: 188 * scale,
                height: 188 * scale,
                borderRadius: (188 * scale) / 2,
                top: (size - 188 * scale) / 2,
                left: (size - 188 * scale) / 2,
                borderWidth: 3.4 * scale,
              },
            ]}
            pointerEvents="none"
          />

          {bolts.map((b) => (
            <View
              key={b.key}
              style={[
                styles.bolt,
                {
                  width: boltSize,
                  height: boltSize,
                  borderRadius: boltSize / 2,
                  top: size / 2 + b.dy * scale - boltSize / 2,
                  left: size / 2 + b.dx * scale - boltSize / 2,
                },
              ]}
              pointerEvents="none"
            >
              <View style={styles.boltHighlight} />
            </View>
          ))}

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: outerDashSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              {outerDashes.map((d) => (
                <Path
                  key={d.key}
                  d={d.d}
                  fill="none"
                  stroke="rgba(0,234,255,0.18)"
                  strokeWidth={1.1}
                  strokeLinecap="round"
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: calibrationSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              {calibrationDashes.map((d) => (
                <Path
                  key={d.key}
                  d={d.d}
                  fill="none"
                  stroke="rgba(0,234,255,0.24)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: hudArcSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              {hudArcs.map((a) => (
                <Path
                  key={a.key}
                  d={a.d}
                  fill="none"
                  stroke={colors.cyanSoft}
                  strokeWidth={2.1}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: radarSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              <Path
                d={radarWedgeD}
                fill="none"
                stroke={colors.cyanSoft}
                strokeWidth={2.8}
                strokeLinecap="round"
                opacity={0.7}
              />
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: segSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              {segments.map((s) => (
                <Path
                  key={s.key}
                  d={s.d}
                  fill="rgba(0,234,255,0.19)"
                  stroke="rgba(0,234,255,0.68)"
                  strokeWidth={1.7}
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: tickSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={42}
                fill="none"
                stroke="rgba(0,234,255,0.25)"
                strokeWidth={0.75}
              />
              {ticks.map((t) => (
                <Line
                  key={t.key}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? colors.cyan : "rgba(0,234,255,0.4)"}
                  strokeWidth={t.isMajor ? 1.4 : 0.7}
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: turbineSpin }] }]}
            pointerEvents="none"
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              {turbineBlades.map((b) => (
                <Line
                  key={b.key}
                  x1={b.x1}
                  y1={b.y1}
                  x2={b.x2}
                  y2={b.y2}
                  stroke="rgba(0,234,255,0.32)"
                  strokeWidth={1.1}
                />
              ))}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: orbitSpin }] }]}
            pointerEvents="none"
          >
            {orbitDots.map((o) => (
              <View
                key={o.key}
                style={[
                  styles.orbitDot,
                  {
                    width: orbitDotSize,
                    height: orbitDotSize,
                    borderRadius: orbitDotSize / 2,
                    top: size / 2 + o.dy * scale - orbitDotSize / 2,
                    left: size / 2 + o.dx * scale - orbitDotSize / 2,
                  },
                ]}
              />
            ))}
          </Animated.View>

          <Animated.View
            style={[styles.fill, { transform: [{ rotate: calDotSpin }] }]}
            pointerEvents="none"
          >
            {calibrationDots.map((c) => (
              <View
                key={c.key}
                style={[
                  styles.calDot,
                  {
                    width: calDotSize,
                    height: calDotSize,
                    borderRadius: calDotSize / 2,
                    top: size / 2 + c.dy * scale - calDotSize / 2,
                    left: size / 2 + c.dx * scale - calDotSize / 2,
                  },
                ]}
              />
            ))}
          </Animated.View>

          {leds.map((l, i) => (
            <Animated.View
              key={l.key}
              pointerEvents="none"
              style={[
                styles.led,
                {
                  width: ledSize,
                  height: ledSize,
                  borderRadius: ledSize / 2,
                  top: size / 2 + l.dy * scale - ledSize / 2,
                  left: size / 2 + l.dx * scale - ledSize / 2,
                  opacity: ledValues[i],
                },
              ]}
            />
          ))}

          <Animated.View
            pointerEvents="none"
            style={[
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
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
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
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
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
            ]}
          />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.fill,
              { transform: [{ scale: coreScale }], opacity: coreOpacity },
            ]}
          >
            <Svg width={size} height={size} viewBox="0 0 200 200">
              <Defs>
                <RadialGradient id="mHalo" cx="50%" cy="50%" r="50%">
                  <Stop
                    offset="0%"
                    stopColor={colors.cyan}
                    stopOpacity={Math.min(1, 0.88 + bloomExtra * 0.12)}
                  />
                  <Stop
                    offset="60%"
                    stopColor={colors.cyan}
                    stopOpacity={0.22 + bloomExtra * 0.18}
                  />
                  <Stop offset="100%" stopColor={colors.cyan} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={34 + bloomExtra * 8}
                fill="url(#mHalo)"
              />
            </Svg>
          </Animated.View>

          <View style={styles.fill} pointerEvents="none">
            <Svg width={size} height={size} viewBox="0 0 200 200">
              <Defs>
                <RadialGradient id="mCore" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#ffffff" />
                  <Stop offset="30%" stopColor="#aef6ff" />
                  <Stop offset="65%" stopColor={colors.cyan} />
                  <Stop
                    offset="100%"
                    stopColor={colors.neonBlueDeep}
                    stopOpacity={0}
                  />
                </RadialGradient>
              </Defs>
              <Circle cx={CENTER} cy={CENTER} r={18} fill="url(#mCore)" />
            </Svg>
          </View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.flickerDot,
              {
                width: flickerDiameter,
                height: flickerDiameter,
                borderRadius: flickerDiameter / 2,
                top: (size - flickerDiameter) / 2,
                left: (size - flickerDiameter) / 2,
                transform: [{ scale: flickerScale }],
              },
            ]}
          />

          {/* Error-state amber flicker overlay — inert unless activityState === 'error' */}
          {activityState === "error" && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.errorOverlay,
                {
                  width: flickerDiameter * 2.4,
                  height: flickerDiameter * 2.4,
                  borderRadius: (flickerDiameter * 2.4) / 2,
                  top: (size - flickerDiameter * 2.4) / 2,
                  left: (size - flickerDiameter * 2.4) / 2,
                  opacity: errorOverlayOpacity,
                },
              ]}
            />
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.flareDot,
              {
                width: flareSize,
                height: flareSize,
                borderRadius: flareSize / 2,
                top: size / 2 - 15 * scale - flareSize / 2,
                left: size / 2 - 13 * scale - flareSize / 2,
                opacity: flareOpacity,
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.flareDotSm,
              {
                width: flareSize * 0.5,
                height: flareSize * 0.5,
                borderRadius: (flareSize * 0.5) / 2,
                top: size / 2 + 20 * scale,
                left: size / 2 + 24 * scale,
                opacity: flareOpacity,
              },
            ]}
          />

          {/* Animated diagonal glass reflection sweep, clipped to the reactor's circular bounds */}
          <View
            style={[
              styles.glassSweepClip,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
            pointerEvents="none"
          >
            <Animated.View
              style={[
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
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.22)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fill}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {showFloor && (
        <>
          <Animated.View
            style={[
              styles.floorWrap,
              { width: shadowWidth, height: beamHeight, opacity: coneOpacity },
            ]}
            pointerEvents="none"
          >
            <Svg width={shadowWidth} height={beamHeight} viewBox="0 0 200 150">
              <Defs>
                <SvgLinearGradient
                  id="beamGrad"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <Stop
                    offset="0%"
                    stopColor={colors.cyan}
                    stopOpacity={beamStopA}
                  />
                  <Stop
                    offset="60%"
                    stopColor={colors.cyan}
                    stopOpacity={beamStopB}
                  />
                  <Stop offset="100%" stopColor={colors.cyan} stopOpacity={0} />
                </SvgLinearGradient>
              </Defs>
              <Path d={beamTrapezoidD} fill="url(#beamGrad)" />
            </Svg>
          </Animated.View>

          {/* --- 3D floating platform: real perspective + rotateX tilt, not manual ellipse squashing --- */}
          <View style={styles.platformStage} pointerEvents="none">
            <View
              style={[
                styles.platformGlow,
                {
                  width: platformGlowSize,
                  height: platformGlowSize * 0.32,
                  borderRadius: platformGlowSize / 2,
                },
              ]}
            />
            <View
              style={[
                styles.platformPerspective,
                { width: platformSize, height: platformSize },
              ]}
            >
              <Animated.View
                style={[
                  styles.fill,
                  {
                    transform: [{ rotateX: "68deg" }, { rotate: platformSpin }],
                  },
                ]}
              >
                <Svg
                  width={platformSize}
                  height={platformSize}
                  viewBox="0 0 200 200"
                >
                  <Defs>
                    <RadialGradient id="platformFill" cx="50%" cy="50%" r="50%">
                      <Stop
                        offset="0%"
                        stopColor={colors.cyan}
                        stopOpacity={0.06}
                      />
                      <Stop
                        offset="100%"
                        stopColor={colors.cyan}
                        stopOpacity={0}
                      />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={100} cy={100} r={94} fill="url(#platformFill)" />
                  <Circle
                    cx={100}
                    cy={100}
                    r={94}
                    fill="none"
                    stroke="rgba(0,234,255,0.35)"
                    strokeWidth={1.4}
                  />
                  {platformDashesOuter.map((d) => (
                    <Path
                      key={d.key}
                      d={d.d}
                      fill="none"
                      stroke="rgba(0,234,255,0.5)"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                    />
                  ))}
                  {platformDashesInner.map((d) => (
                    <Path
                      key={d.key}
                      d={d.d}
                      fill="none"
                      stroke="rgba(0,234,255,0.3)"
                      strokeWidth={1.1}
                      strokeLinecap="round"
                    />
                  ))}
                </Svg>
              </Animated.View>
            </View>
            <View
              style={[
                styles.platformShadow,
                {
                  width: platformSize * 0.9,
                  height: platformSize * 0.9 * 0.16,
                },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stageWrap: { alignItems: "center", position: "relative" },
  atmosphereWrap: { position: "absolute" },
  wrap: { position: "relative" },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bloomFar: { position: "absolute", backgroundColor: "rgba(0,234,255,0.035)" },
  bloomOuter: { position: "absolute", backgroundColor: "rgba(0,234,255,0.06)" },
  bloomInner: { position: "absolute", backgroundColor: "rgba(0,234,255,0.1)" },
  bloomBoost: { position: "absolute", backgroundColor: colors.cyan },
  housingOuterShade: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(0,234,255,0.14)",
    shadowColor: colors.cyan,
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
  led: { position: "absolute", backgroundColor: colors.cyanSoft },
  orbitDot: {
    position: "absolute",
    backgroundColor: colors.cyanSoft,
    shadowColor: colors.cyan,
    shadowOpacity: 0.95,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  calDot: {
    position: "absolute",
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
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

export default ArcReactorMobile;

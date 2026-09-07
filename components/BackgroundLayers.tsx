// BackgroundLayers.tsx — Phase 13, Priority 5: adds one new ambient
// layer — a very soft, slow-moving holographic shimmer band — on top of
// the existing grid/vignette/scanline/particles/radar-sweep/radar-circles/
// fog/noise/light-shafts stack. Single element, one Animated loop, low
// FPS cost. No layout change — everything remains absolutely positioned
// background, exactly as before.

import React, { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Line, RadialGradient, Rect, Stop, Defs } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GRID_CELL = 42;
const RADAR_SIZE = Math.max(SCREEN_W, SCREEN_H) * 1.3;

function HoloGrid() {
  const verticals = useMemo(() => Array.from({ length: Math.ceil(SCREEN_W / GRID_CELL) + 1 }, (_, i) => i * GRID_CELL), []);
  const horizontals = useMemo(() => Array.from({ length: Math.ceil(SCREEN_H / GRID_CELL) + 1 }, (_, i) => i * GRID_CELL), []);
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={styles.fill}>
      {verticals.map((x) => (
        <Line key={`v-${x}`} x1={x} y1={0} x2={x} y2={SCREEN_H} stroke="rgba(0,200,255,0.06)" strokeWidth={1} />
      ))}
      {horizontals.map((y) => (
        <Line key={`h-${y}`} x1={0} y1={y} x2={SCREEN_W} y2={y} stroke="rgba(0,200,255,0.06)" strokeWidth={1} />
      ))}
    </Svg>
  );
}

function Vignette() {
  return (
    <Svg width={SCREEN_W} height={SCREEN_H} style={styles.fill}>
      <Defs>
        <RadialGradient id="vignette" cx="50%" cy="42%" r="70%">
          <Stop offset="45%" stopColor="#02040A" stopOpacity={0} />
          <Stop offset="100%" stopColor="#02040A" stopOpacity={0.85} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} fill="url(#vignette)" />
    </Svg>
  );
}

const NOISE_DOTS = Array.from({ length: 60 }, (_, i) => ({
  key: `noise-${i}`,
  left: Math.random() * SCREEN_W,
  top: Math.random() * SCREEN_H,
  size: Math.random() < 0.7 ? 1 : 1.5,
  opacity: 0.03 + Math.random() * 0.05,
}));

function HoloNoise() {
  return (
    <View style={styles.fill} pointerEvents="none">
      {NOISE_DOTS.map((d) => (
        <View key={d.key} style={{ position: 'absolute', left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: colors.cyanSoft, opacity: d.opacity }} />
      ))}
    </View>
  );
}

const SHAFT_DEFS = [
  { key: 'shaft-a', left: SCREEN_W * 0.15, rotate: '18deg', height: SCREEN_H * 1.4 },
  { key: 'shaft-b', left: SCREEN_W * 0.7, rotate: '-14deg', height: SCREEN_H * 1.2 },
];

function LightShafts() {
  return (
    <View style={styles.fill} pointerEvents="none">
      {SHAFT_DEFS.map((s) => (
        <View key={s.key} style={[styles.shaftWrap, { left: s.left, height: s.height, transform: [{ rotate: s.rotate }] }]}>
          <LinearGradient colors={['rgba(0,234,255,0)', 'rgba(0,234,255,0.05)', 'rgba(0,234,255,0)']} style={styles.fill} />
        </View>
      ))}
    </View>
  );
}

const RADAR_CIRCLE_RADII = [90, 160, 230, 300];

function RadarCircles({ reducedMotion }: { reducedMotion: boolean }) {
  const breathe = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, breathe]);

  const opacity = useMemo(() => breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), [breathe]);

  return (
    <Animated.View style={[styles.fill, { opacity }]} pointerEvents="none">
      {RADAR_CIRCLE_RADII.map((r) => (
        <View
          key={`radar-circle-${r}`}
          style={{
            position: 'absolute',
            top: SCREEN_H * 0.3 - r,
            left: SCREEN_W / 2 - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            borderWidth: 1,
            borderColor: 'rgba(0,234,255,0.06)',
          }}
        />
      ))}
    </Animated.View>
  );
}

// NEW — Priority 5: very soft, slow holographic shimmer band sweeping
// diagonally across the whole screen. Single element, single loop.
function HoloShimmer({ reducedMotion }: { reducedMotion: boolean }) {
  const sweep = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, sweep]);

  const translateX = useMemo(
    () => sweep.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_W * 0.6, SCREEN_W * 1.2] }),
    [sweep]
  );

  return (
    <Animated.View style={[styles.shimmerWrap, { transform: [{ translateX }, { rotate: '22deg' }] }]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(0,234,255,0)', 'rgba(0,234,255,0.035)', 'rgba(0,234,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.4 }}
        style={styles.fill}
      />
    </Animated.View>
  );
}

function ScanlineSweep({ reducedMotion }: { reducedMotion: boolean }) {
  const translateY = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(Animated.timing(translateY, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, translateY]);
  const y = useMemo(() => translateY.interpolate({ inputRange: [0, 1], outputRange: [-140, SCREEN_H] }), [translateY]);
  return (
    <Animated.View style={[styles.scanBand, { transform: [{ translateY: y }] }]} pointerEvents="none">
      <LinearGradient colors={['rgba(0,234,255,0)', 'rgba(0,234,255,0.09)', 'rgba(0,234,255,0)']} style={styles.fill} />
    </Animated.View>
  );
}

interface ParticleDef {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

function buildParticles(count: number): ParticleDef[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * SCREEN_W,
    size: 2 + Math.random() * 2.5,
    duration: 7000 + Math.random() * 6000,
    delay: Math.random() * 5000,
    drift: (Math.random() - 0.5) * 60,
  }));
}

function Particle({ def, reducedMotion }: { def: ParticleDef; reducedMotion: boolean }) {
  const progress = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    if (reducedMotion) return undefined;
    let cancelled = false;
    function run() {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: def.duration, delay: def.delay, easing: Easing.linear, useNativeDriver: true }).start(({ finished }) => {
        if (finished && !cancelled) run();
      });
    }
    run();
    return () => {
      cancelled = true;
      progress.stopAnimation();
    };
  }, [reducedMotion, progress, def]);
  const translateY = useMemo(() => progress.interpolate({ inputRange: [0, 1], outputRange: [0, -SCREEN_H * 1.05] }), [progress]);
  const translateX = useMemo(() => progress.interpolate({ inputRange: [0, 1], outputRange: [0, def.drift] }), [progress, def.drift]);
  const opacity = useMemo(() => progress.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.9, 0.4, 0] }), [progress]);
  return (
    <Animated.View style={[styles.particle, { left: def.left, width: def.size, height: def.size, borderRadius: def.size / 2, opacity, transform: [{ translateY }, { translateX }] }]} />
  );
}

function RadarSweep({ reducedMotion }: { reducedMotion: boolean }) {
  const rotate = useMemo(() => new Animated.Value(0), []);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, rotate]);
  const spin = useMemo(() => rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [rotate]);
  return (
    <Animated.View style={[styles.radarWedge, { width: RADAR_SIZE, height: RADAR_SIZE, borderRadius: RADAR_SIZE / 2, transform: [{ rotate: spin }] }]} pointerEvents="none">
      <LinearGradient colors={['rgba(0,234,255,0.10)', 'rgba(0,234,255,0)']} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 0 }} style={styles.fill} />
    </Animated.View>
  );
}

function BackgroundLayers() {
  const reducedMotion = useReducedMotion();
  const particles = useMemo(() => buildParticles(18), []);

  return (
    <View style={styles.fill} pointerEvents="none">
      <View style={styles.base} />
      <HoloGrid />
      <RadarCircles reducedMotion={reducedMotion} />
      <LightShafts />
      <HoloShimmer reducedMotion={reducedMotion} />
      <RadarSweep reducedMotion={reducedMotion} />
      <LinearGradient colors={['rgba(0,90,160,0.12)', 'rgba(0,90,160,0)']} style={styles.fog} />
      <LinearGradient colors={['rgba(0,60,140,0.08)', 'rgba(0,60,140,0)']} style={styles.fogB} />
      <HoloNoise />
      {particles.map((p) => (
        <Particle key={p.id} def={p} reducedMotion={reducedMotion} />
      ))}
      <Vignette />
      <ScanlineSweep reducedMotion={reducedMotion} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  base: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bgBlack },
  fog: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.35 },
  fogB: { position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_H * 0.22 },
  shaftWrap: { position: 'absolute', top: -SCREEN_H * 0.2, width: 90 },
  shimmerWrap: { position: 'absolute', top: -SCREEN_H * 0.2, width: SCREEN_W * 0.5, height: SCREEN_H * 1.6 },
  particle: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.cyanSoft,
    shadowColor: colors.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  scanBand: { position: 'absolute', left: 0, right: 0, height: 140 },
  radarWedge: { position: 'absolute', top: SCREEN_H * 0.3 - RADAR_SIZE / 2, left: SCREEN_W / 2 - RADAR_SIZE / 2, overflow: 'hidden' },
});

export default BackgroundLayers;
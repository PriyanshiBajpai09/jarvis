// SystemStatusPanel.tsx — Phase 13, Priority 3: values now fluctuate
// continuously and smoothly. Each metric does a small bounded random
// walk on a timer (never a big jump — deltas are clamped per metric)
// and animates to the new value over 1.8s. The waveform now scrolls
// continuously for a genuine "live telemetry" feel instead of a static
// drawn path. Layout/design unchanged.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme/theme';
import GlassPanel from './GlassPanel';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface MetricDef {
  key: string;
  label: string;
  initial: number;
  min: number;
  max: number;
  unit: '%' | '°C';
  tone?: 'warn' | 'safe';
  maxStep: number; // largest change allowed per fluctuation tick
}

const METRIC_DEFS: MetricDef[] = [
  { key: 'cpu', label: 'CPU Load', initial: 47, min: 20, max: 75, unit: '%', maxStep: 4 },
  { key: 'temp', label: 'Core Temperature', initial: 38, min: 32, max: 48, unit: '°C', maxStep: 1 },
  { key: 'shield', label: 'Shield Integrity', initial: 78, min: 65, max: 92, unit: '%', tone: 'safe', maxStep: 2 },
  { key: 'neural', label: 'Neural Sync', initial: 100, min: 92, max: 100, unit: '%', tone: 'safe', maxStep: 2 },
  { key: 'network', label: 'Network', initial: 91, min: 78, max: 98, unit: '%', maxStep: 3 },
  { key: 'power', label: 'Power Reserve', initial: 64, min: 45, max: 80, unit: '%', tone: 'warn', maxStep: 2 },
];

function buildWavePath(seed: number, points: number): string {
  const coords: string[] = [];
  const width = 200;
  for (let i = 0; i <= points; i += 1) {
    const x = (width / points) * i;
    const noise = Math.sin(i * 0.7 + seed) * 7 + Math.sin(i * 1.9 + seed * 1.6) * 3.5;
    const y = 18 + noise;
    coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${coords.join(' L')}`;
}
const wavePathA = buildWavePath(1.2, 32);
const wavePathB = buildWavePath(4.4, 32);

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function StatusBar({ def, index, reducedMotion }: { def: MetricDef; index: number; reducedMotion: boolean }) {
  const fill = useMemo(() => new Animated.Value(0), []);
  const [displayValue, setDisplayValue] = useState(def.initial);
  const currentValueRef = useRef(def.initial);

  useEffect(() => {
    Animated.timing(fill, {
      toValue: def.initial,
      duration: reducedMotion ? 0 : 1100,
      delay: reducedMotion ? 0 : 250 + index * 130,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fill, def.initial, index, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const interval = setInterval(() => {
      const delta = (Math.random() * 2 - 1) * def.maxStep;
      const next = clamp(Math.round(currentValueRef.current + delta), def.min, def.max);
      currentValueRef.current = next;
      Animated.timing(fill, { toValue: next, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
      setDisplayValue(next);
    }, 2600 + index * 200);
    return () => clearInterval(interval);
  }, [reducedMotion, fill, def, index]);

  const width = useMemo(() => fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), [fill]);
  const barColor = def.tone === 'warn' ? colors.warnAmber : def.tone === 'safe' ? colors.safeGreen : colors.cyan;

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.label}>{def.label}</Text>
        <Text style={[styles.value, { color: barColor }]}>
          {displayValue}
          {def.unit}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fillBar, { width, backgroundColor: barColor, shadowColor: barColor }]} />
      </View>
    </View>
  );
}

function LiveWaveform({ reducedMotion }: { reducedMotion: boolean }) {
  const scrollX = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(Animated.timing(scrollX, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, scrollX]);

  const translateA = useMemo(() => scrollX.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }), [scrollX]);
  const translateB = useMemo(() => scrollX.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }), [scrollX]);

  return (
    <View style={styles.waveformSvgWrap}>
      <Animated.View style={[styles.waveformLayer, { transform: [{ translateX: translateA }] }]}>
        <Svg width="100%" height={32} viewBox="0 0 200 36" preserveAspectRatio="none">
          <Path d={wavePathA} fill="none" stroke={colors.cyan} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.waveformLayer, { transform: [{ translateX: translateB }] }]}>
        <Svg width="100%" height={32} viewBox="0 0 200 36" preserveAspectRatio="none">
          <Path d={wavePathB} fill="none" stroke={colors.cyanSoft} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
        </Svg>
      </Animated.View>
    </View>
  );
}

function SystemStatusPanel() {
  const reducedMotion = useReducedMotion();
  const blink = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, blink]);

  return (
    <GlassPanel style={styles.panel}>
      <View style={styles.header}>
        <Text style={styles.title}>System Status</Text>
        <Animated.View style={[styles.pulseDot, { opacity: blink }]} />
      </View>

      {METRIC_DEFS.map((def, i) => (
        <StatusBar key={def.key} def={def} index={i} reducedMotion={reducedMotion} />
      ))}

      <View style={styles.waveformBlock}>
        <Text style={styles.waveformLabel}>Live Telemetry</Text>
        <LiveWaveform reducedMotion={reducedMotion} />
      </View>

      <View style={styles.footer}>
        <Animated.View style={[styles.footerDot, { opacity: blink }]} />
        <Text style={styles.footerText}>All Systems Nominal</Text>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
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
  title: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 2, color: colors.cyanSoft, textTransform: 'uppercase' },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: 0.9, shadowRadius: 5 },
  row: { gap: 7 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textDim, textTransform: 'uppercase' },
  value: { fontFamily: fonts.display, fontSize: 12 },
  track: { height: 7, borderRadius: 3.5, backgroundColor: 'rgba(0,234,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,234,255,0.22)', overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: 3.5, shadowOpacity: 0.8, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  waveformBlock: { gap: 5, paddingTop: 4 },
  waveformLabel: { fontFamily: fonts.body, fontSize: 9.5, letterSpacing: 1.2, color: colors.textDim, textTransform: 'uppercase' },
  waveformSvgWrap: { height: 32, overflow: 'hidden', position: 'relative' },
  waveformLayer: { position: 'absolute', left: 0, right: 0, top: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,234,255,0.15)' },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan },
  footerText: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1.2, color: colors.textDim, textTransform: 'uppercase' },
});

export default SystemStatusPanel;
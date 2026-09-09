// SystemStatusPanel.tsx — Part E: footer now cycles through subtle
// operational status messages instead of a static "All Systems
// Nominal" string. Metrics, animated bars, and waveform are unchanged.

import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts } from '../theme/theme';
import GlassPanel from './GlassPanel';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Metric {
  label: string;
  value: number;
  display: string;
  tone?: 'warn' | 'safe';
}

const METRICS: Metric[] = [
  { label: 'CPU Load', value: 47, display: '47%' },
  { label: 'Core Temperature', value: 38, display: '38°C' },
  { label: 'Shield Integrity', value: 78, display: '78%', tone: 'safe' },
  { label: 'Neural Sync', value: 100, display: '100%', tone: 'safe' },
  { label: 'Network', value: 91, display: '91%' },
  { label: 'Power Reserve', value: 64, display: '64%', tone: 'warn' },
];

const STATUS_MESSAGES = [
  'All Systems Nominal',
  'Core Systems Stable',
  'Network Link Verified',
  'Knowledge Matrix Online',
  'Routing Active',
  'Protocol Engine Ready',
];
const STATUS_CYCLE_MS = 4000;

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
const wavePath = buildWavePath(1.2, 32);

function StatusBar({ metric, index, reducedMotion }: { metric: Metric; index: number; reducedMotion: boolean }) {
  const fill = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fill, {
      toValue: metric.value,
      duration: reducedMotion ? 0 : 1100,
      delay: reducedMotion ? 0 : 250 + index * 130,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fill, metric.value, index, reducedMotion]);

  const width = useMemo(() => fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), [fill]);
  const barColor = metric.tone === 'warn' ? colors.warnAmber : metric.tone === 'safe' ? colors.safeGreen : colors.cyan;

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.label}>{metric.label}</Text>
        <Text style={[styles.value, { color: barColor }]}>{metric.display}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fillBar, { width, backgroundColor: barColor, shadowColor: barColor }]} />
      </View>
    </View>
  );
}

/** Part E — cycles through STATUS_MESSAGES on a timer. Static (first message only) when reducedMotion is on. */
function useCyclingStatus(reducedMotion: boolean): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, STATUS_CYCLE_MS);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  return STATUS_MESSAGES[index];
}

function SystemStatusPanel() {
  const reducedMotion = useReducedMotion();
  const blink = useMemo(() => new Animated.Value(1), []);
  const statusMessage = useCyclingStatus(reducedMotion);

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

      {METRICS.map((m, i) => (
        <StatusBar key={m.label} metric={m} index={i} reducedMotion={reducedMotion} />
      ))}

      <View style={styles.waveformBlock}>
        <Text style={styles.waveformLabel}>Live Telemetry</Text>
        <Svg width="100%" height={32} viewBox="0 0 200 36" preserveAspectRatio="none">
          <Path d={wavePath} fill="none" stroke={colors.cyan} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        </Svg>
      </View>

      <View style={styles.footer}>
        <Animated.View style={[styles.footerDot, { opacity: blink }]} />
        <Text style={styles.footerText}>{statusMessage}</Text>
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
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,234,255,0.15)' },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cyan },
  footerText: { fontFamily: fonts.body, fontSize: 10, letterSpacing: 1.2, color: colors.textDim, textTransform: 'uppercase' },
});

export default SystemStatusPanel;
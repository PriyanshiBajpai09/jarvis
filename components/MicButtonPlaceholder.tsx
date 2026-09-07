// MicButtonPlaceholder.tsx — reverted to a pure visual placeholder for
// Expo Go compatibility. Does NOT import services/voiceService.ts (or
// anything from expo-speech-recognition / expo-speech), because that
// service imports a native module that doesn't exist in Expo Go and
// crashes the app on load with "Cannot find native module
// 'ExpoSpeechRecognition'" — even before the mic is pressed.
//
// Visuals and animation behavior (breathing halo, rotating dashed ring,
// press ripple, glowing core, listening-state speed-up) are unchanged
// from the working version. Listening state is purely local UI state
// with no real microphone/recognition calls.
//
// voiceService.ts remains in the project for a future custom-dev-build
// phase, but nothing currently imports it.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface MicButtonPlaceholderProps {
  onPress?: () => void;
}

const SIZE = 80;

function MicButtonPlaceholder({ onPress }: MicButtonPlaceholderProps) {
  const reducedMotion = useReducedMotion();
  const [isListening, setIsListening] = useState(false);
  const breathe = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(1), []);
  const ringSpin = useMemo(() => new Animated.Value(0), []);
  const pressRipple = useMemo(() => new Animated.Value(0), []);
  const rippleKeyRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: isListening ? 900 : 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: isListening ? 900 : 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    breatheLoop.start();
    return () => breatheLoop.stop();
  }, [reducedMotion, breathe, isListening]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const ringLoop = Animated.loop(
      Animated.timing(ringSpin, { toValue: 1, duration: isListening ? 3000 : 10000, easing: Easing.linear, useNativeDriver: true })
    );
    ringLoop.start();
    return () => ringLoop.stop();
  }, [reducedMotion, ringSpin, isListening]);

  const haloScale = useMemo(() => breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }), [breathe]);
  const haloOpacity = useMemo(() => breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }), [breathe]);
  const ringRotate = useMemo(() => ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }), [ringSpin]);
  const rippleScale = useMemo(() => pressRipple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }), [pressRipple]);
  const rippleOpacity = useMemo(() => pressRipple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), [pressRipple]);

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }

  function handlePress() {
    rippleKeyRef.current += 1;
    pressRipple.setValue(0);
    Animated.timing(pressRipple, { toValue: 1, duration: 620, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();

    setIsListening((prev) => !prev);
    onPress?.();
  }

  const labelText = isListening ? 'Listening...' : null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {labelText && <Text style={styles.statusLabel}>{labelText}</Text>}

      <Animated.View pointerEvents="none" style={[styles.outerBloom, { transform: [{ scale: haloScale }], opacity: Animated.multiply(haloOpacity, 0.55) }]} />
      <Animated.View pointerEvents="none" style={[styles.innerBloom, { transform: [{ scale: haloScale }], opacity: haloOpacity }]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.outerRing, { transform: [{ rotate: ringRotate }] }, isListening ? styles.outerRingActive : null]}
      />
      <Animated.View pointerEvents="none" style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.core, isListening ? styles.coreActive : null]}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Stop listening' : 'Activate voice input'}
        >
          <View style={styles.micBody} />
          <View style={styles.micArc} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const OUTER_HALO = SIZE + 76;
const INNER_HALO = SIZE + 38;
const RING = SIZE + 22;

const styles = StyleSheet.create({
  wrap: { width: OUTER_HALO, height: OUTER_HALO, alignItems: 'center', justifyContent: 'center' },
  statusLabel: {
    position: 'absolute',
    top: -22,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.cyanSoft,
  },
  outerBloom: { position: 'absolute', width: OUTER_HALO, height: OUTER_HALO, borderRadius: OUTER_HALO / 2, backgroundColor: 'rgba(0,234,255,0.16)' },
  innerBloom: { position: 'absolute', width: INNER_HALO, height: INNER_HALO, borderRadius: INNER_HALO / 2, backgroundColor: 'rgba(0,234,255,0.24)' },
  outerRing: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 1.3, borderStyle: 'dashed', borderColor: 'rgba(0,234,255,0.52)' },
  outerRingActive: { borderColor: colors.cyan, borderWidth: 1.8 },
  ripple: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 1.5, borderColor: colors.cyan },
  core: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.cyan,
    backgroundColor: 'rgba(6,16,34,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyan,
    shadowOpacity: 0.85,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 5 },
    elevation: 12,
  },
  coreActive: { shadowOpacity: 1, shadowRadius: 30 },
  micBody: { width: 17, height: 28, borderRadius: 8.5, backgroundColor: colors.cyanSoft },
  micArc: {
    position: 'absolute',
    bottom: 15,
    width: 32,
    height: 17,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.cyanSoft,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});

export default MicButtonPlaceholder;
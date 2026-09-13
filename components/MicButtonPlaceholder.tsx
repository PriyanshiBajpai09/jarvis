// MicButtonPlaceholder.tsx — v0.4: clear mic states (Part C). Visual
// design (halos, ring, ripple, core, mic glyph) is UNCHANGED. Native
// behavior is UNCHANGED — a decorative toggle with no service imports
// executed. On web with SpeechRecognition support, a local voiceState
// now tracks idle/listening/thinking/speaking/ready/error and displays
// a matching label above the mic at all times (not just on error),
// using the same absolutely-positioned slot as before — no layout
// change.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme/theme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import {
  configureWebVoice,
  isSpeakingNow,
  isWebVoiceSupported,
  speak,
  startListening,
  stopListening,
  stopSpeaking,
  teardownWebVoice,
  VoiceActivityState,
} from '../services/webVoiceService';
import { publishExternalMessage } from '../services/chatBus';
import { subscribeToReplyReady } from '../services/replyBus';
import { publishActivityState } from '../services/activityStateBus';

interface MicButtonPlaceholderProps {
  onPress?: () => void;
}

type LocalVoiceState = VoiceActivityState | 'ready';

const SIZE = 80;
const STATUS_DISPLAY_MS = 3200;
const READY_DISPLAY_MS = 1200;
const IS_WEB = Platform.OS === 'web';

function getDisplayLabel(state: LocalVoiceState, supported: boolean): string {
  if (!supported) return 'Tap to Talk';
  switch (state) {
    case 'listening':
      return 'Listening...';
    case 'thinking':
      return 'Processing...';
    case 'speaking':
      return 'Speaking...';
    case 'ready':
      return 'Ready';
    case 'error':
    case 'idle':
    default:
      return 'Tap to Talk';
  }
}

function MicButtonPlaceholder({ onPress }: MicButtonPlaceholderProps) {
  const reducedMotion = useReducedMotion();
  const [voiceState, setVoiceState] = useState<LocalVoiceState>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [webSupported, setWebSupported] = useState(false);

  const breathe = useMemo(() => new Animated.Value(0), []);
  const scale = useMemo(() => new Animated.Value(1), []);
  const ringSpin = useMemo(() => new Animated.Value(0), []);
  const pressRipple = useMemo(() => new Animated.Value(0), []);
  const rippleKeyRef = useRef(0);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isListening = voiceState === 'listening';

  useEffect(() => {
    setWebSupported(IS_WEB && isWebVoiceSupported());
  }, []);

  useEffect(() => {
    if (!webSupported) return undefined;

    configureWebVoice({
      onTranscript: (text) => {
        setVoiceState('thinking');
        publishActivityState('thinking');
        publishExternalMessage(text);
      },
      onStateChange: (state) => {
        setVoiceState(state);
        publishActivityState(state);
      },
      onError: (message) => {
        setVoiceState('idle');
        publishActivityState('error');
        setStatusMessage(message);
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setStatusMessage(null);
          publishActivityState('idle');
        }, STATUS_DISPLAY_MS);
      },
    });

    return () => {
      teardownWebVoice();
    };
  }, [webSupported]);

  useEffect(() => {
    if (!webSupported) return undefined;
    const unsubscribe = subscribeToReplyReady((text) => {
      speak(text, () => {
        publishActivityState('idle');
        setVoiceState('ready');
        if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = setTimeout(() => setVoiceState('idle'), READY_DISPLAY_MS);
      });
    });
    return unsubscribe;
  }, [webSupported]);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    };
  }, []);

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

    if (!webSupported) {
      if (IS_WEB) {
        setStatusMessage('Voice input is not available in this browser.');
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => setStatusMessage(null), STATUS_DISPLAY_MS);
      } else {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : 'listening'));
      }
      onPress?.();
      return;
    }

    setStatusMessage(null);

    if (isListening) {
      stopListening();
      setVoiceState('idle');
      publishActivityState('idle');
    } else {
      if (isSpeakingNow()) {
        stopSpeaking();
      }
      startListening();
    }

    onPress?.();
  }

  const isError = Boolean(statusMessage);
  const labelText = statusMessage ?? getDisplayLabel(voiceState, webSupported);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Text style={[styles.statusLabel, isError ? styles.statusLabelError : null]}>{labelText}</Text>

      <Animated.View pointerEvents="none" style={[styles.outerBloom, { transform: [{ scale: haloScale }], opacity: Animated.multiply(haloOpacity, 0.55) }]} />
      <Animated.View pointerEvents="none" style={[styles.innerBloom, { transform: [{ scale: haloScale }], opacity: haloOpacity }]} />
      <Animated.View
        pointerEvents="none"
        style={[styles.outerRing, { transform: [{ rotate: ringRotate }] }, isListening ? styles.outerRingActive : null]}
      />
      <Animated.View pointerEvents="none" style={[styles.ripple, { transform: [{ scale: rippleScale }], opacity: rippleOpacity }]} />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={() => {
            handlePress();
          }}
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
  statusLabelError: { color: colors.warnAmber },
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
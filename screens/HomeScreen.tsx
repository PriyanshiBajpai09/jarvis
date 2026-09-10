// HomeScreen.tsx
// Stable version: JS-driven keyboard animations (height/bottom) are
// separated from native-driver fade/translate animations.

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  subscribeToActivityState,
  ActivityState,
} from "../services/activityStateBus";
import { ReactorActivityState } from "../components/ArcReactorMobile";
import { colors, fonts } from "../theme/theme";
import BackgroundLayers from "../components/BackgroundLayers";
import HoloHeaderMobile from "../components/HoloHeaderMobile";
import GlassPanel from "../components/GlassPanel";
import ArcReactorMobile from "../components/ArcReactorMobile";
import ReactorStageBackdrop from "../components/ReactorStageBackdrop";
import SystemStatusPanel from "../components/SystemStatusPanel";
import ConversationPanel from "../components/ConversationPanel";
import MicButtonPlaceholder from "../components/MicButtonPlaceholder";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useKeyboardAnimation } from "../hooks/useKeyboardAnimation";

function useFadeUp(delay: number, reducedMotion: boolean) {
  const value = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: reducedMotion ? 0 : 520,
      delay: reducedMotion ? 0 : delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [value, delay, reducedMotion]);

  const translateY = useMemo(
    () =>
      value.interpolate({
        inputRange: [0, 1],
        outputRange: [18, 0],
      }),
    [value],
  );

  return {
    opacity: value,
    transform: [{ translateY }],
  };
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning, Priyanshi.";
  if (hour < 18) return "Good afternoon, Priyanshi.";
  return "Good evening, Priyanshi.";
}

function mapToReactorState(state: ActivityState): ReactorActivityState {
  switch (state) {
    case "listening":
      return "thinking";

    case "thinking":
      return "thinking";

    case "speaking":
      return "streaming";

    case "error":
      return "error";

    case "idle":
    default:
      return "idle";
  }
}

const DOCK_BOTTOM_OFFSET = 28;
const DOCK_RESERVED_SPACE = 130;
const REACTOR_SIZE = 240;
const BACKDROP_SIZE = 305;

export default function HomeScreen() {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const greeting = useMemo(() => getGreeting(), []);

  const scrollViewRef = useRef<ScrollView>(null);

  const headerAnim = useFadeUp(0, reducedMotion);
  const welcomeAnim = useFadeUp(140, reducedMotion);
  const reactorAnim = useFadeUp(280, reducedMotion);
  const statusAnim = useFadeUp(420, reducedMotion);
  const convoAnim = useFadeUp(560, reducedMotion);
  const dockAnim = useFadeUp(700, reducedMotion);

  const handleKeyboardShow = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  const keyboardHeight = useKeyboardAnimation({
    onShow: handleKeyboardShow,
  });

  // JS-driven height animation
  const spacerHeight = useMemo(
    () => Animated.add(keyboardHeight, DOCK_RESERVED_SPACE),
    [keyboardHeight],
  );

  // JS-driven bottom animation
  const dockBottom = useMemo(
    () => Animated.add(keyboardHeight, DOCK_BOTTOM_OFFSET + insets.bottom),
    [keyboardHeight, insets.bottom],
  );

  const [reactorActivityState, setReactorActivityState] =
    useState<ReactorActivityState>("idle");

  useEffect(() => {
    const unsubscribe = subscribeToActivityState((state: ActivityState) => {
      setReactorActivityState(mapToReactorState(state));
    });

    return unsubscribe;
  }, []);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, []);

  return (
    <View style={styles.root}>
      <BackgroundLayers />

      <Animated.View style={[styles.headerLayer, headerAnim]}>
        <HoloHeaderMobile />
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.flexOne}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 20 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={welcomeAnim}>
          <GlassPanel style={styles.welcomePanel}>
            <Text style={styles.welcomeLine}>{greeting}</Text>
            <Text style={styles.welcomeAccent}>I'm Jarvis.</Text>
            <Text style={styles.welcomeLine}>Everything is ready.</Text>
            <Text style={styles.welcomeLine}>What are we building today?</Text>
          </GlassPanel>
        </Animated.View>

        <Animated.View style={[styles.reactorStage, reactorAnim]}>
          <ReactorStageBackdrop size={BACKDROP_SIZE} />
          <ArcReactorMobile
            size={REACTOR_SIZE}
            activityState={reactorActivityState}
          />
        </Animated.View>

        <Animated.View style={statusAnim}>
          <SystemStatusPanel />
        </Animated.View>

        <Animated.View style={convoAnim}>
          <ConversationPanel onInputFocus={handleInputFocus} />
        </Animated.View>

        {/* JS-driven spacer */}
        <Animated.View style={{ height: spacerHeight }} />
      </ScrollView>

      {/* OUTER = JS animation (bottom) */}
      <Animated.View
        style={[styles.dockLayer, { bottom: dockBottom }]}
        pointerEvents="box-none"
      >
        {/* INNER = Native animation (opacity + translateY) */}
        <Animated.View style={dockAnim}>
          <MicButtonPlaceholder onPress={() => {}} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgBlack,
  },

  flexOne: {
    flex: 1,
  },

  headerLayer: {
    zIndex: 5,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },

  welcomePanel: {
    gap: 4,
  },

  welcomeLine: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },

  welcomeAccent: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.cyan,
    marginVertical: 4,
  },

  reactorStage: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  dockLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 6,
  },
});

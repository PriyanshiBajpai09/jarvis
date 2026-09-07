// hooks/useKeyboardAnimation.ts

import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Keyboard,
  KeyboardEvent,
  Platform,
} from "react-native";

interface UseKeyboardAnimationOptions {
  onShow?: (height: number) => void;
  onHide?: () => void;
}

export function useKeyboardAnimation(
  options: UseKeyboardAnimationOptions = {}
): Animated.Value {
  const animatedHeight = useMemo(() => new Animated.Value(0), []);
  const optionsRef = useRef(options);

  // Keep latest callbacks without recreating listeners.
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleShow = (event: KeyboardEvent) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      const duration =
        Platform.OS === "ios" ? event.duration ?? 250 : 220;

      Animated.timing(animatedHeight, {
        toValue: keyboardHeight,
        duration,
        useNativeDriver: false,
      }).start();

      optionsRef.current.onShow?.(keyboardHeight);
    };

    const handleHide = (event: KeyboardEvent) => {
      const duration =
        Platform.OS === "ios" ? event.duration ?? 250 : 200;

      Animated.timing(animatedHeight, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();

      optionsRef.current.onHide?.();
    };

    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      animatedHeight.stopAnimation();
      showSub.remove();
      hideSub.remove();
    };
  }, [animatedHeight]);

  return animatedHeight;
}
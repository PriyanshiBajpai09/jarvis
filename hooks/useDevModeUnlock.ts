// useDevModeUnlock.ts — v0.9.0. Two unlock paths, both producing the
// same result: openDevMode(), which flips visibility and plays the
// voice confirmation via the EXISTING speak() function (unmodified).
//   - Web/dev: Ctrl+Shift+D, attached to window only when
//     Platform.OS === 'web'.
//   - Universal (works today on web, ready for native once a future
//     dev-build phase adds real touch handling): five taps on the Arc
//     Reactor within a 2-second rolling window.
// Escape always closes, matching the panel's required close methods.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { speak } from '../services/webVoiceService';

const TAP_COUNT_REQUIRED = 5;
const TAP_WINDOW_MS = 2000;

export function useDevModeUnlock() {
  const [isOpen, setIsOpen] = useState(false);
  const tapTimestampsRef = useRef<number[]>([]);

  const openDevMode = useCallback(() => {
    setIsOpen(true);
    speak('Admin override recognized.');
  }, []);

  const closeDevMode = useCallback(() => {
    setIsOpen(false);
  }, []);

  const registerReactorTap = useCallback(() => {
    const now = Date.now();
    const recent = tapTimestampsRef.current.filter((t) => now - t < TAP_WINDOW_MS);
    recent.push(now);
    tapTimestampsRef.current = recent;
    if (recent.length >= TAP_COUNT_REQUIRED) {
      tapTimestampsRef.current = [];
      openDevMode();
    }
  }, [openDevMode]);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && (event.key === 'D' || event.key === 'd')) {
        event.preventDefault();
        openDevMode();
      }
      if (event.key === 'Escape') {
        closeDevMode();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openDevMode, closeDevMode]);

  return { isOpen, closeDevMode, registerReactorTap };
}
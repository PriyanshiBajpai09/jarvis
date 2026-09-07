// useReducedMotion.ts
// Mirrors the web app's `prefers-reduced-motion` handling using React
// Native's AccessibilityInfo API. Components should check this before
// starting looping Animated sequences.

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        if (mounted) setReduced(!!enabled);
      })
      .catch(() => {
        /* API not available on this platform/version — default to motion on */
      });

    const subscription = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled: boolean) => {
      setReduced(enabled);
    });

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
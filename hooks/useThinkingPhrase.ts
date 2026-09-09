// useThinkingPhrase.ts — Part G: sequential progression instead of
// endless randomization. Steps through Processing -> Analyzing ->
// Routing -> Response Ready once, then holds on the final phrase until
// `active` becomes false (the reply has arrived and streaming begins).

import { useEffect, useState } from 'react';

const PROGRESSION = ['Processing...', 'Analyzing...', 'Routing...', 'Response Ready'];
const STEP_INTERVAL_MS = 650;

export function useThinkingPhrase(active: boolean): string {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return undefined;
    }

    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, PROGRESSION.length - 1));
    }, STEP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active]);

  return PROGRESSION[stepIndex];
}
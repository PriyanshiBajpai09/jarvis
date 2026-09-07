import { useEffect, useState } from "react";

const THINKING_PHRASES = [
  "Processing...",
  "Analyzing...",
  "Accessing knowledge base...",
  "Computing...",
  "Running diagnostics...",
];

function pickPhrase(exclude?: string): string {
  let next =
    THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];

  let attempts = 0;
  while (next === exclude && attempts < 5) {
    next =
      THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
    attempts++;
  }

  return next;
}

export function useThinkingPhrase(active: boolean): string {
  const [phrase, setPhrase] = useState("Processing...");

  useEffect(() => {
    let frame: number | undefined;

    if (!active) {
      frame = requestAnimationFrame(() => {
        setPhrase("Processing...");
      });

      return () => {
        if (frame !== undefined) cancelAnimationFrame(frame);
      };
    }

    frame = requestAnimationFrame(() => {
      setPhrase("Processing...");
    });

    const interval = setInterval(() => {
      setPhrase((prev) => pickPhrase(prev));
    }, 750);

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [active]);

  return phrase;
}
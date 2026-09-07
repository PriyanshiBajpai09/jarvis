// MicButton.tsx
// Holographic voice-input control — hero-grade element.
// Concentric rotating rings, animated audio spectrum, breathing bloom,
// hover/press feedback, idle float, and an active-listening pulse ring.
// No audio permissions are requested here — this is a pure UI affordance;
// wiring to real speech input is a future integration point.

import { useMemo, useState, useCallback } from 'react';

const SPECTRUM_BAR_COUNT = 16;

interface SpectrumBar {
  id: number;
  angle: number;
  height: number;
  delay: string;
  duration: string;
}

function buildSpectrumBars(): SpectrumBar[] {
  return Array.from({ length: SPECTRUM_BAR_COUNT }, (_, i) => {
    const angle = (360 / SPECTRUM_BAR_COUNT) * i;
    const wave = Math.sin(i * 0.9) * 6 + Math.cos(i * 1.6) * 4;
    return {
      id: i,
      angle,
      height: Math.max(8, Math.round(16 + wave)),
      delay: `${(i % 8) * 0.08}s`,
      duration: `${0.6 + (i % 5) * 0.1}s`,
    };
  });
}

const spectrumBars = buildSpectrumBars();

function MicButton() {
  const [isListening, setIsListening] = useState(false);

  const handleToggle = useCallback(() => {
    setIsListening((prev) => !prev);
  }, []);

  const bars = useMemo(() => spectrumBars, []);

  return (
    <span className="mic-float">
      <button
        type="button"
        className={`mic-button ${isListening ? 'mic-button--active' : ''}`}
        onClick={handleToggle}
        aria-pressed={isListening}
        aria-label={isListening ? 'Stop listening' : 'Activate voice input'}
      >
        {/* Outer bloom halo */}
        <span className="mic-button__bloom" aria-hidden="true" />

        {/* Concentric rotating rings */}
        <span className="mic-rings" aria-hidden="true">
          <span className="mic-ring mic-ring--outer" />
          <span className="mic-ring mic-ring--mid" />
          <span className="mic-ring mic-ring--inner" />
        </span>

        {/* Animated audio spectrum, radiating from center */}
        <span className="mic-spectrum" aria-hidden="true">
          {bars.map((b) => (
            <span
              key={b.id}
              className="mic-spectrum__slot"
              style={{ transform: `rotate(${b.angle}deg)` }}
            >
              <span
                className="mic-spectrum__bar"
                style={{
                  height: `${b.height}px`,
                  animationDelay: b.delay,
                  animationDuration: b.duration,
                }}
              />
            </span>
          ))}
        </span>

        {/* Glass core with mic glyph */}
        <span className="mic-core">
          <svg className="mic-core__svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="15" y="7" width="10" height="18" rx="5" fill="currentColor" />
            <path
              d="M11 18 A9 9 0 0 0 29 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line x1="20" y1="27" x2="20" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="32" x2="26" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>

        {/* Active-listening expanding pulse ring */}
        {isListening && <span className="mic-listening-pulse" aria-hidden="true" />}
        {isListening && <span className="mic-listening-pulse mic-listening-pulse--delay" aria-hidden="true" />}
      </button>
    </span>
  );
}

export default MicButton;
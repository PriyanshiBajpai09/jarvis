// SystemStatus.tsx
// Left HUD panel: live-feeling system diagnostics for the JARVIS interface.
// Values are simulated locally for now (no backend). The metric list and
// update mechanism are intentionally isolated so a real telemetry feed can
// be swapped in later without touching layout or styling.

import { useEffect, useRef, useState } from 'react';

interface Metric {
  id: string;
  label: string;
  value: number; // 0-100 normalized for the bar
  display: string; // formatted text shown to the user
  tone: 'cyan' | 'warn' | 'safe';
}

const INITIAL_METRICS: Metric[] = [
  { id: 'cpu', label: 'CPU Load', value: 47, display: '47%', tone: 'cyan' },
  { id: 'temp', label: 'Core Temperature', value: 38, display: '38°C', tone: 'cyan' },
  { id: 'shield', label: 'Shield Integrity', value: 78, display: '78%', tone: 'safe' },
  { id: 'sync', label: 'Neural Sync', value: 100, display: '100%', tone: 'safe' },
  { id: 'network', label: 'Network', value: 91, display: '91%', tone: 'cyan' },
  { id: 'power', label: 'Power Reserve', value: 64, display: '64%', tone: 'warn' },
];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toneForValue(id: string, value: number): Metric['tone'] {
  if (id === 'power' || id === 'shield') {
    if (value < 35) return 'warn';
    return value < 65 ? 'cyan' : 'safe';
  }
  return 'cyan';
}

/** Deterministic-looking jagged waveform path, animated via CSS transform (cheap, GPU-friendly). */
function buildWavePath(seed: number): string {
  const points: string[] = [];
  const width = 200;
  const segments = 24;
  for (let i = 0; i <= segments; i += 1) {
    const x = (width / segments) * i;
    const noise = Math.sin(i * 0.9 + seed) * 6 + Math.sin(i * 2.3 + seed * 1.7) * 3;
    const y = 18 + noise;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

const wavePathA = buildWavePath(1.2);
const wavePathB = buildWavePath(4.6);

function SystemStatus() {
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const reducedMotionRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Respect reduced-motion: keep values static rather than fluctuating.
    if (reducedMotionRef.current) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMetrics((prev) =>
        prev.map((m) => {
          const drift = (Math.random() - 0.5) * 6;
          const nextValue = clamp(Math.round(m.value + drift), 4, 100);
          const display = m.id === 'temp' ? `${clamp(Math.round(38 + drift / 2), 30, 62)}°C` : `${nextValue}%`;
          return {
            ...m,
            value: nextValue,
            display,
            tone: toneForValue(m.id, nextValue),
          };
        })
      );
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside className="hud-panel hud-panel--left glass-panel corner-brackets">
      <div className="hud-panel__header">
        <span className="hud-panel__title">System Status</span>
        <span className="hud-panel__pulse" />
      </div>

      <div className="hud-metrics">
        {metrics.map((m) => (
          <div className="hud-readout" key={m.id}>
            <div className="hud-readout__row">
              <span className="hud-readout__label">{m.label}</span>
              <span className={`hud-readout__value hud-readout__value--${m.tone}`}>{m.display}</span>
            </div>
            <div className="hud-readout__bar">
              <span
                className={`hud-readout__fill hud-readout__fill--${m.tone}`}
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hud-waveform">
        <span className="hud-waveform__label">Live Telemetry</span>
        <svg className="hud-waveform__svg" viewBox="0 0 200 36" preserveAspectRatio="none" aria-hidden="true">
          <path className="hud-waveform__path hud-waveform__path--a" d={wavePathA} fill="none" />
          <path className="hud-waveform__path hud-waveform__path--b" d={wavePathB} fill="none" />
        </svg>
      </div>

      <div className="hud-panel__footer">
        <span className="hud-panel__footer-dot" />
        <span className="hud-panel__footer-text">All Systems Nominal</span>
      </div>
    </aside>
  );
}

export default SystemStatus;
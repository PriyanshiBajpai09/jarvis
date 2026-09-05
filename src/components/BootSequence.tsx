// BootSequence.tsx
// MK-85 cinematic boot sequence, shown before the HUD becomes interactive.
//
// Structure is intentionally self-contained: a single progress value (0-100)
// driven by requestAnimationFrame drives every stage transition. This makes
// it trivial later to hook a real backend readiness signal, a boot chime, or
// a reactor hum in place of the fixed timeline — see the TODO markers below.
//
// The component reuses the app's existing background layers (.holo-grid,
// .particle-field, .vignette, .scanline-overlay) so the boot screen shares
// the exact same visual language as the HUD it precedes, rather than being a
// separate generic loader.

import { useEffect, useMemo, useRef, useState } from 'react';

interface BootSequenceProps {
  /** Called once, when the exit transition finishes and the HUD should take over. */
  onComplete?: () => void;
}

/* ---------------------------------------------------------------- */
/* Timing                                                            */
/* ---------------------------------------------------------------- */

const TOTAL_DURATION_MS = 7200;
const REDUCED_DURATION_MS = 1400;
const HOLD_AFTER_COMPLETE_MS = 1100;
const REDUCED_HOLD_MS = 300;
const EXIT_DURATION_MS = 900;
const REDUCED_EXIT_MS = 300;

const LOG_LINES = [
  'Initializing Neural Core...',
  'Loading Cognitive Matrix...',
  'Calibrating Holographic Systems...',
  'Authenticating User...',
];

const CHECKLIST_ITEMS = ['Prompt Shield', 'Memory Vault', 'Voice Engine', 'System Integrity'];

/* ---------------------------------------------------------------- */
/* Mini Arc Reactor — same visual language as ArcReactorCore.tsx,   *
 * scaled down and self-contained (own gradient/filter ids so it   *
 * never collides with the main reactor rendering underneath).     */
/* ---------------------------------------------------------------- */

const MINI_CENTER = 100;
const DEG_TO_RAD = Math.PI / 180;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * DEG_TO_RAD;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(cx: number, cy: number, rInner: number, rOuter: number, start: number, end: number) {
  const outerStart = polar(cx, cy, rOuter, end);
  const outerEnd = polar(cx, cy, rOuter, start);
  const innerEnd = polar(cx, cy, rInner, start);
  const innerStart = polar(cx, cy, rInner, end);
  const largeArc = end - start <= 180 ? 0 : 1;
  return [
    'M', outerStart.x, outerStart.y,
    'A', rOuter, rOuter, 0, largeArc, 0, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', rInner, rInner, 0, largeArc, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
}

const MINI_SEGMENT_COUNT = 12;
const MINI_GAP = 5;
const MINI_SPAN = 360 / MINI_SEGMENT_COUNT - MINI_GAP;

const miniSegments = Array.from({ length: MINI_SEGMENT_COUNT }, (_, i) => {
  const start = i * (360 / MINI_SEGMENT_COUNT) + MINI_GAP / 2;
  const end = start + MINI_SPAN;
  return { key: `mini-seg-${i}`, d: segmentPath(MINI_CENTER, MINI_CENTER, 62, 84, start, end) };
});

const miniTicks = Array.from({ length: 36 }, (_, i) => {
  const angle = i * 10;
  const isMajor = angle % 30 === 0;
  const outer = polar(MINI_CENTER, MINI_CENTER, 42, angle);
  const inner = polar(MINI_CENTER, MINI_CENTER, isMajor ? 34 : 38, angle);
  return { key: `mini-tick-${i}`, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, isMajor };
});

interface MiniReactorProps {
  /** 3 = spinning up, 4 = verifying (steady), 5 = fully bright */
  intensity: 3 | 4 | 5;
}

function MiniReactor({ intensity }: MiniReactorProps) {
  return (
    <div className={`boot-reactor-wrap boot-reactor-wrap--${intensity}`}>
      <svg
        className="boot-reactor-svg"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Reactor initializing"
      >
        <defs>
          <radialGradient id="bootCoreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#aef6ff" />
            <stop offset="65%" stopColor="#00eaff" />
            <stop offset="100%" stopColor="#0057b8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bootHaloGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00eaff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#00eaff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00eaff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bootGlassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,234,255,0.34)" />
            <stop offset="50%" stopColor="rgba(0,234,255,0.06)" />
            <stop offset="100%" stopColor="rgba(0,234,255,0.24)" />
          </linearGradient>
          <filter id="bootBloom" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="bootSoftBlur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <circle cx={MINI_CENTER} cy={MINI_CENTER} r="90" fill="none" stroke="rgba(0,234,255,0.3)" strokeWidth="2" />

        <g className="boot-reactor-segments">
          {miniSegments.map((s) => (
            <path key={s.key} d={s.d} fill="url(#bootGlassGradient)" stroke="rgba(0,234,255,0.55)" strokeWidth="1" />
          ))}
        </g>

        <g className="boot-reactor-ticks">
          <circle cx={MINI_CENTER} cy={MINI_CENTER} r="42" fill="none" stroke="rgba(0,234,255,0.25)" strokeWidth="0.75" />
          {miniTicks.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.isMajor ? 'var(--cyan)' : 'rgba(0,234,255,0.4)'}
              strokeWidth={t.isMajor ? 1.4 : 0.7}
            />
          ))}
        </g>

        <circle
          className="boot-reactor-halo"
          cx={MINI_CENTER}
          cy={MINI_CENTER}
          r="30"
          fill="url(#bootHaloGradient)"
          filter="url(#bootSoftBlur)"
        />
        <circle cx={MINI_CENTER} cy={MINI_CENTER} r="18" fill="url(#bootCoreGradient)" filter="url(#bootBloom)" />
        <circle className="boot-reactor-core-flicker" cx={MINI_CENTER} cy={MINI_CENTER} r="7" fill="#ffffff" />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Boot particle field — smaller, local copy of the app's generator */
/* ---------------------------------------------------------------- */

interface BootParticle {
  id: number;
  left: string;
  size: string;
  duration: string;
  delay: string;
  drift: string;
}

function generateBootParticles(count: number): BootParticle[] {
  const particles: BootParticle[] = [];
  for (let i = 0; i < count; i += 1) {
    particles.push({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${1.5 + Math.random() * 2}px`,
      duration: `${7 + Math.random() * 8}s`,
      delay: `${Math.random() * 6}s`,
      drift: `${(Math.random() - 0.5) * 60}px`,
    });
  }
  return particles;
}

/* ---------------------------------------------------------------- */
/* Main component                                                    */
/* ---------------------------------------------------------------- */

type BootPhase = 'booting' | 'exiting' | 'hidden';

function BootSequence({ onComplete }: BootSequenceProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<BootPhase>('booting');

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const exitTimeoutRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);
  const completedRef = useRef(false);

  const particles = useMemo(() => generateBootParticles(24), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const duration = reducedMotionRef.current ? REDUCED_DURATION_MS : TOTAL_DURATION_MS;

    function step(timestamp: number) {
      if (startRef.current === null) {
        startRef.current = timestamp;
      }
      const elapsed = timestamp - startRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      if (completedRef.current) return;
      completedRef.current = true;

      // TODO(future): trigger boot chime / reactor hum here once audio is wired in.
      const holdMs = reducedMotionRef.current ? REDUCED_HOLD_MS : HOLD_AFTER_COMPLETE_MS;
      holdTimeoutRef.current = window.setTimeout(() => {
        setPhase('exiting');
        const exitMs = reducedMotionRef.current ? REDUCED_EXIT_MS : EXIT_DURATION_MS;
        exitTimeoutRef.current = window.setTimeout(() => {
          setPhase('hidden');
          onComplete?.();
        }, exitMs);
      }, holdMs);
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (holdTimeoutRef.current !== null) window.clearTimeout(holdTimeoutRef.current);
      if (exitTimeoutRef.current !== null) window.clearTimeout(exitTimeoutRef.current);
    };
    // Intentionally run once — the whole sequence is timeline-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === 'hidden') {
    return null;
  }

  const stage = progress < 15 ? 1 : progress < 35 ? 2 : progress < 65 ? 3 : progress < 90 ? 4 : 5;

  const logVisibleCount =
    stage >= 2
      ? Math.min(LOG_LINES.length, Math.max(1, Math.ceil(((Math.min(progress, 35) - 15) / 20) * LOG_LINES.length)))
      : 0;

  const checklistVisibleCount =
    stage === 5
      ? CHECKLIST_ITEMS.length
      : stage === 4
      ? Math.min(
          CHECKLIST_ITEMS.length,
          Math.max(1, Math.ceil(((Math.min(progress, 90) - 65) / 25) * CHECKLIST_ITEMS.length))
        )
      : 0;

  const reactorIntensity: 3 | 4 | 5 = stage <= 3 ? 3 : stage === 4 ? 4 : 5;

  return (
    <div
      className={`boot-sequence ${phase === 'exiting' ? 'boot-sequence--exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Jarvis operating system booting"
    >
      {/* Reused background layers — identical visual language to the HUD */}
      <div className="holo-grid" />
      <div className="particle-field">
        {particles.map((p) => (
          <span
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ['--drift' as any]: p.drift,
            }}
          />
        ))}
      </div>
      <div className="vignette" />
      <div className="scanline-overlay" />

      <div className="boot-stage-content">
        <div className="boot-title-block">
          <span className="boot-title">JARVIS</span>
          <span className="boot-subtitle">Mark LXXXV Operating System</span>
        </div>

        {stage <= 2 && (
          <div className="boot-log-panel glass-panel corner-brackets">
            {LOG_LINES.slice(0, logVisibleCount).map((line, i) => (
              <p key={line} className="boot-log-line" style={{ animationDelay: `${i * 0.06}s` }}>
                <span className="boot-log-caret">&gt;</span> {line}
              </p>
            ))}
          </div>
        )}

        {stage >= 3 && (
          <div className="boot-reactor-stage">
            <MiniReactor intensity={reactorIntensity} />
          </div>
        )}

        {stage === 4 && (
          <div className="boot-checklist glass-panel corner-brackets">
            {CHECKLIST_ITEMS.slice(0, checklistVisibleCount).map((item, i) => (
              <div key={item} className="boot-checklist-item" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="boot-checklist-check">&#10003;</span>
                <span className="boot-checklist-label">{item}</span>
              </div>
            ))}
          </div>
        )}

        {stage === 5 && (
          <div className="boot-welcome">
            <p className="boot-welcome-line">Welcome, Priyanshi.</p>
            <p className="boot-welcome-line boot-welcome-line--accent">Jarvis Online.</p>
          </div>
        )}
      </div>

      <div className="boot-progress-block">
        <span className="boot-progress-percent">{Math.floor(progress)}%</span>
        <div className="boot-progress-bar">
          <span className="boot-progress-fill" style={{ width: `${progress}%` }} />
          <span className="boot-progress-energy" />
        </div>
      </div>

      <div className="boot-flash" aria-hidden="true" />
    </div>
  );
}

export default BootSequence;
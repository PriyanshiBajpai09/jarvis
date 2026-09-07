// ArcReactorCore.tsx
// MK-85 Arc Reactor — precise SVG geometry, layered rotating rings,
// mechanical glass segments, HUD tick marks, and a volumetric hologram beam.
//
// PHASE 5 NOTE: existing ring/segment/tick geometry and rotation groups are
// UNCHANGED. Additions in this pass — brushed scratches, calibration labels,
// warning LEDs, a second core pulse ring, and chromatic core glow — are
// appended as new decorative layers only. Nothing structural moved.

const CENTER = 200;
const DEG_TO_RAD = Math.PI / 180;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg - 90) * DEG_TO_RAD;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

/** Filled annular sector (used for the 12 mechanical glass segments). */
function describeSegment(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(cx, cy, rOuter, endAngle);
  const outerEnd = polarToCartesian(cx, cy, rOuter, startAngle);
  const innerEnd = polarToCartesian(cx, cy, rInner, startAngle);
  const innerStart = polarToCartesian(cx, cy, rInner, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M', outerStart.x, outerStart.y,
    'A', rOuter, rOuter, 0, largeArc, 0, outerEnd.x, outerEnd.y,
    'L', innerEnd.x, innerEnd.y,
    'A', rInner, rInner, 0, largeArc, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
}

/** Open stroked arc (used for HUD dashed rings). */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return ['M', start.x, start.y, 'A', r, r, 0, largeArc, 0, end.x, end.y].join(' ');
}

/* ---------------------------------------------------------------- */
/* Static geometry — computed once at module load, never per render */
/* ---------------------------------------------------------------- */

const SEGMENT_COUNT = 12;
const SEGMENT_GAP_DEG = 4;
const SEGMENT_SPAN_DEG = 360 / SEGMENT_COUNT - SEGMENT_GAP_DEG;

const glassSegments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
  const start = i * (360 / SEGMENT_COUNT) + SEGMENT_GAP_DEG / 2;
  const end = start + SEGMENT_SPAN_DEG;
  return {
    key: `seg-${i}`,
    d: describeSegment(CENTER, CENTER, 136, 178, start, end),
  };
});

const structuralSpokes = Array.from({ length: 12 }, (_, i) => {
  const angle = i * 30;
  const outer = polarToCartesian(CENTER, CENTER, 134, angle);
  const inner = polarToCartesian(CENTER, CENTER, 96, angle);
  return { key: `spoke-${i}`, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, angle };
});

const tickMarks = Array.from({ length: 60 }, (_, i) => {
  const angle = i * 6;
  const isMajor = angle % 30 === 0;
  const outer = polarToCartesian(CENTER, CENTER, 92, angle);
  const inner = polarToCartesian(CENTER, CENTER, isMajor ? 76 : 84, angle);
  return {
    key: `tick-${i}`,
    x1: outer.x,
    y1: outer.y,
    x2: inner.x,
    y2: inner.y,
    isMajor,
  };
});

const hudArcs = [
  { key: 'hud-a', d: describeArc(CENTER, CENTER, 68, 10, 95) },
  { key: 'hud-b', d: describeArc(CENTER, CENTER, 68, 130, 200) },
  { key: 'hud-c', d: describeArc(CENTER, CENTER, 68, 235, 290) },
  { key: 'hud-d', d: describeArc(CENTER, CENTER, 68, 315, 350) },
];

const innerBlips = Array.from({ length: 8 }, (_, i) => {
  const angle = i * 45;
  const pos = polarToCartesian(CENTER, CENTER, 52, angle);
  return { key: `blip-${i}`, cx: pos.x, cy: pos.y };
});

const grooveRadii = [188, 182, 176, 170];

/* ---------------------------------------------------------------- */
/* Mechanical detail (added Phase 4/5) — additive only              */
/* ---------------------------------------------------------------- */

const boltPositions = structuralSpokes.map((s, i) => {
  const pos = polarToCartesian(CENTER, CENTER, 190, s.angle);
  return { key: `bolt-${i}`, cx: pos.x, cy: pos.y };
});

const WARN_LED_INDICES = new Set([5, 17]);

const ledPositions = Array.from({ length: 24 }, (_, i) => {
  const angle = i * 15;
  const pos = polarToCartesian(CENTER, CENTER, 158, angle);
  return {
    key: `led-${i}`,
    cx: pos.x,
    cy: pos.y,
    delay: (i % 8) * 0.35,
    tone: WARN_LED_INDICES.has(i) ? ('warn' as const) : ('cyan' as const),
  };
});

const turbineBlades = Array.from({ length: 28 }, (_, i) => {
  const angle = (360 / 28) * i;
  const bladeSweep = 6;
  const outer = polarToCartesian(CENTER, CENTER, 100, angle);
  const inner = polarToCartesian(CENTER, CENTER, 84, angle + bladeSweep);
  return { key: `blade-${i}`, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y };
});

/* ---------------------------------------------------------------- */
/* NEW (Phase 5) — brushed scratches + calibration labels           */
/* ---------------------------------------------------------------- */

// Short faint arc-scratches on the metallic housing, randomized once at module load.
const brushedScratches = Array.from({ length: 34 }, (_, i) => {
  const angle = (i * 137.5) % 360; // golden-angle spread for even, non-repeating look
  const radius = 172 + ((i * 7) % 14);
  const sweep = 4 + (i % 3) * 2;
  return {
    key: `scratch-${i}`,
    d: describeArc(CENTER, CENTER, radius, angle, angle + sweep),
    opacity: 0.08 + (i % 4) * 0.02,
  };
});

const calibrationLabels = [
  { key: 'cal-1', text: 'CAL-01', angle: 20 },
  { key: 'cal-2', text: 'SYNC', angle: 110 },
  { key: 'cal-3', text: 'PWR-OK', angle: 200 },
  { key: 'cal-4', text: 'MK-85', angle: 290 },
];

function ArcReactorCore() {
  return (
    <div className="arc-reactor-wrapper">
      <div className="arc-reactor-beam arc-reactor-beam--up" />
      <div className="arc-reactor-beam arc-reactor-beam--down" />

      <div className="arc-reactor-float">
        <svg
          className="arc-reactor-svg"
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Arc Reactor Core"
        >
          <defs>
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="28%" stopColor="#aef6ff" />
              <stop offset="60%" stopColor="#00eaff" />
              <stop offset="100%" stopColor="#0057b8" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="coreHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00eaff" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#00eaff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00eaff" stopOpacity="0" />
            </radialGradient>

            {/* NEW: chromatic fringe — a faint blue-shifted halo offset from the
                cyan halo, giving a subtle lens-chromatic-aberration look */}
            <radialGradient id="coreChromatic" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#7d9bff" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#3a6bff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3a6bff" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d1b33" />
              <stop offset="45%" stopColor="#1c3355" />
              <stop offset="55%" stopColor="#0a1424" />
              <stop offset="100%" stopColor="#152840" />
            </linearGradient>

            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,234,255,0.32)" />
              <stop offset="45%" stopColor="rgba(0,234,255,0.08)" />
              <stop offset="55%" stopColor="rgba(0,234,255,0.02)" />
              <stop offset="100%" stopColor="rgba(0,234,255,0.22)" />
            </linearGradient>

            <linearGradient id="chamferGradient" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#dff6ff" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#0a1424" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#0a1424" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#7df9ff" stopOpacity="0.6" />
            </linearGradient>

            <filter id="reactorBloom" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="softBlur" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="10" />
            </filter>

            <filter id="ledGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          {/* ---------- Static outer housing: metallic grooves + chamfer ---------- */}
          <g className="arc-ring-static">
            <circle
              cx={CENTER}
              cy={CENTER}
              r="198"
              fill="none"
              stroke="url(#chamferGradient)"
              strokeWidth="4"
              opacity="0.85"
            />
            <circle cx={CENTER} cy={CENTER} r="196" fill="none" stroke="url(#metalGradient)" strokeWidth="6" />

            {/* NEW: brushed metal micro scratches on the housing band */}
            <g className="arc-scratches">
              {brushedScratches.map((s) => (
                <path key={s.key} d={s.d} fill="none" stroke="#bfe9ff" strokeWidth="0.5" opacity={s.opacity} />
              ))}
            </g>

            {grooveRadii.map((r) => (
              <circle
                key={`groove-${r}`}
                cx={CENTER}
                cy={CENTER}
                r={r}
                fill="none"
                stroke="rgba(0,234,255,0.18)"
                strokeWidth="0.75"
              />
            ))}
            {structuralSpokes.map((s) => (
              <line
                key={s.key}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="rgba(0,234,255,0.22)"
                strokeWidth="1.5"
              />
            ))}
            {boltPositions.map((b) => (
              <g key={b.key}>
                <circle cx={b.cx} cy={b.cy} r="3.2" fill="#0e1c33" stroke="rgba(0,234,255,0.4)" strokeWidth="0.6" />
                <circle cx={b.cx - 0.6} cy={b.cy - 0.6} r="0.9" fill="rgba(200,240,255,0.7)" />
              </g>
            ))}
            <circle cx={CENTER} cy={CENTER} r="96" fill="none" stroke="rgba(0,234,255,0.3)" strokeWidth="1.5" />
          </g>

          {/* ---------- NEW: rotating calibration labels, own slow ring ---------- */}
          <g className="arc-ring-calibration">
            {calibrationLabels.map((c) => {
              const pos = polarToCartesian(CENTER, CENTER, 114, c.angle);
              return (
                <text
                  key={c.key}
                  x={pos.x}
                  y={pos.y}
                  className="arc-calibration-text"
                  textAnchor="middle"
                  transform={`rotate(${c.angle}, ${pos.x}, ${pos.y})`}
                >
                  {c.text}
                </text>
              );
            })}
          </g>

          {/* ---------- Rotating ring 1: 12 mechanical glass segments ---------- */}
          <g className="arc-ring-segments">
            {glassSegments.map((seg) => (
              <path
                key={seg.key}
                d={seg.d}
                fill="url(#glassGradient)"
                stroke="rgba(0,234,255,0.55)"
                strokeWidth="1.25"
              />
            ))}
            <g filter="url(#reactorBloom)" opacity="0.35">
              {glassSegments.map((seg) => (
                <path key={`glow-${seg.key}`} d={seg.d} fill="none" stroke="var(--cyan)" strokeWidth="1" />
              ))}
            </g>
          </g>

          {/* ---------- Counter-rotating ring 2: tick marks + turbine blades ---------- */}
          <g className="arc-ring-ticks">
            <circle cx={CENTER} cy={CENTER} r="92" fill="none" stroke="rgba(0,234,255,0.25)" strokeWidth="1" />
            <circle cx={CENTER} cy={CENTER} r="76" fill="none" stroke="rgba(0,234,255,0.18)" strokeWidth="0.75" />
            {tickMarks.map((t) => (
              <line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isMajor ? 'var(--cyan)' : 'rgba(0,234,255,0.45)'}
                strokeWidth={t.isMajor ? 1.6 : 0.8}
              />
            ))}
            {turbineBlades.map((b) => (
              <line
                key={b.key}
                x1={b.x1}
                y1={b.y1}
                x2={b.x2}
                y2={b.y2}
                stroke="rgba(0,234,255,0.3)"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* ---------- Rotating ring 3: HUD dashed arcs ---------- */}
          <g className="arc-ring-hud">
            {hudArcs.map((arc) => (
              <path
                key={arc.key}
                d={arc.d}
                fill="none"
                stroke="var(--cyan-soft)"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
            ))}
            <circle cx={CENTER} cy={CENTER} r="60" fill="none" stroke="rgba(0,234,255,0.2)" strokeWidth="0.75" />
          </g>

          {/* ---------- Counter-rotating ring 4: inner mechanical blips ---------- */}
          <g className="arc-ring-inner">
            <circle cx={CENTER} cy={CENTER} r="52" fill="none" stroke="rgba(0,234,255,0.3)" strokeWidth="1" />
            {innerBlips.map((b) => (
              <circle key={b.key} cx={b.cx} cy={b.cy} r="2.6" fill="var(--cyan)" opacity="0.85" />
            ))}
          </g>

          {/* Status LEDs — mostly cyan, two amber warning LEDs mixed in */}
          <g className="arc-led-group" filter="url(#ledGlow)">
            {ledPositions.map((l) => (
              <circle
                key={l.key}
                className={`arc-led ${l.tone === 'warn' ? 'arc-led--warn' : ''}`}
                cx={l.cx}
                cy={l.cy}
                r={l.tone === 'warn' ? 1.9 : 1.6}
                fill={l.tone === 'warn' ? '#ffb300' : 'var(--cyan-soft)'}
                style={{ animationDelay: `${l.delay}s` }}
              />
            ))}
          </g>

          {/* Energy ripple expanding outward from the core, staggered */}
          <g className="arc-ripple-group">
            <circle className="arc-ripple" cx={CENTER} cy={CENTER} r="44" />
            <circle className="arc-ripple arc-ripple--delay-1" cx={CENTER} cy={CENTER} r="44" />
            <circle className="arc-ripple arc-ripple--delay-2" cx={CENTER} cy={CENTER} r="44" />
          </g>

          {/* ---------- Core ---------- */}
          {/* NEW: chromatic halo sits beneath the cyan halo for a lens-fringe look */}
          <circle
            className="arc-core-chromatic"
            cx={CENTER}
            cy={CENTER - 1.5}
            r="72"
            fill="url(#coreChromatic)"
            filter="url(#softBlur)"
          />
          <circle
            className="arc-core-breathe"
            cx={CENTER}
            cy={CENTER}
            r="70"
            fill="url(#coreHalo)"
            filter="url(#softBlur)"
          />
          <circle cx={CENTER} cy={CENTER} r="42" fill="url(#coreGradient)" filter="url(#reactorBloom)" />
          <circle className="arc-core-flicker" cx={CENTER} cy={CENTER} r="16" fill="#ffffff" />

          {/* NEW: second, slower core pulse ring for layered energy depth */}
          <circle className="arc-core-pulse-ring" cx={CENTER} cy={CENTER} r="24" fill="none" stroke="#eafcff" />

          <circle className="arc-lensflare-dot" cx={CENTER - 26} cy={CENTER - 30} r="4" fill="#ffffff" opacity="0.6" />
        </svg>

        <div className="arc-reactor-reflection" />
      </div>

      <div className="arc-reactor-pedestal">
        <div className="arc-reactor-pedestal__ring" />
        <div className="arc-reactor-pedestal__base" />
      </div>
    </div>
  );
}

export default ArcReactorCore;
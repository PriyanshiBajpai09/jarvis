import { useMemo } from 'react';
import HoloHeader from './components/HoloHeader';
import ArcReactorCore from './components/ArcReactorCore';
import SystemStatus from './components/SystemStatus';
import ChatPanel from './components/ChatPanel';
import MicButton from './components/MicButton';
import BootSequence from './components/BootSequence';
import './styles/jarvis.css';

interface ParticleConfig {
  id: number;
  left: string;
  size: string;
  duration: string;
  delay: string;
  drift: string;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  for (let i = 0; i < count; i += 1) {
    particles.push({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${1.5 + Math.random() * 2.5}px`,
      duration: `${8 + Math.random() * 10}s`,
      delay: `${Math.random() * 10}s`,
      drift: `${(Math.random() - 0.5) * 80}px`,
    });
  }
  return particles;
}

function App() {
  const particles = useMemo(() => generateParticles(36), []);

  return (
    <div className="app-root">
      {/*
        BootSequence is a self-removing overlay: it renders on top of the
        HUD (via its own fixed positioning + z-index) and returns null once
        its exit animation finishes. The HUD underneath is always mounted,
        so nothing needs to wait on boot state here.
      */}
      <BootSequence />

      {/* Layered atmospheric background (existing layers preserved) */}
      <div className="holo-grid" />
      <div className="hex-pattern-bg" aria-hidden="true" />
      <div className="light-rays-bg" aria-hidden="true" />
      <div className="light-streaks-bg" aria-hidden="true">
        <span className="light-streak" />
        <span className="light-streak light-streak--b" />
      </div>
      <div className="volumetric-fog-bg" aria-hidden="true" />
      <div className="radar-sweep-bg" aria-hidden="true" />

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

      {/* HUD Header (untouched) */}
      <HoloHeader />

      {/* Main content */}
      <main className="hud-main">
        <section className="welcome-console glass-panel corner-brackets">
          <p className="welcome-console__line">Good morning, Priyanshi.</p>
          <p className="welcome-console__line welcome-console__line--accent">I'm Jarvis.</p>
          <p className="welcome-console__line">Everything is ready.</p>
          <p className="welcome-console__line">What are we building today?</p>
        </section>

        {/* ================= HERO STAGE (layout preserved) ================= */}
        <section className="hero-stage">
          <div className="hero-stage__inner">
            <div className="stage-backdrop" aria-hidden="true">
              <div className="stage-ring stage-ring--outer" />
              <div className="stage-ring stage-ring--dotted" />
              <div className="stage-ring stage-ring--calibration" />
              <div className="stage-ring stage-ring--scan" />
              <div className="stage-ring stage-ring--hud-circle" />
              <div className="stage-crosshair stage-crosshair--h" />
              <div className="stage-crosshair stage-crosshair--v" />
              <div className="stage-lensflare stage-lensflare--a" />
              <div className="stage-lensflare stage-lensflare--b" />
              <div className="stage-targeting-glyph" />
            </div>

            <div className="hero-stage__grid">
              <SystemStatus />

              <div className="reactor-stage">
                <div className="reactor-stage__bloom" aria-hidden="true" />
                <div className="reactor-stage__flare" aria-hidden="true" />
                <ArcReactorCore />
              </div>

              <ChatPanel />
            </div>

            {/* Bottom floating command dock */}
            <div className="command-dock glass-panel corner-brackets">
              <div className="command-dock__slot command-dock__slot--mic">
                <div className="mic-dock-scale">
                  <MicButton />
                </div>
                <span className="command-dock__label">Voice</span>
              </div>

              <span className="command-dock__separator" />

              <div className="command-dock__slot">
                <span className="command-dock__icon command-dock__icon--sys" />
                <span className="command-dock__label">System</span>
              </div>

              <span className="command-dock__separator" />

              <div className="command-dock__slot command-dock__slot--primary command-dock__slot--active">
                <span className="command-dock__icon command-dock__icon--core" />
                <span className="command-dock__label">Core</span>
              </div>

              <span className="command-dock__separator" />

              <div className="command-dock__slot">
                <span className="command-dock__icon command-dock__icon--net" />
                <span className="command-dock__label">Network</span>
              </div>

              <span className="command-dock__separator" />

              <div className="command-dock__slot">
                <span className="command-dock__icon command-dock__icon--pwr" />
                <span className="command-dock__label">Power</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
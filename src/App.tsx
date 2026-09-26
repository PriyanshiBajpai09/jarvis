import { useEffect, useMemo, useState } from "react";

import HoloHeader from "./components/HoloHeader";
import ArcReactorCore from "./components/ArcReactorCore";
import SystemStatus from "./components/SystemStatus";
import ChatPanel from "./components/ChatPanel";
import MicButton from "./components/MicButton";
import BootSequence from "./components/BootSequence";
import IdentityGate from "./components/IdentityGate";

import "./styles/jarvis.css";

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

  for (let i = 0; i < count; i++) {
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

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  return "Good evening";
}

function App() {
  const particles = useMemo(() => generateParticles(36), []);

  const [userName, setUserName] = useState(
    localStorage.getItem("jarvis_name") || "Commander"
  );

  useEffect(() => {
    const update = () => {
      setUserName(localStorage.getItem("jarvis_name") || "Commander");
    };

    window.addEventListener("jarvis-name-updated", update);

    return () => {
      window.removeEventListener("jarvis-name-updated", update);
    };
  }, []);

  return (
    <IdentityGate>
      <div className="app-root">
        <BootSequence />

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
              style={
                {
                  left: p.left,
                  width: p.size,
                  height: p.size,
                  animationDuration: p.duration,
                  animationDelay: p.delay,
                  "--drift": p.drift,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <div className="vignette" />
        <div className="scanline-overlay" />

        <HoloHeader />

        <main className="hud-main">
          <section className="welcome-console glass-panel corner-brackets">
            <p className="welcome-console__line">
              {getGreeting()}, {userName}.
            </p>

            <p className="welcome-console__line welcome-console__line--accent">
              I'm Jarvis.
            </p>

            <p className="welcome-console__line">
              Everything is ready.
            </p>

            <p className="welcome-console__line">
              What are we building today?
            </p>
          </section>

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
                  <div className="reactor-stage__bloom" />
                  <div className="reactor-stage__flare" />
                  <ArcReactorCore />
                </div>

                <ChatPanel />
              </div>

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
    </IdentityGate>
  );
}

export default App;
import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "jarvis_name";

interface IdentityGateProps {
  children: ReactNode;
}

export default function IdentityGate({ children }: IdentityGateProps) {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [storedName, setStoredName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setStoredName(saved);
    }

    setReady(true);
  }, []);

  function authorize() {
    const clean = name.trim();

    if (!clean) return;

    localStorage.setItem(STORAGE_KEY, clean);
    setStoredName(clean);

    // Notify the whole app that identity changed.
    window.dispatchEvent(new CustomEvent("jarvis-name-updated"));
  }

  if (!ready) return null;

  if (storedName) {
    return <>{children}</>;
  }

  return (
    <div className="identity-overlay">
      <div className="identity-card corner-brackets">
        <div className="identity-scanline" />

        <p className="identity-label">IDENTITY AUTHORIZATION</p>

        <h1 className="identity-title">JARVIS</h1>

        <p className="identity-subtitle">
          State your callsign to initialize your personal operating system.
        </p>

        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") authorize();
          }}
          placeholder="Enter your callsign"
          className="identity-input"
        />

        <button className="identity-button" onClick={authorize}>
          AUTHORIZE
        </button>

        <div className="identity-footer">
          Neural Link • Awaiting Identity
        </div>
      </div>
    </div>
  );
}
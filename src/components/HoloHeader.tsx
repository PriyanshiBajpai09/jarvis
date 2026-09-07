import { useEffect, useState } from 'react';

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options).toUpperCase();
}

function HoloHeader() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="holo-header">
      <div className="holo-header__inner">
        {/* Brand */}
        <div className="holo-header__brand">
          <div className="holo-header__emblem" />
          <div className="holo-header__titles">
            <span className="holo-header__title">JARVIS</span>
            <span className="holo-header__subtitle">Mark LXXXV Operating System</span>
          </div>
        </div>

        {/* Status readouts */}
        <div className="holo-header__status">
          <div className="status-pill">
            <span className="status-pill__dot" />
            <span className="status-pill__label">Power 100%</span>
          </div>

          <div className="status-pill">
            <span className="radar-mini" />
            <span className="status-pill__label">Signal Locked</span>
          </div>

          <div className="status-pill status-pill--warn">
            <span className="status-pill__dot" />
            <span className="status-pill__label">Defense Standby</span>
          </div>

          <div className="holo-header__clock">
            <span className="holo-header__time">{formatTime(now)}</span>
            <span className="holo-header__date">{formatDate(now)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HoloHeader;
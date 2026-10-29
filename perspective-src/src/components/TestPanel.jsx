import { useEffect, useRef } from 'react';
import { LENSES, LENS_META } from '../content.js';

export default function TestPanel({ record, log, phase, lens, onClose, onSimulateReturn, onFirstVisit, onReplayIntro }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <section className="test-panel" aria-labelledby="test-title" tabIndex={-1} ref={ref}>
      <header className="tp-head">
        <h2 id="test-title">Test mode</h2>
        <button type="button" className="tp-close" onClick={onClose} aria-label="Close test mode">
          ×
        </button>
      </header>

      <p className="tp-note">
        Simulate visits without waiting for real ones. Everything here reads and writes the same localStorage the site
        uses.
      </p>

      <div className="tp-group">
        <h3>Simulate a returning visitor</h3>
        <p className="tp-hint">Pretends you chose a lens 4 days ago, then reloads the opening as a return visit.</p>
        <div className="tp-row">
          {LENSES.map((l) => (
            <button key={l} type="button" className={`tp-btn tp-${l}`} onClick={() => onSimulateReturn(l)}>
              {LENS_META[l].label}
            </button>
          ))}
        </div>
      </div>

      <div className="tp-group">
        <h3>Other states</h3>
        <div className="tp-row">
          <button type="button" className="tp-btn" onClick={onFirstVisit}>
            First-time visitor
          </button>
          <button type="button" className="tp-btn" onClick={onReplayIntro}>
            Replay opening
          </button>
        </div>
      </div>

      <div className="tp-group">
        <h3>Now</h3>
        <p className="tp-state">
          Screen: <b>{phase}</b> · Lens: <b>{lens || '—'}</b>
        </p>
        <h3>Stored memory</h3>
        <pre className="tp-json">{record ? JSON.stringify(record, null, 2) : 'null — nothing remembered'}</pre>
      </div>

      <div className="tp-group">
        <h3>Behaviour log</h3>
        <ol className="tp-log" aria-live="polite">
          {log.map((e, i) => (
            <li key={log.length - i}>
              <time>{e.t}</time> {e.msg}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { LENSES, LENS_META } from '../content.js';

export default function Header({
  lens,
  visits,
  returning,
  reduced,
  onToggleMotion,
  onLens,
  onReset,
  testOpen,
  onToggleTest,
}) {
  return (
    <header className="site-header">
      <a className="logo" href="#main" aria-label={`PERSPECTIVE — ${LENS_META[lens].label}`}>
        <span className="logo-word">PERSPECTIVE</span>
        <span className="logo-lens">/{LENS_META[lens].label}</span>
      </a>

      <nav className="lens-switch" aria-label="Change lens">
        <span className="lens-switch-label" aria-hidden="true">
          Lens
        </span>
        {LENSES.map((l) => (
          <button
            key={l}
            type="button"
            className={`lens-btn lens-btn-${l}`}
            aria-pressed={l === lens}
            onClick={() => onLens(l)}
          >
            {LENS_META[l].label}
          </button>
        ))}
      </nav>

      <div className="header-tools">
        <span className="visit-badge" title={returning ? 'Returning visitor' : 'First visit'}>
          {returning ? 'Visit' : 'First visit'} {returning && String(visits).padStart(2, '0')}
        </span>
        <button type="button" className="tool-btn" aria-pressed={reduced} onClick={onToggleMotion}>
          Reduce motion
        </button>
        <button type="button" className="tool-btn" aria-pressed={testOpen} onClick={onToggleTest}>
          Test mode
        </button>
        <button type="button" className="tool-btn tool-reset" onClick={onReset}>
          Reset
        </button>
      </div>
    </header>
  );
}

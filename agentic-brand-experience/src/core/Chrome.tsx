import type { Mode, SceneDef } from './types';

interface Props {
  scenes: SceneDef[];
  index: number;
  /** 0–1 progress through each scene. */
  fills: number[];
  mode: Mode;
  onJump: (i: number) => void;
  onAction: () => void;
}

/** Apple-style chrome: a blurred local nav in Explore, a close button in Present, and pill progress dots in both. */
export function Chrome({ scenes, index, fills, mode, onJump, onAction }: Props) {
  return (
    <div className={`chrome chrome-${mode}`}>
      {mode === 'explore' ? (
        <nav className="localnav" aria-label="Scenes">
          <div className="localnav-in">
            <button className="localnav-title" onClick={() => onJump(0)}>
              Agentic Brand Experience
            </button>
            <div className="localnav-links">
              {scenes.map((s, i) => (
                <button key={s.id} className={i === index ? 'is-current' : ''} onClick={() => onJump(i)} aria-current={i === index ? 'step' : undefined}>
                  {s.nav}
                </button>
              ))}
            </div>
            <button className="cta" onClick={onAction} title="Presentation mode (P)">
              Present <span aria-hidden="true">›</span>
            </button>
          </div>
        </nav>
      ) : (
        <button className="pr-close" onClick={onAction} aria-label="Exit presentation (Esc)">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      )}

      <div className="dots" aria-hidden="true">
        {scenes.map((s, i) => (
          <button key={s.id} className={`dot ${i === index ? 'is-current' : ''} ${fills[i] >= 1 && i !== index ? 'is-done' : ''}`} tabIndex={-1} onClick={() => onJump(i)}>
            <i style={{ transform: `scaleX(${i === index ? fills[i] ?? 0 : 0})` }} />
          </button>
        ))}
      </div>
    </div>
  );
}

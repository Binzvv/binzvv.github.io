import type { SceneDef } from './types';

interface Props {
  scenes: SceneDef[];
  index: number;
  /** 0–1 progress through each scene, for the segmented rule. */
  fills: number[];
  action?: { label: string; onClick: () => void; hint?: string };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The deck's folio system: kicker top-left, title and page bottom, a hairline that doubles as progress. */
export function Chrome({ scenes, index, fills, action }: Props) {
  const def = scenes[index];
  return (
    <div className="chrome">
      <div className="chrome-top">
        <span className="mono chrome-kicker" key={def.id}>
          {def.kicker}
        </span>
        {action && (
          <button className="mono chrome-action" onClick={action.onClick} title={action.hint}>
            {action.label}
          </button>
        )}
      </div>
      <div className="chrome-bottom">
        <div className="chrome-progress" aria-hidden="true">
          {scenes.map((s, i) => (
            <span key={s.id} className={i === index ? 'is-current' : ''}>
              <i style={{ transform: `scaleX(${fills[i] ?? 0})` }} />
            </span>
          ))}
        </div>
        <div className="chrome-folio">
          <span className="mono">Agentic Brand Experience / 001</span>
          <span className="mono" aria-label={`Scene ${index + 1} of ${scenes.length}`}>
            {pad(index + 1)}—{pad(scenes.length)}
          </span>
        </div>
      </div>
    </div>
  );
}

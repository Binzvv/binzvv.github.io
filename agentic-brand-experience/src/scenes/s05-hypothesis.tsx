import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { Line } from '../core/Type';
import { ease, hold, newTimeline } from '../core/motion';
import { POLICY_IDS } from '../core/policy';
import { POLICIES } from './experiment-data';

const COLUMNS = [
  { label: 'Input', sub: ['Feeling', 'Time', 'Need'] },
  { label: 'Intelligence', sub: ['Same underlying capability'] },
  { label: 'Brand policy', sub: ['Prioritise', 'Refuse', 'Intervene', 'Explain'] },
  { label: 'Decision', sub: ['Different action'] },
];

/* Geometry in stage percentages. The SVG box is 160 × 90 so it maps 1:1 onto a 16:9 stage. */
const HORIZON = 56;
const GATE = { x0: 43, x1: 64 };
const ROWS = [48.5, 56, 63.5];
const OUT_X = 72;
const X = (cqw: number) => +(cqw * 1.6).toFixed(2);
const Y = (cqh: number) => +(cqh * 0.9).toFixed(2);

function Hypothesis({ portrait }: SceneProps) {
  return (
    <div className="scene s05">
      <div className="light" style={{ ['--lx' as string]: '54%', ['--ly' as string]: '58%' }} />
      <h2 className="s05-h head">
        <Line>Brand principles can function</Line>
        <Line>as decision-making rules.</Line>
      </h2>

      <div className="s05-system">
        {!portrait && (
          <svg className="s05-svg" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
            <path className="s05-in" d={`M${X(4.5)} ${Y(HORIZON)} L${X(GATE.x0)} ${Y(HORIZON)}`} pathLength={1} />
            <path className="s05-through" d={`M${X(GATE.x0)} ${Y(HORIZON)} L${X(GATE.x1)} ${Y(HORIZON)}`} pathLength={1} />
            {ROWS.map((y, i) => (
              <path
                key={i}
                className={`s05-out o${i}`}
                d={`M${X(GATE.x1)} ${Y(HORIZON)} C${X(GATE.x1 + 3.5)} ${Y(HORIZON)} ${X(OUT_X - 4)} ${Y(y)} ${X(OUT_X - 0.8)} ${Y(y)}`}
                pathLength={1}
              />
            ))}
            <g className="s05-signals">
              <path className="sig" d={`M${X(4.5)} ${Y(HORIZON)} L${X(GATE.x1)} ${Y(HORIZON)}`} pathLength={1} />
            </g>
          </svg>
        )}

        {COLUMNS.map((c, i) => (
          <div key={c.label} className={`s05-col c${i}`}>
            <div className="s05-top">
              <span className="mono s05-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="s05-label">{c.label}</span>
            </div>
            <ul className="s05-sub">
              {c.sub.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="s05-gate" aria-hidden="true">
          <i className="g-t" />
          <i className="g-r" />
          <i className="g-b" />
          <i className="g-l" />
          <div className="s05-state mono">
            {POLICY_IDS.map((id) => (
              <span key={id} className={`st st-${id}`}>
                Policy {id} · {POLICIES[id].name}
              </span>
            ))}
          </div>
        </div>

        <ol className="s05-rows" aria-label="Same input, three different decisions">
          {POLICY_IDS.map((id, i) => (
            <li key={id} className={`r${i}`} style={{ ['--y' as string]: `${ROWS[i]}cqh` }}>
              <span className="mono">{id}</span>
              <span>{POLICIES[id].short}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="s05-close display">
        <Line>Change the policy.</Line>
        <Line>
          Change the <span className="serif">experience.</span>
        </Line>
      </p>
    </div>
  );
}

export const s05: SceneDef = {
  id: 'hypothesis',
  kicker: 'Hypothesis',
  title: 'The hypothesis',
  length: 6,
  Component: Hypothesis,
  build({ q, root, portrait }) {
    const col = (i: number) => q(`.c${i} .s05-top, .c${i} .s05-sub li`);
    const out = (i: number) => q(`.o${i}`);
    const row = (i: number) => q(`.s05-rows .r${i}`);
    const state = (id: string) => q(`.st-${id}`);

    gsap.set(root, { attr: { 'data-live': '0' } });
    gsap.set(q('.s05-h .line-in, .s05-close .line-in'), { yPercent: 112 });
    gsap.set(q('.s05-top, .s05-sub li, .s05-rows li, .st'), { autoAlpha: 0, y: 12 });
    gsap.set(q('.s05-in, .s05-through, .s05-out'), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q('.g-t, .g-b'), { scaleX: 0 });
    gsap.set(q('.g-l, .g-r'), { scaleY: 0 });

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 });

    // 1 — the claim
    tl.to(q('.s05-h .line-in'), { yPercent: 0, stagger: 0.1, duration: 1.2 }).addLabel('beat:1');
    hold(tl, 0.4);

    // 2 — the same input meets the same intelligence
    tl.to(col(0), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8, ease: ease.quiet })
      .to(q('.s05-in'), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, '<0.2')
      .to(col(1), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8, ease: ease.quiet }, '<0.5')
      .addLabel('beat:2');
    hold(tl, 0.4);

    // 3 — the intervention point: the camera leans in on brand policy
    tl.to(q('.s05-system'), { scale: portrait ? 1 : 1.045, duration: 1.4, ease: ease.settle })
      .to(q('.g-t, .g-b'), { scaleX: 1, duration: 0.9, ease: ease.settle }, '<0.1')
      .to(q('.g-l, .g-r'), { scaleY: 1, duration: 0.9, ease: ease.settle }, '<0.15')
      .to(col(2), { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8, ease: ease.quiet }, '<0.3')
      .to(q('.c0, .c1'), { autoAlpha: 0.45, duration: 0.8, ease: ease.quiet }, '<')
      .addLabel('beat:3');
    hold(tl, 0.4);

    // 4–6 — same input, three policies, three decisions
    tl.to(q('.s05-system'), { scale: 1, duration: 1.2, ease: ease.settle })
      .to(q('.c0, .c1'), { autoAlpha: 1, duration: 0.8, ease: ease.quiet }, '<')
      .to(col(3), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.7, ease: ease.quiet }, '<0.2')
      .to(q('.s05-rows li'), { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.7, ease: ease.quiet }, '<0.1')
      .to(q('.s05-rows li'), { color: 'var(--fg-3)', duration: 0.4 }, '>')
      .set(root, { attr: { 'data-live': '1' } });

    POLICY_IDS.forEach((id, i) => {
      if (i > 0) {
        tl.to(out(i - 1), { opacity: 0.12, duration: 0.5, ease: ease.quiet })
          .to(row(i - 1), { color: 'var(--fg-3)', duration: 0.5, ease: ease.quiet }, '<')
          .to(state(POLICY_IDS[i - 1]), { autoAlpha: 0, y: -10, duration: 0.4, ease: ease.quiet }, '<');
      }
      tl.to(state(id), { autoAlpha: 1, y: 0, duration: 0.5, ease: ease.quiet }, i > 0 ? '<0.2' : '>')
        .to(q('.s05-through'), { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, '<')
        .fromTo(out(i), { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, '>-0.1')
        .to(row(i), { color: 'var(--fg)', duration: 0.5, ease: ease.quiet }, '>-0.3')
        .addLabel(`beat:${4 + i}`);
      hold(tl, 0.5);
    });

    // 7 — the principle
    tl.to(q('.s05-system'), { autoAlpha: portrait ? 0 : 0.08, y: portrait ? 0 : -60, duration: 1.2, ease: ease.settle })
      .to(q('.s05-h'), { autoAlpha: 0, duration: 0.6, ease: ease.quiet }, '<')
      .to(q('.s05-close .line-in'), { yPercent: 0, stagger: 0.14, duration: 1.3 }, '<0.4')
      .addLabel('beat:7');

    hold(tl, 1.2);
    tl.to(q('.s05-close .line-in'), { yPercent: -112, stagger: 0.08, duration: 0.9, ease: ease.exit }).to(
      q('.s05-system'),
      { autoAlpha: 0, duration: 0.6 },
      '<',
    );
    return tl;
  },
};

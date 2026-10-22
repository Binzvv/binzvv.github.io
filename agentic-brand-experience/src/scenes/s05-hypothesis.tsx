import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { ease, hold, newTimeline } from '../core/motion';
import { POLICY_IDS } from '../core/policy';
import { POLICIES } from './experiment-data';

/* Geometry in stage percentages (cqw across, cqh down). The SVG box is 160 × 90,
   so it maps 1:1 onto a 16:9 stage. */
const AXIS = 60;
const IN = { x0: 6, x1: 19 };
const CHIP = { x0: 45.5, x1: 62.5 };
const OUT_X = 70;
const ROWS = [52, 60, 68];
const X = (cqw: number) => +(cqw * 1.6).toFixed(2);
const Y = (cqh: number) => +(cqh * 0.9).toFixed(2);

const VERBS = ['Prioritise', 'Refuse', 'Intervene', 'Explain'];

function Hypothesis({ portrait }: SceneProps) {
  return (
    <div className="scene s05">
      <div className="glow" style={{ ['--gx' as string]: '54%', ['--gy' as string]: '60%' }} />
      <header className="s05-head">
        <span className="eyebrow">Hypothesis</span>
        <h2 className="headline">
          Brand principles can function
          <br />
          as decision-making rules.
        </h2>
      </header>

      <div className="s05-system">
        {!portrait && (
          <svg className="s05-svg" viewBox="0 0 160 90" preserveAspectRatio="none" aria-hidden="true">
            <path className="s05-in" d={`M${X(IN.x1)} ${Y(AXIS)} L${X(CHIP.x0)} ${Y(AXIS)}`} pathLength={1} />
            {ROWS.map((y, i) => (
              <path
                key={i}
                className={`s05-out o${i}`}
                d={`M${X(CHIP.x1)} ${Y(AXIS)} C${X(CHIP.x1 + 3.5)} ${Y(AXIS)} ${X(OUT_X - 4)} ${Y(y)} ${X(OUT_X - 1)} ${Y(y)}`}
                pathLength={1}
              />
            ))}
            <g className="s05-signals">
              <path className="sig" d={`M${X(IN.x1)} ${Y(AXIS)} L${X(CHIP.x0)} ${Y(AXIS)}`} pathLength={1} />
            </g>
          </svg>
        )}

        <div className="s05-tile tile s05-input">
          <span className="s05-k">Input</span>
          <span className="s05-v">Feeling · Time · Need</span>
        </div>
        <div className="s05-tile tile s05-ai">
          <span className="s05-k">Intelligence</span>
          <span className="s05-v">Same underlying capability</span>
        </div>

        <div className="s05-chip" aria-label="Brand policy: prioritise, refuse, intervene, explain">
          <div className="s05-chip-in">
            <span className="s05-chip-top">Brand</span>
            <span className="s05-chip-name grad">Policy</span>
            <span className="s05-verbs">
              {VERBS.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </span>
          </div>
          <div className="s05-state">
            {POLICY_IDS.map((id) => (
              <span key={id} className={`st st-${id}`}>
                Policy {id} — {POLICIES[id].name}
              </span>
            ))}
          </div>
        </div>

        <div className="s05-decision">
          <span className="s05-k">Decision</span>
          <span className="s05-v">Different action</span>
        </div>
        <ol className="s05-rows" aria-label="Same input, three different decisions">
          {POLICY_IDS.map((id, i) => (
            <li key={id} className={`r${i}`} style={{ ['--y' as string]: `${ROWS[i]}cqh` }}>
              <span className="s05-row-id">{id}</span>
              <span>{POLICIES[id].short}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="s05-close">
        <span className="s05-c1">Change the policy.</span>
        <span className="s05-c2">
          Change the <span className="grad">experience.</span>
        </span>
      </p>
    </div>
  );
}

export const s05: SceneDef = {
  id: 'hypothesis',
  kicker: 'Hypothesis',
  title: 'The hypothesis',
  nav: 'Hypothesis',
  length: 6,
  Component: Hypothesis,
  build({ q, root, portrait }) {
    const out = (i: number) => q(`.o${i}`);
    const row = (i: number) => q(`.s05-rows .r${i}`);
    const state = (id: string) => q(`.st-${id}`);
    const fadeUp = { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' };

    gsap.set(root, { attr: { 'data-live': '0' } });
    gsap.set(q('.s05-head .eyebrow, .s05-head .headline, .s05-c1, .s05-c2'), { autoAlpha: 0, y: 40 });
    gsap.set(q('.s05-tile, .s05-decision, .s05-rows li'), { autoAlpha: 0, y: 30 });
    gsap.set(q('.s05-chip'), { autoAlpha: 0, scale: 0.86, rotationX: 24, transformPerspective: 1400 });
    gsap.set(q('.s05-verbs span, .st'), { autoAlpha: 0, y: 10 });
    gsap.set(q('.s05-in, .s05-out'), { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q('.s05-chip-name'), { backgroundPosition: '100% 0' });

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 });

    // 1 — the claim
    tl.to(q('.s05-head .eyebrow'), fadeUp).to(q('.s05-head .headline'), fadeUp, '<0.1').addLabel('beat:1');
    hold(tl, 0.4);

    // 2 — the same input meets the same intelligence
    tl.to(q('.s05-tile'), { ...fadeUp, stagger: 0.15 })
      .to(q('.s05-in'), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, '<0.3')
      .addLabel('beat:2');
    hold(tl, 0.4);

    // 3 — the intervention point: the chip rises into place and the light finds it
    tl.to(q('.s05-chip'), { autoAlpha: 1, scale: 1, rotationX: 0, duration: 1.8, ease: 'expo.out' })
      .to(q('.glow'), { autoAlpha: 1, duration: 1.4, ease: ease.quiet }, '<0.2')
      .to(q('.s05-chip-name'), { backgroundPosition: '0% 0', duration: 2, ease: 'power2.inOut' }, '<')
      .to(q('.s05-verbs span'), { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, '<0.4')
      .to(q('.s05-tile'), { autoAlpha: 0.5, duration: 0.8, ease: ease.quiet }, '<')
      .addLabel('beat:3');
    hold(tl, 0.4);

    // 4–6 — same input, three policies, three decisions
    tl.to(q('.s05-tile'), { autoAlpha: 1, duration: 0.8, ease: ease.quiet })
      .to(q('.s05-decision'), fadeUp, '<0.1')
      .to(q('.s05-rows li'), { ...fadeUp, stagger: 0.08 }, '<0.1')
      .to(q('.s05-rows li'), { color: 'var(--grey-3)', duration: 0.4 }, '>')
      .set(root, { attr: { 'data-live': '1' } });

    POLICY_IDS.forEach((id, i) => {
      if (i > 0) {
        tl.to(out(i - 1), { opacity: 0.15, duration: 0.5, ease: ease.quiet })
          .to(row(i - 1), { color: 'var(--grey-3)', duration: 0.5, ease: ease.quiet }, '<')
          .to(state(POLICY_IDS[i - 1]), { autoAlpha: 0, y: -10, duration: 0.4, ease: ease.quiet }, '<');
      }
      tl.to(state(id), { autoAlpha: 1, y: 0, duration: 0.5, ease: ease.quiet }, i > 0 ? '<0.2' : '>')
        .fromTo(out(i), { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, '<')
        .to(row(i), { color: 'var(--fg)', duration: 0.5, ease: ease.quiet }, '>-0.3')
        .addLabel(`beat:${4 + i}`);
      hold(tl, 0.5);
    });

    // 7 — the principle
    tl.to(q('.s05-system'), { autoAlpha: 0, scale: portrait ? 1 : 0.96, duration: 1, ease: ease.settle })
      .to(q('.s05-head'), { autoAlpha: 0, y: -30, duration: 0.7, ease: ease.quiet }, '<')
      .to(q('.s05-c1'), { ...fadeUp, duration: 1.3 }, '<0.5')
      .to(q('.s05-c2'), { ...fadeUp, duration: 1.3 }, '<0.18')
      .addLabel('beat:7');

    hold(tl, 1.2);
    tl.to(q('.s05-c1, .s05-c2'), { autoAlpha: 0, y: -40, stagger: 0.08, duration: 0.9, ease: ease.exit }).to(q('.glow'), { autoAlpha: 0, duration: 0.8 }, '<');
    return tl;
  },
};

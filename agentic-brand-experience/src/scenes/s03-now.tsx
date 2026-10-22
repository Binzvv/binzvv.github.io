import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { Line } from '../core/Type';
import { ease, hold, newTimeline } from '../core/motion';

const NODES = ['Person', 'Intent', 'Agent', 'Decision', 'Action'];
/** Candidate routes the agent weighs, as offsets from the axis. Index 1 is chosen. */
const FAN = [-150, -72, 0, 72, 150];
const CHOSEN = 1;

function geometry(portrait: boolean) {
  // Positions along the main axis; the cross axis is the horizon.
  const W = portrait ? 600 : 1600;
  const H = portrait ? 1000 : 560;
  const along = portrait ? [70, 250, 450, 760, 930] : [150, 440, 760, 1130, 1450];
  const cross = portrait ? 150 : 250;
  const pt = (a: number, c: number) => (portrait ? { x: cross + c, y: a } : { x: a, y: cross + c });
  const P = (a: number, c = 0) => {
    const p = pt(a, c);
    return `${p.x} ${p.y}`;
  };
  const straight = (i: number) => `M${P(along[i])} L${P(along[i + 1])}`;
  const fan = (o: number) => {
    const a0 = along[2];
    const a1 = along[3];
    const k = (a1 - a0) * 0.32;
    const sc = portrait ? 0.62 : 1;
    return `M${P(a0)} C${P(a0 + k, o * sc)} ${P(a1 - k, o * sc)} ${P(a1)}`;
  };
  return { W, H, along, cross, pt, straight, fan };
}

function Flow({ portrait }: SceneProps) {
  const g = geometry(portrait);
  const nodes = g.along.map((a) => g.pt(a, 0));
  return (
    <div className="scene s03">
      <div className="light" style={{ ['--lx' as string]: '70%', ['--ly' as string]: '42%' }} />
      <svg
        className="s03-svg"
        viewBox={`0 0 ${g.W} ${g.H}`}
        role="img"
        aria-label="Person, then intent, then agent, which weighs several options and arrives at a decision, then action."
      >
        <line
          className="s03-horizon"
          x1={portrait ? g.cross : -400}
          y1={portrait ? -400 : g.cross}
          x2={portrait ? g.cross : g.W + 400}
          y2={portrait ? g.H + 400 : g.cross}
        />
        {FAN.map((o, i) => (
          <path key={`f${i}`} className={`s03-fan ${i === CHOSEN ? 'is-chosen' : ''}`} d={g.fan(o)} pathLength={1} />
        ))}
        {[0, 1, 3].map((i) => (
          <path key={`p${i}`} className={`s03-path p${i}`} d={g.straight(i)} pathLength={1} />
        ))}
        <g className="s03-signals">
          <path className="sig" d={g.straight(0)} pathLength={1} style={{ ['--sdelay' as string]: '0s' }} />
          <path className="sig" d={g.straight(1)} pathLength={1} style={{ ['--sdelay' as string]: '0.55s' }} />
          {FAN.map((o, i) => (
            <path
              key={`s${i}`}
              className={`sig ${i === CHOSEN ? '' : 'sig-ghost'}`}
              d={g.fan(o)}
              pathLength={1}
              style={{ ['--sdelay' as string]: `${1.1 + i * 0.07}s` }}
            />
          ))}
          <path className="sig" d={g.straight(3)} pathLength={1} style={{ ['--sdelay' as string]: '1.75s' }} />
        </g>
        {nodes.map((p, i) => (
          <g key={NODES[i]} className={`s03-node n${i} ${i === 3 ? 'is-decision' : ''}`} transform={`translate(${p.x} ${p.y})`}>
            {i === 3 && <circle className="s03-ring" r={34} />}
            {i === 3 && <circle className="s03-pulse" r={34} />}
            <circle className="s03-dot" r={i === 3 ? 9 : 6} />
            <g className="s03-label">
              <text className="s03-idx" x={portrait ? 44 : 0} y={portrait ? -16 : -44} textAnchor={portrait ? 'start' : 'middle'}>
                {String(i + 1).padStart(2, '0')}
              </text>
              <text
                className="s03-name"
                x={portrait ? 44 : 0}
                y={portrait ? (i === 3 ? 22 : 16) : i === 3 ? 92 : 70}
                textAnchor={portrait ? 'start' : 'middle'}
              >
                {NODES[i].toUpperCase()}
              </text>
            </g>
          </g>
        ))}
      </svg>
      <div className="s03-copy">
        <div className="rule s03-rule" />
        <p className="s03-text">
          <Line>If an agent increasingly decides what happens next,</Line>
          <Line>
            brand needs to <em className="s03-hl">influence the decision</em>
          </Line>
          <Line>
            — not just <span className="s03-dim">decorate the response.</span>
          </Line>
        </p>
      </div>
    </div>
  );
}

export const s03: SceneDef = {
  id: 'now',
  kicker: 'Brand / Now',
  title: 'Brand now',
  length: 4.5,
  Component: Flow,
  build({ q, root }) {
    const label = (i: number) => q(`.n${i} .s03-label`)[0];
    const dot = (i: number) => q(`.n${i} .s03-dot`)[0];
    const path = (i: number) => q(`.p${i}`)[0];
    const fans = q('.s03-fan');
    const chosen = q('.s03-fan.is-chosen');
    const others = fans.filter((f) => !f.classList.contains('is-chosen'));
    const textLines = q('.s03-text .line-in');

    gsap.set(root, { attr: { 'data-live': '0' } });
    gsap.set([...q('.s03-path'), ...fans], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q('.s03-dot'), { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(q('.s03-label'), { autoAlpha: 0, y: 10 });
    gsap.set(q('.s03-ring'), { scale: 0.2, autoAlpha: 0, transformOrigin: '50% 50%' });
    gsap.set(q('.s03-horizon'), { scaleX: 0, scaleY: 0, transformOrigin: '50% 50%' });
    gsap.set(textLines, { yPercent: 112 });
    gsap.set(q('.s03-rule'), { scaleX: 0 });

    const ignite = (tl: gsap.core.Timeline, i: number, at = '>') =>
      tl
        .to(dot(i), { scale: 1, duration: 0.6, ease: 'back.out(2.2)' }, at)
        .to(label(i), { autoAlpha: 1, y: 0, duration: 0.8, ease: ease.quiet }, '<0.05');

    const tl = newTimeline();
    tl.to(q('.s03-horizon'), { scaleX: 1, scaleY: 1, duration: 1.4, ease: ease.settle });

    // 1 — a person forms an intent
    ignite(tl, 0, '<0.6');
    tl.to(path(0), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '>-0.2');
    ignite(tl, 1, '>-0.1');
    tl.addLabel('beat:1');
    hold(tl, 0.5);

    // 2 — an agent receives it and considers the options
    tl.to(path(1), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' });
    ignite(tl, 2, '>-0.1');
    tl.to(fans, { strokeDashoffset: 0, duration: 1.3, stagger: { each: 0.08, from: 'center' }, ease: 'power2.inOut' }, '>-0.2')
      .addLabel('beat:2');
    hold(tl, 0.5);

    // 3 — one route survives: the decision, then action
    tl.to(others, { opacity: 0.12, duration: 0.8, ease: ease.quiet })
      .to(chosen, { stroke: 'var(--fg)', strokeWidth: 1.6, duration: 0.6, ease: ease.quiet }, '<')
      .to(dot(3), { scale: 1, duration: 0.7, ease: 'back.out(2.2)' }, '<0.3')
      .to(q('.s03-ring'), { scale: 1, autoAlpha: 1, duration: 1, ease: ease.reveal }, '<')
      .to(label(3), { autoAlpha: 1, y: 0, duration: 0.9, ease: ease.quiet }, '<0.1')
      .to(path(3), { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, '>-0.3');
    ignite(tl, 4, '>-0.1');
    tl.set(root, { attr: { 'data-live': '1' } }).addLabel('beat:3');
    hold(tl, 0.5);

    // 4 — what that means for brand
    tl.to(q('.s03-rule'), { scaleX: 1, duration: 1, ease: ease.settle })
      .to(textLines, { yPercent: 0, duration: 1.1, stagger: 0.09 }, '<0.2')
      .to(q('.s03-dim'), { color: 'var(--fg-3)', duration: 0.8, ease: ease.quiet }, '>-0.2')
      .to(q('.s03-dim'), { backgroundSize: '100% 1px', duration: 0.8, ease: ease.settle }, '<')
      .addLabel('beat:4');

    hold(tl, 1.2);
    tl.to(q('.s03-svg'), { autoAlpha: 0, scale: 0.94, duration: 1.2, ease: ease.exit })
      .to(textLines, { yPercent: -112, duration: 0.8, stagger: 0.05, ease: ease.exit }, '<0.2');

    return tl;
  },
};

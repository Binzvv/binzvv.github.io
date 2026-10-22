import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { ease, hold, newTimeline } from '../core/motion';

const NODES = ['Person', 'Intent', 'Agent', 'Decision', 'Action'];
/** Candidate routes the agent weighs, as offsets from the axis. Index 1 is chosen. */
const FAN = [-170, -84, 0, 84, 170];
const CHOSEN = 1;
const DECISION = 3;

function geometry(portrait: boolean) {
  const W = portrait ? 600 : 1600;
  const H = portrait ? 1000 : 600;
  const along = portrait ? [70, 240, 420, 760, 930] : [150, 450, 760, 1140, 1460];
  const cross = portrait ? 300 : 300;
  const pt = (a: number, c: number) => (portrait ? { x: cross + c, y: a } : { x: a, y: cross + c });
  const P = (a: number, c = 0) => {
    const p = pt(a, c);
    return `${p.x} ${p.y}`;
  };
  const straight = (i: number) => `M${P(along[i])} L${P(along[i + 1])}`;
  const fan = (o: number) => {
    const a0 = along[2];
    const a1 = along[3];
    const k = (a1 - a0) * 0.34;
    const sc = portrait ? 0.7 : 1;
    return `M${P(a0)} C${P(a0 + k, o * sc)} ${P(a1 - k, o * sc)} ${P(a1)}`;
  };
  return { W, H, along, cross, pt, straight, fan };
}

function Flow({ portrait }: SceneProps) {
  const g = geometry(portrait);
  const nodes = g.along.map((a) => g.pt(a, 0));
  const pillH = portrait ? 60 : 64;
  return (
    <div className="scene s03">
      <div className="glow" style={{ ['--gx' as string]: portrait ? '50%' : '71%', ['--gy' as string]: portrait ? '62%' : '48%' }} />
      <header className="s03-head">
        <span className="eyebrow">Brand / Now</span>
      </header>
      <svg
        className="s03-svg"
        viewBox={`0 0 ${g.W} ${g.H}`}
        role="img"
        aria-label="Person, then intent, then agent, which weighs several options and arrives at a decision, then action."
      >
        <defs>
          <radialGradient id="s03halo">
            <stop offset="0%" stopColor="#ff7a33" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#ff5a2c" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ff5a2c" stopOpacity="0" />
          </radialGradient>
        </defs>
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
        {nodes.map((p, i) => {
          const big = i === DECISION;
          const h = big ? pillH * 1.3 : pillH;
          const w = NODES[i].length * (big ? 25 : 18) + (big ? 92 : 64);
          return (
            <g key={NODES[i]} className={`s03-node n${i} ${big ? 'is-decision' : ''}`} transform={`translate(${p.x} ${p.y})`}>
              {big && <circle className="s03-halo" r={260} fill="url(#s03halo)" />}
              <g className="s03-pin">
                {big && <rect className="s03-pulse" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} />}
                <rect className="s03-pill" x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} />
                <text className="s03-name" textAnchor="middle" dominantBaseline="central">
                  {NODES[i]}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <p className="copy s03-copy">
        If an agent increasingly decides what happens next, <strong>brand needs to influence the decision</strong> —{' '}
        <span className="s03-not">not just decorate the response.</span>
      </p>
    </div>
  );
}

export const s03: SceneDef = {
  id: 'now',
  kicker: 'Brand / Now',
  title: 'Brand now',
  nav: 'Now',
  length: 4.5,
  Component: Flow,
  build({ q, root }) {
    const pin = (i: number) => q(`.n${i} .s03-pin`)[0];
    const path = (i: number) => q(`.p${i}`)[0];
    const fans = q('.s03-fan');
    const chosen = q('.s03-fan.is-chosen');
    const others = fans.filter((f) => !f.classList.contains('is-chosen'));

    gsap.set(root, { attr: { 'data-live': '0' } });
    gsap.set([...q('.s03-path'), ...fans], { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(q('.s03-pin'), { scale: 0.7, autoAlpha: 0, transformOrigin: '50% 50%' });
    gsap.set(q('.s03-halo'), { scale: 0.3, autoAlpha: 0, transformOrigin: '50% 50%' });
    gsap.set(q('.s03-head .eyebrow, .s03-copy'), { autoAlpha: 0, y: 30 });

    const ignite = (tl: gsap.core.Timeline, i: number, at = '>') =>
      tl.to(pin(i), { scale: 1, autoAlpha: 1, duration: 0.9, ease: 'expo.out' }, at);

    const tl = newTimeline();
    tl.to({}, { duration: 0.2 }).to(q('.s03-head .eyebrow'), { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' });

    // 1 — a person forms an intent
    ignite(tl, 0, '<0.3');
    tl.to(path(0), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '>-0.4');
    ignite(tl, 1, '>-0.2');
    tl.addLabel('beat:1');
    hold(tl, 0.5);

    // 2 — an agent receives it and weighs the options
    tl.to(path(1), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' });
    ignite(tl, 2, '>-0.2');
    tl.to(fans, { strokeDashoffset: 0, duration: 1.4, stagger: { each: 0.08, from: 'center' }, ease: 'power2.inOut' }, '>-0.3').addLabel('beat:2');
    hold(tl, 0.5);

    // 3 — one route survives: the decision lights up, then action
    tl.to(others, { opacity: 0.12, duration: 0.8, ease: ease.quiet })
      .to(chosen, { stroke: '#ff8a3d', strokeWidth: 2.2, duration: 0.6, ease: ease.quiet }, '<')
      .to(pin(DECISION), { scale: 1, autoAlpha: 1, duration: 1.1, ease: 'expo.out' }, '<0.3')
      .to(q('.s03-halo'), { scale: 1, autoAlpha: 1, duration: 1.6, ease: 'expo.out' }, '<')
      .to(q('.glow'), { autoAlpha: 1, duration: 1.4, ease: ease.quiet }, '<')
      .to(path(3), { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, '>-0.8');
    ignite(tl, 4, '>-0.2');
    tl.set(root, { attr: { 'data-live': '1' } }).addLabel('beat:3');
    hold(tl, 0.5);

    // 4 — what that means for brand
    tl.to(q('.s03-copy'), { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' })
      .to(q('.s03-not'), { color: 'var(--grey-3)', duration: 0.8, ease: ease.quiet }, '>-0.3')
      .addLabel('beat:4');

    hold(tl, 1.2);
    tl.to(q('.s03-svg'), { autoAlpha: 0, scale: 0.94, duration: 1.2, ease: ease.exit })
      .to(q('.s03-copy, .s03-head, .glow'), { autoAlpha: 0, y: -30, duration: 0.8, ease: ease.exit }, '<0.2');
    return tl;
  },
};

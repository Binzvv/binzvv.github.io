import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { Line } from '../core/Type';
import { ease, hold, newTimeline } from '../core/motion';

const LAYERS = ['Visual identity', 'Interface', 'Experience'];
/** Vertical stacking of the planes, as a percentage of plane size. */
const OFFSETS = [-36, 0, 36];

function IdentityArt() {
  return (
    <svg viewBox="0 0 100 100" className="s02-art" aria-hidden="true">
      <circle cx="26" cy="28" r="11" />
      <path d="M26 17 A11 11 0 0 1 37 28 L26 28 Z" className="fill" />
      <rect x="46" y="22" width="36" height="5" />
      <rect x="46" y="31" width="22" height="2.5" />
      <rect x="14" y="62" width="16" height="16" className="fill" />
      <rect x="34" y="62" width="16" height="16" />
      <rect x="54" y="62" width="16" height="16" />
      <path d="M74 78 L80 62 L86 78" />
    </svg>
  );
}

function InterfaceArt() {
  return (
    <svg viewBox="0 0 100 100" className="s02-art" aria-hidden="true">
      <rect x="12" y="12" width="76" height="8" />
      <rect x="12" y="28" width="35" height="26" />
      <rect x="53" y="28" width="35" height="26" />
      <rect x="12" y="60" width="76" height="4" />
      <rect x="12" y="68" width="56" height="4" />
      <rect x="12" y="78" width="22" height="9" className="fill" />
    </svg>
  );
}

function ExperienceArt() {
  const dots = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const d = Math.hypot(r - 4, c - 4);
      dots.push(<circle key={`${r}-${c}`} cx={14 + c * 9} cy={14 + r * 9} r={1.1} style={{ ['--d' as string]: `${d * 0.16}s` }} />);
    }
  return (
    <svg viewBox="0 0 100 100" className="s02-art" aria-hidden="true">
      <g className="s02-journey">
        <path d="M10 76 C 28 76, 30 30, 50 40 S 74 70, 90 24" />
        <circle cx="10" cy="76" r="2.4" className="fill" />
        <circle cx="50" cy="40" r="2.4" className="fill" />
        <circle cx="90" cy="24" r="2.4" className="fill" />
      </g>
      <g className="s02-field">{dots}</g>
    </svg>
  );
}

const ART = [IdentityArt, InterfaceArt, ExperienceArt];

function Then(_: SceneProps) {
  return (
    <div className="scene s02">
      <div className="light" style={{ ['--lx' as string]: '58%', ['--ly' as string]: '50%' }} />
      <div className="s02-brand mono">Brand</div>
      <ol className="s02-labels">
        {LAYERS.map((name, i) => (
          <li key={name} className={`s02-label k${i}`} style={{ ['--o' as string]: OFFSETS[i] }}>
            <span className="mono s02-idx">{String(i + 1).padStart(2, '0')}</span>
            <Line className="s02-name">{name}</Line>
            <i className="s02-lead" />
            {i === 2 && (
              <span className="s02-sub mono">
                <span className="s02-designed">Designed</span>
                <span className="s02-decided">Decided</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="s02-stack" aria-hidden="true">
        {LAYERS.map((name, i) => {
          const Art = ART[i];
          return (
            <div key={name} className={`s02-plane p${i}`}>
              <div className="s02-face">
                <Art />
              </div>
            </div>
          );
        })}
      </div>
      <div className="s02-copy">
        <p className="s02-lede">
          <Line>We designed how</Line>
          <Line>a brand looked,</Line>
          <Line>sounded and felt.</Line>
        </p>
      </div>
      <div className="s02-ai">
        <p className="head">
          <Line>AI changes</Line>
          <Line>the final layer.</Line>
        </p>
      </div>
    </div>
  );
}

export const s02: SceneDef = {
  id: 'then',
  kicker: 'Brand / Then',
  title: 'Brand then',
  length: 4.5,
  Component: Then,
  build({ q, root, portrait }) {
    const planes = q('.s02-plane');
    const faces = q('.s02-face');
    const name = (i: number) => q(`.k${i} .s02-name .line-in`);
    const idx = (i: number) => q(`.k${i} .s02-idx`);
    const lead = (i: number) => q(`.k${i} .s02-lead`);

    gsap.set(root, { attr: { 'data-live': '0' } });
    planes.forEach((p, i) => gsap.set(p, { rotationX: 60, yPercent: OFFSETS[i], y: -90, autoAlpha: 0, transformPerspective: 2600 }));
    gsap.set(faces, { rotation: -45 });
    gsap.set(q('.s02-name .line-in, .s02-copy .line-in, .s02-ai .line-in'), { yPercent: 112 });
    gsap.set(q('.s02-idx, .s02-brand, .s02-sub'), { autoAlpha: 0 });
    gsap.set(q('.s02-lead'), { scaleX: 0 });
    gsap.set(q('.s02-decided'), { autoAlpha: 0, yPercent: 60 });
    gsap.set(q('.s02-field'), { autoAlpha: 0 });

    const layer = (tl: gsap.core.Timeline, i: number) =>
      tl
        .to(planes[i], { y: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out' })
        .to(lead(i), { scaleX: 1, duration: 0.9, ease: ease.settle }, '<0.25')
        .to(idx(i), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '<')
        .to(name(i), { yPercent: 0, duration: 1 }, '<0.1');

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 }).to(q('.s02-brand'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet });

    layer(tl, 0).addLabel('beat:1');
    hold(tl, 0.4);
    // earlier layers settle back as new ones arrive
    layer(tl, 1)
      .to(name(0), { color: 'var(--fg-2)', duration: 0.6, ease: ease.quiet }, '<')
      .addLabel('beat:2');
    hold(tl, 0.4);
    layer(tl, 2)
      .to(name(1), { color: 'var(--fg-2)', duration: 0.6, ease: ease.quiet }, '<')
      .to(q('.s02-sub'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '<0.4')
      .to(q('.s02-copy .line-in'), { yPercent: 0, stagger: 0.08 }, '<0.2')
      .addLabel('beat:3');
    hold(tl, 0.6);

    // 4 — AI changes the final layer: the camera pulls it out of the stack and faces it
    tl.to(planes.slice(0, 2), { yPercent: (i) => OFFSETS[i] - 70, autoAlpha: 0.12, duration: 1.6, ease: ease.settle })
      .to(q('.k0, .k1'), { autoAlpha: 0.3, duration: 1, ease: ease.quiet }, '<')
      .to(planes[2], { rotationX: 0, yPercent: 0, scale: portrait ? 1 : 1.12, duration: 1.8, ease: ease.settle }, '<')
      .to(faces[2], { rotation: 0, duration: 1.8, ease: ease.settle }, '<')
      .to(q('.s02-journey'), { autoAlpha: 0, duration: 0.6, ease: ease.quiet }, '<0.6')
      .to(q('.s02-field'), { autoAlpha: 1, duration: 0.8, ease: ease.quiet }, '>-0.2')
      .set(root, { attr: { 'data-live': '1' } }, '<')
      .to(q('.s02-designed'), { color: 'var(--fg-3)', backgroundSize: '100% 1px', duration: 0.6, ease: ease.settle }, '<')
      .to(q('.s02-decided'), { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: ease.reveal }, '>-0.1')
      .to(q(portrait ? '.s02-copy' : '.s02-copy .line-in'), portrait ? { autoAlpha: 0, duration: 0.5 } : { color: 'var(--fg-3)', duration: 0.8, ease: ease.quiet }, '<')
      .to(q('.s02-ai .line-in'), { yPercent: 0, stagger: 0.1, duration: 1.2 }, '<0.2')
      .addLabel('beat:4');

    hold(tl, 1.2);
    tl.to(planes[2], { scale: portrait ? 2.4 : 3.2, autoAlpha: 0, duration: 1.6, ease: 'power2.in' }).to(
      q('.s02-labels, .s02-copy, .s02-ai, .s02-brand, .s02-plane.p0, .s02-plane.p1'),
      { autoAlpha: 0, duration: 0.8, ease: ease.quiet },
      '<',
    );
    return tl;
  },
};

import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
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
      <div className="glow" style={{ ['--gx' as string]: '66%', ['--gy' as string]: '56%' }} />
      <header className="s02-head">
        <span className="eyebrow">Brand / Then</span>
        <div className="s02-swap">
          <h2 className="headline s02-h1">
            We designed how a brand
            <br />
            looked, sounded and felt.
          </h2>
          <h2 className="headline s02-h2" aria-hidden="true">
            AI changes
            <br />
            <span className="grad">the final layer.</span>
          </h2>
        </div>
      </header>
      <ol className="s02-labels">
        {LAYERS.map((name, i) => (
          <li key={name} className={`s02-label k${i}`} style={{ ['--o' as string]: OFFSETS[i] }}>
            <span className="s02-name">{name}</span>
            <i className="s02-lead" />
            {i === 2 && (
              <span className="s02-sub caption">
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
    </div>
  );
}

export const s02: SceneDef = {
  id: 'then',
  kicker: 'Brand / Then',
  title: 'Brand then',
  nav: 'Then',
  length: 4.5,
  Component: Then,
  build({ q, root, portrait }) {
    const planes = q('.s02-plane');
    const faces = q('.s02-face');
    const label = (i: number) => q(`.k${i} .s02-name`);
    const lead = (i: number) => q(`.k${i} .s02-lead`);
    const fadeUp = { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' };

    gsap.set(root, { attr: { 'data-live': '0' } });
    planes.forEach((p, i) => gsap.set(p, { rotationX: 58, yPercent: OFFSETS[i], y: -120, autoAlpha: 0, transformPerspective: 2600 }));
    gsap.set(faces, { rotation: -45 });
    gsap.set(q('.s02-head .eyebrow, .s02-h1, .s02-name, .s02-sub'), { autoAlpha: 0, y: 30 });
    gsap.set(q('.s02-h2'), { autoAlpha: 0, y: 40 });
    gsap.set(q('.s02-lead'), { scaleX: 0 });
    gsap.set(q('.s02-decided'), { autoAlpha: 0, y: 8 });
    gsap.set(q('.s02-field'), { autoAlpha: 0 });

    const layer = (tl: gsap.core.Timeline, i: number) =>
      tl
        .to(planes[i], { y: 0, autoAlpha: 1, duration: 1.5, ease: 'expo.out' })
        .to(lead(i), { scaleX: 1, duration: 1, ease: ease.settle }, '<0.25')
        .to(label(i), fadeUp, '<0.1');

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 })
      .to(q('.s02-head .eyebrow'), fadeUp)
      .to(q('.s02-h1'), fadeUp, '<0.1');

    layer(tl, 0).addLabel('beat:1');
    hold(tl, 0.4);
    layer(tl, 1)
      .to(label(0), { color: 'var(--grey)', duration: 0.6, ease: ease.quiet }, '<')
      .addLabel('beat:2');
    hold(tl, 0.4);
    layer(tl, 2)
      .to(label(1), { color: 'var(--grey)', duration: 0.6, ease: ease.quiet }, '<')
      .to(q('.s02-sub'), fadeUp, '<0.3')
      .addLabel('beat:3');
    hold(tl, 0.6);

    // 4 — AI changes the final layer: the camera lifts it out of the stack and faces it
    tl.to(planes.slice(0, 2), { yPercent: (i) => OFFSETS[i] - 80, autoAlpha: 0.1, duration: 1.7, ease: ease.settle })
      .to(q('.k0, .k1'), { autoAlpha: 0.25, duration: 1, ease: ease.quiet }, '<')
      .to(q('.s02-h1'), { autoAlpha: 0, y: -30, duration: 0.7, ease: ease.exit }, '<')
      .to(planes[2], { rotationX: 0, yPercent: 0, scale: portrait ? 1.05 : 1.22, duration: 1.9, ease: ease.settle }, '<')
      .to(faces[2], { rotation: 0, duration: 1.9, ease: ease.settle }, '<')
      .to(q('.glow'), { autoAlpha: 1, duration: 1.6, ease: ease.quiet }, '<0.4')
      .to(q('.s02-h2'), fadeUp, '<0.3')
      .to(q('.s02-journey'), { autoAlpha: 0, duration: 0.6, ease: ease.quiet }, '<')
      .to(q('.s02-field'), { autoAlpha: 1, duration: 0.8, ease: ease.quiet }, '>-0.3')
      .set(root, { attr: { 'data-live': '1' } }, '<')
      .to(q('.s02-designed'), { color: 'var(--grey-2)', backgroundSize: '100% 1px', duration: 0.6, ease: ease.settle }, '<')
      .to(q('.s02-decided'), { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '>-0.1')
      .addLabel('beat:4');

    hold(tl, 1.2);
    tl.to(planes[2], { scale: portrait ? 2.6 : 3.4, autoAlpha: 0, duration: 1.6, ease: 'power2.in' }).to(
      q('.s02-labels, .s02-head, .s02-plane.p0, .s02-plane.p1, .glow'),
      { autoAlpha: 0, duration: 0.8, ease: ease.quiet },
      '<',
    );
    return tl;
  },
};

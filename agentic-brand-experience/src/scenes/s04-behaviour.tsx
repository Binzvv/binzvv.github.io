import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { ease, hold, newTimeline } from '../core/motion';

/* A fictional identity in a bento grid, dismantled one tile at a time, in the deck's order. */
const TILES = [
  { id: 'logo', label: 'Logo', not: 'Not its logo.' },
  { id: 'colour', label: 'Colour', not: 'Not its colour.' },
  { id: 'type', label: 'Typography', not: 'Not its typography.' },
  { id: 'name', label: 'Name', not: 'Not even its name.' },
];

function TileBody({ id }: { id: string }) {
  switch (id) {
    case 'logo':
      return (
        <svg viewBox="0 0 60 60" className="s04-mark" aria-hidden="true">
          <circle cx="30" cy="30" r="26" />
          <path d="M30 4 A26 26 0 0 1 56 30 L30 30 Z" />
        </svg>
      );
    case 'colour':
      return (
        <>
          <span className="s04-field" />
          <span className="s04-hex">Halden Blue · #2F6BFF</span>
        </>
      );
    case 'type':
      return (
        <>
          <span className="s04-specimen">Aa</span>
          <span className="s04-specimen-meta">Halden Serif Italic</span>
        </>
      );
    default:
      return (
        <>
          <span className="s04-name s04-name-serif">Halden</span>
          <span className="s04-name s04-name-plain">Halden</span>
        </>
      );
  }
}

function Behaviour(_: SceneProps) {
  return (
    <div className="scene s04">
      <header className="s04-head">
        <span className="eyebrow">Recognition</span>
        <h2 className="headline">
          Can a brand be recognised
          <br />
          by what it decides?
        </h2>
      </header>

      <div className="s04-bento" aria-label="A fictional brand identity whose logo, colour, typography and name are removed in turn.">
        {TILES.map((t) => (
          <div key={t.id} className={`s04-tile tile t-${t.id}`}>
            <div className="s04-body">
              <TileBody id={t.id} />
            </div>
            <span className="s04-ghost" aria-hidden="true" />
            <span className="s04-cap">
              <span className="s04-cap-label">{t.label}</span>
              <span className="s04-cap-not">{t.not}</span>
            </span>
          </div>
        ))}
        <span className="s04-fict caption">Fictional brand, for illustration.</span>
      </div>

      <div className="s04-light">
        <p className="mega s04-answer">
          <span className="s04-its">Its</span>
          <span className="grad s04-beh">behaviour.</span>
        </p>
      </div>
    </div>
  );
}

export const s04: SceneDef = {
  id: 'behaviour',
  kicker: 'Recognition',
  title: 'What makes a brand recognisable?',
  nav: 'Behaviour',
  length: 6,
  Component: Behaviour,
  build({ q }) {
    const tile = (id: string) => q(`.t-${id}`)[0];
    const fadeUp = { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' };

    gsap.set(q('.s04-head .eyebrow, .s04-head .headline'), { autoAlpha: 0, y: 30 });
    gsap.set(q('.s04-tile'), { autoAlpha: 0, y: 60, scale: 0.96 });
    gsap.set(q('.s04-fict'), { autoAlpha: 0 });
    gsap.set(q('.s04-ghost, .s04-cap-not, .s04-name-plain'), { autoAlpha: 0 });
    gsap.set(q('.s04-light'), { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(q('.s04-its, .s04-beh'), { autoAlpha: 0, y: 80 });
    gsap.set(q('.s04-beh'), { backgroundPosition: '100% 0' });

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 });

    // 1 — the question
    tl.to(q('.s04-head .eyebrow'), fadeUp).to(q('.s04-head .headline'), fadeUp, '<0.1').addLabel('beat:1');
    hold(tl, 0.4);

    // 2 — a familiar kind of brand assembles, tile by tile
    tl.to(q('.s04-tile'), { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, stagger: 0.12, ease: 'expo.out' })
      .to(q('.s04-fict'), { autoAlpha: 1, duration: 0.6 }, '>-0.6')
      .addLabel('beat:2');
    hold(tl, 0.5);

    // 3–6 — absence as a design device: each tile empties to a dashed ghost
    TILES.forEach((t, i) => {
      const el = tile(t.id);
      const q2 = (s: string) => el.querySelectorAll(s);
      if (t.id === 'type') {
        // typography leaves twice: the specimen, and the name's typeface
        tl.to(q2('.s04-body'), { autoAlpha: 0, scale: 0.94, duration: 0.7, ease: ease.quiet })
          .to(q('.s04-name-serif'), { autoAlpha: 0, duration: 0.5, ease: ease.quiet }, '<')
          .to(q('.s04-name-plain'), { autoAlpha: 1, duration: 0.5, ease: ease.quiet }, '<0.25');
      } else if (t.id === 'colour') {
        tl.to(q('.s04-field'), { backgroundColor: '#3a3a3c', duration: 0.7, ease: 'sine.inOut' }).to(q2('.s04-body'), {
          autoAlpha: 0,
          duration: 0.5,
          ease: ease.quiet,
        });
      } else {
        tl.to(q2('.s04-body'), { autoAlpha: 0, scale: 0.94, duration: 0.7, ease: ease.quiet });
      }
      tl.to(el, { backgroundColor: 'rgba(29,29,31,0)', duration: 0.6, ease: ease.quiet }, '<0.1')
        .to(q2('.s04-ghost'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '<')
        .to(q2('.s04-cap-label'), { autoAlpha: 0, y: -10, duration: 0.4, ease: ease.quiet }, '<')
        .fromTo(q2('.s04-cap-not'), { y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '<0.2');
      if (i === TILES.length - 1) tl.to(q('.s04-fict'), { autoAlpha: 0, duration: 0.4 }, '<');
      tl.addLabel(`beat:${i + 3}`);
      hold(tl, 0.5);
    });

    // 7 — the answer, on light, at the scale of the whole frame
    tl.to(q('.s04-light'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
      .to(q('.s04-its'), { autoAlpha: 1, y: 0, duration: 1.4, ease: 'expo.out' }, '>-0.4')
      .to(q('.s04-beh'), { autoAlpha: 1, y: 0, duration: 1.5, ease: 'expo.out' }, '<0.12')
      .to(q('.s04-beh'), { backgroundPosition: '0% 0', duration: 2, ease: 'power2.inOut' }, '<')
      .addLabel('beat:7');

    hold(tl, 1.2);
    tl.to(q('.s04-answer'), { autoAlpha: 0, y: -60, duration: 0.9, ease: ease.exit }).to(
      q('.s04-light'),
      { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' },
      '>-0.3',
    );
    return tl;
  },
};

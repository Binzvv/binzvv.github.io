import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { Letters, Line } from '../core/Type';
import { ease, hold, newTimeline } from '../core/motion';

const NOTS = ['Not its logo.', 'Not its colour.', 'Not its typography.', 'Not even its name.'];

function Ghost({ label }: { label: string }) {
  return (
    <span className="s04-ghost" aria-hidden="true">
      <span className="mono">{label}</span>
    </span>
  );
}

function Behaviour(_: SceneProps) {
  return (
    <div className="scene s04">
      <div className="light" style={{ ['--lx' as string]: '74%', ['--ly' as string]: '48%' }} />
      <h2 className="s04-q head">
        <Line>Can a brand be</Line>
        <Line>recognised by</Line>
        <Line>what it decides?</Line>
      </h2>

      <ul className="s04-nots">
        {NOTS.map((t, i) => (
          <li key={t} className={`n${i}`}>
            <Line>{t}</Line>
          </li>
        ))}
      </ul>

      {/* A fictional identity, dismantled one element at a time. */}
      <figure className="s04-brand" aria-label="A fictional brand identity whose logo, colour, typography and name are removed in turn.">
        <div className="s04-frame" />
        <div className="s04-zone z-logo">
          <svg viewBox="0 0 60 60" className="s04-mark" aria-hidden="true">
            <circle cx="30" cy="30" r="27" />
            <path d="M30 3 A27 27 0 0 1 57 30 L30 30 Z" />
          </svg>
          <Ghost label="Logo" />
        </div>
        <div className="s04-zone z-type">
          <span className="s04-specimen">Aa</span>
          <span className="s04-specimen-meta mono">Halden Serif · Italic</span>
          <Ghost label="Typography" />
        </div>
        <div className="s04-zone z-name">
          <span className="s04-name s04-name-serif">Halden</span>
          <span className="s04-name s04-name-plain">HALDEN</span>
          <Ghost label="Name" />
        </div>
        <div className="s04-zone z-colour">
          <span className="s04-field" />
          <span className="s04-field-meta mono">#FF4F1F</span>
          <Ghost label="Colour" />
        </div>
        <figcaption className="s04-caption mono">Fictional brand · for illustration</figcaption>
      </figure>

      <div className="s04-paper">
        <p className="s04-answer display">
          <span className="line">
            <span className="line-in">
              <Letters text="ITS" />
            </span>
          </span>
          <span className="line">
            <span className="line-in">
              <Letters text="BEHAVIOUR." />
            </span>
          </span>
        </p>
      </div>
    </div>
  );
}

export const s04: SceneDef = {
  id: 'behaviour',
  kicker: 'Recognition',
  title: 'What makes a brand recognisable?',
  length: 6,
  Component: Behaviour,
  build({ q }) {
    const not = (i: number) => q(`.s04-nots .n${i} .line-in`);
    const ghost = (z: string) => q(`.${z} .s04-ghost`);
    const letters = q('.s04-answer .ch');

    gsap.set(q('.s04-q .line-in, .s04-nots .line-in'), { yPercent: 112 });
    gsap.set(q('.s04-frame'), { scaleY: 0, transformOrigin: '50% 0%' });
    gsap.set(q('.s04-mark'), { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set(q('.s04-zone > *:not(.s04-ghost), .s04-caption'), { autoAlpha: 0 });
    gsap.set(q('.s04-field'), { scaleY: 0, transformOrigin: '50% 100%' });
    gsap.set(q('.s04-ghost'), { autoAlpha: 0 });
    gsap.set(q('.s04-paper'), { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(letters, { yPercent: 115 });

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 });

    // 1 — the question
    tl.to(q('.s04-q .line-in'), { yPercent: 0, stagger: 0.1, duration: 1.2 }).addLabel('beat:1');
    hold(tl, 0.4);

    // 2 — a familiar kind of brand assembles
    tl.to(q('.s04-frame'), { scaleY: 1, duration: 1.1, ease: ease.settle })
      .to(q('.s04-field'), { autoAlpha: 1, scaleY: 1, duration: 1.1, ease: ease.settle }, '<0.3')
      .to(q('.s04-mark'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '<0.4')
      .fromTo(q('.s04-mark'), { rotation: -90 }, { rotation: 0, duration: 1.2, ease: ease.reveal }, '<')
      .to(q('.s04-name-serif'), { autoAlpha: 1, duration: 0.8, ease: ease.quiet }, '<0.2')
      .to(q('.s04-specimen, .s04-specimen-meta, .s04-field-meta, .s04-caption'), { autoAlpha: 1, duration: 0.8, stagger: 0.08, ease: ease.quiet }, '<0.1')
      .addLabel('beat:2');
    hold(tl, 0.5);

    const remove = (i: number, body: (t: gsap.core.Timeline) => void) => {
      tl.to(not(i), { yPercent: 0, duration: 0.9 });
      if (i > 0) tl.to(not(i - 1), { color: 'var(--fg-3)', duration: 0.6, ease: ease.quiet }, '<');
      body(tl);
      tl.addLabel(`beat:${i + 3}`);
      hold(tl, 0.5);
    };

    // 3–6 — absence as a design device: each element leaves a hairline ghost
    remove(0, (t) =>
      t
        .to(q('.s04-mark'), { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.9, ease: ease.settle }, '<0.15')
        .to(ghost('z-logo'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '>-0.3'),
    );
    remove(1, (t) =>
      t
        .to(q('.s04-field'), { backgroundColor: '#3a3a3c', duration: 0.8, ease: 'sine.inOut' }, '<0.15')
        .to(q('.s04-field'), { autoAlpha: 0, duration: 0.6, ease: ease.quiet })
        .to(q('.s04-field-meta'), { autoAlpha: 0, duration: 0.4 }, '<')
        .to(ghost('z-colour'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '>-0.3'),
    );
    remove(2, (t) =>
      t
        .to(q('.s04-specimen, .s04-specimen-meta'), { autoAlpha: 0, y: -8, duration: 0.6, ease: ease.quiet }, '<0.15')
        .to(q('.s04-name-serif'), { autoAlpha: 0, duration: 0.5, ease: ease.quiet }, '<')
        .to(q('.s04-name-plain'), { autoAlpha: 1, duration: 0.5, ease: ease.quiet }, '<0.2')
        .to(ghost('z-type'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '<'),
    );
    remove(3, (t) =>
      t
        .to(q('.s04-name-plain'), { autoAlpha: 0, duration: 0.6, ease: ease.quiet }, '<0.15')
        .to(ghost('z-name'), { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '>-0.3')
        .to(q('.s04-caption'), { autoAlpha: 0, duration: 0.4 }, '<'),
    );

    // 7 — the answer, at the scale of the whole frame, on paper
    tl.to(q('.s04-paper'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
      .to(letters, { yPercent: 0, duration: 1.4, stagger: 0.04, ease: ease.reveal }, '>-0.45')
      .addLabel('beat:7');

    hold(tl, 1.2);
    tl.to(q('.s04-answer .line-in'), { yPercent: -112, duration: 0.9, stagger: 0.08, ease: ease.exit }).to(
      q('.s04-paper'),
      { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' },
      '>-0.3',
    );
    return tl;
  },
};

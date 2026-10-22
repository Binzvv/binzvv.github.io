import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { ease, hold, newTimeline } from '../core/motion';

function Question({ mode }: SceneProps) {
  return (
    <div className="scene s01">
      <div className="glow" style={{ ['--gx' as string]: '50%', ['--gy' as string]: '70%' }} />
      <h1 className="s01-h">
        <span className="s01-eye">Agentic Brand Experience</span>
        <span className="hero s01-a">What happens to brand</span>
        <span className="hero s01-b grey">when the interface starts making</span>
        <span className="mega s01-c">
          <span className="grad">decisions?</span>
        </span>
      </h1>
      {mode === 'explore' && (
        <div className="s01-cue caption" aria-hidden="true">
          Scroll
          <svg viewBox="0 0 16 10">
            <path d="M2 2l6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  );
}

export const s01: SceneDef = {
  id: 'question',
  kicker: 'The question',
  title: 'The question',
  nav: 'Question',
  length: 4,
  Component: Question,
  build({ q }) {
    const fadeUp = { autoAlpha: 1, y: 0, duration: 1.3, ease: 'power3.out' };
    const word = q('.s01-c')[0];
    const grad = q('.s01-c .grad')[0];

    gsap.set(q('.s01-eye, .s01-a, .s01-b'), { autoAlpha: 0, y: 40 });
    gsap.set(word, { autoAlpha: 0, scale: 1.22, y: 0 });
    gsap.set(grad, { backgroundPosition: '100% 0' });

    const tl = newTimeline();
    tl.to({}, { duration: 0.35 });

    // 1 — the subject
    tl.to(q('.s01-eye'), fadeUp)
      .to(q('.s01-a'), fadeUp, '<0.15')
      .to(q('.s01-cue'), { autoAlpha: 0, duration: 0.4, ease: ease.quiet }, '<')
      .addLabel('beat:1');
    hold(tl, 0.5);

    // 2 — the condition
    tl.to(q('.s01-b'), fadeUp).addLabel('beat:2');
    hold(tl, 0.5);

    // 3 — the climax: the word settles out of the camera and the finish catches the light
    tl.to(word, { autoAlpha: 1, scale: 1, duration: 1.8, ease: 'expo.out' })
      .to(q('.glow'), { autoAlpha: 1, duration: 1.6, ease: ease.quiet }, '<0.1')
      .to(grad, { backgroundPosition: '0% 0', duration: 2.2, ease: 'power2.inOut' }, '<0.1')
      .addLabel('beat:3');

    // scroll-only exit: the question lifts away; the word pushes through the camera
    hold(tl, 1.2);
    tl.to(q('.s01-eye, .s01-a, .s01-b'), { autoAlpha: 0, y: -40, duration: 0.9, stagger: 0.05, ease: ease.exit })
      .to(word, { scale: 2.4, autoAlpha: 0, duration: 1.5, ease: 'power2.in' }, '<0.1')
      .to(q('.glow'), { autoAlpha: 0, duration: 1 }, '<0.3');

    return tl;
  },
};

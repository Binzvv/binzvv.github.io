import { gsap } from 'gsap';
import type { SceneDef } from '../core/types';
import { Letters, Line } from '../core/Type';
import { ease, hold, newTimeline } from '../core/motion';

function Question({ mode }: { mode: string }) {
  return (
    <div className="scene s01">
      <div className="light" style={{ ['--lx' as string]: '30%', ['--ly' as string]: '78%' }} />
      <h1 className="s01-q">
        <span className="s01-lead head">
          <Line className="l1">What happens to brand</Line>
          <Line className="l2">when the interface</Line>
          <Line className="l3">starts making</Line>
        </span>
        <span className="line s01-big display">
          <span className="line-in">
            <Letters text="DECISIONS?" />
          </span>
        </span>
      </h1>
      {mode === 'explore' && (
        <div className="s01-cue mono" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      )}
    </div>
  );
}

export const s01: SceneDef = {
  id: 'question',
  kicker: 'Agentic Brand Experience / 001',
  title: 'The question',
  length: 4,
  Component: Question,
  build({ q }) {
    const [l1, l2, l3] = ['.l1', '.l2', '.l3'].map((s) => q(`${s} .line-in`)[0]);
    const letters = q('.s01-big .ch');
    const lead = q('.s01-lead .line-in');
    const cue = q('.s01-cue');

    gsap.set([l1, l2, l3], { yPercent: 112 });
    gsap.set(letters, { yPercent: 118 });

    const tl = newTimeline();
    tl.to({}, { duration: 0.35 });

    // 1 — the subject
    tl.to(l1, { yPercent: 0, duration: 1.2 })
      .to(cue, { autoAlpha: 0, duration: 0.4, ease: ease.quiet }, '<')
      .addLabel('beat:1');
    hold(tl, 0.5);

    // 2 — the condition
    tl.to(l2, { yPercent: 0, duration: 1.2 })
      .to(l1, { color: 'var(--fg-2)', duration: 0.9, ease: ease.quiet }, '<0.1')
      .addLabel('beat:2');
    hold(tl, 0.5);

    // 3 — the climax: the verb, then DECISIONS at monumental scale
    tl.to(l3, { yPercent: 0, duration: 1 })
      .to([l1, l2], { color: 'var(--fg-3)', duration: 1, ease: ease.quiet }, '<')
      .to(l3, { color: 'var(--fg-2)', duration: 0.8, ease: ease.quiet }, '>-0.2')
      .to(letters, { yPercent: 0, duration: 1.5, stagger: 0.055, ease: 'expo.out' }, '<-0.5')
      // one slow pass of light across the word
      .to(letters, { color: '#ffffff', duration: 0.35, stagger: 0.06, ease: 'sine.inOut' }, '>-0.6')
      .to(letters, { color: 'var(--metal)', duration: 0.7, stagger: 0.06, ease: 'sine.inOut' }, '<0.35')
      .addLabel('beat:3');

    // scroll-only exit: the question falls away, DECISIONS pushes toward camera
    hold(tl, 1.2);
    tl.to(lead, { yPercent: -112, duration: 0.9, stagger: 0.06, ease: ease.exit })
      .to(q('.s01-big'), { scale: 1.9, autoAlpha: 0, duration: 1.4, ease: 'power2.in' }, '<0.15');

    return tl;
  },
};

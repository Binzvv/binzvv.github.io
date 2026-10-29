import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { LENSES, LENS_META } from '../content.js';

const WORD = 'PERSPECTIVE';
const QUESTION = ['What', 'are', 'you', 'here', 'to', 'explore?'];

export default function Intro({ reduced, onChoose }) {
  const root = useRef(null);
  const tl = useRef(null);
  const [preview, setPreview] = useState(null);
  const [ready, setReady] = useState(false);
  const chosen = useRef(false);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray('.intro-logo .ch');
      const t = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => setReady(true),
      });
      t.set('.intro-q .w > span, .choice-anim', { yPercent: 115 })
        .set('.choice-rule', { scaleX: 0 })
        .set('.choice-meta, .intro-foot, .intro-mark', { autoAlpha: 0 })
        .set(letters, { yPercent: 110, '--wdth': 62 })
        .fromTo('.intro-line', { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'expo.inOut' })
        .to(letters, { yPercent: 0, duration: 0.9, stagger: 0.045, ease: 'expo.out' }, '-=0.2')
        .to('.intro-line', { scaleX: 0, transformOrigin: '100% 50%', duration: 0.7, ease: 'expo.in' }, '<0.2')
        .to(letters, { '--wdth': 125, duration: 1.1, stagger: { each: 0.03, from: 'center' }, ease: 'power2.inOut' }, '<')
        .fromTo('.intro-tag', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.5')
        .to(letters, { '--wdth': 62, yPercent: -110, duration: 0.7, stagger: { each: 0.025, from: 'edges' }, ease: 'expo.in' }, '+=0.6')
        .to('.intro-tag', { autoAlpha: 0, duration: 0.3 }, '<')
        .set('.intro-open', { display: 'none' })
        .to('.intro-mark', { autoAlpha: 1, duration: 0.5 })
        .to('.intro-q .w > span', { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, '<')
        .to('.choice-rule', { scaleX: 1, duration: 0.9, stagger: 0.12, ease: 'expo.inOut' }, '-=0.5')
        .to('.choice-anim', { yPercent: 0, duration: 1, stagger: 0.12, ease: 'expo.out' }, '<0.15')
        .to('.choice-meta', { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, '-=0.6')
        .to('.intro-foot', { autoAlpha: 1, duration: 0.5 }, '<');
      tl.current = t;
      if (reduced) t.progress(1);
    }, root);
    return () => ctx.revert();
    // The opening plays once per mount; toggling motion mid-way just jumps to the end (below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reduced && tl.current && tl.current.progress() < 1) tl.current.progress(1);
  }, [reduced]);

  const skip = () => tl.current?.progress(1);

  const choose = (lens, e) => {
    if (chosen.current) return;
    chosen.current = true;
    if (tl.current && tl.current.progress() < 1) tl.current.progress(1);
    if (reduced) {
      onChoose(lens);
      return;
    }
    const btn = e.currentTarget;
    const others = gsap.utils.toArray('.choice', root.current).filter((b) => b !== btn);
    gsap
      .timeline({ onComplete: () => onChoose(lens) })
      .to(others, { autoAlpha: 0.08, duration: 0.35 })
      .to(btn.querySelector('.choice-word'), { scale: 1.06, xPercent: 2, duration: 0.5, ease: 'power3.out' }, 0)
      .to('.intro-q, .intro-mark', { autoAlpha: 0, duration: 0.3 }, 0);
  };

  // Number keys 1–3 pick a lens once the question is on screen.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i > -1) {
        const btn = root.current?.querySelectorAll('.choice')[i];
        if (btn) btn.click();
      } else if ((e.key === 'Enter' || e.key === ' ') && !ready && tl.current?.progress() < 1) {
        if (e.target === document.body) {
          e.preventDefault();
          skip();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ready]);

  return (
    <main id="main" className="intro" ref={root} data-preview={preview || 'none'}>
      <div className="intro-previews" aria-hidden="true">
        <div className="pv pv-sound">
          {Array.from({ length: 48 }, (_, i) => (
            <i key={i} style={{ '--h': `${18 + ((i * 37) % 70)}%`, '--d': `${(i % 8) * 0.07}s` }} />
          ))}
        </div>
        <div className="pv pv-film">
          <b />
          <b />
        </div>
        <div className="pv pv-culture" />
      </div>

      <div className="intro-open" aria-hidden="true">
        <div className="intro-line" />
        <div className="intro-logo">
          {WORD.split('').map((c, i) => (
            <span className="ch-wrap" key={i}>
              <span className="ch">{c}</span>
            </span>
          ))}
        </div>
        <p className="intro-tag">An independent studio — sound, film &amp; culture</p>
      </div>

      <div className="intro-mark">
        <span className="intro-mark-logo">PERSPECTIVE</span>
        <span>Independent studio · Est. 2019</span>
      </div>

      <div className="intro-body">
        <h1 className="intro-q" id="intro-q">
          <span className="sr-only">PERSPECTIVE. </span>
          {QUESTION.map((w, i) => (
            <span className="w" key={i}>
              <span>{w}</span>{' '}
            </span>
          ))}
        </h1>

        <ul className="intro-choices" aria-labelledby="intro-q">
          {LENSES.map((id, i) => {
            const m = LENS_META[id];
            return (
              <li key={id}>
                <span className="choice-rule" aria-hidden="true" />
                <button
                  type="button"
                  className={`choice choice-${id}`}
                  onClick={(e) => choose(id, e)}
                  onMouseEnter={() => setPreview(id)}
                  onMouseLeave={() => setPreview(null)}
                  onFocus={() => setPreview(id)}
                  onBlur={() => setPreview(null)}
                  aria-describedby={`choice-desc-${id}`}
                >
                  <span className="choice-meta choice-no" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <span className="choice-clip">
                    <span className="choice-anim">
                      <span className="choice-word">{m.label}</span>
                    </span>
                  </span>
                  <span className="choice-meta choice-verb">{m.verb}</span>
                  <span className="choice-meta choice-desc" id={`choice-desc-${id}`}>
                    {m.blurb}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="intro-foot">
        <span>Your choice reshapes the studio. We’ll remember it — you can change it any time.</span>
        <span className="intro-keys" aria-hidden="true">
          Press 1 · 2 · 3
        </span>
      </div>

      {!ready && !reduced && (
        <button type="button" className="intro-skip" onClick={skip}>
          Skip intro
        </button>
      )}
    </main>
  );
}

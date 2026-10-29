import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { LENSES, LENS_META } from '../content.js';
import { timeAgo } from '../storage.js';

export default function Return({ reduced, lens, session, onContinue, onSwitch, onCross, onReset }) {
  const root = useRef(null);
  const meta = LENS_META[lens];
  const d = session.discovery;
  const prev = session.previous || {};
  const others = LENSES.filter((l) => l !== lens);
  const trail = (prev.history || [])
    .map((h) => h.lens)
    .filter((l, i, arr) => l !== arr[i - 1])
    .slice(-5);

  useLayoutEffect(() => {
    if (reduced) {
      root.current?.querySelector('.r-title')?.focus({ preventScroll: true });
      return undefined;
    }
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'expo.out' } })
        .from('.r-line > span', { yPercent: 115, duration: 1.1, stagger: 0.1 })
        .from('.r-eyebrow, .r-lede', { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.1 }, '-=0.8')
        .from('.r-card', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.6')
        .from('.r-card > *', { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.06 }, '-=0.4')
        .from('.r-actions > *', { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.07 }, '-=0.5')
        .add(() => root.current?.querySelector('.r-title')?.focus({ preventScroll: true }), 0.2);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main id="main" className={`return return-${lens}`} ref={root}>
      <div className="r-mark">
        <span className="r-logo">PERSPECTIVE</span>
        <span>Visit {String(session.visits).padStart(2, '0')}</span>
      </div>

      <div className="r-grid">
        <div className="r-left">
          <p className="r-eyebrow">
            <span className="r-dot" aria-hidden="true" /> We remember you · last here {timeAgo(prev.lastVisit)}
          </p>
          <h1 className="r-title" tabIndex={-1}>
            <span className="r-line">
              <span>Welcome back,</span>
            </span>
            <span className="r-line">
              <span className="r-noun">{meta.noun}.</span>
            </span>
          </h1>
          <p className="r-lede">
            Last time you came here <strong>{meta.verb}</strong>. So instead of the opening again, we kept something
            new for you.
          </p>
          {trail.length > 1 && (
            <p className="r-trail" aria-label={`Your trail so far: ${trail.join(', ')}`}>
              <span aria-hidden="true">Your trail</span>
              {trail.map((t, i) => (
                <span key={i} className={`r-trail-step is-${t}`} aria-hidden="true">
                  {LENS_META[t].label}
                </span>
              ))}
              <span className="r-trail-step is-next" aria-hidden="true">
                ?
              </span>
            </p>
          )}
        </div>

        {d && (
          <article className="r-card" aria-labelledby="r-card-title">
            <p className="r-card-label">New since your last visit</p>
            <p className="r-card-kind">{d.kind}</p>
            <h2 className="r-card-title" id="r-card-title">
              {d.title}
            </h2>
            <p className="r-card-blurb">{d.blurb}</p>
            {d.crossTo && (
              <button type="button" className="r-cross" onClick={() => onCross(d.crossTo)}>
                Step into {LENS_META[d.crossTo].label} for this <span aria-hidden="true">→</span>
              </button>
            )}
          </article>
        )}
      </div>

      <div className="r-actions">
        <button type="button" className="r-primary" onClick={onContinue}>
          Continue with {meta.label} <span aria-hidden="true">→</span>
        </button>
        <div className="r-change" role="group" aria-label="Change direction">
          <span className="r-change-label">Or change direction</span>
          {others.map((l) => (
            <button key={l} type="button" className={`r-alt r-alt-${l}`} onClick={() => onSwitch(l)}>
              {LENS_META[l].label}
            </button>
          ))}
        </div>
        <button type="button" className="r-reset" onClick={onReset}>
          Forget me &amp; start over
        </button>
      </div>
    </main>
  );
}

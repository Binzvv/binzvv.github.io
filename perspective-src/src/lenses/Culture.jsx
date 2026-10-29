import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CULTURE } from '../content.js';

gsap.registerPlugin(Flip, ScrollTrigger);

// A slight, stable tilt per card so the grid reads as pasted-up paper.
const tilt = (i) => [-1.2, 0.8, -0.4, 1.4, -0.9, 0.5, -1.6][i % 7];

function Art({ kind, i }) {
  return (
    <div className={`c-art c-art-${kind}`} aria-hidden="true">
      {kind === 'type' && <span>Aa</span>}
      {kind === 'arch' && <span className="c-arch" />}
      {kind === 'circle' && <span className="c-dot" />}
      <span className="c-art-no">{String(i + 1).padStart(2, '0')}</span>
    </div>
  );
}

export default function Culture({ reduced, welcome }) {
  const root = useRef(null);
  const grid = useRef(null);
  const [filter, setFilter] = useState('All');
  const [tickerPaused, setTickerPaused] = useState(false);
  const flipState = useRef(null);
  const ticker = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap
        .timeline({ defaults: { ease: 'back.out(1.6)' } })
        .from('.c-hero .ln > span', { yPercent: 105, rotate: () => gsap.utils.random(-8, 8), duration: 0.9, stagger: 0.12, ease: 'expo.out' })
        .from('.c-issue > *', { autoAlpha: 0, y: -8, duration: 0.4, stagger: 0.06 }, 0.2)
        .from('.c-stamp', { scale: 2.4, rotate: -40, autoAlpha: 0, duration: 0.6 }, 0.7)
        .from('.c-standfirst, .c-index', { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, 0.6)
        .from('.welcome-culture', { y: -60, rotate: 12, autoAlpha: 0, duration: 0.8 }, 1);

      ScrollTrigger.batch('.c-card', {
        start: 'top 92%',
        once: true,
        onEnter: (els) =>
          gsap.from(els, {
            y: -50,
            rotate: () => gsap.utils.random(-10, 10),
            scale: 1.06,
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: 'back.out(1.4)',
            clearProps: 'scale',
          }),
      });

      gsap.from('.c-quote p', {
        clipPath: 'inset(0 100% 0 0)',
        duration: 1.2,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '.c-quote', start: 'top 75%', once: true },
      });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // The ticker: infinite marquee, pausable (and static under reduced motion).
  useLayoutEffect(() => {
    if (reduced) return undefined;
    const t = gsap.to('.c-ticker-track', { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    ticker.current = t;
    return () => t.kill();
  }, [reduced]);

  useLayoutEffect(() => {
    if (!ticker.current) return;
    if (tickerPaused) ticker.current.pause();
    else ticker.current.play();
  }, [tickerPaused]);

  // Re-flow the grid with Flip when the filter changes.
  useLayoutEffect(() => {
    if (!flipState.current) return;
    const state = flipState.current;
    flipState.current = null;
    if (reduced) return;
    Flip.from(state, {
      duration: 0.7,
      ease: 'power3.inOut',
      absolute: true,
      stagger: 0.03,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.85, rotate: -6 }, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(1.6)' }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.4 }),
    });
  }, [filter, reduced]);

  const choose = (f) => {
    if (f === filter) return;
    flipState.current = Flip.getState(grid.current.querySelectorAll('.c-card'));
    setFilter(f);
  };

  const visible = CULTURE.stories.filter((s) => filter === 'All' || s.cat === filter);
  const tickerItems = [...CULTURE.ticker, ...CULTURE.ticker];

  return (
    <main id="main" className="culture" ref={root}>
      <div className="c-ticker" onMouseEnter={() => setTickerPaused(true)} onMouseLeave={() => setTickerPaused(false)}>
        <div className="c-ticker-track" aria-hidden="true">
          {tickerItems.map((t, i) => (
            <span key={i}>
              {t} <b>✶</b>
            </span>
          ))}
        </div>
        <p className="sr-only">Latest: {CULTURE.ticker.join('. ')}.</p>
        {!reduced && (
          <button type="button" className="c-ticker-btn" aria-pressed={tickerPaused} onClick={() => setTickerPaused((p) => !p)}>
            {tickerPaused ? 'Play ticker' : 'Pause ticker'}
          </button>
        )}
      </div>

      <header className="c-masthead">
        <div className="c-issue">
          <span>PERSPECTIVE/Culture</span>
          <span>Issue {CULTURE.issue}</span>
          <span>{CULTURE.season}</span>
          <span>Theme: “{CULTURE.theme}”</span>
        </div>
        <div className="c-hero">
          <h1>
            {CULTURE.hero.map((l, i) => (
              <span className="ln" key={i}>
                <span>{i === 1 ? <em>{l}</em> : l}</span>
              </span>
            ))}
          </h1>
          <div className="c-stamp" aria-hidden="true">
            <span>{CULTURE.issue}</span>
            <span>Public Rooms</span>
          </div>
        </div>
        <p className="c-standfirst">{CULTURE.standfirst}</p>
        {welcome && <div className="c-welcome-wrap">{welcome}</div>}
      </header>

      <div className="c-body">
        <aside className="c-index" aria-label="Contents and filters">
          <h2 className="c-index-h c-toc-h">Contents</h2>
          <ol className="c-toc">
            {CULTURE.stories.map((s, i) => (
              <li key={s.id} className={visible.includes(s) ? '' : 'is-dim'}>
                <a href={`#story-${s.id}`}>
                  <span>{String(i + 1).padStart(2, '0')}</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
          <h2 className="c-index-h" id="c-filter-h">
            Filter
          </h2>
          <div className="c-filters" role="group" aria-labelledby="c-filter-h">
            {CULTURE.filters.map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => choose(f)}>
                {f}
              </button>
            ))}
          </div>
          <p className="c-count" aria-live="polite">
            Showing {visible.length} of {CULTURE.stories.length}
          </p>
        </aside>

        <div className="c-grid" ref={grid}>
          {visible.map((s) => {
            const i = CULTURE.stories.indexOf(s);
            return (
              <article
                key={s.id}
                id={`story-${s.id}`}
                className={`c-card c-${s.size}`}
                data-flip-id={s.id}
                style={{ '--tilt': `${tilt(i)}deg` }}
              >
                <Art kind={s.art} i={i} />
                <div className="c-card-body">
                  <p className="c-cat">{s.cat}</p>
                  <h3 className="c-card-title">
                    <a href={`#story-${s.id}`}>{s.title}</a>
                  </h3>
                  <p className="c-dek">{s.dek}</p>
                  <p className="c-by">
                    <span>{s.by}</span>
                    <span>{s.read}</span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <section className="c-quote" aria-label="Pull quote">
        <p>“{CULTURE.quote.text}”</p>
        <cite>{CULTURE.quote.by}</cite>
      </section>

      <footer className="c-colophon">
        <p className="c-colophon-big">
          Write to the editors <span>letters@perspective.example</span>
        </p>
        <p>Colophon — Set in Fraunces &amp; Archivo. Printed on the internet. Issue {CULTURE.issue}, {CULTURE.season}.</p>
      </footer>
    </main>
  );
}

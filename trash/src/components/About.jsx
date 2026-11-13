import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Words from './Words';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { prefersReducedMotion } from '../lib/motion';
import { DISCIPLINES, PERSON, RESULT, SECONDARY, STATEMENT, meaningFor } from '../engine/connections';
import '../styles/about.css';

const BASE_OPACITY = 0.6;
const MAGNET_RADIUS = 260;
const MAGNET_PULL = 14;

/**
 * Experiment 002 — Connected thinking.
 * Four disciplines drift in a quiet field. Choose two: they travel
 * toward each other, meet, and the meaning of the connection appears.
 *
 * Each word has three nested layers so motions never fight:
 *   .node  — placement + the connecting move
 *   .drift — slow idle breathing
 *   .mag   — magnetic response to the cursor
 */
export default function About({ onExit }) {
  const root = useRef(null);
  const field = useRef(null);
  const head = useRef(null);
  const reveal = useRef(null);
  const joiner = useRef(null);
  const backRef = useRef(null);
  const personBody = useRef(null);
  const exploreRef = useRef(null);

  const nodes = useRef({});
  const drifts = useRef({});
  const mags = useRef({});
  const labels = useRef({});
  const driftTweens = useRef({});

  const [selected, setSelected] = useState([]);
  const [pair, setPair] = useState(null); // ordered [a, b] once connected
  const [personOpen, setPersonOpen] = useState(false);

  const narrow = useMediaQuery('(max-width: 640px)');
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)');

  const busy = useRef(false);
  const exiting = useRef(false);
  const pairRef = useRef(null);
  const selectedRef = useRef([]);
  pairRef.current = pair;
  selectedRef.current = selected;

  const posOf = useCallback((id) => DISCIPLINES.find((d) => d.id === id)[narrow ? 'narrow' : 'wide'], [narrow]);

  /* ---------- entrance ---------- */

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      gsap.set(q('.node'), { xPercent: -50, yPercent: -50 });
      gsap.set(q('.about__label'), { opacity: BASE_OPACITY });

      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (reduce) {
        tl.from(q('.about__statement, .about__secondary, .about__hint, .node, .person'), {
          opacity: 0,
          duration: 0.5,
        });
      } else {
        tl.from(q('.about__statement .w__i'), {
          opacity: 0,
          yPercent: 60,
          filter: 'blur(10px)',
          duration: 1.3,
          stagger: 0.06,
        })
          .from(q('.about__secondary'), { opacity: 0, y: 8, duration: 1.2 }, 0.6)
          .from(
            q('.node'),
            { opacity: 0, scale: 0.92, duration: 1.8, stagger: 0.14, ease: 'power3.out' },
            0.8,
          )
          .from(q('.about__hint, .person'), { opacity: 0, duration: 1.2, ease: 'power2.out' }, 1.4);

        // Each word breathes on its own slow rhythm — a system at rest, not a layout.
        DISCIPLINES.forEach(({ id }, i) => {
          driftTweens.current[id] = gsap.to(drifts.current[id], {
            x: [6, -5, 4, -6][i],
            y: [-4, 5, -5, 4][i],
            duration: 5.5 + i * 1.3,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        });
      }
    }, root);
    backRef.current?.focus({ preventScroll: true });
    return () => ctx.revert();
  }, []);

  /* ---------- magnetic proximity (precise pointers only) ---------- */

  useEffect(() => {
    if (!finePointer || prefersReducedMotion()) return undefined;
    const movers = DISCIPLINES.map(({ id }) => ({
      id,
      x: gsap.quickTo(mags.current[id], 'x', { duration: 0.9, ease: 'power3.out' }),
      y: gsap.quickTo(mags.current[id], 'y', { duration: 0.9, ease: 'power3.out' }),
      o: gsap.quickTo(labels.current[id], 'opacity', { duration: 0.5, ease: 'power2.out' }),
    }));

    const settle = () =>
      movers.forEach((m) => {
        m.x(0);
        m.y(0);
        m.o(selectedRef.current.includes(m.id) ? 1 : BASE_OPACITY);
      });

    const onMove = (e) => {
      if (pairRef.current) return settle();
      movers.forEach((m) => {
        const r = labels.current[m.id].getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const t = Math.max(0, 1 - d / MAGNET_RADIUS);
        const pull = t * t * MAGNET_PULL;
        m.x((dx / d) * pull);
        m.y((dy / d) * pull);
        m.o(selectedRef.current.includes(m.id) ? 1 : BASE_OPACITY + t * (1 - BASE_OPACITY));
      });
    };

    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', settle);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', settle);
    };
  }, [finePointer]);

  // Without a cursor, selection alone sets each word's brightness.
  useEffect(() => {
    if (finePointer && !prefersReducedMotion()) return;
    DISCIPLINES.forEach(({ id }) =>
      gsap.to(labels.current[id], { opacity: selected.includes(id) ? 1 : BASE_OPACITY, duration: 0.4 }),
    );
  }, [selected, finePointer]);

  /* ---------- geometry for a connected pair ---------- */

  const measurePair = useCallback(
    ([a, b]) => {
      const W = field.current.clientWidth;
      const H = field.current.clientHeight;
      const size = (id) => [labels.current[id].offsetWidth, labels.current[id].offsetHeight];
      const [wA, hA] = size(a);
      const [wB, hB] = size(b);
      const gap = Math.max(36, W * 0.045);
      const vertical = narrow || wA + wB + gap > W * 0.9;
      const cy = H * (vertical ? 0.22 : 0.3);

      const target = vertical
        ? { [a]: [W / 2, cy - hA * 0.8], [b]: [W / 2, cy + hB * 0.8] }
        : { [a]: [W / 2 - gap / 2 - wA / 2, cy], [b]: [W / 2 + gap / 2 + wB / 2, cy] };

      const delta = (id) => {
        const [px, py] = posOf(id);
        return { x: target[id][0] - px * W, y: target[id][1] - py * H };
      };

      return {
        vertical,
        moves: { [a]: delta(a), [b]: delta(b) },
        joiner: vertical
          ? { left: W / 2, top: cy, width: 1, height: Math.round(hA * 0.5) }
          : { left: W / 2, top: cy, width: Math.round(gap * 0.5), height: 1 },
        revealTop: vertical ? cy + hB * 0.8 + hB / 2 + 36 : cy + Math.max(hA, hB) / 2 + 44,
      };
    },
    [narrow, posOf],
  );

  /* ---------- choose ---------- */

  const choose = (id) => {
    if (busy.current || pairRef.current || exiting.current) return;
    if (personOpen) setPersonOpen(false);
    const prev = selectedRef.current;
    if (prev.includes(id)) {
      setSelected(prev.filter((x) => x !== id));
      return;
    }
    const next = [...prev, id];
    setSelected(next);
    if (next.length === 2) {
      // Order by where the words already sit, so each travels the short way.
      const axis = narrow ? 1 : 0;
      setPair([...next].sort((x, y) => posOf(x)[axis] - posOf(y)[axis]));
    }
  };

  /* ---------- connect: the pair travels, meets, and means something ---------- */

  useLayoutEffect(() => {
    if (!pair) return undefined;
    busy.current = true;
    const reduce = prefersReducedMotion();
    const [a, b] = pair;
    const others = DISCIPLINES.map((d) => d.id).filter((id) => !pair.includes(id));
    const geo = measurePair(pair);
    const q = gsap.utils.selector(reveal);
    const hint = root.current.querySelector('.about__hint');

    const W = field.current.clientWidth;
    const H = field.current.clientHeight;
    const ghost = narrow ? 0 : 0.05;
    const person = root.current.querySelector('.person');

    gsap.to(hint, { opacity: 0, duration: 0.4 });
    // While a connection is showing, the disclosure steps back.
    gsap.to(person, { autoAlpha: 0, duration: reduce ? 0.2 : 0.6 });
    gsap.set(joiner.current, { ...geo.joiner, xPercent: -50, yPercent: -50, opacity: 0, scaleX: 0, scaleY: 0 });
    gsap.set(reveal.current, { top: geo.revealTop });
    gsap.set(q('.w__i, .about__result, .about__explore'), { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        exploreRef.current?.focus({ preventScroll: true });
      },
    });

    if (reduce) {
      tl.to(others.map((id) => nodes.current[id]), { opacity: ghost, duration: 0.3 })
        .to([nodes.current[a], nodes.current[b]], { opacity: 0, duration: 0.2 }, 0)
        .set(nodes.current[a], geo.moves[a])
        .set(nodes.current[b], geo.moves[b])
        .to([nodes.current[a], nodes.current[b]], { opacity: 1, duration: 0.3 })
        .to(joiner.current, { opacity: 0.6, scaleX: 1, scaleY: 1, duration: 0.3 })
        .to(q('.w__i'), { opacity: 1, duration: 0.4 })
        .to(q('.about__result'), { opacity: 1, duration: 0.4 }, '+=0.4')
        .to(q('.about__explore'), { opacity: 1, duration: 0.3 });
      return () => tl.kill();
    }

    [a, b].forEach((id) => {
      driftTweens.current[id]?.pause();
      gsap.to([drifts.current[id], mags.current[id]], { x: 0, y: 0, duration: 0.8, ease: 'power2.out', overwrite: true });
    });

    tl.to(head.current, { opacity: 0.32, duration: 1.2, ease: 'power2.out' }, 0)
      .to(
        others.map((id) => nodes.current[id]),
        {
          // The two that weren't chosen give way, drifting gently outward.
          opacity: ghost,
          scale: 0.94,
          x: (i) => (posOf(others[i])[0] - 0.5) * W * 0.12,
          y: (i) => (posOf(others[i])[1] - 0.5) * H * 0.12,
          duration: 1.4,
          ease: 'power2.out',
        },
        0,
      )
      .to(nodes.current[a], { ...geo.moves[a], duration: 1.5, ease: 'expo.inOut' }, 0.1)
      .to(nodes.current[b], { ...geo.moves[b], duration: 1.5, ease: 'expo.inOut' }, 0.16)
      .to(
        joiner.current,
        { opacity: 0.7, [geo.vertical ? 'scaleY' : 'scaleX']: 1, [geo.vertical ? 'scaleX' : 'scaleY']: 1, duration: 0.9, ease: 'power3.out' },
        1.45,
      )
      .fromTo(
        q('.w__i'),
        { yPercent: 50, filter: 'blur(8px)' },
        { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.05, ease: 'expo.out' },
        1.6,
      )
      .fromTo(q('.about__result'), { y: 8 }, { opacity: 1, y: 0, duration: 1.3, ease: 'power3.out' }, '-=0.1')
      .fromTo(q('.about__explore'), { y: 6 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.6');

    gsap.to(document.documentElement, { '--glow': 0.5, duration: 3, ease: 'power2.out' });
    return () => tl.kill();
  }, [pair, measurePair, narrow, posOf]);

  // Keep a connected pair precisely placed if the viewport changes.
  useEffect(() => {
    if (!pair) return undefined;
    const onResize = () => {
      const geo = measurePair(pair);
      pair.forEach((id) => gsap.set(nodes.current[id], geo.moves[id]));
      gsap.set(joiner.current, geo.joiner);
      gsap.set(reveal.current, { top: geo.revealTop });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pair, measurePair]);

  /* ---------- explore another: everything returns to its place ---------- */

  const exploreAnother = () => {
    if (!pairRef.current || busy.current) return;
    busy.current = true;
    const reduce = prefersReducedMotion();
    const all = DISCIPLINES.map((d) => nodes.current[d.id]);
    const q = gsap.utils.selector(reveal);

    const tl = gsap.timeline({
      onComplete: () => {
        busy.current = false;
        setPair(null);
        setSelected([]);
        DISCIPLINES.forEach(({ id }) => driftTweens.current[id]?.resume());
        labels.current[DISCIPLINES[0].id]?.focus({ preventScroll: true });
      },
    });

    tl.to(q('.w__i, .about__result, .about__explore'), { opacity: 0, duration: reduce ? 0.2 : 0.5, ease: 'power2.in' })
      .to(joiner.current, { opacity: 0, scaleX: 0, scaleY: 0, duration: reduce ? 0.2 : 0.5, ease: 'power2.in' }, 0)
      .to(all, { x: 0, y: 0, scale: 1, opacity: 1, duration: reduce ? 0.01 : 1.3, ease: 'expo.inOut' }, reduce ? 0.2 : 0.3)
      .to(head.current, { opacity: 1, duration: reduce ? 0.3 : 1.2, ease: 'power2.out' }, reduce ? 0.2 : 0.5)
      .to(root.current.querySelector('.about__hint'), { opacity: 1, duration: 0.8 }, '<0.4')
      .to(root.current.querySelector('.person'), { autoAlpha: 1, duration: 0.8 }, '<');
    DISCIPLINES.forEach(({ id }) => gsap.to(labels.current[id], { opacity: BASE_OPACITY, duration: 0.6 }));
    gsap.to(document.documentElement, { '--glow': 0, duration: reduce ? 0.3 : 1.6, ease: 'power2.inOut' });
  };

  /* ---------- the person behind this ---------- */

  useLayoutEffect(() => {
    const el = personBody.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    gsap.killTweensOf([el, field.current]);
    if (personOpen) {
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: reduce ? 0.2 : 0.9, ease: 'expo.out' },
      );
      gsap.to(field.current, { opacity: 0.18, duration: reduce ? 0.2 : 0.8, ease: 'power2.out' });
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: reduce ? 0.2 : 0.6, ease: 'power2.inOut' });
      gsap.to(field.current, { opacity: 1, duration: reduce ? 0.2 : 0.8, ease: 'power2.out' });
    }
  }, [personOpen]);

  /* ---------- leave ---------- */

  const exit = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    const reduce = prefersReducedMotion();
    gsap.to(document.documentElement, { '--glow': 0, duration: reduce ? 0.3 : 1.2, ease: 'power2.inOut' });
    gsap.to(root.current.children, {
      opacity: 0,
      y: reduce ? 0 : -12,
      duration: reduce ? 0.3 : 0.7,
      stagger: reduce ? 0 : 0.05,
      ease: 'power2.in',
      onComplete: onExit,
    });
  }, [onExit]);

  /* ---------- keyboard-first: 1–4 choose, Esc steps back ---------- */

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= DISCIPLINES.length) {
        e.preventDefault();
        choose(DISCIPLINES[n - 1].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (personOpen) setPersonOpen(false);
        else if (pairRef.current) exploreAnother();
        else exit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const meaning = pair ? meaningFor(pair[0], pair[1]) : '';

  return (
    <section ref={root} className={`about ${pair ? 'is-connected' : ''}`} aria-labelledby="about-statement">
      <button ref={backRef} type="button" className="about__corner corner" onClick={exit}>
        Back
      </button>

      <header ref={head} className="about__head">
        <h1 id="about-statement" className="about__statement">
          <Words text={STATEMENT} />
        </h1>
        <p className="about__secondary">{SECONDARY}</p>
        <p className="about__hint">Choose any two.</p>
      </header>

      <div ref={field} className="about__field">
        {DISCIPLINES.map((d, i) => {
          const [x, y] = narrow ? d.narrow : d.wide;
          const isSelected = selected.includes(d.id);
          return (
            <div
              key={d.id}
              ref={(el) => (nodes.current[d.id] = el)}
              className={`node ${isSelected ? 'is-selected' : ''}`}
              style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            >
              <div ref={(el) => (drifts.current[d.id] = el)} className="node__drift">
                <div ref={(el) => (mags.current[d.id] = el)} className="node__mag">
                  <button
                    ref={(el) => (labels.current[d.id] = el)}
                    type="button"
                    className="about__label"
                    aria-pressed={isSelected}
                    aria-keyshortcuts={String(i + 1)}
                    disabled={!!pair && !isSelected}
                    onClick={() => choose(d.id)}
                  >
                    {d.label}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <span ref={joiner} className="about__joiner" aria-hidden="true" />

        <div ref={reveal} className="about__reveal" aria-live="polite">
          {pair && (
            <>
              <p className="about__meaning">
                <Words text={meaning} />
              </p>
              <p className="about__result">{RESULT}</p>
              <button ref={exploreRef} type="button" className="about__explore" onClick={exploreAnother}>
                Explore another combination
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`person ${personOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="person__toggle"
          aria-expanded={personOpen}
          aria-controls="person-body"
          onClick={() => setPersonOpen((v) => !v)}
        >
          The person behind this.
        </button>
        <div ref={personBody} id="person-body" className="person__body" aria-hidden={!personOpen}>
          <p>{PERSON}</p>
        </div>
      </div>
    </section>
  );
}

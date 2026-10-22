import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { ease, hold, newTimeline, prefersReducedMotion } from '../core/motion';
import { POLICY_IDS, policyStore, usePolicy, type PolicyId } from '../core/policy';
import { CONSTANTS, FACTORS, POLICIES } from './experiment-data';

/** Text that leaves and re-enters when its value changes. */
function SwapText({ value, className = '', variant = 'fade' }: { value: string; className?: string; variant?: 'fade' | 'mask' | 'words' }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  const reduced = useRef(prefersReducedMotion());
  const travel = variant === 'mask' ? 105 : 35;

  useEffect(() => {
    const el = ref.current!;
    if (value === shown) {
      gsap.to(el, { yPercent: 0, autoAlpha: 1, duration: 0.3, overwrite: true });
      return;
    }
    if (reduced.current) return setShown(value);
    gsap.to(el, {
      yPercent: -travel,
      autoAlpha: 0,
      duration: variant === 'words' ? 0.25 : 0.32,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => setShown(value),
    });
    // `shown` is intentionally read from this render only
  }, [value]);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current!;
    if (reduced.current) {
      gsap.set(el, { yPercent: 0, autoAlpha: 1 });
      return;
    }
    if (variant === 'words') {
      gsap.set(el, { yPercent: 0, autoAlpha: 1 });
      gsap.fromTo(
        el.querySelectorAll('.w'),
        { autoAlpha: 0, y: '0.35em' },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.03, ease: ease.quiet, overwrite: true },
      );
    } else {
      gsap.fromTo(el, { yPercent: travel, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: ease.reveal, overwrite: true });
    }
  }, [shown]);

  const inner = (
    <span className={`swap ${className}`} ref={ref}>
      {variant === 'words'
        ? shown.split(' ').map((w, i) => (
            <span className="w" key={`${shown}-${i}`}>
              {w}{' '}
            </span>
          ))
        : shown}
    </span>
  );
  return variant === 'mask' ? <span className="swap-mask">{inner}</span> : inner;
}

/** Ranked factors; rows travel to their new rank (FLIP) and bars re-weight. */
function Priorities({ policy }: { policy: PolicyId }) {
  const list = POLICIES[policy].priorities;
  const rows = useRef(new Map<string, HTMLLIElement>());
  const tops = useRef(new Map<string, number>());
  const reduced = useRef(prefersReducedMotion());

  useLayoutEffect(() => {
    const d = reduced.current ? 0 : 0.9;
    list.forEach(([id, weight]) => {
      const el = rows.current.get(id);
      if (!el) return;
      const top = el.offsetTop;
      const prev = tops.current.get(id);
      if (prev !== undefined && prev !== top) {
        const current = Number(gsap.getProperty(el, 'y')) || 0;
        gsap.fromTo(el, { y: prev + current - top }, { y: 0, duration: d, ease: 'power3.inOut', overwrite: true });
      }
      tops.current.set(id, top);
      gsap.to(el.querySelector('.pr-fill'), { scaleX: weight, duration: d, ease: 'power3.inOut', overwrite: true });
      gsap.to(el, { color: weight > 0.7 ? 'var(--fg)' : 'var(--grey)', duration: d * 0.6, ease: ease.quiet });
    });
  }, [policy]);

  return (
    <div className="pr">
      <ol className="pr-ranks mono" aria-hidden="true">
        {list.map((_, i) => (
          <li key={i}>{i + 1}</li>
        ))}
      </ol>
      <ol className="pr-list">
        {list.map(([id]) => (
          <li
            key={id}
            ref={(el) => {
              if (el) rows.current.set(id, el);
            }}
          >
            <span className="pr-name">{FACTORS[id]}</span>
            <span className="pr-bar">
              <i className="pr-fill" />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Experiment({ mode }: SceneProps) {
  const policy = usePolicy();
  const p = POLICIES[policy];
  const root = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const firstSwitch = useRef(true);

  // The sliding pill and a light pass across the interface answer the same change.
  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    const place = (d: number) => {
      const btn = g.querySelector<HTMLElement>(`[data-policy="${policyStore.get()}"]`)!;
      gsap.to(g.querySelector('.seg-pill'), { x: btn.offsetLeft, width: btn.offsetWidth, duration: d, ease: 'power3.inOut', overwrite: true });
    };
    const d = prefersReducedMotion() || firstSwitch.current ? 0 : 0.7;
    place(d);
    if (!firstSwitch.current && d) {
      gsap.fromTo(root.current!.querySelector('.ui-scan'), { xPercent: -100, autoAlpha: 1 }, { xPercent: 100, duration: 1.1, ease: 'power2.inOut' });
    }
    firstSwitch.current = false;
    const onResize = () => place(0);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [policy]);

  // Keys 1–3 / A–C also switch policy while exploring (the presenter has its own keys).
  useEffect(() => {
    if (mode !== 'explore') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (root.current?.closest<HTMLElement>('.stage')?.dataset.active !== '1') return;
      const k = e.key.toLowerCase();
      const i = ['1', '2', '3'].includes(k) ? Number(k) - 1 : ['a', 'b', 'c'].indexOf(k);
      if (i >= 0) policyStore.set(POLICY_IDS[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const onRadioKey = (e: React.KeyboardEvent) => {
    const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    e.stopPropagation();
    const i = (POLICY_IDS.indexOf(policy) + dir + 3) % 3;
    policyStore.set(POLICY_IDS[i]);
    group.current?.querySelector<HTMLElement>(`[data-policy="${POLICY_IDS[i]}"]`)?.focus();
  };

  return (
    <div className="scene s06" ref={root}>
      <div className="glow" style={{ ['--gx' as string]: '62%', ['--gy' as string]: '66%', ['--gc' as string]: 'rgba(255,106,43,0.1)' }} />
      <header className="s06-head">
        <span className="eyebrow">Experiment</span>
        <h2 className="headline">
          <span className="su0 grey">Same person. Same intent. Same interface.</span>
          <br />
          <span className="su1">Different behavioural policy.</span>
        </h2>
      </header>

      <div className="s06-inst">
        <div className="s06-control">
          <div className="seg" ref={group} role="radiogroup" aria-label="Behavioural policy" onKeyDown={onRadioKey}>
            <i className="seg-pill" aria-hidden="true" />
            {POLICY_IDS.map((id) => {
              const on = id === policy;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  data-policy={id}
                  className={`seg-btn ${on ? 'is-on' : ''}`}
                  onClick={() => policyStore.set(id)}
                >
                  <span className="seg-id">{id}</span> {POLICIES[id].name}
                </button>
              );
            })}
          </div>
          <SwapText value={p.principle} className="s06-principle" />
        </div>

        <section className="s06-consts" aria-label="Held constant">
          <dl>
            <div>
              <dt>Person</dt>
              <dd>
                {CONSTANTS.person.map(([a, b]) => (
                  <span key={a}>
                    {a} <span className="grey">{b}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt>Intent</dt>
              <dd>{CONSTANTS.intent}</dd>
            </div>
            <div>
              <dt>Intelligence</dt>
              <dd>{CONSTANTS.intelligence}</dd>
            </div>
          </dl>
          <p className="caption s06-note">Visual identity has been deliberately removed.</p>
        </section>

        <section className="s06-ui tile" aria-label="Agent output" aria-live="polite">
          <i className="ui-scan" aria-hidden="true" />
          <header className="ui-head">
            <span className="ui-agent">
              <i aria-hidden="true" />
              Agent
            </span>
          </header>
          <p className="ui-bubble">{CONSTANTS.intent.replace(/[“”]/g, '')}</p>

          <div className="ui-decision-block">
            <span className="ui-k">Decision</span>
            <SwapText value={p.decision} className="ui-decision" variant="mask" />
          </div>

          <div className="ui-grid">
            <div className="ui-block">
              <span className="ui-k">Action</span>
              <SwapText value={p.action.title} className="ui-action" />
              <SwapText value={p.action.meta} className="ui-meta" />
              <SwapText value={p.action.follow} className="ui-meta" />
              <span className="ui-k ui-k-gap">Refuses</span>
              <SwapText value={p.refuses} className="ui-refuse" />
            </div>
            <div className="ui-block">
              <span className="ui-k">Prioritisation</span>
              <Priorities policy={policy} />
            </div>
            <div className="ui-block">
              <span className="ui-k">Explanation</span>
              <SwapText value={p.explanation} className="ui-explain" variant="words" />
            </div>
          </div>

          <footer className="ui-foot">Illustrative output — a conceptual example, not a measured result.</footer>
        </section>
      </div>
    </div>
  );
}

export const s06: SceneDef = {
  id: 'experiment',
  kicker: 'Experiment',
  title: 'The live experiment',
  nav: 'Experiment',
  length: 3.5,
  Component: Experiment,
  extra: {
    count: 2,
    current: () => POLICY_IDS.indexOf(policyStore.get()),
    apply: (i) => policyStore.set(POLICY_IDS[i]),
  },
  build({ q, portrait }) {
    const fadeUp = { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' };

    gsap.set(q('.s06-head .eyebrow, .su0, .su1'), { autoAlpha: 0, y: 30 });
    gsap.set(q('.s06-control, .s06-consts'), { autoAlpha: 0, y: 30 });
    gsap.set(q('.s06-ui'), { autoAlpha: 0, y: 80, scale: 0.97 });
    gsap.set(q('.s06-inst'), { pointerEvents: 'none' });

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 });

    // 1 — the controlled conditions, then the single variable
    tl.to(q('.s06-head .eyebrow'), fadeUp)
      .to(q('.su0'), fadeUp, '<0.1')
      .to(q('.su1'), { ...fadeUp, duration: 1.3 }, '>-0.3')
      .addLabel('beat:1');
    hold(tl, 0.5);

    // 2 — the headline steps back; the instrument rises into the frame
    tl.to(q('.s06-head'), portrait ? { autoAlpha: 0, duration: 0.7 } : { scale: 0.6, yPercent: -14, duration: 1.3, ease: ease.settle })
      .to(q('.s06-control'), fadeUp, '<0.4')
      .to(q('.s06-ui'), { autoAlpha: 1, y: 0, scale: 1, duration: 1.6, ease: 'expo.out' }, '<0.1')
      .to(q('.s06-consts'), fadeUp, '<0.2')
      .to(q('.glow'), { autoAlpha: 1, duration: 1.2, ease: ease.quiet }, '<')
      .set(q('.s06-inst'), { pointerEvents: 'auto' })
      .addLabel('beat:2');

    // scroll-only: hold the instrument on screen so it can be played with
    hold(tl, 3);

    return tl;
  },
};

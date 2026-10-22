import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import type { SceneDef, SceneProps } from '../core/types';
import { Line } from '../core/Type';
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
      gsap.to(el, { color: weight > 0.7 ? 'var(--fg)' : 'var(--fg-2)', duration: d * 0.6, ease: ease.quiet });
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

  // The selection marker, wire and a scan line all answer the same change.
  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    const btn = g.querySelector<HTMLElement>(`[data-policy="${policy}"]`)!;
    const y = btn.offsetTop + btn.offsetHeight / 2;
    const d = prefersReducedMotion() || firstSwitch.current ? 0 : 0.8;
    gsap.to(g.querySelector('.s06-marker'), { y: btn.offsetTop, height: btn.offsetHeight, duration: d, ease: 'power3.inOut' });
    gsap.to(g.querySelector('.s06-wire'), { y, duration: d, ease: 'power3.inOut' });
    if (!firstSwitch.current && d) {
      gsap.fromTo(root.current!.querySelector('.ui-scan'), { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' });
      gsap.to(root.current!.querySelector('.ui-scan'), { autoAlpha: 0, duration: 0.4, delay: 0.9 });
    }
    firstSwitch.current = false;
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
      <div className="light" style={{ ['--lx' as string]: '72%', ['--ly' as string]: '58%' }} />
      <h2 className="s06-setup display">
        <Line className="su0">Same person.</Line>
        <Line className="su1">Same intent.</Line>
        <Line className="su2">Same interface.</Line>
        <Line className="su3">Different behavioural policy.</Line>
      </h2>

      <div className="s06-inst">
        <section className="s06-consts" aria-label="Held constant">
          <div className="s06-const">
            <div className="s06-k mono">
              <span>Person</span>
              <span>Fixed</span>
            </div>
            {CONSTANTS.person.map(([a, b]) => (
              <p key={a} className="s06-v">
                <span>{a}</span> <span className="dim">{b}</span>
              </p>
            ))}
          </div>
          <div className="s06-const">
            <div className="s06-k mono">
              <span>Intent</span>
              <span>Fixed</span>
            </div>
            <p className="s06-v">{CONSTANTS.intent}</p>
          </div>
          <div className="s06-const">
            <div className="s06-k mono">
              <span>Intelligence</span>
              <span>Fixed</span>
            </div>
            <p className="s06-v">{CONSTANTS.intelligence}</p>
          </div>
          <p className="s06-note serif">Visual identity has been deliberately removed.</p>
        </section>

        <div className="s06-policies" ref={group} role="radiogroup" aria-label="Behavioural policy" onKeyDown={onRadioKey}>
          <span className="s06-k mono s06-policies-k">Behavioural policy</span>
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
                className={`s06-pol ${on ? 'is-on' : ''}`}
                onClick={() => policyStore.set(id)}
              >
                <span className="pol-letter">{id}</span>
                <span className="pol-text">
                  <span className="pol-name">{POLICIES[id].name}</span>
                  <span className="pol-principle">{POLICIES[id].principle}</span>
                </span>
              </button>
            );
          })}
          <i className="s06-marker" aria-hidden="true" />
          <span className="s06-wire" aria-hidden="true">
            <i />
          </span>
        </div>

        <section className="s06-ui" aria-label="Agent output" aria-live="polite">
          <i className="ui-scan" aria-hidden="true" />
          <header className="ui-head mono">
            <span>Agent</span>
            <span>Today · 18:04</span>
          </header>
          <p className="ui-msg">{CONSTANTS.intent}</p>

          <div className="ui-block ui-decision-block">
            <span className="ui-k mono">Decision</span>
            <SwapText value={p.decision} className="ui-decision" variant="mask" />
          </div>

          <div className="ui-grid">
            <div className="ui-block">
              <span className="ui-k mono">Action</span>
              <SwapText value={p.action.title} className="ui-action" />
              <SwapText value={p.action.meta} className="ui-meta" />
              <SwapText value={p.action.follow} className="ui-meta" />
              <span className="ui-k mono ui-k-gap">Refuses</span>
              <SwapText value={p.refuses} className="ui-refuse" />
            </div>
            <div className="ui-block">
              <span className="ui-k mono">Prioritisation</span>
              <Priorities policy={policy} />
            </div>
          </div>

          <div className="ui-block ui-why">
            <span className="ui-k mono">Explanation</span>
            <SwapText value={p.explanation} className="ui-explain serif" variant="words" />
          </div>

          <footer className="ui-foot mono">Illustrative output · conceptual example, not a measured result</footer>
        </section>
      </div>
    </div>
  );
}

export const s06: SceneDef = {
  id: 'experiment',
  kicker: 'Experiment',
  title: 'The live experiment',
  length: 3.5,
  Component: Experiment,
  extra: {
    count: 2,
    current: () => POLICY_IDS.indexOf(policyStore.get()),
    apply: (i) => policyStore.set(POLICY_IDS[i]),
  },
  build({ q, portrait }) {
    const setup = q('.s06-setup .line-in');
    const parts = q('.s06-const, .s06-note, .s06-policies-k, .s06-pol');
    // the marker and wire own their `y` (they follow the selection), so they only fade
    const guides = q('.s06-marker, .s06-wire');

    gsap.set(setup, { yPercent: 112 });
    gsap.set(parts, { autoAlpha: 0, y: 16 });
    gsap.set(guides, { autoAlpha: 0 });
    gsap.set(q('.s06-ui'), { autoAlpha: 0, clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set(q('.s06-ui > *:not(.ui-scan)'), { autoAlpha: 0 });
    gsap.set(q('.s06-inst'), { pointerEvents: 'none' });

    const tl = newTimeline();
    tl.to({}, { duration: 0.3 });

    // 1 — the controlled conditions, then the single variable
    tl.to(setup.slice(0, 3), { yPercent: 0, stagger: 0.22, duration: 1.1 })
      .to(setup.slice(0, 3), { color: 'var(--fg-3)', duration: 0.7, ease: ease.quiet }, '>0.1')
      .to(setup[3], { yPercent: 0, duration: 1.2 }, '<0.1')
      .addLabel('beat:1');
    hold(tl, 0.5);

    // 2 — the setup recomposes into a header; the instrument assembles beneath it
    tl.to(q('.s06-setup'), portrait ? { autoAlpha: 0, duration: 0.8 } : { scale: 0.38, duration: 1.3, ease: ease.settle })
      .to(parts, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8, ease: ease.quiet }, '<0.5')
      .to(guides, { autoAlpha: 1, duration: 0.6, ease: ease.quiet }, '>-0.3')
      .to(q('.s06-ui'), { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: ease.settle }, '<0.2')
      .to(q('.s06-ui > *:not(.ui-scan)'), { autoAlpha: 1, stagger: 0.06, duration: 0.6, ease: ease.quiet }, '>-0.6')
      .set(q('.s06-inst'), { pointerEvents: 'auto' })
      .addLabel('beat:2');

    // scroll-only: hold the instrument on screen so it can be played with
    hold(tl, 3);

    return tl;
  },
};

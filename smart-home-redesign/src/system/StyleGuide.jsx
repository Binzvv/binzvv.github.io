import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../lib/gsap.js';
import { useSystemReducedMotion } from '../lib/motion.js';
import { DURATION, EASE, SCRUB, STAGGER } from '../directions/apple/tokens.js';
import { Handheld, PixelScene } from '../components/art/Handheld.jsx';

// Examples use "Relic Pocket", a fictional handheld. Token values are read
// from the live CSS, so the guide can't drift from tokens.css; motion uses
// tokens.js, so the guide moves the way the system says it should.
const readVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function luminance(hex) {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SECTIONS = [
  ['principles', 'Principles'],
  ['colour', 'Colour'],
  ['type', 'Type'],
  ['space', 'Space'],
  ['shape', 'Shape'],
  ['components', 'Components'],
  ['motion', 'Motion'],
  ['rules', 'Rules'],
];

const PRINCIPLES = [
  ['One idea per viewport.', 'One headline, one object, at most one action on each screen.'],
  ['Space is the material.', 'Generous, consistent rhythm. Empty space is never filled for its own sake.'],
  ['Two worlds, one accent.', 'Stage for drama and product. Paper for detail. Blue marks actions, nothing else.'],
  ['Motion explains.', 'Every animation demonstrates a product truth. If you can’t caption it, cut it.'],
  ['Precision over flourish.', 'Decelerating curves, no bounce, scroll in the reader’s control.'],
];

const COLOURS = [
  {
    group: 'Stage',
    note: 'Drama and product. Secondary grey is Stage-only.',
    items: [
      ['--cn-black', 'Background'],
      ['--cn-surface-dark', 'Raised surface'],
      ['--cn-paper', 'Primary text'],
      ['--cn-muted', 'Secondary text'],
    ],
  },
  {
    group: 'Paper',
    note: 'Detail and decisions. Shadows live here.',
    items: [
      ['--cn-paper-bright', 'Background'],
      ['--cn-surface', 'Raised surface'],
      ['--cn-ink', 'Primary text'],
      ['--cn-muted-ink', 'Secondary text'],
      ['--cn-hairline', 'Rules'],
    ],
  },
  {
    group: 'Accent',
    note: 'Actions only. Hover goes darker.',
    items: [
      ['--cn-accent', 'Link on Stage'],
      ['--cn-accent-ink', 'Link on Paper · button'],
      ['--cn-accent-hover', 'Button hover'],
    ],
  },
  {
    group: 'Status',
    note: 'Data meaning only, always with a label.',
    items: [
      ['--cn-live', 'Live / recording'],
      ['--cn-warning', 'Needs attention'],
      ['--cn-success', 'Connected'],
    ],
  },
];

const PAIRS = [
  ['--cn-ink', '--cn-paper', 'Text on Paper'],
  ['--cn-muted-ink', '--cn-paper-bright', 'Secondary on Paper'],
  ['--cn-paper', '--cn-black', 'Text on Stage'],
  ['--cn-muted', '--cn-black', 'Secondary on Stage'],
  ['--cn-muted', '--cn-surface-dark', 'Secondary in Stage card'],
  ['--cn-accent', '--cn-black', 'Link on Stage'],
  ['--cn-accent-ink', '--cn-paper-bright', 'Link on Paper'],
  ['--cn-pure', '--cn-accent-ink', 'Button label'],
  ['--cn-pure', '--cn-accent-hover', 'Button label, hover'],
  ['--cn-muted', '--cn-paper-bright', 'Not allowed: Stage grey on Paper'],
];

const TYPE = [
  ['Display', 'display', 'Play everything.', 'Hero only. Once per page.'],
  ['H2', 'h2', 'Every pixel, exactly.', 'Section headline. Max two lines.'],
  ['H3', 'h3', 'Your library, in your pocket.', 'Sub-section headline.'],
  ['Card title', 'title', 'Save states', 'Tiles, plans, rows.'],
  ['Eyebrow', 'eyebrow', 'Relic Pocket', 'Product name above an H2.'],
  ['Lede', 'lede', 'A handheld built for the cartridges you already own.', 'Max 36ch. Secondary grey.'],
  ['Body', 'body', 'Suspend any game mid-level and pick up exactly where you left off.', 'Card body copy.'],
  ['Meta', 'meta', 'From £219 · Dock £89', 'Prices and notes. Tabular figures.'],
];

const SPACES = ['--cn-space-1', '--cn-space-2', '--cn-space-3', '--cn-space-4', '--cn-space-5', '--cn-space-6', '--cn-space-7', '--cn-space-8'];
const RADII = [
  ['--cn-radius-sm', 'Compact cards, chips'],
  ['--cn-radius-md', 'Rows, notifications'],
  ['--cn-radius-lg', 'Cards'],
  ['--cn-radius-xl', 'Media frames'],
  ['--cn-radius-pill', 'Buttons, tags'],
];

const DOS = [
  ['One primary button per viewport, paired with a link.', 'Two filled buttons competing for the same tap.'],
  ['Left-aligned section intros; only the hero is centred.', 'Centred intros mid-page.'],
  ['Shadows on Paper; tone and a 1px ring on Stage.', 'Drop shadows on black.'],
  ['Lines rising through a mask.', 'Per-character, blurred or scaling text.'],
  ['Decelerating curves, scroll-scrubbed.', 'Bounce, elastic or overshoot.'],
  ['Pinned stories of at most three acts.', 'Scenes that hold the scroll hostage.'],
  ['Hover via translate/scale on GSAP-owned elements.', 'CSS transitions on transform for elements GSAP also animates.'],
  ['A static, readable layout for reduced motion.', 'Just shortening the animations.'],
];

// Containers that rise into place as they arrive (one rule, used everywhere).
const RISE = [
  '.sg-principles li',
  '.sg-world',
  '.sg-swatchGroup',
  '.sg-table tbody tr',
  '.sg-rhythm > *',
  '.sg-radii li',
  '.sg-elev > *',
  '.sg-spec__stage',
  '.sg-cards > *',
  '.sg-curve',
  '.sg-demo',
  '.sg-dos li',
  '.sg-a11y li',
  '.sg-note',
  '.sg-h4',
].join(', ');

function Swatch({ token, label, dark }) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(readVar(token)), [token]);
  return (
    <li className="sg-swatch">
      <span className={`sg-swatch__chip ${dark ? 'is-dark' : ''}`} style={{ background: `var(${token})` }} />
      <span className="sg-swatch__label">{label}</span>
      <code>{token}</code>
      <span className="sg-swatch__hex">{value || '\u00a0'}</span>
    </li>
  );
}

function ContrastTable() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    setRows(
      PAIRS.map(([fg, bg, use]) => {
        const f = readVar(fg);
        const b = readVar(bg);
        return { fg, bg, f, b, use, ratio: contrast(f, b) };
      }),
    );
  }, []);
  return (
    <table className="sg-table">
      <thead>
        <tr>
          <th>Sample</th>
          <th>Pair</th>
          <th>Use</th>
          <th className="is-num">Ratio</th>
          <th>AA text</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.fg + r.bg}>
            <td>
              <span className="sg-sample" style={{ color: r.f, background: r.b }}>
                Aa
              </span>
            </td>
            <td>
              <code>{r.fg.replace('--cn-', '')}</code> on <code>{r.bg.replace('--cn-', '')}</code>
            </td>
            <td>{r.use}</td>
            <td className="is-num">{r.ratio.toFixed(2)}</td>
            <td>
              <span className={`sg-badge ${r.ratio >= 4.5 ? 'is-pass' : 'is-fail'}`}>{r.ratio >= 4.5 ? 'Pass' : 'Fail'}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TypeRow({ name, role, sample, note }) {
  const [meta, setMeta] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const cs = getComputedStyle(ref.current);
    const size = parseFloat(cs.fontSize);
    const track = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / size;
    setMeta(`${Math.round(size)}px · ${cs.fontWeight} · ${track.toFixed(3).replace(/\.?0+$/, '')}em`);
  }, []);
  return (
    <li className="sg-type">
      <div className="sg-type__meta">
        <strong>{name}</strong>
        <span>{note}</span>
        <code>{meta ? `${meta} @ this width` : '\u00a0'}</code>
      </div>
      <p ref={ref} className={`sg-t-${role} sg-type__sample`}>
        {sample}
      </p>
    </li>
  );
}

// Plots an ease from GSAP's own parsed function, so the curve shown is the
// curve that runs. Draws itself and runs once on arrival.
function Curve({ name, ease, label, use, reduced }) {
  const fig = useRef(null);
  const [path, setPath] = useState('');
  useEffect(() => {
    const fn = gsap.parseEase(ease);
    const pts = Array.from({ length: 61 }, (_, i) => {
      const t = i / 60;
      return `${(t * 200).toFixed(1)},${(120 - fn(t) * 110).toFixed(1)}`;
    });
    setPath(`M${pts.join(' L')}`);
  }, [ease]);

  const travel = () => fig.current.querySelector('.sg-curve__track').clientWidth - 16;

  const { contextSafe } = useGSAP(
    () => {
      if (reduced || !path) return;
      gsap
        .timeline({ scrollTrigger: { trigger: fig.current, start: 'top 80%', once: true } })
        .from('.sg-curve__line', { drawSVG: '0%', duration: DURATION.support, ease: 'cine' })
        .fromTo('.sg-curve__dot', { x: 0 }, { x: travel, duration: 1.2, ease }, '-=0.4');
    },
    { scope: fig, dependencies: [path, reduced] },
  );

  const play = contextSafe(() => {
    gsap.fromTo('.sg-curve__dot', { x: 0 }, { x: travel, duration: reduced ? 0 : 1.2, ease });
  });

  return (
    <figure className="sg-curve" ref={fig}>
      <svg viewBox="-6 -6 212 132" aria-hidden="true">
        <path d="M0 120 H200 M0 120 V10" className="sg-curve__axis" />
        {path && <path d={path} className="sg-curve__line" />}
      </svg>
      <div className="sg-curve__track">
        <span className="sg-curve__dot" />
      </div>
      <figcaption>
        <strong>{name}</strong>
        <code>{label}</code>
        <span>{use}</span>
        <button type="button" className="ap-link sg-play" onClick={play}>
          Play
        </button>
      </figcaption>
    </figure>
  );
}

function TextRevealDemo({ reduced }) {
  const scope = useRef(null);
  const split = useRef(null);
  const playRef = useRef(null);
  const { contextSafe } = useGSAP(
    () => {
      if (reduced) return;
      ScrollTrigger.create({ trigger: scope.current, start: 'top 70%', once: true, onEnter: () => playRef.current?.() });
    },
    { scope, dependencies: [reduced] },
  );
  const play = contextSafe(() => {
    const h = scope.current.querySelector('h3');
    split.current?.revert();
    split.current = SplitText.create(h, {
      type: 'lines',
      mask: 'lines',
      onSplit: (self) =>
        gsap.fromTo(self.lines, { yPercent: 105 }, { yPercent: 0, duration: reduced ? 0 : DURATION.text, stagger: STAGGER.lines, ease: 'cine' }),
    });
  });
  playRef.current = play;
  return (
    <div className="sg-demo" ref={scope}>
      <h3 className="sg-t-h2">
        Every pixel.
        <br />
        Exactly where you left it.
      </h3>
      <div className="sg-demo__bar">
        <span>
          Lines rise through a mask · <code>yPercent 105 → 0</code> · {DURATION.text}s · stagger {STAGGER.lines}s · cine
        </span>
        <button type="button" className="ap-link sg-play" onClick={play}>
          Replay
        </button>
      </div>
    </div>
  );
}

function ImageRevealDemo({ reduced }) {
  const scope = useRef(null);
  useGSAP(
    () => {
      if (reduced) return;
      const st = () => ({ trigger: scope.current, start: 'top 85%', end: 'center 45%', scrub: SCRUB.local });
      gsap.fromTo('.sg-reveal__frame', { clipPath: 'inset(12% 14% 12% 14% round 48px)' }, { clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none', scrollTrigger: st() });
      gsap.fromTo('.sg-reveal__product', { yPercent: 16, rotate: -6, scale: 1.08 }, { yPercent: -4, rotate: 0, scale: 1, ease: 'none', scrollTrigger: st() });
    },
    { scope, dependencies: [reduced] },
  );
  return (
    <div className="sg-demo" ref={scope}>
      <div className="sg-reveal__frame sg-live">
        <div className="sg-reveal__product">
          <Handheld className="is-booted" title="" />
        </div>
      </div>
      <div className="sg-demo__bar">
        <span>
          Scrubbed by scroll (<code>scrub {SCRUB.local}</code>): the frame opens from a cropped inset while the product
          drifts and settles. Scroll back up to watch it reverse.
        </span>
      </div>
    </div>
  );
}

const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export default function StyleGuide() {
  const root = useRef(null);
  const reduced = useSystemReducedMotion();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const success = readVar('--cn-success');

      // Created last, after the cover's pin exists, so their positions
      // include the scroll space the pin adds.
      const bindScrollState = () => {
        // Loops (pixel clouds, hero, coin) run only while their screen is in view.
        q('.sg-live').forEach((el) =>
          ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', toggleClass: 'is-live' }),
        );
        // Nav marks the section in view.
        SECTIONS.forEach(([id]) => {
          const link = q(`.sg-nav a[href="#${id}"]`)[0];
          ScrollTrigger.create({
            trigger: q(`#${id}`)[0],
            start: 'top 50%',
            end: 'bottom 50%',
            onToggle: (self) => link?.classList.toggle('is-active', self.isActive),
          });
        });
      };

      if (reduced) {
        gsap.set(q('.px-off, .px-logo'), { autoAlpha: 0 });
        gsap.set(q('.art-handheld__led'), { attr: { fill: success } });
        bindScrollState();
        return;
      }

      // ---- Cover: load-in, then a pinned boot sequence -----------------
      const title = SplitText.create(q('.sg-cover__title'), { type: 'lines', mask: 'lines', linesClass: 'sg-cover__line' });
      root.current.classList.add('is-split');
      gsap
        .timeline({ defaults: { ease: 'cine' }, delay: 0.1 })
        .from(q('.sg-cover .ap-eyebrow'), { autoAlpha: 0, y: 14, duration: DURATION.support })
        .from(title.lines, { yPercent: 105, duration: DURATION.text, stagger: STAGGER.lines }, 0.1)
        .from(q('.sg-cover__copy .ap-lede, .sg-cover__cue'), { autoAlpha: 0, y: 18, duration: DURATION.support, stagger: STAGGER.items }, 0.5)
        .from(q('.sg-cover__device'), { autoAlpha: 0, yPercent: 12, duration: DURATION.object }, 0.3);

      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: q('.sg-cover__stage')[0], start: 'top top', end: '+=140%', scrub: SCRUB.story, pin: true },
        })
        .fromTo(q('.sg-cover__deviceWrap'), { rotate: -12, y: 40, scale: 0.94 }, { rotate: 0, y: 0, scale: 1.04, duration: 1, ease: 'power2.inOut' }, 0)
        .to(q('.sg-cover__glow'), { opacity: 1, scale: 1.25, duration: 0.8 }, 0.15)
        .to(q('.sg-cover__cue'), { autoAlpha: 0, y: -12, duration: 0.2 }, 0.05)
        .to(q('.sg-cover .px-off'), { autoAlpha: 0, duration: 0.12 }, 0.3)
        .to(q('.sg-cover .art-handheld__led'), { attr: { fill: success }, duration: 0.02 }, 0.3)
        .fromTo(q('.sg-cover .px-logo__bar'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.3 }, 0.36)
        .to(q('.sg-cover .px-logo'), { autoAlpha: 0, duration: 0.2 }, 0.72)
        .fromTo(q('.sg-cover__caption'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.8)
        .to({}, { duration: 0.25 });

      // ---- Section intros: eyebrow, H2 lines, lede ----------------------
      q('.sg-head').forEach((head) => {
        const h2 = SplitText.create(head.querySelector('.ap-h2'), { type: 'lines', mask: 'lines' });
        const tl = gsap
          .timeline({ defaults: { ease: 'cine' }, scrollTrigger: { trigger: head, start: 'top 72%' } })
          .from(head.querySelector('.ap-eyebrow'), { autoAlpha: 0, y: 12, duration: DURATION.support })
          .from(h2.lines, { yPercent: 105, duration: DURATION.text, stagger: STAGGER.lines }, 0.05);
        const lede = head.querySelector('.ap-lede');
        if (lede) tl.from(lede, { autoAlpha: 0, y: 20, duration: DURATION.support }, 0.4);
      });

      // ---- Everything else rises into place as it arrives ---------------
      const risers = q(RISE);
      gsap.set(risers, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(risers, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: DURATION.support, ease: 'cine', stagger: STAGGER.items }),
      });

      // Type specimens rise line by line.
      q('.sg-type__sample').forEach((p) => {
        const s = SplitText.create(p, { type: 'lines', mask: 'lines' });
        gsap.from(s.lines, { yPercent: 105, duration: DURATION.text, ease: 'cine', stagger: STAGGER.lines, scrollTrigger: { trigger: p, start: 'top 88%' } });
      });

      // Spacing bars grow to their token width.
      gsap.from(q('.sg-spaces__bar'), {
        scaleX: 0,
        transformOrigin: '0% 50%',
        duration: DURATION.support,
        ease: 'cine',
        stagger: STAGGER.items,
        scrollTrigger: { trigger: q('.sg-spaces')[0], start: 'top 80%' },
      });

      // Product stage: the device arrives, then boots.
      const product = q('.sg-product__device')[0];
      const p = gsap.utils.selector(product);
      gsap
        .timeline({ scrollTrigger: { trigger: product, start: 'top 75%' } })
        .from(product, { autoAlpha: 0, y: 60, rotate: -6, duration: DURATION.object, ease: 'cine' })
        .to(p('.px-off'), { autoAlpha: 0, duration: 0.2 }, 0.8)
        .to(p('.art-handheld__led'), { attr: { fill: success }, duration: 0.01 }, 0.8)
        .fromTo(p('.px-logo__bar'), { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.7, ease: 'cineInOut' }, 0.9)
        .to(p('.px-logo'), { autoAlpha: 0, duration: 0.4 }, 1.8);
      gsap.from(q('.sg-toast .ap-db__notif'), {
        yPercent: -140,
        autoAlpha: 0,
        duration: DURATION.support,
        ease: 'cine',
        scrollTrigger: { trigger: q('.sg-toast')[0], start: 'top 70%' },
      });

      bindScrollState();
    },
    { scope: root, dependencies: [reduced] },
  );

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 300);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <div className={`ap sg ${reduced ? 'is-static' : 'is-motion'}`} ref={root}>
      <header className="ap-nav">
        <div className="ap-nav__inner">
          <a className="ap-nav__brand" href="#top">
            Cinematic
          </a>
          <nav className="ap-nav__links sg-nav" aria-label="Design system">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`}>
                {label}
              </a>
            ))}
          </nav>
          <span className="sg-version">Design system · v1</span>
        </div>
      </header>

      <main id="top">
        {/* Cover */}
        <section className="sg-cover" id="principles">
          <div className="sg-cover__stage">
            <div className="sg-cover__grid ap-wrap">
              <div className="sg-cover__copy">
                <p className="ap-eyebrow">Cinematic · Design language</p>
                <h1 className="sg-cover__title">
                  Design system
                  <br />
                  and rules.
                </h1>
                <p className="ap-lede">
                  One typeface, two greys, one accent, and motion that only ever explains the product. Everything here
                  renders from the same tokens and CSS it documents.
                </p>
                <p className="sg-cover__cue" aria-hidden="true">
                  Scroll to power on
                </p>
              </div>
              <div className="sg-cover__device">
                <div className="sg-cover__glow" aria-hidden="true" />
                <div className="sg-cover__deviceWrap sg-live">
                  <Handheld />
                </div>
                <p className="sg-cover__caption">
                  <strong>Relic Pocket</strong> A fictional handheld, used for every example in this guide.
                </p>
              </div>
            </div>
          </div>
          <div className="ap-wrap">
            <ol className="sg-principles">
              {PRINCIPLES.map(([t, b], i) => (
                <li key={t}>
                  <span className="sg-principles__n">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{t}</strong>
                  <span>{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Colour */}
        <section className="sg-section" id="colour">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Colour</p>
              <h2 className="ap-h2">Two worlds. One accent.</h2>
              <p className="ap-lede">
                Each section lives on Stage or on Paper. Change worlds with a hard cut at a section boundary, or by scrubbing
                inside a pinned scene. Never with a gradient.
              </p>
            </header>
            <div className="sg-worlds">
              <div className="sg-world is-stage">
                <span>Stage</span>
                <p>Drama and product.</p>
                <a className="ap-link" href="#colour">
                  Link on Stage
                </a>
              </div>
              <div className="sg-world is-paper">
                <span>Paper</span>
                <p>Detail and decisions.</p>
                <a className="ap-link" href="#colour">
                  Link on Paper
                </a>
              </div>
            </div>
            <div className="sg-swatchGroups">
              {COLOURS.map((g) => (
                <div key={g.group} className="sg-swatchGroup">
                  <h3>{g.group}</h3>
                  <p>{g.note}</p>
                  <ul>
                    {g.items.map(([token, label]) => (
                      <Swatch key={token} token={token} label={label} dark={g.group === 'Stage'} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <h3 className="sg-h4">Contrast, measured live</h3>
            <ContrastTable />
          </div>
        </section>

        {/* Type */}
        <section className="sg-section is-bright" id="type">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Typography</p>
              <h2 className="ap-h2">One family. Tight at size.</h2>
              <p className="ap-lede">
                Inter Tight, weights 400–660. Tracking tightens as size grows; nothing is tracked positive. No italics, no
                all-caps.
              </p>
            </header>
            <ul className="sg-typeList">
              {TYPE.map(([name, role, sample, note]) => (
                <TypeRow key={role} name={name} role={role} sample={sample} note={note} />
              ))}
            </ul>
          </div>
        </section>

        {/* Space */}
        <section className="sg-section" id="space">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Space and layout</p>
              <h2 className="ap-h2">Space is the material.</h2>
            </header>
            <div className="sg-split">
              <div>
                <h3 className="sg-h4">Component scale · 4px base</h3>
                <ul className="sg-spaces">
                  {SPACES.map((t) => (
                    <li key={t}>
                      <span className="sg-spaces__bar" style={{ width: `var(${t})` }} />
                      <code>{t.replace('--cn-', '')}</code>
                      <SpaceValue token={t} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="sg-h4">Section rhythm</h3>
                <div className="sg-rhythm" aria-label="Section rhythm diagram">
                  <span className="sg-rhythm__gap" style={{ height: 'calc(var(--cn-space-section) / 2)' }}>
                    space-section
                  </span>
                  <span className="sg-rhythm__block">Intro: eyebrow · H2 · lede · meta</span>
                  <span className="sg-rhythm__gap" style={{ height: 'calc(var(--cn-space-intro-after) / 1.4)' }}>
                    space-intro-after
                  </span>
                  <span className="sg-rhythm__block is-tall">Content (stage, frame, grid)</span>
                  <span className="sg-rhythm__gap" style={{ height: 'calc(var(--cn-space-block) / 2)' }}>
                    space-block
                  </span>
                  <span className="sg-rhythm__block">Next block</span>
                </div>
                <p className="sg-note">
                  Container <code>1180px</code> inside a <code>16 → 64px</code> gutter. Feature grids use 6 columns: three
                  cards span 2, two cards span 3. Cards in a row are equal height with text anchored to the bottom.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Shape */}
        <section className="sg-section is-bright" id="shape">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Shape and elevation</p>
              <h2 className="ap-h2">Shadows on Paper. Tone on Stage.</h2>
            </header>
            <ul className="sg-radii">
              {RADII.map(([t, use]) => (
                <li key={t}>
                  <span className="sg-radii__box" style={{ borderRadius: `var(${t})` }} />
                  <code>{t.replace('--cn-', '')}</code>
                  <span>{use}</span>
                </li>
              ))}
            </ul>
            <div className="sg-elev">
              <div className="sg-elev__card" style={{ boxShadow: 'var(--cn-shadow-row)' }}>
                <code>shadow-row</code>
              </div>
              <div className="sg-elev__card" style={{ boxShadow: 'var(--cn-shadow-card)' }}>
                <code>shadow-card</code>
              </div>
              <div className="sg-elev__card" style={{ boxShadow: 'var(--cn-shadow-card-hover)' }}>
                <code>shadow-card-hover</code>
              </div>
              <div className="sg-elev__stage">
                <div className="sg-elev__card is-dark">
                  <code>surface-dark + ring</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Components */}
        <section className="sg-section" id="components">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Components</p>
              <h2 className="ap-h2">Built from the same CSS.</h2>
              <p className="ap-lede">These are the system’s real classes, not drawings of them. Hover and press them.</p>
            </header>

            <h3 className="sg-h4">Actions</h3>
            <div className="sg-spec">
              <div className="sg-spec__stage is-paper">
                <a className="ap-btn" href="#components">
                  Buy Relic Pocket
                </a>
                <a className="ap-link" href="#components">
                  Watch the film
                </a>
              </div>
              <div className="sg-spec__stage is-dark">
                <a className="ap-btn" href="#components">
                  Buy Relic Pocket
                </a>
                <a className="ap-link" href="#components">
                  Watch the film
                </a>
              </div>
              <p className="sg-note">
                Primary: 44px pill, accent-ink, 17/500, hover darkens, press <code>scale .97</code>. One per viewport,
                paired with a link whose chevron nudges 3px.
              </p>
            </div>

            <h3 className="sg-h4">Section intro</h3>
            <div className="sg-spec">
              <div className="sg-spec__stage is-paper is-block">
                <p className="ap-eyebrow">Relic Pocket</p>
                <h3 className="ap-h2">
                  Every pixel.
                  <br />
                  Exactly where you left it.
                </h3>
                <p className="ap-lede">A handheld built for the cartridges you already own.</p>
                <p className="ap-meta">From £219 · Dock £89</p>
              </div>
              <p className="sg-note">Always eyebrow → H2 → lede → meta, left-aligned. Headlines break by hand at the sense break and end with a full stop.</p>
            </div>

            <h3 className="sg-h4">Cards</h3>
            <div className="sg-cards">
              <div className="sg-spec__stage is-dark">
                <article className="ap-hero__plan">
                  <h3>Relic Pocket</h3>
                  <p className="ap-hero__planIncl">Handheld + USB-C cable</p>
                  <p className="ap-hero__planPrice">
                    <strong>£219</strong>
                    <span>one-off</span>
                  </p>
                  <p className="ap-hero__planUp">Dock sold separately · £89</p>
                  <a className="ap-link" href="#components">
                    Choose
                  </a>
                </article>
              </div>
              <ul className="ap-tiles sg-oneTile">
                <li className="ap-tile" onPointerMove={trackPointer}>
                  <svg className="ap-tile__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 3.5h8l2 2v15H7zM9.5 7h5v5h-5zM10 16h4" />
                  </svg>
                  <h4>Save states</h4>
                  <p>Suspend any game mid-level and pick up exactly where you left off.</p>
                </li>
              </ul>
              <ol className="ap-in__feed sg-feed">
                {[
                  ['Cartridge · Slot 1', 'Save state written', '18:42', ''],
                  ['Battery · 9%', 'Charge soon to keep playing', '21:07', 'is-warning'],
                ].map(([d, a, t, c]) => (
                  <li key={a}>
                    <span className={`ap-in__dot ${c}`} aria-hidden="true" />
                    <span className="ap-in__feedBody">
                      <span className="ap-in__feedDevice">{d}</span>
                      <span className="ap-in__feedAlert">{a}</span>
                    </span>
                    <time>{t}</time>
                  </li>
                ))}
              </ol>
            </div>
            <p className="sg-note">
              Plan card (Stage): tone + 1px ring, price 48px tabular. Feature tile (Paper): icon chip, bottom-anchored text,
              4px lift and pointer glow on hover. Event row: status dot always beside a text label.
            </p>

            <h3 className="sg-h4">Product and imagery</h3>
            <div className="sg-product">
              <div className="sg-spec__stage is-dark sg-product__stage sg-live">
                <Handheld className="sg-product__device" />
              </div>
              <div className="sg-spec__stage is-paper sg-product__stage">
                <div className="sg-toast sg-live is-booted">
                  <svg className="sg-toast__screen" viewBox="0 0 80 72" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                    <PixelScene />
                  </svg>
                  <div className="ap-db__notif">
                    <span className="ap-db__appIcon sg-toast__icon" aria-hidden="true" />
                    <span>
                      <strong>Relic Pocket</strong>
                      Game saved to slot 3
                    </span>
                    <time>now</time>
                  </div>
                </div>
              </div>
              <p className="sg-note">
                Product art is lit, not flat: a top-down sheen and a soft drop shadow on Stage. Here the device arrives,
                then boots. Glass is for UI floating over imagery, like this toast, never for cards.
              </p>
            </div>
          </div>
        </section>

        {/* Motion */}
        <section className="sg-section is-bright" id="motion">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Motion</p>
              <h2 className="ap-h2">Motion explains.</h2>
              <p className="ap-lede">
                Long, soft decelerations. Scroll-scrubbed so the reader is in control. No bounce, no overshoot.
              </p>
            </header>
            <div className="sg-curves">
              <Curve name="cine" ease="cine" label={EASE.cine.replace('M0,0 C', 'C ')} use="Every entrance and reveal" reduced={reduced} />
              <Curve name="cineInOut" ease="cineInOut" label={EASE.cineInOut.replace('M0,0 C', 'C ')} use="Scene changes, curtain" reduced={reduced} />
              <Curve name="ui" ease="ui" label={EASE.ui.replace('M0,0 C', 'C ')} use="Hover and press (CSS)" reduced={reduced} />
            </div>
            <TextRevealDemo reduced={reduced} />
            <ImageRevealDemo reduced={reduced} />
            <table className="sg-table sg-timing">
              <thead>
                <tr>
                  <th>Token</th>
                  <th className="is-num">Value</th>
                  <th>For</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>DURATION.text</code></td><td className="is-num">{DURATION.text}s</td><td>Headline lines rising through a mask</td></tr>
                <tr><td><code>DURATION.support</code></td><td className="is-num">{DURATION.support}s</td><td>Eyebrow, lede, CTAs after a headline</td></tr>
                <tr><td><code>DURATION.object</code></td><td className="is-num">{DURATION.object}s</td><td>Product art arriving on stage</td></tr>
                <tr><td><code>STAGGER.lines</code></td><td className="is-num">{STAGGER.lines}s</td><td>Between headline lines</td></tr>
                <tr><td><code>STAGGER.items</code></td><td className="is-num">{STAGGER.items}s</td><td>Between sibling items</td></tr>
                <tr><td><code>SCRUB.local / story</code></td><td className="is-num">{SCRUB.local} / {SCRUB.story}</td><td>Scroll smoothing, short scenes / pinned stories</td></tr>
                <tr><td><code>Pinned story</code></td><td className="is-num">≤ 3 acts</td><td>About one viewport of scroll per act, plus a short hold</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Rules */}
        <section className="sg-section" id="rules">
          <div className="ap-wrap">
            <header className="sg-head">
              <p className="ap-eyebrow">Rules</p>
              <h2 className="ap-h2">Do. Don’t.</h2>
            </header>
            <ul className="sg-dos">
              {DOS.map(([d, n]) => (
                <li key={d}>
                  <p className="is-do">
                    <span>Do</span>
                    {d}
                  </p>
                  <p className="is-dont">
                    <span>Don’t</span>
                    {n}
                  </p>
                </li>
              ))}
            </ul>
            <div className="sg-a11y">
              <h3 className="sg-h4">Accessibility</h3>
              <ul>
                <li>Reduced motion is a separate static layout in reading order, not shorter animations.</li>
                <li>Every text pair in use meets WCAG AA (4.5:1). Stage grey never goes on Paper.</li>
                <li>2px accent focus ring at 3px offset. Hit targets are at least 44px.</li>
                <li>Decorative art is hidden from assistive tech; real content stays in the DOM as text.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="ap-foot">
        <p>
          Cinematic design system v1. Full rules: <code>docs/cinematic-design-system.md</code>. Tokens:{' '}
          <code>src/directions/apple/tokens.css</code> and <code>tokens.js</code>. Relic Pocket is a fictional product;
          all artwork is original.
        </p>
      </footer>
    </div>
  );
}

function SpaceValue({ token }) {
  const [v, setV] = useState('');
  useEffect(() => setV(readVar(token)), [token]);
  return <span className="sg-spaces__v">{v || '\u00a0'}</span>;
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { FILM } from '../content.js';

const FPS = 24;
const SCENE_HOLD = 7; // seconds per scene while screening

function Still({ kind }) {
  switch (kind) {
    case 'opening':
      return (
        <svg viewBox="0 0 1600 670" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id="beam" cx="50%" cy="0%" r="100%">
              <stop offset="0" stopColor="#ffd9a8" stopOpacity="0.55" />
              <stop offset="0.5" stopColor="#ff7a1a" stopOpacity="0.08" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1600" height="670" fill="#0a0907" />
          <polygon points="760,0 840,0 1400,670 200,670" fill="url(#beam)" className="beam" />
          {Array.from({ length: 40 }, (_, i) => (
            <circle
              key={i}
              className="dust"
              cx={500 + ((i * 97) % 600)}
              cy={60 + ((i * 53) % 560)}
              r={((i % 3) + 1) * 0.9}
              fill="#ffe6c4"
              opacity={0.4}
            />
          ))}
        </svg>
      );
    case 'corridor': {
      const doors = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72];
      return (
        <svg viewBox="0 0 1600 670" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="cfloor" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#3a1d0e" />
              <stop offset="1" stopColor="#110906" />
            </linearGradient>
            <radialGradient id="cend" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#ffd08a" />
              <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1600" height="670" fill="#140b07" />
          <polygon points="0,670 1600,670 860,380 740,380" fill="url(#cfloor)" />
          <polygon points="0,0 1600,0 860,300 740,300" fill="#0d0705" />
          <polygon points="0,0 740,300 740,380 0,670" fill="#1d0f08" />
          <polygon points="1600,0 860,300 860,380 1600,670" fill="#1a0d07" />
          {doors.map((t, i) => {
            const xl = 740 * t;
            const yt = 300 * t;
            const yb = 670 - 290 * t;
            const xr = 1600 - 740 * t;
            const w = 60 * (1 - t);
            return (
              <g key={i} opacity={0.9 - t * 0.6}>
                <polygon points={`${xl},${yt + 40 * (1 - t)} ${xl + w},${yt + 40 * (1 - t) + w * 0.4} ${xl + w},${yb - w * 0.5} ${xl},${yb}`} fill="#2e170b" />
                <polygon points={`${xr},${yt + 40 * (1 - t)} ${xr - w},${yt + 40 * (1 - t) + w * 0.4} ${xr - w},${yb - w * 0.5} ${xr},${yb}`} fill="#2a1409" />
              </g>
            );
          })}
          <rect x="740" y="300" width="120" height="80" fill="url(#cend)" className="flicker" />
          <ellipse cx="800" cy="340" rx="190" ry="110" fill="url(#cend)" opacity="0.35" />
          <rect x="794" y="338" width="12" height="38" fill="#080403" />
          <circle cx="800" cy="333" r="6" fill="#080403" />
        </svg>
      );
    }
    case 'afterlight':
      return (
        <svg viewBox="0 0 1600 670" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1b0d1c" />
              <stop offset="0.55" stopColor="#8a2c1a" />
              <stop offset="1" stopColor="#ff9a3c" />
            </linearGradient>
            <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe9b0" />
              <stop offset="1" stopColor="#ff6a1a" />
            </linearGradient>
            <clipPath id="sunclip">
              <rect x="0" y="0" width="1600" height="440" />
            </clipPath>
          </defs>
          <rect width="1600" height="670" fill="url(#sky)" />
          <g clipPath="url(#sunclip)">
            <circle cx="800" cy="440" r="210" fill="url(#sun)" className="sun" />
          </g>
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x="560" y={360 + i * 12} width="480" height={2 + i * 0.6} fill="#8a2c1a" opacity="0.9" />
          ))}
          <rect y="440" width="1600" height="230" fill="#120707" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={640 + Math.sin(i) * 30} y={452 + i * 22} width={320 - i * 26} height="3" fill="#ff9a3c" opacity={0.5 - i * 0.05} className="ripple" />
          ))}
        </svg>
      );
    case 'windows': {
      const cols = 12;
      const rows = 8;
      return (
        <svg viewBox="0 0 1600 670" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="1600" height="670" fill="#07090c" />
          <rect x="340" y="40" width="920" height="700" fill="#14171c" />
          {Array.from({ length: cols * rows }, (_, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const lit = (i * 7919) % 5 < 2;
            return (
              <rect
                key={i}
                className={lit ? 'win lit' : 'win'}
                x={372 + c * 74}
                y={70 + r * 74}
                width="46"
                height="52"
                fill={lit ? (i % 3 ? '#ffb45c' : '#ffd99c') : '#1f242b'}
              />
            );
          })}
        </svg>
      );
    }
    case 'moons':
      return (
        <svg viewBox="0 0 1600 670" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="6" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.55" />
            </filter>
          </defs>
          <rect width="1600" height="670" fill="#14203a" />
          {Array.from({ length: 7 }, (_, i) => {
            const cx = 230 + i * 190;
            const cy = 335 + Math.sin(i * 0.9) * 60;
            const off = -90 + i * 30;
            return (
              <g key={i} filter="url(#paper)" className="moon">
                <circle cx={cx} cy={cy} r="70" fill="#f2e8d2" />
                <circle cx={cx + off} cy={cy} r="70" fill="#14203a" />
              </g>
            );
          })}
          {Array.from({ length: 30 }, (_, i) => (
            <rect key={i} x={(i * 211) % 1600} y={(i * 97) % 670} width="4" height="4" fill="#f2e8d2" opacity="0.5" transform={`rotate(45 ${(i * 211) % 1600} ${(i * 97) % 670})`} />
          ))}
        </svg>
      );
    default:
      return <div className="still-black" aria-hidden="true" />;
  }
}

function formatTC(frames) {
  const f = frames % FPS;
  const s = Math.floor(frames / FPS);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
}

export default function Film({ reduced, welcome }) {
  const root = useRef(null);
  const [index, setIndex] = useState(0);
  const [screening, setScreening] = useState(false);
  const tcRef = useRef(null);
  const frames = useRef(0);
  const first = useRef(true);
  const scenes = FILM.scenes;
  const total = scenes.length;

  // Opening: slate countdown, letterbox closes in.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('.f-slate', { display: 'none' });
        return;
      }
      gsap
        .timeline()
        .set('.f-bar-top', { yPercent: -100 })
        .set('.f-bar-bottom', { yPercent: 100 })
        .set('.f-timeline, .f-hud', { autoAlpha: 0 })
        .fromTo('.f-slate-sweep', { rotate: 0 }, { rotate: 360, duration: 0.5, repeat: 2, ease: 'none' })
        .to('.f-slate-num', { innerText: 1, snap: { innerText: 1 }, duration: 1.5, ease: 'steps(2)' }, 0)
        .to('.f-slate', { autoAlpha: 0, duration: 0.4 })
        .to('.f-bar-top, .f-bar-bottom', { yPercent: 0, duration: 1.2, ease: 'expo.inOut' }, '<')
        .to('.f-hud, .f-timeline', { autoAlpha: 1, duration: 0.8, stagger: 0.2 }, '-=0.4');

      gsap.to('.f-grain', { backgroundPosition: '+=73px +=41px', duration: 0.12, repeat: -1, ease: 'steps(1)' });
      gsap.to('.dust', { y: () => gsap.utils.random(-30, 30), x: () => gsap.utils.random(-20, 20), duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.beam', { opacity: 0.75, duration: 0.09, repeat: -1, yoyo: true, repeatDelay: 1.7, ease: 'steps(1)' });
      gsap.to('.win.lit', {
        opacity: 0.25,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        repeatDelay: () => gsap.utils.random(2, 8),
        stagger: { each: 0.6, from: 'random' },
      });
      gsap.to('.sun', { attr: { cy: 470 }, duration: 12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to('.flicker', { opacity: 0.6, duration: 0.06, repeat: -1, yoyo: true, repeatDelay: 2.3, ease: 'steps(1)' });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // Running timecode (24fps).
  useEffect(() => {
    if (reduced) {
      if (tcRef.current) tcRef.current.textContent = formatTC(index * FPS * 60);
      return undefined;
    }
    let acc = 0;
    const tick = (_t, delta) => {
      acc += delta;
      const step = 1000 / FPS;
      while (acc >= step) {
        frames.current += 1;
        acc -= step;
      }
      if (tcRef.current) tcRef.current.textContent = formatTC(frames.current);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [reduced, index]);

  // Cut / dissolve between scenes.
  useLayoutEffect(() => {
    const els = gsap.utils.toArray('.f-scene', root.current);
    const active = els[index];
    frames.current = index * FPS * 60 * 3 + 12;
    if (reduced || first.current) {
      first.current = false;
      els.forEach((el, i) => gsap.set(el, { autoAlpha: i === index ? 1 : 0 }));
      if (!reduced) {
        gsap.fromTo(active.querySelectorAll('.f-title .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out', delay: 2.2 });
      }
      return;
    }
    const tl = gsap.timeline();
    els.forEach((el, i) => {
      if (i !== index) tl.to(el, { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' }, 0);
    });
    tl.fromTo(active, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .fromTo(active.querySelector('.f-still'), { scale: 1.12 }, { scale: 1, duration: 8, ease: 'power1.out' }, 0)
      .fromTo(active.querySelector('.f-still'), { filter: 'blur(8px) brightness(1.6)' }, { filter: 'blur(0px) brightness(1)', duration: 1.8, ease: 'power2.out' }, 0)
      .fromTo(active.querySelectorAll('.f-title .ln > span'), { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 0.5)
      .fromTo(active.querySelectorAll('.f-meta, .f-sub'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, stagger: 0.15 }, 0.9)
      .fromTo('.f-flash', { opacity: 0.35 }, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
    const roll = active.querySelector('.f-roll');
    if (roll) tl.fromTo(roll, { yPercent: 30 }, { yPercent: -100, duration: 24, ease: 'none', repeat: -1 }, 0.4);
    gsap.to('.f-playhead', { left: `${(index / (total - 1)) * 100}%`, duration: 1.1, ease: 'power3.inOut' });
    return () => tl.kill();
  }, [index, reduced, total]);

  // Screening mode: advance on its own until paused.
  useEffect(() => {
    if (!screening) return undefined;
    const id = setTimeout(() => setIndex((i) => (i + 1) % total), SCENE_HOLD * 1000);
    return () => clearTimeout(id);
  }, [screening, index, total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea, [contenteditable], .test-panel')) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  const scene = scenes[index];

  return (
    <main id="main" className="film" ref={root}>
      <h1 className="sr-only">PERSPECTIVE Film — a screening in {total} scenes</h1>
      <div className="f-screen">
        <div className="f-scenes" aria-live="polite">
          {scenes.map((s, i) => (
            <section
              key={s.id}
              className={`f-scene f-scene-${s.still}`}
              aria-hidden={i !== index}
              inert={i !== index ? '' : undefined}
              aria-label={`${s.code}: ${s.title}`}
            >
              <div className="f-still">
                <Still kind={s.still} />
              </div>
              {s.still === 'credits' ? (
                <div className="f-credits">
                  <div className="f-roll">
                    <p className="f-roll-head">PERSPECTIVE Pictures</p>
                    {FILM.credits.map(([role, desc]) => (
                      <p className="f-roll-row" key={role}>
                        <span>{role}</span>
                        <span>{desc}</span>
                      </p>
                    ))}
                    <p className="f-roll-head">No frames were harmed.</p>
                    <p className="f-roll-contact">screenings@perspective.example</p>
                  </div>
                </div>
              ) : (
                <div className="f-overlay">
                  <p className="f-meta">
                    <span>{s.code}</span>
                    <span>{s.kind}</span>
                    {s.year && <span>{s.year}</span>}
                  </p>
                  <h2 className="f-title">
                    {s.title.split(/(?<=\.)\s|\s(?=is)/).map((ln, k) => (
                      <span className="ln" key={k}>
                        <span>{ln}</span>
                      </span>
                    ))}
                  </h2>
                  <p className="f-sub">
                    <span>{s.caption}</span>
                  </p>
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="f-grain" aria-hidden="true" />
        <div className="f-vignette" aria-hidden="true" />
        <div className="f-flash" aria-hidden="true" />
        <div className="f-bar f-bar-top" aria-hidden="true" />
        <div className="f-bar f-bar-bottom" aria-hidden="true" />

        <div className="f-hud" aria-hidden="true">
          <span className="f-rec">
            <i /> {screening ? 'Screening' : 'Paused on'} {scene.code}
          </span>
          <span className="f-tc" ref={tcRef}>
            00:00:00:00
          </span>
        </div>

        {welcome && <div className="f-welcome-wrap">{welcome}</div>}

        <div className="f-slate" aria-hidden="true">
          <div className="f-slate-ring">
            <div className="f-slate-sweep" />
            <span className="f-slate-num">3</span>
          </div>
        </div>
      </div>

      <nav className="f-timeline" aria-label="Scenes">
        <button
          type="button"
          className="f-ctrl"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          aria-label="Previous scene"
        >
          ←
        </button>
        <button type="button" className="f-ctrl f-screen-btn" aria-pressed={screening} onClick={() => setScreening((s) => !s)}>
          {screening ? 'Pause' : 'Screen all'}
        </button>
        <div className="f-track-wrap">
        <span className="f-playhead" aria-hidden="true" style={{ left: `${(index / (total - 1)) * 100}%` }} />
        <ol className="f-track">
          {scenes.map((s, i) => (
            <li key={s.id} style={{ left: `${(i / (total - 1)) * 100}%` }}>
              <button type="button" className="f-marker" aria-current={i === index ? 'step' : undefined} onClick={() => setIndex(i)}>
                <span className="f-marker-code">{s.code}</span>
                <span className="f-marker-title">{s.id === 'opening' ? 'Opening' : s.title}</span>
              </button>
            </li>
          ))}
        </ol>
        </div>
        <button
          type="button"
          className="f-ctrl"
          onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
          disabled={index === total - 1}
          aria-label="Next scene"
        >
          →
        </button>
        <span className="f-runtime">
          {scene.runtime !== '00:00:00' ? `RT ${scene.runtime}` : 'Use ← → keys'}
        </span>
      </nav>
    </main>
  );
}

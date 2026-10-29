import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SOUND } from '../content.js';

gsap.registerPlugin(ScrollTrigger);

const BEAT = 60 / SOUND.bpm;
// Root notes per track (C minor-ish), so each selection sounds different.
const ROOTS = [65.41, 77.78, 87.31, 98.0];

function seeded(seed, n) {
  let s = seed;
  return Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280;
    return 0.15 + (s / 233280) * 0.85;
  });
}

/** A soft generative pad built with the Web Audio API. Only starts on a user click. */
function createPad() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 520;
  filter.Q.value = 6;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = SOUND.bpm / 60 / 2;
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain).connect(filter.frequency);
  filter.connect(master).connect(ctx.destination);
  const oscs = [1, 1.5, 2.003, 2.997].map((ratio, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? 'triangle' : 'sawtooth';
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.5 : 0.22;
    o.connect(g).connect(filter);
    o.start();
    return { o, ratio };
  });
  lfo.start();
  return {
    setRoot(f) {
      oscs.forEach(({ o, ratio }) => o.frequency.setTargetAtTime(f * ratio, ctx.currentTime, 0.4));
    },
    fade(to) {
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.setTargetAtTime(to, ctx.currentTime, 0.6);
    },
    close() {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      setTimeout(() => ctx.close(), 400);
    },
  };
}

function Waveform({ seed, count, className = '' }) {
  const values = seeded(seed, count);
  return (
    <div className={`wave ${className}`} aria-hidden="true">
      {values.map((v, i) => (
        <i key={i} style={{ '--v': v }} />
      ))}
    </div>
  );
}

export default function Sound({ reduced, welcome }) {
  const root = useRef(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(null);
  const [playing, setPlaying] = useState(false);
  const pad = useRef(null);
  const amp = useRef(0.35);
  const progress = useRef(null);

  // Entrance on the beat, then a waveform that never quite stops.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (!reduced) {
        gsap
          .timeline({ defaults: { ease: 'expo.out' } })
          .from('.s-title .line > span', { yPercent: 110, duration: 1.1, stagger: BEAT / 2 })
          .from('.s-meta > *', { autoAlpha: 0, y: -10, duration: 0.4, stagger: BEAT / 4 }, BEAT / 2)
          .from('.s-hero .wave i', { scaleY: 0, duration: 0.8, stagger: { each: 0.008, from: 'center' } }, BEAT)
          .from('.s-intro, .transport', { autoAlpha: 0, y: 20, duration: 0.8, stagger: BEAT / 2 }, BEAT * 1.5);

        gsap.to('.s-hero .wave i', {
          scaleY: () => 0.12 + Math.random() * amp.current * 2.2,
          duration: BEAT / 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
          stagger: { each: 0.012, from: 'center' },
          delay: BEAT * 2,
        });

        gsap.to('.s-pulse', { scale: 1.8, autoAlpha: 0.3, duration: BEAT / 2, repeat: -1, yoyo: true, ease: 'sine.out' });
        gsap.to('.s-title', { '--wdth': 112, duration: BEAT * 2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.4 });

        ScrollTrigger.batch('.s-reveal', {
          start: 'top 88%',
          once: true,
          onEnter: (els) =>
            gsap.from(els, { y: 40, autoAlpha: 0, duration: 0.8, stagger: BEAT / 4, ease: 'expo.out' }),
        });

        gsap.from('.s-fader-fill', {
          scaleY: 0,
          duration: 1.2,
          stagger: BEAT / 2,
          ease: 'expo.out',
          scrollTrigger: { trigger: '.s-freq', start: 'top 75%', once: true },
        });

        gsap.utils.toArray('.s-notes .nw').forEach((w, i) => {
          gsap.fromTo(
            w,
            { color: 'rgba(236,235,228,0.18)' },
            {
              color: '#ecebe4',
              ease: 'none',
              scrollTrigger: { trigger: '.s-notes', start: `top+=${i * 18} 70%`, end: `top+=${i * 18 + 40} 60%`, scrub: true },
            }
          );
        });
      }
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  // Playhead in the transport bar runs while "playing".
  useEffect(() => {
    if (!progress.current) return undefined;
    gsap.set(progress.current, { scaleX: 0 });
    if (!playing || reduced) return undefined;
    const t = gsap.to(progress.current, { scaleX: 1, duration: BEAT * 32, ease: 'none', repeat: -1 });
    return () => t.kill();
  }, [playing, current, reduced]);

  useEffect(() => {
    amp.current = playing ? 0.5 : 0.22;
    if (pad.current) {
      pad.current.setRoot(ROOTS[current]);
      pad.current.fade(playing ? 0.07 : 0);
    }
  }, [playing, current]);

  useEffect(() => () => pad.current?.close(), []);

  const togglePlay = () => {
    if (!pad.current) pad.current = createPad();
    setPlaying((p) => !p);
  };

  const select = useCallback((i, scroll = true) => {
    setCurrent(i);
    setOpen(i);
    if (scroll) {
      const row = root.current?.querySelector(`#track-${i}`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const step = (dir) => select((current + dir + SOUND.tracks.length) % SOUND.tracks.length);

  const track = SOUND.tracks[current];

  return (
    <main id="main" className="sound" ref={root}>
      <section className="s-hero" id="a1" aria-labelledby="s-title">
        <div className="s-meta">
          <span>PERSPECTIVE/Sound</span>
          <span>
            <i className="s-pulse" aria-hidden="true" /> {SOUND.bpm} BPM
          </span>
          <span>Key of {SOUND.key}</span>
          <span>Side A</span>
        </div>
        <h1 className="s-title" id="s-title">
          {SOUND.hero.map((l, i) => (
            <span className="line" key={i}>
              <span>{l}</span>
            </span>
          ))}
        </h1>
        <Waveform seed={5} count={96} className="wave-hero" />
        <p className="s-intro">{SOUND.intro}</p>
      </section>

      {welcome && <div className="s-welcome-wrap">{welcome}</div>}

      <section className="s-tracks" id="a2" aria-labelledby="s-tracks-h">
        <h2 className="s-label" id="s-tracks-h">
          <span>A2</span> Selected work — tracklist
        </h2>
        <ol className="s-list">
          {SOUND.tracks.map((t, i) => {
            const isOpen = open === i;
            return (
              <li key={t.id} id={`track-${i}`} className={`s-row s-reveal ${current === i ? 'is-current' : ''}`}>
                <button
                  type="button"
                  className="s-row-btn"
                  aria-expanded={isOpen}
                  aria-controls={`track-panel-${i}`}
                  onClick={() => {
                    setCurrent(i);
                    setOpen(isOpen ? null : i);
                  }}
                >
                  <span className="s-no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="s-name">{t.title}</span>
                  <span className="s-kind">{t.kind}</span>
                  <Waveform seed={t.seed} count={32} className="wave-mini" />
                  <span className="s-dur">{t.duration}</span>
                </button>
                <div className="s-panel" id={`track-panel-${i}`} hidden={!isOpen}>
                  <p className="s-blurb">{t.blurb}</p>
                  <p className="s-credits">
                    {t.year} · {t.credits}
                  </p>
                  <Waveform seed={t.seed * 3} count={120} className="wave-big" />
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="s-notes" id="a3" aria-labelledby="s-notes-h">
        <h2 className="s-label" id="s-notes-h">
          <span>A3</span> Liner notes
        </h2>
        <blockquote>
          <p>
            {SOUND.notes.split(' ').map((w, i) => (
              <span className="nw" key={i}>
                {w}{' '}
              </span>
            ))}
          </p>
        </blockquote>
      </section>

      <section className="s-freq" id="a4" aria-labelledby="s-freq-h">
        <h2 className="s-label" id="s-freq-h">
          <span>A4</span> Frequencies — what we do
        </h2>
        <ul className="s-faders">
          {SOUND.frequencies.map((f) => (
            <li key={f.hz} className="s-fader s-reveal">
              <span className="s-fader-track" aria-hidden="true">
                <span className="s-fader-fill" style={{ '--level': f.level }} />
              </span>
              <span className="s-fader-hz">{f.hz}</span>
              <span className="s-fader-label">{f.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="s-footer s-reveal">
        <p className="s-footer-big">Side B is still in the studio.</p>
        <p>
          Send a demo, a brief or a strange noise: <span className="s-mail">listen@perspective.example</span>
        </p>
      </footer>

      <nav className="transport" aria-label="Sound transport">
        <div className="tp-controls">
          <button type="button" onClick={() => step(-1)} aria-label="Previous track">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 5h2v14H6zM20 5v14L9 12z" />
            </svg>
          </button>
          <button type="button" className="tp-play" onClick={togglePlay} aria-pressed={playing}>
            <span className="sr-only">{playing ? 'Pause ambient tone' : 'Play ambient tone'}</span>
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 4v16l13-8z" />
              </svg>
            )}
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next track">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <div className="tp-now" aria-live="polite">
          <span className="tp-now-label">{playing ? 'Now playing' : 'Cued'}</span>
          <span className="tp-now-title">
            {String(current + 1).padStart(2, '0')} — {track.title}
          </span>
          <span className="tp-bar" aria-hidden="true">
            <span ref={progress} />
          </span>
        </div>
        <ul className="tp-chapters">
          {[
            ['a1', 'A1', 'Intro'],
            ['a2', 'A2', 'Tracks'],
            ['a3', 'A3', 'Notes'],
            ['a4', 'A4', 'Frequencies'],
          ].map(([id, code, label]) => (
            <li key={id}>
              <a href={`#${id}`}>
                <b>{code}</b> {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

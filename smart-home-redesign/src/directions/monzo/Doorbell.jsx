import { useRef, useState } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap.js';
import { useMotion } from '../../lib/motion.js';
import { Doorbell as DoorbellArt } from '../../components/art/Devices.jsx';
import { DoorstepScene, Phone } from '../../components/art/Scenes.jsx';
import { doorbell } from '../../lib/content.js';

const CHIPS = ['1080p HD video', 'Night vision', 'Two-way talk', 'Live view', 'Smart alerts', '30 days of clips'];

export default function Doorbell() {
  const root = useRef(null);
  const ringRef = useRef(null);
  const playing = useRef(false);
  const { reduced } = useMotion();
  const [night, setNight] = useState(false);
  const [rings, setRings] = useState(0);
  const [announce, setAnnounce] = useState('');

  const { contextSafe } = useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.set(q('.mz-db__bubble, .mz-db__notif'), { autoAlpha: 0 });
      if (reduced) return;

      const split = SplitText.create(q('.mz-db__title'), { type: 'words' });
      gsap
        .timeline({ scrollTrigger: { trigger: q('.mz-db__head')[0], start: 'top 75%' } })
        .from(q('.mz-db__head .mz-tag'), { scale: 0, rotate: 10, duration: 0.7, ease: 'back.out(2.5)' })
        .from(split.words, { yPercent: 120, rotate: -8, autoAlpha: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(1.8)' }, 0.1)
        .from(q('.mz-db__head .mz-lede'), { y: 24, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.5)' }, 0.4);

      gsap.from(q('.mz-db__bellWrap'), {
        scale: 0.6,
        rotate: -16,
        autoAlpha: 0,
        duration: 1.2,
        ease: 'elastic.out(1, 0.55)',
        scrollTrigger: { trigger: q('.mz-db__play')[0], start: 'top 75%' },
      });
      gsap.from(q('.mz-db__phoneWrap'), {
        y: 120,
        rotate: 8,
        autoAlpha: 0,
        duration: 1.1,
        ease: 'back.out(1.4)',
        scrollTrigger: { trigger: q('.mz-db__play')[0], start: 'top 75%' },
      });
      gsap.from(q('.mz-chip'), {
        scale: 0,
        rotate: () => gsap.utils.random(-20, 20),
        duration: 0.8,
        stagger: 0.06,
        ease: 'back.out(2.2)',
        scrollTrigger: { trigger: q('.mz-db__chips')[0], start: 'top 90%' },
      });

      // Ring once on our own when the phone is in view, if nobody has yet.
      ScrollTrigger.create({
        trigger: q('.mz-db__phoneWrap')[0],
        start: 'top 45%',
        once: true,
        onEnter: () => ringRef.current?.(true),
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const ring = contextSafe((auto = false) => {
    if (playing.current) return;
    if (auto && rings > 0) return;
    playing.current = true;
    setRings((n) => n + 1);
    setAnnounce(`Doorbell pressed. ${doorbell.chat.map((c) => `${c.from === 'you' ? 'You' : 'Visitor'}: ${c.text}`).join(' ')}`);

    const q = gsap.utils.selector(root);
    const bubbles = q('.mz-db__bubble');

    if (reduced) {
      gsap.set(q('.mz-db__idle'), { autoAlpha: 0 });
      gsap.set([...q('.mz-db__notif'), ...bubbles], { autoAlpha: 1 });
      playing.current = false;
      return;
    }

    gsap
      .timeline({ onComplete: () => (playing.current = false) })
      .set(bubbles, { autoAlpha: 0 })
      .to(q('.mz-db__bellArt'), { scaleY: 0.9, scaleX: 1.06, transformOrigin: '50% 100%', duration: 0.09, ease: 'power2.in' })
      .to(q('.mz-db__bellArt'), { scaleY: 1, scaleX: 1, duration: 0.9, ease: 'elastic.out(1.2, 0.3)' })
      .fromTo(q('.mz-db__ripple'), { scale: 0.5, autoAlpha: 0.9 }, { scale: 2.4, autoAlpha: 0, duration: 1.2, stagger: 0.16, ease: 'power2.out' }, 0.05)
      .fromTo(q('.mz-db__phoneWrap'), { rotate: 0 }, { keyframes: { rotate: [0, -5, 5, -4, 3, -1, 0] }, duration: 0.7, ease: 'none' }, 0.15)
      .fromTo(q('.mz-db__notif'), { yPercent: -160, scale: 0.85, autoAlpha: 0 }, { yPercent: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: 'back.out(2.2)' }, 0.2)
      .to(q('.mz-db__idle'), { autoAlpha: 0, scale: 1.1, duration: 0.45, ease: 'power2.in' }, 0.8)
      .to(q('.mz-db__notif'), { yPercent: -160, autoAlpha: 0, duration: 0.4, ease: 'back.in(1.6)' }, 2.1)
      .fromTo(bubbles, { autoAlpha: 0, y: 24, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 1.1, ease: 'back.out(2.4)' }, 1.4);
  });
  ringRef.current = ring;

  return (
    <section id="doorbell" className={`mz-db ${reduced ? 'is-static' : 'is-motion'} ${night ? 'is-night' : ''}`} ref={root} aria-labelledby="mz-db-title">
      <div className="mz-db__head">
        <p className="mz-tag mz-tag--sun">{doorbell.eyebrow}</p>
        <h2 className="mz-db__title mz-h2" id="mz-db-title">
          Ding dong. Who’s&nbsp;there?
        </h2>
        <p className="mz-lede">
          See, hear and chat to whoever’s on your doorstep — from wherever you are. {doorbell.plan}, £5 a month.
        </p>
      </div>

      <div className="mz-db__play">
        <div className="mz-db__bellCol">
          <div className="mz-db__bellWrap">
            <span className="mz-db__ripple" aria-hidden="true" />
            <span className="mz-db__ripple" aria-hidden="true" />
            <span className="mz-db__ripple" aria-hidden="true" />
            <button type="button" className="mz-db__bell" onClick={() => ring(false)} aria-describedby="mz-bell-hint">
              <DoorbellArt variant="monzo" className="mz-db__bellArt" title="Press the Smart Doorbell" />
            </button>
          </div>
          <p className="mz-db__hint" id="mz-bell-hint">
            <svg viewBox="0 0 80 40" aria-hidden="true">
              <path d="M76 30C56 36 30 32 14 12M14 12l2 12M14 12l12 1" />
            </svg>
            {rings === 0 ? 'Go on, give it a press' : rings === 1 ? 'Again? Go for it' : `Rung ${rings} times. They’re coming!`}
          </p>
        </div>

        <div className="mz-db__phoneCol">
          <div className="mz-db__switchRow">
            <button
              type="button"
              role="switch"
              aria-checked={night}
              className="mz-switch mz-press"
              onClick={() => setNight((n) => !n)}
            >
              <span className="mz-switch__track" aria-hidden="true">
                <span className="mz-switch__knob" />
              </span>
              <span>{night ? 'Night vision on' : 'Try night vision'}</span>
            </button>
          </div>

          <div className="mz-db__phoneWrap">
            <Phone className="mz-db__phone">
              <div className="mz-db__feed">
                <DoorstepScene flat className="mz-db__scene" />
                <DoorstepScene flat className="mz-db__scene mz-db__scene--night is-night" />
              </div>
              <div className="mz-db__live" aria-hidden="true">
                <span>● Live</span>
                <span>1080p</span>
              </div>
              <div className="mz-db__idle" aria-hidden="true">
                <svg viewBox="0 0 48 48">
                  <path d="M8 22L24 9l16 13v17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
                  <path d="M19 41V29h10v12" />
                </svg>
                <p>All quiet at the front door</p>
              </div>
              <div className="mz-db__notif" aria-hidden="true">
                <strong>Ding dong!</strong>
                <span>Someone’s at your front door</span>
              </div>
              <div className="mz-db__chat" aria-hidden="true">
                {doorbell.chat.map((c, i) => (
                  <p key={i} className={`mz-db__bubble is-${c.from}`}>
                    {c.text}
                  </p>
                ))}
              </div>
            </Phone>
          </div>
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </div>
      </div>

      <ul className="mz-db__chips" aria-label="Doorbell features">
        {CHIPS.map((c, i) => (
          <li key={c} className={`mz-chip mz-chip--${i % 4}`}>
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}

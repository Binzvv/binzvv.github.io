import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap.js';
import { useMotion } from '../../lib/motion.js';
import { DoorstepScene, Phone } from '../../components/art/Scenes.jsx';
import { doorbell } from '../../lib/content.js';

// Resting bar heights for the waveform (used when motion is reduced).
const WAVE = [0.3, 0.55, 0.8, 0.45, 0.95, 0.6, 0.35, 0.7, 1, 0.5, 0.75, 0.4, 0.6, 0.3];

export default function Doorbell() {
  const root = useRef(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);

      const intro = q('.ap-db__intro')[0];
      const title = SplitText.create(q('.ap-db__title'), { type: 'lines', mask: 'lines' });
      gsap
        .timeline({ defaults: { ease: 'cine' }, scrollTrigger: { trigger: intro, start: 'top 72%' } })
        .from(q('.ap-db__intro .ap-eyebrow'), { autoAlpha: 0, y: 12, duration: 1.1 })
        .from(title.lines, { yPercent: 105, duration: 1.5, stagger: 0.1 }, 0.05)
        .from(q('.ap-db__intro .ap-lede, .ap-db__intro .ap-meta'), { autoAlpha: 0, y: 20, duration: 1.3, stagger: 0.1 }, 0.4);

      // Pinned story. One timeline, three acts, each roughly one unit long.
      const steps = q('.ap-db__step');
      const bars = q('.ap-db__bar i');
      const res = q('.ap-db__res')[0];
      const count = { v: 0 };
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 36 });

      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: q('.ap-db__stage')[0],
            start: 'top top',
            end: '+=330%',
            scrub: 0.8,
            pin: true,
            onUpdate: (self) => root.current?.classList.toggle('is-talking', self.progress > 0.68),
          },
        })
        // Act 1 — the picture opens up from a keyhole crop to full screen.
        .fromTo(
          q('.ap-db__feed'),
          { clipPath: 'inset(24% 20% 30% 20% round 40px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 0.6, ease: 'power2.inOut' },
          0,
        )
        .from(q('.ap-db__scene--day'), { scale: 1.3, duration: 0.8, ease: 'power2.out' }, 0)
        .to(count, { v: 1080, duration: 0.55, onUpdate: () => (res.textContent = `${Math.round(count.v)}p`) }, 0.1)
        .from(q('.ap-db__hud'), { autoAlpha: 0, duration: 0.2 }, 0.35)
        .from(q('.ap-db__notif'), { yPercent: -140, autoAlpha: 0, duration: 0.25, ease: 'power3.out' }, 0.5)
        .fromTo(bars[0], { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)

        // Act 2 — the light goes. Page and picture both turn to night.
        .to(steps[0], { autoAlpha: 0, y: -36, duration: 0.25 }, 1)
        .to(steps[1], { autoAlpha: 1, y: 0, duration: 0.25 }, 1.1)
        .to(root.current, { '--db-bg': '#000000', '--db-fg': '#f5f5f7', '--db-muted': '#86868b', '--db-track': 'rgba(255,255,255,0.18)', duration: 0.4 }, 1)
        .to(q('.ap-db__notif'), { autoAlpha: 0, y: -16, duration: 0.2 }, 1)
        .to(q('.ap-db__scene--night'), { autoAlpha: 1, duration: 0.35 }, 1.05)
        .fromTo(q('.ap-db__ir'), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.2 }, 1.25)
        .fromTo(bars[1], { scaleX: 0 }, { scaleX: 1, duration: 1 }, 1)

        // Act 3 — talk back. A sheet rises; the conversation appears.
        .to(steps[1], { autoAlpha: 0, y: -36, duration: 0.25 }, 2)
        .to(steps[2], { autoAlpha: 1, y: 0, duration: 0.25 }, 2.1)
        .from(q('.ap-db__talk'), { yPercent: 110, duration: 0.35, ease: 'power3.out' }, 2.05)
        .from(q('.ap-db__bubble'), { autoAlpha: 0, y: 14, scale: 0.96, duration: 0.2, stagger: 0.28, ease: 'power2.out' }, 2.3)
        .fromTo(bars[2], { scaleX: 0 }, { scaleX: 1, duration: 1 }, 2)
        .to({}, { duration: 0.15 });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section
      id="doorbell"
      className={`ap-db ${reduced ? 'is-static' : 'is-motion'}`}
      ref={root}
      aria-labelledby="ap-db-title"
    >
      <header className="ap-db__intro ap-wrap">
        <p className="ap-eyebrow">{doorbell.eyebrow}</p>
        <h2 className="ap-db__title ap-h2" id="ap-db-title">
          Someone’s at the door.
          <br />
          You’ll know first.
        </h2>
        <p className="ap-lede">
          A doorbell that sees, hears and speaks — and tells your phone before the chime has finished.
        </p>
        <p className="ap-meta">{doorbell.plan} · £5 a month</p>
      </header>

      <div className="ap-db__stage">
        <div className="ap-db__grid ap-wrap">
          <div className="ap-db__text">
            <ol className="ap-db__steps">
              {doorbell.steps.map((s, i) => (
                <li key={s.id} className="ap-db__step">
                  <p className="ap-db__kicker">
                    <span>{String(i + 1).padStart(2, '0')}</span> {s.kicker}
                  </p>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="ap-db__bar" aria-hidden="true">
              {doorbell.steps.map((s) => (
                <span key={s.id}>
                  <i />
                </span>
              ))}
            </div>
          </div>

          <div className="ap-db__device">
            <Phone className="ap-db__phone">
              <div className="ap-db__feed">
                <DoorstepScene className="ap-db__scene--day" />
                <DoorstepScene className="ap-db__scene--night is-night" />
              </div>
              <div className="ap-db__hud" aria-hidden="true">
                <span className="ap-db__live">Live</span>
                <span className="ap-db__res">1080p</span>
              </div>
              <span className="ap-db__ir" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path d="M10.5 1.5a6.5 6.5 0 1 0 4 11.6A7 7 0 0 1 10.5 1.5z" fill="currentColor" />
                </svg>
                Night vision
              </span>
              <div className="ap-db__notif" role="presentation">
                <span className="ap-db__appIcon" aria-hidden="true" />
                <span>
                  <strong>Front door</strong>
                  Someone’s at your door
                </span>
                <time>now</time>
              </div>
              <div className="ap-db__talk">
                <div className="ap-db__bubbles">
                  {doorbell.chat.slice(0, 2).map((c, i) => (
                    <p key={i} className={`ap-db__bubble is-${c.from}`}>
                      {c.text}
                    </p>
                  ))}
                </div>
                <div className="ap-db__mic">
                  <span className="ap-db__wave" aria-hidden="true">
                    {WAVE.map((h, i) => (
                      <i key={i} style={{ '--i': i, '--h': h }} />
                    ))}
                  </span>
                  <span className="ap-db__micBtn" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor" />
                      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </Phone>
          </div>
        </div>
      </div>
    </section>
  );
}

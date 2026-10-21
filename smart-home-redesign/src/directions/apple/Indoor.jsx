import { useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap.js';
import { useMotion } from '../../lib/motion.js';
import { IndoorCamera, SensorBridge } from '../../components/art/Devices.jsx';
import { FloorPlan } from '../../components/art/Scenes.jsx';
import { indoor, planFeatures } from '../../lib/content.js';

const ICONS = {
  rec: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></>,
  cloud: <path d="M7.5 18.5h9.5a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.4A3.3 3.3 0 0 0 7.5 18.5z" />,
  zones: <><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" /><rect x="8.5" y="8.5" width="7" height="7" rx="1.5" /></>,
  alerts: <path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14zM10 20.5a2 2 0 0 0 4 0" />,
  share: <path d="M12 3.5v11M8 7.5l4-4 4 4M6 11.5v7a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-7" />,
};

// Pointer-tracked highlight for tiles: cheap, CSS-variable driven.
const trackPointer = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export default function Indoor() {
  const root = useRef(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);

      // Intro
      const intro = q('.ap-in__intro')[0];
      const title = SplitText.create(q('.ap-in__title'), { type: 'lines', mask: 'lines' });
      gsap
        .timeline({ defaults: { ease: 'cine' }, scrollTrigger: { trigger: intro, start: 'top 72%' } })
        .from(q('.ap-in__intro .ap-eyebrow'), { autoAlpha: 0, y: 12, duration: 1.1 })
        .from(title.lines, { yPercent: 105, duration: 1.5, stagger: 0.1 }, 0.05)
        .from(q('.ap-in__intro .ap-lede, .ap-in__intro .ap-meta'), { autoAlpha: 0, y: 20, duration: 1.3, stagger: 0.1 }, 0.4);

      // Image reveal: the frame opens while the product drifts against it.
      const fig = q('.ap-in__figure')[0];
      gsap.fromTo(
        q('.ap-in__frame'),
        { clipPath: 'inset(12% 14% 12% 14% round 48px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 32px)',
          ease: 'none',
          scrollTrigger: { trigger: fig, start: 'top 90%', end: 'top 25%', scrub: 0.6 },
        },
      );
      gsap.fromTo(
        q('.ap-in__product'),
        { yPercent: 14, scale: 1.08 },
        { yPercent: -8, scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
      gsap.from(q('.ap-in__chips li'), {
        autoAlpha: 0,
        y: 12,
        duration: 0.9,
        ease: 'cine',
        stagger: 0.07,
        scrollTrigger: { trigger: q('.ap-in__chips')[0], start: 'top 90%' },
      });

      // Pinned map: walls draw, then each sensor reports in turn.
      const map = q('.ap-in__map')[0];
      const nodes = q('.art-plan__node');
      const items = q('.ap-in__feed li');
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: map, start: 'top top', end: '+=280%', scrub: 0.8, pin: true },
      });
      tl.from(q('.ap-in__mapHead > *'), { autoAlpha: 0, y: 24, stagger: 0.1, duration: 0.35, ease: 'power2.out' }, 0)
        .from(q('.art-plan__walls path'), { drawSVG: '0%', duration: 0.9, stagger: 0.06, ease: 'power1.inOut' }, 0.05)
        .from(q('.art-plan__fixtures > *, .art-plan__labels text'), { autoAlpha: 0, duration: 0.3, stagger: 0.03 }, 0.7);
      nodes.forEach((node, i) => {
        const at = 1.2 + i * 0.55;
        tl.from(node, { autoAlpha: 0, duration: 0.15 }, at)
          .from(node.querySelector('.art-plan__dot'), { scale: 0, transformOrigin: '50% 50%', duration: 0.25, ease: 'back.out(3)' }, at)
          .from(items[i], { autoAlpha: 0, y: 24, duration: 0.25, ease: 'power2.out' }, at + 0.05);
        if (i > 0) tl.to(items[i - 1], { opacity: 0.4, duration: 0.2 }, at);
      });
      tl.to({}, { duration: 0.3 });

      // Bridge: slides out from behind the camera as you pass.
      const bridge = q('.ap-in__bridge')[0];
      gsap
        .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: bridge, start: 'top 80%', end: 'center 50%', scrub: 0.6 } })
        .from(q('.ap-in__bridgeArt'), { xPercent: -95, rotate: -6, duration: 1 }, 0)
        .from(q('.ap-in__cable'), { drawSVG: '0%', duration: 0.6 }, 0.4)
        .from(q('.ap-in__bridgeCopy > *'), { autoAlpha: 0, y: 24, stagger: 0.12, duration: 0.5 }, 0.2);

      // Tiles: quiet staggered entrance, in rows.
      ScrollTrigger.batch(q('.ap-tile'), {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.from(batch, { autoAlpha: 0, y: 40, duration: 1.1, ease: 'cine', stagger: 0.08 }),
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section id="indoor" className={`ap-in ${reduced ? 'is-static' : 'is-motion'}`} ref={root} aria-labelledby="ap-in-title">
      <header className="ap-in__intro ap-wrap">
        <p className="ap-eyebrow">{indoor.eyebrow}</p>
        <h2 className="ap-in__title ap-h2" id="ap-in-title">
          Every room.
          <br />
          One quiet app.
        </h2>
        <p className="ap-lede">
          Add an Indoor Camera and sensors, and your whole home reports in — calmly, and only when it matters.
        </p>
        <p className="ap-meta">{indoor.plan} · £8 a month · £20 upfront</p>
      </header>

      <figure className="ap-in__figure ap-wrap">
        <div className="ap-in__frame">
          <div className="ap-in__product">
            <IndoorCamera variant="apple" />
          </div>
        </div>
        <figcaption>
          <ul className="ap-in__chips">
            {indoor.camera.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </figcaption>
      </figure>

      <div className="ap-in__map" id="sensors">
        <div className="ap-in__mapGrid ap-wrap">
          <div className="ap-in__mapHead">
            <h3 className="ap-h3">Sensors that speak up.</h3>
            <p className="ap-lede">Contact, motion and leak sensors report to the same app as your cameras.</p>
          </div>
          <FloorPlan className="ap-in__plan" />
          <ol className="ap-in__feed" aria-label="Example alerts">
            {indoor.sensors.map((s) => (
              <li key={s.id}>
                <span className={`ap-in__dot is-${s.id}`} aria-hidden="true" />
                <span className="ap-in__feedBody">
                  <span className="ap-in__feedDevice">
                    {s.device} · {s.room}
                  </span>
                  <span className="ap-in__feedAlert">{s.alert}</span>
                </span>
                <time>{s.time}</time>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="ap-in__bridge ap-wrap">
        <div className="ap-in__bridgeVisual" aria-hidden="true">
          <svg className="ap-in__cableSvg" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path className="ap-in__cable" d="M60 120 C 140 120, 160 60, 240 70 S 340 120, 390 110" />
          </svg>
          <div className="ap-in__bridgeCam">
            <IndoorCamera variant="apple" title="" />
          </div>
          <div className="ap-in__bridgeArt">
            <SensorBridge variant="apple" />
          </div>
        </div>
        <div className="ap-in__bridgeCopy">
          <h3 className="ap-h3">{indoor.bridge.title}</h3>
          <p className="ap-lede">{indoor.bridge.body}</p>
          <ul className="ap-in__packs">
            {indoor.packs.map((p) => (
              <li key={p.id}>
                <span>
                  <strong>{p.name}</strong>
                  {p.contents}
                </span>
                <span className="ap-in__packPrice">£{p.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ap-in__features ap-wrap" id="plans">
        <h3 className="ap-h3">Every plan includes.</h3>
        <ul className="ap-tiles">
          {planFeatures.map((f) => (
            <li key={f.id} className={`ap-tile ap-tile--${f.id}`} onPointerMove={trackPointer}>
              <svg className="ap-tile__icon" viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[f.id]}
              </svg>
              <h4>{f.title}</h4>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

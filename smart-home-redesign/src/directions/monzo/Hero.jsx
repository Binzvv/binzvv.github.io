import { useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from '../../lib/gsap.js';
import { useMotion } from '../../lib/motion.js';

const PLACES = ['front door', 'living room', 'kitchen sink', 'hallway'];

const CARDS = [
  { id: 'bell', tone: 'coral', title: 'Ding dong!', body: 'Someone’s at the front door', time: 'now', speed: 0.5, icon: 'bell' },
  { id: 'parcel', tone: 'sun', title: 'Parcel dropped off', body: 'Left behind the plant pot', time: '2m', speed: 1.1, icon: 'box' },
  { id: 'door', tone: 'mint', title: 'Back door closed', body: 'Contact sensor · Kitchen', time: '14m', speed: 0.8, icon: 'door' },
  { id: 'leak', tone: 'sky', title: 'All dry under the sink', body: 'Leak sensor checked in', time: '1h', speed: 1.4, icon: 'drop' },
];

const ICON_PATHS = {
  bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',
  door: 'M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M4 21h16M14.5 12.5h.01',
  drop: 'M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z',
};

export default function Hero() {
  const root = useRef(null);
  const z = useRef(10);
  const { reduced } = useMotion();

  const { contextSafe } = useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);

      // Words pop up one by one, then the last word does a stretch.
      const split = SplitText.create(q('.mz-hero__title .mz-split'), { type: 'words' });
      const stretch = q('.mz-hero__stretch')[0];
      gsap
        .timeline({ delay: 0.15 })
        .from(q('.mz-tag'), { scale: 0, rotate: -12, duration: 0.7, ease: 'back.out(2.5)' })
        .from(split.words, { yPercent: 110, rotate: 6, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: 'back.out(1.7)' }, 0.1)
        .fromTo(
          stretch,
          { fontVariationSettings: "'wdth' 125", autoAlpha: 0, yPercent: 60 },
          { fontVariationSettings: "'wdth' 72", autoAlpha: 1, yPercent: 0, duration: 1.1, ease: 'elastic.out(1, 0.45)' },
          0.5,
        )
        .from(q('.mz-hero__rot, .mz-hero__lede, .mz-hero__ctas > *'), { y: 30, autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: 'back.out(1.6)' }, 0.7)
        .from(q('.mz-hcard'), { y: 260, rotate: (i) => [-24, 18, -14, 22][i], autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: 'elastic.out(1, 0.6)' }, 0.45)
        .from(q('.mz-sticker'), { scale: 0, rotate: -90, duration: 1, ease: 'elastic.out(1, 0.5)' }, 1.0);

      // Rotating place name.
      const words = q('.mz-hero__rotWord');
      const box = q('.mz-hero__rotBox')[0];
      gsap.set(words.slice(1), { yPercent: 110, autoAlpha: 0 });
      gsap.set(box, { width: words[0].offsetWidth });
      const rot = gsap.timeline({ repeat: -1, delay: 2.2 });
      words.forEach((w, i) => {
        const next = words[(i + 1) % words.length];
        rot
          .to(w, { yPercent: -110, autoAlpha: 0, duration: 0.45, ease: 'back.in(1.6)' }, '+=1.8')
          .to(box, { width: next.offsetWidth, duration: 0.5, ease: 'back.out(1.6)' }, '<0.15')
          .fromTo(next, { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: 'back.out(2)', immediateRender: false }, '<');
      });

      // Cards drift at different speeds as you scroll away.
      q('.mz-hcard').forEach((card) => {
        gsap.to(card, {
          y: () => (window.innerWidth < 860 ? -50 : -160) * Number(card.dataset.speed),
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        });
      });

      // The stack leans into fast scrolls and springs back upright.
      const stack = q('.mz-hero__stack')[0];
      const skew = gsap.quickTo(stack, 'skewY', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => skew(gsap.utils.clamp(-6, 6, self.getVelocity() / -400)),
        onLeave: () => skew(0),
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  // Tap a card to bring it to the top of the pile.
  const raise = contextSafe((e) => {
    const card = e.currentTarget.closest('.mz-hcard');
    card.style.zIndex = ++z.current;
    if (reduced) return;
    gsap.fromTo(e.currentTarget, { scale: 0.92 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1.1, 0.35)' });
  });

  const stretchWiggle = contextSafe((e) => {
    if (reduced) return;
    gsap.timeline()
      .to(e.currentTarget, { fontVariationSettings: "'wdth' 125", duration: 0.25, ease: 'power2.out' })
      .to(e.currentTarget, { fontVariationSettings: "'wdth' 72", duration: 1, ease: 'elastic.out(1, 0.3)' });
  });

  const stickerSpin = contextSafe((e) => {
    if (reduced) return;
    gsap.fromTo(e.currentTarget, { scale: 0.85 }, { scale: 1, rotate: '+=30', duration: 1, ease: 'elastic.out(1, 0.35)' });
  });

  return (
    <section className={`mz-hero ${reduced ? 'is-static' : 'is-motion'}`} ref={root} aria-labelledby="mz-hero-title">
      <div className="mz-hero__copy">
        <p className="mz-tag">Sky Smart Home</p>
        <h1 className="mz-hero__title" id="mz-hero-title">
          <span className="mz-split">Home, but on your </span>
          <span className="mz-hero__stretch" onPointerEnter={stretchWiggle}>
            phone.
          </span>
        </h1>
        <p className="mz-hero__rot">
          Keep an eye on the{' '}
          <span className="mz-hero__rotBox">
            {PLACES.map((p, i) => (
              <span key={p} className="mz-hero__rotWord" aria-hidden={i > 0 || undefined}>
                {p}
              </span>
            ))}
          </span>
          <span className="sr-only">, wherever you are.</span>
        </p>
        <p className="mz-hero__lede">
          A smart doorbell, indoor camera and sensors in one friendly app. Plug in, pair up, done — from £5 a month.
        </p>
        <div className="mz-hero__ctas">
          <a className="mz-btn mz-press" href="#sensors-end">
            Get Smart Home
          </a>
          <a className="mz-btn mz-btn--ghost mz-press" href="#doorbell">
            See how it works
          </a>
        </div>
      </div>

      <div className="mz-hero__visual">
        <div className="mz-hero__stack" aria-label="Example notifications" role="list">
          {CARDS.map((c, i) => (
            <div key={c.id} className={`mz-hcard mz-hcard--${i}`} data-speed={c.speed} role="listitem">
              <button type="button" className={`mz-hcard__body is-${c.tone}`} onClick={raise}>
                <span className="mz-hcard__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d={ICON_PATHS[c.icon]} />
                  </svg>
                </span>
                <span className="mz-hcard__text">
                  <strong>{c.title}</strong>
                  <span>{c.body}</span>
                </span>
                <time>{c.time}</time>
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="mz-sticker" onClick={stickerSpin} aria-label="Plans from £5 a month">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id="mz-sticker-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
            </defs>
            <text>
              <textPath href="#mz-sticker-path">from £5 a month · from £5 a month · </textPath>
            </text>
          </svg>
          <span className="mz-sticker__price" aria-hidden="true">
            £5
          </span>
        </button>
      </div>
    </section>
  );
}

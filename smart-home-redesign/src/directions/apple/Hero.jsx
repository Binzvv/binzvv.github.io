import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap.js';
import { useMotion } from '../../lib/motion.js';
import { LINE_FROM, LINE_SPLIT } from './tokens.js';
import { Doorbell } from '../../components/art/Devices.jsx';
import { plans } from '../../lib/content.js';

export default function Hero() {
  const root = useRef(null);
  const { reduced } = useMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const q = gsap.utils.selector(root);
      const mobile = () => window.innerWidth < 800;

      // Load-in: lines rise through a mask, then the device surfaces.
      // Gradient text moves onto each line so it survives the mask wrappers.
      const title = SplitText.create(q('.ap-hero__title'), { ...LINE_SPLIT, linesClass: 'cn-line ap-hero__line' });
      root.current.classList.add('is-split');
      gsap
        .timeline({ defaults: { ease: 'cine' }, delay: 0.1 })
        .from(q('.ap-hero__eyebrow'), { autoAlpha: 0, y: 14, duration: 1.2 })
        .from(title.lines, { yPercent: LINE_FROM, duration: 1.6, stagger: 0.1 }, 0.1)
        .from(q('.ap-hero__lede'), { autoAlpha: 0, y: 18, duration: 1.4 }, 0.5)
        .from(q('.ap-hero__ctas > *'), { autoAlpha: 0, y: 14, duration: 1.2, stagger: 0.08 }, 0.65)
        .from(q('.ap-hero__device'), { autoAlpha: 0, yPercent: 16, duration: 2.4 }, 0.3)
        .from(q('.ap-hero__glow'), { autoAlpha: 0, duration: 2.4 }, 0.8);

      // Scroll: copy steps back, the doorbell rises to centre stage, and
      // the offer resolves around it.
      const wrap = q('.ap-hero__deviceWrap')[0];
      const deviceShift = () => {
        const targetCentre = window.innerHeight * (mobile() ? 0.4 : 0.52);
        return targetCentre - (wrap.offsetTop + wrap.offsetHeight / 2);
      };

      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '+=170%',
            scrub: 0.8,
            pin: q('.ap-hero__stage')[0],
            invalidateOnRefresh: true,
          },
        })
        .to(q('.ap-hero__copy'), { yPercent: -14, autoAlpha: 0, duration: 0.7, ease: 'power1.in' }, 0)
        .to(wrap, { y: deviceShift, scale: () => (mobile() ? 0.62 : 0.88), duration: 1, ease: 'power2.inOut' }, 0)
        .to(q('.ap-hero__glow'), { scale: 1.5, opacity: 1, duration: 1 }, 0.2)
        .to(q('.art-doorbell__led'), { opacity: 1, duration: 0.5 }, 0.6)
        .to(q('.ap-hero__ring'), { keyframes: [{ opacity: 0.5, scale: 1.1, duration: 0.3 }, { opacity: 0, scale: 1.9, duration: 0.5 }] }, 0.7)
        .from(q('.ap-hero__offerTitle > span'), { autoAlpha: 0, y: 40, duration: 0.45, stagger: 0.12, ease: 'power2.out' }, 0.65)
        .from(q('.ap-hero__plan--left'), { autoAlpha: 0, x: () => (mobile() ? 0 : -60), y: () => (mobile() ? 30 : 0), duration: 0.5, ease: 'power2.out' }, 1.05)
        .from(q('.ap-hero__plan--right'), { autoAlpha: 0, x: () => (mobile() ? 0 : 60), y: () => (mobile() ? 30 : 0), duration: 0.5, ease: 'power2.out' }, 1.15)
        .to({}, { duration: 0.35 });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section className={`ap-hero ${reduced ? 'is-static' : 'is-motion'}`} ref={root} aria-labelledby="ap-hero-title">
      <div className="ap-hero__stage">
        <div className="ap-hero__copy">
          <p className="ap-hero__eyebrow">Sky Smart Home</p>
          <h1 className="ap-hero__title" id="ap-hero-title">
            Stay connected
            <br />
            to home.
          </h1>
          <p className="ap-hero__lede">
            A smart doorbell, indoor camera and sensors that work together in one app — so you know what’s
            happening at home, wherever you are.
          </p>
          <div className="ap-hero__ctas">
            <a className="ap-btn" href="#plans">
              Shop Smart Home
            </a>
            <a className="ap-link" href="#doorbell">
              Explore the doorbell
            </a>
          </div>
        </div>

        <div className="ap-hero__deviceWrap" aria-hidden="true">
          <div className="ap-hero__glow" />
          <div className="ap-hero__ring" />
          <Doorbell variant="apple" className="ap-hero__device" />
        </div>

        <div className="ap-hero__offer">
          <h2 className="ap-hero__offerTitle">
            <span>For less.</span> <span className="is-muted">From £5 a month.</span>
          </h2>
          {plans.map((p, i) => (
            <article key={p.id} className={`ap-hero__plan ap-hero__plan--${i === 0 ? 'left' : 'right'}`}>
              <h3>{p.name}</h3>
              <p className="ap-hero__planIncl">{p.includes}</p>
              <p className="ap-hero__planPrice">
                <strong>£{p.monthly}</strong>
                <span>a month</span>
              </p>
              <p className="ap-hero__planUp">£{p.upfront} upfront · {p.detail}</p>
              <a className="ap-link" href="#plans" aria-label={`Choose ${p.name}`}>
                Choose
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

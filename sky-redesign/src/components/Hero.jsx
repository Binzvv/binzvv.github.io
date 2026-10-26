import { useScene, gsap, EASE } from '../lib/motion';
import Glass from './Glass';
import { Chevron } from './Icons';
import Slot from './Slot';
import { ASSETS, SKY } from '../content';

// Stand-in for campaign key art: a layered dawn landscape lit in Sky's
// spectrum. Each layer carries a depth so the scene parallaxes as the
// camera pulls back from the screen.
function HeroScene() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060935" />
          <stop offset="0.42" stopColor="#3420b4" />
          <stop offset="0.66" stopColor="#b5227f" />
          <stop offset="0.82" stopColor="#ff5a36" />
          <stop offset="1" stopColor="#ffb000" />
        </linearGradient>
        <radialGradient id="h-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset="0.25" stopColor="#ffd27a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ff5a36" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#h-sky)" />
      <g data-depth="-0.6">
        <circle cx="800" cy="650" r="330" fill="url(#h-sun)" />
      </g>
      <g data-depth="0.4">
        <path d="M0 640 C 220 560 380 600 560 560 S 900 500 1080 560 S 1420 540 1600 600 V900 H0Z" fill="#43125f" opacity="0.92" />
      </g>
      <g data-depth="0.8">
        <path d="M0 720 C 260 640 420 700 640 660 S 1000 620 1220 680 S 1480 660 1600 690 V900 H0Z" fill="#1d0838" />
      </g>
      <g data-depth="1.4">
        <path d="M0 800 C 300 730 520 790 760 760 S 1180 720 1400 770 S 1560 780 1600 776 V900 H0Z" fill="#06041a" />
      </g>
    </svg>
  );
}

export default function Hero() {
  const ref = useScene((root, { motion, desktop }) => {
    const tv = root.querySelector('.hero-tv');
    const body = tv.querySelector('.glass-body');
    const screen = tv.querySelector('.glass-screen');
    const copy = root.querySelector('[data-copy]');
    const scrim = root.querySelector('[data-scrim]');
    const caption = root.querySelectorAll('[data-caption] > *');
    const glow = root.querySelector('[data-glow]');

    // Layout-space metrics (offset* ignores transforms, so these stay
    // correct while the TV is scaled).
    const originY = () => body.offsetTop + screen.offsetTop + screen.offsetHeight / 2;
    const coverScale = () => Math.max(root.clientWidth / screen.offsetWidth, root.clientHeight / screen.offsetHeight) * 1.02;
    const coverY = () => root.clientHeight / 2 - (tv.offsetTop + originY());

    // Opening frame: the screen fills the viewport.
    const setCover = () => gsap.set(tv, { transformOrigin: `50% ${originY()}px`, scale: coverScale(), y: coverY() });
    setCover();
    gsap.set(caption, { opacity: 0 });
    gsap.set(glow, { opacity: 0 });

    if (!motion) {
      window.addEventListener('resize', setCover);
      return () => window.removeEventListener('resize', setCover);
    }

    // 1. Entrance: the picture comes up like a screen waking, then the
    //    headline rises out of its own line mask.
    const intro = gsap.timeline({ defaults: { ease: EASE.settle } });
    intro
      .fromTo(root.querySelector('[data-scene]'), { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 2.4, transformOrigin: '50% 60%' })
      .from(copy.querySelector('[data-eyebrow]'), { opacity: 0, y: 12, duration: 1 }, 0.55)
      .from(copy.querySelectorAll('[data-line] > span'), { yPercent: 110, duration: 1.3, stagger: 0.09 }, 0.62)
      .from(copy.querySelector('[data-body]'), { opacity: 0, y: 12, duration: 1 }, 1.0)
      .from(copy.querySelector('[data-cta]'), { opacity: 0, scale: 0.96, duration: 0.9 }, 1.15);

    // 2. Pull-back: one continuous camera move from "content" to "product".
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: desktop ? '+=140%' : '+=110%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: () => gsap.set(tv, { transformOrigin: `50% ${originY()}px` }),
      },
    });
    tl.to(copy, { y: -72, opacity: 0, ease: 'power1.in', duration: 0.28 }, 0)
      .to(scrim, { opacity: 0, ease: 'none', duration: 0.3 }, 0)
      .fromTo(tv, { scale: coverScale, y: coverY }, { scale: 1, y: 0, ease: EASE.glide, duration: 1, immediateRender: false }, 0)
      .to(glow, { opacity: 0.55, ease: 'none', duration: 0.45 }, 0.5)
      .to(caption, { opacity: 1, y: 0, startAt: { y: 16 }, ease: 'power2.out', duration: 0.25, stagger: 0.06 }, 0.78)
      .to({}, { duration: 0.25 }); // rest on the finished composition before releasing

    // Depth inside the picture: near layers drift more than far ones.
    root.querySelectorAll('[data-depth]').forEach((g) => {
      tl.to(g, { y: 40 * Number(g.dataset.depth), ease: 'none', duration: 1 }, 0);
    });

    return () => intro.kill();
  });

  return (
    <section ref={ref} id="top" data-nav="dark" aria-labelledby="hero-title" className="on-dark relative h-[100svh] overflow-hidden bg-night text-white">
      <div className="absolute inset-0 isolate flex flex-col items-center justify-center px-4 pt-14 lg:pt-16">
        <Glass
          className="hero-tv w-[92vw] will-change-transform sm:w-[80vw] lg:w-[min(60vw,880px)]"
          label="Sky TV playing on Sky Glass"
        >
          <div data-scene className="absolute inset-0">
            <Slot name="Hero key art" src={ASSETS.hero} className="h-full w-full">
              <HeroScene />
            </Slot>
          </div>
        </Glass>
        <div data-glow aria-hidden="true" className="spectrum-glow pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[40vh] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen" style={{ zIndex: -1 }} />
        <div data-caption className="mt-8 max-w-xl text-center lg:mt-10">
          <p className="t-eyebrow">On Sky Glass, or any TV with Sky Stream.</p>
          <p className="mt-2 text-[17px] leading-[26px] text-white/60 lg:text-[19px] lg:leading-[28px]">
            All you need is broadband of at least 25Mbps.
          </p>
        </div>
      </div>

      <div data-scrim aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />

      <div data-copy className="absolute inset-x-0 bottom-[9svh] px-6 text-center lg:bottom-[11svh]">
        <p data-eyebrow className="t-eyebrow text-white/80">Sky TV</p>
        <h1 id="hero-title" className="t-hero mx-auto mt-3 max-w-[16ch] lg:max-w-none">
          <span data-line className="block overflow-hidden pb-[0.08em]"><span className="inline-block">Goodbye dish.</span></span>
        </h1>
        <p data-body className="t-lead mx-auto mt-4 max-w-[30ch] text-white/80 lg:max-w-none">
          Sky TV, streamed to any TV over Wi‑Fi.
        </p>
        <div data-cta className="mt-8">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            <a href="#tv" className="btn btn-primary w-full max-w-[320px] sm:w-auto">
              Explore Sky TV
            </a>
            <a href={`${SKY}/deals`} className="link">
              <span className="u">See TV deals</span> <Chevron />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

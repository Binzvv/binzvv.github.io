import { useScene, gsap, bgShift, EASE } from '../lib/motion';
import { ASSETS, SKY } from '../content';
import Slot from './Slot';
import { Chevron } from './Icons';

// Stand-in for match photography: a floodlit pitch in perspective.
function Pitch() {
  const far = { y: 470, l: 470, r: 1130 };
  const near = { y: 960, l: -260, r: 1860 };
  const at = (t) => {
    const k = Math.pow(t, 1.7); // perspective: stripes widen toward camera
    return { y: far.y + (near.y - far.y) * k, l: far.l + (near.l - far.l) * k, r: far.r + (near.r - far.r) * k };
  };
  const stripes = Array.from({ length: 12 }, (_, i) => [at(i / 12), at((i + 1) / 12)]);
  const mid = at(0.42);
  const lights = [230, 610, 990, 1370];
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="flood" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.12" stopColor="#eaf6ff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#eaf6ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lights.map((x) => (
        <g key={x}>
          <polygon points={`${x - 6},96 ${x + 6},96 ${x * 0.6 + 480},520 ${x * 0.6 + 300},520`} fill="#ffffff" opacity="0.035" />
          <circle cx={x} cy="96" r="150" fill="url(#flood)" />
        </g>
      ))}
      <g data-pitch>
        {stripes.map(([a, b], i) => (
          <polygon key={i} points={`${a.l},${a.y} ${a.r},${a.y} ${b.r},${b.y} ${b.l},${b.y}`} fill={i % 2 ? '#0c4825' : '#0a3d1f'} />
        ))}
        <g fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2">
          <polygon points={`${far.l + 40},${far.y + 6} ${far.r - 40},${far.y + 6} ${near.r - 300},${near.y} ${near.l + 300},${near.y}`} />
          <line x1={mid.l + 120} y1={mid.y} x2={mid.r - 120} y2={mid.y} />
          <ellipse cx="800" cy={mid.y} rx="150" ry="38" />
        </g>
      </g>
      <rect width="1600" height="900" fill="url(#fade)" />
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#020a06" stopOpacity="0.2" />
        <stop offset="0.75" stopColor="#020a06" stopOpacity="0" />
        <stop offset="1" stopColor="#020a06" stopOpacity="0.85" />
      </linearGradient>
    </svg>
  );
}

export default function Sports() {
  const ref = useScene((root, { motion, desktop }) => {
    const count = root.querySelector('[data-count]');
    const f1 = root.querySelector('[data-f1]');
    if (!motion) return;

    bgShift(root, '#05061a', '#03140b');
    const n = { v: 0 };
    const tick = () => (count.textContent = Math.round(n.v));
    const pitch = root.querySelector('[data-pitch]');

    if (desktop) {
      // One pinned beat: the camera settles on the pitch as the number of
      // live matches counts up, then Formula 1 lands beneath it.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.querySelector('[data-stage]'), start: 'top top', end: '+=120%', pin: true, scrub: 0.6, anticipatePin: 1 },
      });
      tl.fromTo(n, { v: 0 }, { v: 215, ease: 'power2.out', duration: 0.7, onUpdate: tick }, 0)
        .fromTo(pitch, { scale: 1.35, y: 120 }, { scale: 1, y: 0, svgOrigin: '800 700', ease: EASE.glide, duration: 1 }, 0)
        .fromTo(f1, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.25 }, 0.72)
        .to({}, { duration: 0.25 });
    } else {
      const st = { trigger: root, start: 'top 70%', end: 'center 45%', scrub: 0.5 };
      gsap.fromTo(n, { v: 0 }, { v: 215, ease: 'power2.out', onUpdate: tick, scrollTrigger: st });
      gsap.fromTo(pitch, { scale: 1.25 }, { scale: 1, svgOrigin: '800 700', ease: 'none', scrollTrigger: st });
    }
  });

  return (
    <section ref={ref} id="sports" data-nav="dark" aria-labelledby="sports-title" className="on-dark relative bg-[#03140b] text-white">
      <div data-stage className="relative h-[100svh] min-h-[680px] overflow-hidden">
        <Slot name="Sky Sports key art" src={ASSETS.sports} className="absolute inset-0">
          <Pitch />
        </Slot>

        <div className="relative z-10 mx-auto flex h-full max-w-[1180px] flex-col px-6 pb-10 pt-24 lg:px-8 lg:pb-16 lg:pt-32">
          <div>
            <p className="t-eyebrow text-white/70">Sky Sports</p>
            <h2 id="sports-title" className="t-h2 mt-2 max-w-[13ch]">More live Premier League than ever.</h2>
          </div>

          <div className="mt-auto">
            <p className="sr-only">At least 215 live Premier League matches every season.</p>
            <p aria-hidden="true" className="font-headline text-[148px] font-medium leading-[0.9] tracking-[-0.055em] tabular-nums lg:text-[280px]">
              <span data-count>215</span>
            </p>
            <p aria-hidden="true" className="mt-3 max-w-[30ch] text-[18px] leading-[28px] text-white/75 lg:text-[21px] lg:leading-[32px]">
              live Premier League matches every season, at least.
            </p>
          </div>

          <div data-f1 className="mt-10 flex flex-col gap-6 border-t border-white/15 pt-8 lg:mt-14 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="t-h3">Every Formula 1 race, live.</p>
              <p className="mt-2 text-[16px] leading-[24px] text-white/60">Sky Sports F1 is the UK home of Formula 1 until 2034.</p>
            </div>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
              <a href={`${SKY}/deals/sports`} className="btn btn-on-dark w-full max-w-[320px] sm:w-auto">
                See sports deals
              </a>
              <a href={`${SKY}/deals/sports`} className="link">
                <span className="u">Explore Sky Sports</span> <Chevron />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

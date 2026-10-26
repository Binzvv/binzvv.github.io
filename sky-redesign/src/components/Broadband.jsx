import { useScene, gsap, bgShift } from '../lib/motion';
import { ASSETS, SKY } from '../content';
import Slot from './Slot';
import { Chevron } from './Icons';

const HUB = { x: 240, y: 352 };
const RINGS = 5;
const STEP = 62;
const MAX_R = 30 + (RINGS - 1) * STEP;
// Devices around the house; each lights when the leading ring reaches it.
const DEVICES = [
  { x: 120, y: 330 },
  { x: 372, y: 312 },
  { x: 300, y: 250 },
  { x: 150, y: 214 },
  { x: 340, y: 186 },
  { x: 236, y: 134 },
];

function House() {
  return (
    <svg viewBox="0 0 480 400" className="h-full w-full" role="img" aria-label="Wi‑Fi from the Sky hub reaching every room of the house">
      <defs>
        <clipPath id="bb-house">
          <path d="M40 392 V176 L240 32 L440 176 V392Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#bb-house)">
        {Array.from({ length: RINGS }, (_, i) => (
          <circle key={i} data-ring cx={HUB.x} cy={HUB.y} r={30 + i * STEP} fill="none" stroke="#fff" strokeOpacity={0.55 - i * 0.08} strokeWidth="1.5" />
        ))}
      </g>
      <g fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M40 392 V176 L240 32 L440 176 V392 Z" />
        <path d="M40 272 H440 M232 272 V392 M262 176 V272 M40 176 H440" />
      </g>
      {DEVICES.map((d, i) => (
        <g key={i} data-device data-dist={Math.hypot(d.x - HUB.x, d.y - HUB.y)}>
          <circle cx={d.x} cy={d.y} r="14" fill="#ffb000" opacity="0.18" />
          <circle cx={d.x} cy={d.y} r="4.5" fill="#fff" />
        </g>
      ))}
      <rect x={HUB.x - 16} y={HUB.y - 7} width="32" height="14" rx="5" fill="#fff" />
    </svg>
  );
}

// The page dims to night, then coverage fills the home from the hub
// outward, lighting each device as it arrives.
export default function Broadband() {
  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    bgShift(root, '#fafafd', '#0c1b87');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.querySelector('[data-house]'), start: 'top 75%', end: 'bottom 60%', scrub: 0.5 },
    });
    root.querySelectorAll('[data-ring]').forEach((c, i) => {
      tl.fromTo(c, { attr: { r: 0 } }, { attr: { r: 30 + i * STEP }, ease: 'none', duration: (30 + i * STEP) / MAX_R }, 0);
    });
    root.querySelectorAll('[data-device]').forEach((d) => {
      tl.fromTo(d, { opacity: 0.15 }, { opacity: 1, duration: 0.06, ease: 'none' }, Number(d.dataset.dist) / MAX_R);
    });
  });

  return (
    <section ref={ref} id="broadband" data-nav="dark" aria-labelledby="bb-title" className="on-dark bg-surface-blue px-6 py-24 text-white lg:px-8 lg:py-40">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <p className="t-eyebrow text-white/70">Sky Broadband</p>
          <h2 id="bb-title" className="t-h2 mt-2">Full Fibre. Up to 5Gbps.</h2>
          <p className="t-lead mt-4 max-w-[34ch] text-white/75">Gigafast+ comes with a Wi‑Fi 7 hub, so every room in the house keeps up.</p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
            <a href={`${SKY}/broadband`} className="btn btn-on-dark w-full max-w-[320px] sm:w-auto">
              Check availability
            </a>
            <a href={`${SKY}/broadband`} className="link">
              <span className="u">Explore broadband</span> <Chevron />
            </a>
          </div>
          <p className="t-legal mt-10 max-w-[48ch] text-white/55">
            Gigafast+ 2.5Gbps and 5Gbps are available in selected CityFibre areas. Speeds vary by location and connection.
          </p>
        </div>
        <Slot name="Broadband photography" src={ASSETS.broadband} className="mx-auto aspect-[6/5] w-full max-w-[560px] lg:col-span-6">
          <div data-house className="h-full w-full">
            <House />
          </div>
        </Slot>
      </div>
    </section>
  );
}

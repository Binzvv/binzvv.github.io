import { useScene, gsap } from '../lib/motion';
import { SKY } from '../content';
import { Chevron } from './Icons';

// Two tiles, two ideas. Each visual is a diagram of its promise:
// Wi‑Fi reaching every room; unused data filling the Piggybank.
export default function Home() {
  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    gsap.fromTo(
      root.querySelectorAll('[data-ring]'),
      { attr: { r: 8 }, opacity: 0 },
      {
        // Rings grow out from the router until they reach every room.
        attr: { r: (i) => 40 + i * 44 },
        opacity: (i) => 0.9 - i * 0.18,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: { trigger: root.querySelector('[data-bb]'), start: 'top 75%', end: 'center 45%', scrub: 0.5 },
      },
    );
    gsap.fromTo(
      root.querySelector('[data-fill]'),
      { scaleY: 0.12 },
      { scaleY: 0.72, ease: 'none', scrollTrigger: { trigger: root.querySelector('[data-mob]'), start: 'top 75%', end: 'center 45%', scrub: 0.5 } },
    );
    gsap.from(root.querySelectorAll('[data-tile]'), {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: { trigger: root.querySelector('[data-tiles]'), start: 'top 85%', once: true },
    });
  });

  return (
    <section ref={ref} id="home" data-nav="light" aria-labelledby="home-title" className="bg-flat px-4 py-24 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-[1180px]">
        <div className="text-center">
          <h2 id="home-title" className="t-h2 text-ink">The rest of your home, sorted.</h2>
        </div>

        <div data-tiles className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-2">
          <article data-tile data-bb className="on-dark relative flex min-h-[540px] flex-col overflow-hidden rounded-xl bg-[linear-gradient(180deg,#0c1b87,#05061a)] px-6 pt-12 text-center text-white lg:min-h-[640px] lg:rounded-2xl lg:pt-16">
            <p className="t-eyebrow text-white/70">Sky Broadband</p>
            <h3 className="t-h3 mx-auto mt-2 max-w-[16ch]">Full Fibre for the whole home.</h3>
            <div className="mt-6 flex justify-center gap-6">
              <a href={`${SKY}/broadband`} className="link">
                <span className="u">Check availability</span> <Chevron />
              </a>
            </div>
            <svg viewBox="0 0 320 240" className="mx-auto mt-auto w-full max-w-[420px]" aria-hidden="true" data-slot="Broadband imagery">
              <defs>
                <clipPath id="house">
                  <path d="M40 240 V112 L160 30 L280 112 V240Z" />
                </clipPath>
              </defs>
              <g clipPath="url(#house)">
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle key={i} data-ring cx="160" cy="214" r={40 + i * 44} fill="none" stroke="url(#ringGrad)" strokeWidth="2" />
                ))}
              </g>
              <linearGradient id="ringGrad" x1="0" x2="1">
                <stop offset="0" stopColor="#4b2bff" />
                <stop offset="0.5" stopColor="#ff2d7a" />
                <stop offset="1" stopColor="#ffb000" />
              </linearGradient>
              <path d="M40 240 V112 L160 30 L280 112 V240" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="146" y="208" width="28" height="12" rx="4" fill="white" />
            </svg>
          </article>

          <article data-tile data-mob className="relative flex min-h-[540px] flex-col overflow-hidden rounded-xl bg-white px-6 pt-12 text-center shadow-[0_2px_12px_rgb(0_0_0/0.06)] lg:min-h-[640px] lg:rounded-2xl lg:pt-16">
            <p className="t-eyebrow text-grey-70">Sky Mobile</p>
            <h3 className="t-h3 mx-auto mt-2 max-w-[16ch] text-ink">Keep the data you don’t use.</h3>
            <p className="mx-auto mt-3 max-w-[30ch] text-[18px] leading-[28px] text-grey-70">Unused data rolls into your Piggybank, ready for when you need it.</p>
            <div className="mt-6 flex justify-center">
              <a href={`${SKY}/mobile`} className="link">
                <span className="u">Explore Sky Mobile</span> <Chevron />
              </a>
            </div>
            <div className="relative mx-auto mt-auto h-[260px] pt-10 w-[200px] lg:h-[320px] lg:w-[240px]" aria-hidden="true" data-slot="Handset photography">
              <div className="absolute inset-x-0 top-10 h-[120%] rounded-t-[40px] border-[10px] border-b-0 border-[#1c1d21] bg-[#f4f5fa] p-5">
                <p className="text-left text-[13px] font-medium text-ink">Piggybank</p>
                <div className="relative mt-3 h-[70%] overflow-hidden rounded-[18px] bg-grey-5">
                  <div data-fill className="absolute inset-0 origin-bottom bg-[linear-gradient(0deg,#4b2bff,#ff2d7a_70%,#ffb000)]" style={{ transform: 'scaleY(0.72)' }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

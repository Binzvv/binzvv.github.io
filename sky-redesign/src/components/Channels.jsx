import { useRef, useState } from 'react';
import { useScene, gsap, EASE } from '../lib/motion';
import { CHANNELS } from '../content';
import { Arrow, Chevron } from './Icons';

// Desktop: one row of panels; the one you point at, or tab to, opens up.
// Mobile: a swipeable row with explicit previous / next controls.
export default function Channels() {
  const [active, setActive] = useState(0);
  const railRef = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    gsap.fromTo(
      root.querySelectorAll('[data-panel]'),
      { clipPath: 'inset(100% 0% 0% 0% round 24px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 24px)',
        duration: 1.2,
        ease: EASE.settle,
        stagger: 0.07,
        scrollTrigger: { trigger: root.querySelector('[data-panels]'), start: 'top 78%', once: true },
      },
    );
  });

  const step = (dir) => {
    const rail = railRef.current;
    const card = rail.firstElementChild;
    rail.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: 'smooth' });
  };
  const onRail = () => {
    const r = railRef.current;
    setEdge({ start: r.scrollLeft < 8, end: r.scrollLeft + r.clientWidth > r.scrollWidth - 8 });
  };

  return (
    <section ref={ref} id="channels" data-nav="dark" aria-labelledby="channels-title" className="on-dark bg-night py-24 text-white lg:py-40">
      <div className="mx-auto max-w-[1180px] px-6 text-center lg:px-8">
        <p className="t-eyebrow text-white/70">Sky TV</p>
        <h2 id="channels-title" className="t-h2 mt-2">Add what you love.</h2>
        <p className="t-lead mx-auto mt-4 max-w-[40ch] text-white/70">
          Start with Sky Essential TV, with Sky Atlantic, Netflix and discovery+. Then add the rest.
        </p>
      </div>

      {/* Desktop panels */}
      <ul data-panels className="mx-auto mt-16 hidden h-[560px] max-w-[1280px] gap-3 px-8 lg:flex">
        {CHANNELS.map((c, i) => {
          const on = active === i;
          return (
            <li
              key={c.id}
              data-panel
              onMouseEnter={() => setActive(i)}
              className="relative overflow-hidden rounded-xl transition-[flex-grow] duration-700 ease-sky"
              style={{ flexGrow: on ? 5 : 1, flexBasis: 0 }}
              data-slot={`${c.name} key art`}
            >
              <div aria-hidden="true" className={`absolute inset-0 ${c.art} transition-transform duration-1000 ease-sky ${on ? 'scale-100' : 'scale-110'}`} />
              <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-700 ${on ? 'opacity-100' : 'opacity-60'}`} />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <h3 className={`font-headline font-medium tracking-[-0.01em] transition-all duration-700 ease-sky ${on ? 'text-[40px] leading-[48px]' : 'text-[20px] leading-[26px]'}`}>
                  {c.name}
                </h3>
                <div className={`grid transition-[grid-template-rows,opacity] duration-700 ease-sky ${on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <p className="mt-3 max-w-[36ch] text-[18px] leading-[28px] text-white/80">{c.line}</p>
                    <a href="#deals" onFocus={() => setActive(i)} className="link mt-5">
                      <span className="u">See {c.name} deals</span> <Chevron />
                    </a>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Mobile rail */}
      <div className="mt-12 lg:hidden">
        <ul
          ref={railRef}
          onScroll={onRail}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6"
          aria-label="Channels and packs"
        >
          {CHANNELS.map((c) => (
            <li key={c.id} className="relative h-[440px] w-[82%] shrink-0 snap-start overflow-hidden rounded-xl" data-slot={`${c.name} key art`}>
              <div aria-hidden="true" className={`absolute inset-0 ${c.art}`} />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="t-h3">{c.name}</h3>
                <p className="mt-2 text-[17px] leading-[26px] text-white/80">{c.line}</p>
                <a href="#deals" className="link mt-4">
                  <span className="u">See {c.name} deals</span> <Chevron />
                </a>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-3 px-6">
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => step(d)}
              disabled={d < 0 ? edge.start : edge.end}
              aria-label={d < 0 ? 'Previous' : 'Next'}
              className="btn h-11 min-h-0 w-11 bg-white/10 px-0 text-white transition-opacity hover:bg-white/20 disabled:opacity-30"
            >
              <Arrow dir={d < 0 ? 'left' : 'right'} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

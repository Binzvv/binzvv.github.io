import { useRef } from 'react';
import gsap from 'gsap';
import SplitText from '../components/SplitText.jsx';
import BrowserWindow from '../components/BrowserWindow.jsx';
import { useReducedMotion, useSlideIntro } from '../lib/hooks.js';

const MOCK_W = 800;
const MOCK_MAX_H = 500;

const VIEWS = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'product', label: 'Product' },
];

function Mockup({ id, label, number, viewport, onOpen, reduced }) {
  const boxRef = useRef(null);
  const scrollerRef = useRef(null);
  const arrowRef = useRef(null);
  const preview = useRef(null);

  // The thumbnail is the real window at viewport size, scaled down.
  const scale = MOCK_W / viewport.w;
  const height = Math.min(Math.round(MOCK_W * (viewport.h / viewport.w)), MOCK_MAX_H);

  const hover = (on) => {
    if (reduced) return;
    gsap.to(boxRef.current, { y: on ? -8 : 0, duration: 0.7, ease: 'power3.out' });
    gsap.to(arrowRef.current, { x: on ? 6 : 0, duration: 0.5, ease: 'power3.out' });
    preview.current?.kill();
    preview.current = gsap.to(scrollerRef.current, {
      scrollTop: on ? 380 : 0,
      duration: on ? 5 : 1.1,
      ease: on ? 'sine.inOut' : 'power3.out',
    });
  };

  const open = () => {
    preview.current?.kill();
    const scrollTop = scrollerRef.current.scrollTop;
    onOpen({ id, el: boxRef.current, scrollTop });
    // Reset behind the overlay so the thumbnail is at rest when we return.
    scrollerRef.current.scrollTop = 0;
    gsap.set([boxRef.current, arrowRef.current], { y: 0, x: 0 });
  };

  return (
    <button
      type="button"
      onClick={open}
      onMouseEnter={() => hover(true)}
      onMouseLeave={() => hover(false)}
      onFocus={() => hover(true)}
      onBlur={() => hover(false)}
      aria-label={`Open ${label} experience`}
      className="mock group block text-left text-ink"
    >
      <div
        ref={boxRef}
        className="relative overflow-hidden rounded-[18px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_40px_80px_-48px_rgba(0,0,0,0.45)]"
        style={{ width: MOCK_W, height }}
      >
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{ width: viewport.w, height: viewport.h, transform: `scale(${scale})` }}
          aria-hidden="true"
        >
          <BrowserWindow site={id} mini scrollerRef={scrollerRef} />
        </div>
      </div>
      <div className="mock-label mt-9 flex items-baseline justify-between">
        <span className="flex items-baseline gap-5">
          <span className="text-[18px] tabular-nums text-black/35">{number}</span>
          <span className="text-[44px] font-semibold tracking-[-0.035em]">{label}</span>
        </span>
        <span className="flex items-center gap-3 text-[18px] text-black/45 transition-colors duration-300 group-hover:text-ink">
          Open
          <span ref={arrowRef} aria-hidden="true">
            →
          </span>
        </span>
      </div>
    </button>
  );
}

export default function Experience({ active, viewport, onOpen }) {
  const root = useRef(null);
  const reduced = useReducedMotion();

  useSlideIntro(
    active,
    root,
    () => {
      if (reduced) {
        gsap.from('[data-fade]', { opacity: 0, duration: 0.6, stagger: 0.1 });
        return;
      }
      gsap
        .timeline({ delay: 0.4 })
        .from('.eyebrow', { opacity: 0, duration: 0.8 }, 0)
        .from('.headline .split-word', { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.07 }, 0)
        .from('.mock', { y: 160, opacity: 0, duration: 1.7, ease: 'expo.out', stagger: 0.14 }, 0.45)
        .from('.mock-label', { opacity: 0, duration: 0.9, stagger: 0.14 }, 1.2)
        .from('.cue', { opacity: 0, duration: 0.8 }, 1.8);
    },
    [reduced],
  );

  return (
    <div ref={root} className="absolute inset-0 bg-white text-ink">
      <p data-fade className="eyebrow absolute left-[120px] top-[96px] text-[20px] text-black/40">
        <span className="tabular-nums">03</span>
        <span className="mx-3">—</span>The experience
      </p>

      <h2
        data-fade
        className="headline absolute left-[120px] top-[150px] text-[112px] font-semibold leading-none tracking-[-0.05em]"
      >
        <SplitText text="From discovery to product." by="word" />
      </h2>

      <div data-fade className="absolute inset-x-[120px] top-[340px] flex justify-between">
        {VIEWS.map((v, i) => (
          <Mockup
            key={v.id}
            {...v}
            number={`0${i + 1}`}
            viewport={viewport}
            onOpen={onOpen}
            reduced={reduced}
          />
        ))}
      </div>

      <p data-fade className="cue absolute bottom-[64px] right-[120px] text-[17px] text-black/40">
        Select a view to explore
      </p>
    </div>
  );
}

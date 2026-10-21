import { useRef } from 'react';
import gsap from 'gsap';
import SplitText from '../components/SplitText.jsx';
import { useReducedMotion, useSlideIntro } from '../lib/hooks.js';

const COLUMNS = [
  { label: 'Brand', text: 'Brand wanted inspiration.' },
  { label: 'Digital', text: 'Digital wanted information.' },
];

export default function Challenge({ active }) {
  const root = useRef(null);
  const reduced = useReducedMotion();

  useSlideIntro(
    active,
    root,
    () => {
      if (reduced) {
        gsap.from('[data-fade]', { opacity: 0, duration: 0.6, stagger: 0.12 });
        return;
      }
      // The headline lands near centre, then the page "scrolls" up as the
      // columns travel in at different speeds, like parallax layers.
      gsap
        .timeline({ delay: 0.4 })
        .from('.eyebrow', { opacity: 0, duration: 0.8 }, 0)
        .from('.headline .split-word', { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.09 }, 0)
        .from('.page', { y: 230, duration: 1.9, ease: 'power3.inOut' }, 1.0)
        .from('.col', { y: 420, duration: 2.0, ease: 'power3.out', stagger: 0.16 }, 1.05)
        .from('.col-text', { opacity: 0, duration: 1.2, ease: 'power1.out', stagger: 0.16 }, 1.25)
        .from('.rule', { scaleX: 0, duration: 1.4, ease: 'expo.inOut', stagger: 0.16 }, 1.5)
        .from('.col-label', { opacity: 0, y: 8, duration: 0.8, stagger: 0.16 }, 1.9)
        .from('.finale .split-char', { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.035 }, 2.6);
    },
    [reduced],
  );

  return (
    <div ref={root} className="absolute inset-0 bg-paper text-ink">
      <p data-fade className="eyebrow absolute left-[120px] top-[96px] text-[20px] text-black/40">
        <span className="tabular-nums">02</span>
        <span className="mx-3">—</span>The challenge
      </p>

      <div className="page absolute inset-x-[120px] top-[170px]">
        <h2 data-fade className="headline text-[152px] font-semibold leading-[0.94] tracking-[-0.05em]">
          <SplitText text="Inspiration" by="word" />
          <br />
          <SplitText text="meets information." by="word" />
        </h2>

        <div className="mt-[108px] grid grid-cols-2 gap-[120px]">
          {COLUMNS.map(({ label, text }) => (
            <div data-fade key={label} className="col">
              <div className="rule h-px origin-left bg-black/25" />
              <p className="col-label mt-6 text-[19px] text-black/45">{label}</p>
              <p className="col-text mt-5 max-w-[640px] text-[60px] font-medium leading-[1.04] tracking-[-0.035em]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p
        data-fade
        className="finale absolute bottom-[130px] right-[120px] text-[96px] font-semibold leading-none tracking-[-0.05em]"
      >
        <SplitText text="Both mattered." />
      </p>
    </div>
  );
}

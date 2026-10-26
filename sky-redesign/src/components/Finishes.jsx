import { useEffect, useRef, useState } from 'react';
import { useScene, gsap, EASE, prefersReducedMotion } from '../lib/motion';
import { FINISHES, SIZES, SKY } from '../content';
import Glass from './Glass';
import { Chevron } from './Icons';

function HomeScreen() {
  // Neutral "standby" picture so the finish, not the content, is the subject.
  return (
    <div className="absolute inset-0" style={{ background: 'radial-gradient(90% 80% at 70% 30%, #4b2bff 0%, transparent 60%), radial-gradient(80% 70% at 20% 90%, #ff2d7a 0%, transparent 60%), #07081f' }} />
  );
}

// Explains rather than decorates: the TV changes physical size against
// a fixed sideboard, and the room takes on a hint of the chosen finish.
export default function Finishes() {
  const [finish, setFinish] = useState(FINISHES[0]);
  const [size, setSize] = useState(55);
  const tvRef = useRef(null);

  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    // Lights come up as the section arrives: the night of the previous
    // section gives way to a daylit room.
    gsap.fromTo(
      root,
      { backgroundColor: '#05061a' },
      { backgroundColor: '#fafafd', ease: 'none', scrollTrigger: { trigger: root, start: 'top 90%', end: 'top 25%', scrub: true } },
    );
    gsap.fromTo(
      root.querySelector('[data-stage]'),
      { scale: 0.94, opacity: 0.4 },
      { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top 80%', end: 'top 10%', scrub: true } },
    );
  });

  // Physical size change, scaled from the base of the TV so it stays
  // standing on the sideboard.
  useEffect(() => {
    gsap.to(tvRef.current, {
      scale: size / 65,
      duration: prefersReducedMotion() ? 0 : 0.9,
      ease: EASE.settle,
      transformOrigin: '50% 100%',
    });
  }, [size]);

  return (
    <section ref={ref} id="glass" data-nav="light" aria-labelledby="glass-title" className="bg-flat px-4 py-24 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-[1180px] text-center">
        <p className="t-eyebrow text-grey-70">Sky Glass</p>
        <h2 id="glass-title" className="t-h2 mx-auto mt-2 max-w-[14ch] text-ink lg:max-w-none">Made to fit your room.</h2>
        <p className="t-lead mx-auto mt-4 max-w-[34ch] text-grey-70">Three sizes and three finishes, each with the speakers built in.</p>

        <div
          data-stage
          className="relative mx-auto mt-12 h-[300px] overflow-hidden rounded-xl transition-colors duration-700 ease-sky sm:h-[420px] lg:mt-16 lg:h-[560px] lg:rounded-2xl"
          style={{ backgroundColor: finish.wall }}
          data-slot="Room photography"
        >
          {/* soft window light */}
          <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(70% 90% at 15% 0%, rgb(255 255 255 / 0.85), transparent 60%)' }} />
          {/* floor */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-b from-black/[0.06] to-black/[0.02]" />
          {/* sideboard */}
          <div aria-hidden="true" className="absolute bottom-[18%] left-1/2 h-[9%] w-[64%] -translate-x-1/2 rounded-t-[6px] bg-[#c9c3ba] shadow-[0_18px_30px_-18px_rgb(0_0_0/0.45)] lg:w-[58%]" />
          <div className="absolute bottom-[27%] left-1/2 w-[78%] -translate-x-1/2 lg:w-[62%]">
            <div ref={tvRef} style={{ transform: `scale(${55 / 65})`, transformOrigin: '50% 100%' }}>
              <Glass finish={finish.hex} label={`Sky Glass, ${size} inch, in ${finish.name}`}>
                <HomeScreen />
              </Glass>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-6 lg:mt-10 lg:flex-row lg:justify-center lg:gap-12">
          <fieldset>
            <legend className="sr-only">Finish</legend>
            <div className="flex flex-wrap justify-center gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={finish.id === f.id}
                  onClick={() => setFinish(f)}
                  className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] transition-[border-color,box-shadow] duration-300 ease-sky ${
                    finish.id === f.id ? 'border-primary font-medium shadow-[0_0_0_1px_var(--primary)]' : 'border-grey-20 hover:shadow-[0_0_0_4px_rgb(0_15_245/0.12)]'
                  }`}
                >
                  <i className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: f.hex }} />
                  {f.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="sr-only">Screen size</legend>
            <div className="relative inline-flex rounded-full bg-grey-5 p-1">
              {/* sliding thumb */}
              <span
                aria-hidden="true"
                className="absolute bottom-1 top-1 w-[calc((100%-8px)/3)] rounded-full bg-white shadow-[0_1px_4px_rgb(0_0_0/0.12)] transition-transform duration-500 ease-sky"
                style={{ transform: `translateX(${SIZES.indexOf(size) * 100}%)` }}
              />
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={`relative h-10 w-[76px] rounded-full text-[15px] transition-colors duration-300 ${size === s ? 'font-medium text-ink' : 'text-grey-70 hover:text-ink'}`}
                >
                  {s}″
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <p className="mt-4 text-[15px] text-grey-70" aria-live="polite">
          {size} inch in {finish.name}
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <a href={`${SKY}/glass`} className="btn btn-primary w-full max-w-[320px] sm:w-auto">
            Shop Sky Glass
          </a>
          <a href={`${SKY}/glass`} className="link">
            <span className="u">Compare models</span> <Chevron />
          </a>
        </div>
      </div>
    </section>
  );
}

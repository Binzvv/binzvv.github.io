import { useState } from 'react';
import { useScene, gsap, EASE, prefersReducedMotion } from '../lib/motion';
import { OS_STEPS } from '../content';
import Glass from './Glass';

// Schematic screens. They explain each feature; they are not Sky OS
// screenshots (see asset slots). Sizes use container units so they
// scale with the screen.
const Poster = ({ c, className = '' }) => <div className={`aspect-[2/3] rounded-[0.8cqw] ${c} ${className}`} />;

function PlaylistScreen() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-[3cqw] bg-[#07081f] px-[6cqw]">
      <p className="text-[2.6cqw] font-medium text-white">Playlist</p>
      <div className="flex gap-[1.6cqw]">
        {['poster-a', 'poster-b', 'poster-c', 'poster-d'].map((c) => (
          <Poster key={c} c={c} className="w-[14cqw]" />
        ))}
        <div data-added className="relative w-[14cqw]">
          <Poster c="poster-e" className="w-full ring-[0.3cqw] ring-white" />
          <span className="absolute -right-[1cqw] -top-[1cqw] flex h-[3.6cqw] w-[3.6cqw] items-center justify-center rounded-full bg-white text-[2.4cqw] font-semibold text-night">+</span>
        </div>
      </div>
      <div className="h-[0.5cqw] w-[40cqw] overflow-hidden rounded-full bg-white/20">
        <div data-progress className="h-full w-[62%] origin-left rounded-full bg-white" />
      </div>
    </div>
  );
}

function VoiceScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3cqw] bg-[radial-gradient(60%_60%_at_50%_50%,#1b1470,#07081f)]">
      <div className="flex h-[8cqw] items-center gap-[0.9cqw]" aria-hidden="true">
        {[0.5, 0.8, 1, 0.7, 0.95, 0.6, 0.4].map((h, i) => (
          <span key={i} className="wave-bar w-[0.9cqw] rounded-full bg-white" style={{ height: `${h * 8}cqw`, animationDelay: `${i * 0.09}s` }} />
        ))}
      </div>
      <p className="text-[3cqw] font-medium text-white">“Hello Sky, find me a comedy”</p>
    </div>
  );
}

function AdjustScreen() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#3420b4_0%,#b5227f_55%,#ff5a36_80%,#ffb000_100%)]" />
      {/* the unadjusted picture, wiped away by the sweep */}
      <div data-before className="absolute inset-0 origin-right bg-[#0b0b1d]/55" style={{ transform: 'scaleX(0.5)' }} />
      <div data-sweep className="absolute inset-y-0 left-1/2 w-[0.3cqw] bg-white shadow-[0_0_2cqw_rgb(255_255_255/0.9)]" />
      <p className="absolute bottom-[4cqw] right-[4cqw] rounded-full bg-black/40 px-[1.6cqw] py-[0.6cqw] text-[1.8cqw] text-white backdrop-blur">Adjusted for your room</p>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2.4cqw] bg-[#07081f]">
      <svg viewBox="0 0 48 36" className="w-[12cqw]" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path data-arc d="M4 12a30 30 0 0 1 40 0" />
        <path data-arc d="M10 19a21 21 0 0 1 28 0" />
        <path data-arc d="M16.5 26a11.5 11.5 0 0 1 15 0" />
        <circle cx="24" cy="32" r="2" fill="white" stroke="none" />
      </svg>
      <p className="text-[2.8cqw] font-medium text-white">Connected to Wi‑Fi</p>
    </div>
  );
}

const SCREENS = { playlist: PlaylistScreen, voice: VoiceScreen, adjust: AdjustScreen, nodish: SetupScreen };

function StepText({ step, i }) {
  return (
    <>
      <p className="text-[15px] font-medium tabular-nums text-white/50">0{i + 1}</p>
      <h3 className="t-h3 mt-3">{step.title}</h3>
      <p className="t-lead mt-4 text-white/70">{step.body}</p>
      {step.legal && <p className="t-legal mt-4 text-white/50">{step.legal}</p>}
    </>
  );
}

export default function SkyOS() {
  const [active, setActive] = useState(0);

  const ref = useScene((root, { motion, desktop }) => {
    if (!motion || !desktop) return;
    const pinned = root.querySelector('[data-pinned]');
    const texts = pinned.querySelectorAll('[data-step-text]');
    const screens = pinned.querySelectorAll('[data-step-screen]');
    const n = OS_STEPS.length;

    gsap.set([...texts].slice(1), { opacity: 0, y: 24 });
    gsap.set([...screens].slice(1), { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: EASE.glide },
      scrollTrigger: {
        trigger: pinned,
        start: 'top top',
        end: `+=${(n - 1) * 85 + 40}%`,
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        snap: { snapTo: 'labels', duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: EASE.glide },
        onUpdate: (self) => {
          const i = Math.min(n - 1, Math.round(self.progress * tl.duration()));
          setActive((a) => (a === i ? a : i));
        },
      },
    });

    tl.addLabel('s0', 0);
    // Step 0 detail: the new title lands in the playlist.
    tl.from(screens[0].querySelector('[data-added]'), { x: '-30cqw', opacity: 0, duration: 0.45, ease: EASE.settle }, 0);
    tl.from(screens[0].querySelector('[data-progress]'), { scaleX: 0, duration: 0.5 }, 0.1);

    for (let i = 1; i < n; i++) {
      const at = i - 0.5;
      tl.to(texts[i - 1], { opacity: 0, y: -24, duration: 0.3 }, at)
        .to(texts[i], { opacity: 1, y: 0, duration: 0.35 }, at + 0.15)
        .to(screens[i - 1], { opacity: 0, scale: 1.03, duration: 0.35 }, at)
        .fromTo(screens[i], { scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.4 }, at + 0.05)
        .addLabel(`s${i}`, i);
    }
    // Step details tied to their own stretch of scroll.
    tl.fromTo(screens[2].querySelector('[data-sweep]'), { xPercent: 0, left: '0%' }, { left: '100%', duration: 0.7, ease: 'power1.inOut' }, 1.75)
      .fromTo(screens[2].querySelector('[data-before]'), { scaleX: 1 }, { scaleX: 0, duration: 0.7, ease: 'power1.inOut' }, 1.75)
      .from(screens[3].querySelectorAll('[data-arc]'), { opacity: 0.15, duration: 0.2, stagger: { each: 0.12, from: 'end' } }, 2.7)
      .to({}, { duration: 0.3 });

    // Expose scroll positions for the step buttons.
    root._st = tl.scrollTrigger;
    return () => delete root._st;
  });

  const goTo = (i) => {
    const st = ref.current?._st;
    if (!st) return;
    // Step labels sit at whole seconds on the timeline.
    const p = i / st.animation.duration();
    window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section ref={ref} id="sky-os" data-nav="dark" aria-labelledby="os-title" className="on-dark bg-night text-white">
      <div className="mx-auto max-w-[1180px] px-6 pt-24 text-center lg:px-8 lg:pt-40">
        <p className="t-eyebrow text-white/70">Sky OS</p>
        <h2 id="os-title" className="t-h2 mx-auto mt-2 max-w-[14ch] lg:max-w-none">Made for the way you watch.</h2>
      </div>

      {/* Desktop with motion: one pinned stage, four states. */}
      <div data-pinned className="hidden h-[100svh] items-center lg:motion-safe:flex">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-12 items-center gap-8 px-8">
          <div className="col-span-5 pr-8">
            <div className="relative h-[300px]">
              {OS_STEPS.map((s, i) => (
                <div key={s.id} data-step-text className="absolute inset-x-0 top-0" aria-hidden={active !== i}>
                  <StepText step={s} i={i} />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2" role="group" aria-label="Sky OS features">
              {OS_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show feature ${i + 1}: ${s.title}`}
                  aria-current={active === i ? 'step' : undefined}
                  className="group relative flex h-8 items-center"
                >
                  <span className={`block h-[3px] rounded-full transition-all duration-500 ease-sky ${active === i ? 'w-10 bg-white' : 'w-5 bg-white/30 group-hover:bg-white/60'}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-7">
            <Glass finish="#4a4c50" stand={false} slot="Sky OS screen captures" screenClass="[container-type:inline-size]">
              {OS_STEPS.map((s) => {
                const Screen = SCREENS[s.id];
                return (
                  <div key={s.id} data-step-screen className="absolute inset-0">
                    <Screen />
                  </div>
                );
              })}
            </Glass>
          </div>
        </div>
      </div>

      {/* Mobile, and reduced motion: a calm stacked sequence, no pinning. */}
      <ol className="mx-auto max-w-[640px] space-y-20 px-6 pb-24 pt-14 lg:motion-safe:hidden">
        {OS_STEPS.map((s, i) => {
          const Screen = SCREENS[s.id];
          return (
            <li key={s.id}>
              <Glass finish="#4a4c50" stand={false} screenClass="[container-type:inline-size]">
                <Screen />
              </Glass>
              <div className="mt-8">
                <StepText step={s} i={i} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

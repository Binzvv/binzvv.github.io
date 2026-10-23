import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitText from '../components/SplitText.jsx';
import { useReducedMotion, useSlideIntro } from '../lib/hooks.js';

function DevicePlaceholder() {
  return (
    <div className="device absolute right-[170px] top-[64px] h-[480px] w-[380px]">
      <div className="device-float absolute inset-0">
        <div className="absolute inset-x-[64px] bottom-[96px] top-0 overflow-hidden rounded-[68px] bg-[#0F0F0F] ring-1 ring-white/[0.07]">
          <div className="absolute inset-x-[56px] top-0 h-px bg-white/25" />
          <div className="absolute inset-[22px] flex items-center justify-center rounded-[52px] bg-[#060606] ring-1 ring-white/[0.04]">
            <span className="led block h-[3px] w-[56px] rounded-full bg-white/80" />
          </div>
          <div className="sweep absolute -top-1/4 left-0 h-[150%] w-[38%] -skew-x-[14deg] bg-white/[0.035]" />
        </div>
        <div className="glow absolute bottom-[60px] left-1/2 h-[18px] w-[240px] -translate-x-1/2 rounded-[50%] bg-white/[0.07] blur-xl" />
      </div>
      <span className="absolute bottom-0 left-[64px] text-[13px] uppercase tracking-[0.2em] text-white/30">
        Product image — placeholder
      </span>
    </div>
  );
}

export default function Opening({ active }) {
  const root = useRef(null);
  const reduced = useReducedMotion();

  useSlideIntro(
    active,
    root,
    () => {
      if (reduced) {
        gsap.from('[data-fade]', { opacity: 0, duration: 0.6, stagger: 0.08 });
        return;
      }
      gsap
        .timeline({ delay: 0.35 })
        .from('.device', { opacity: 0, y: 50, scale: 0.94, filter: 'blur(14px)', duration: 2.4, ease: 'power3.out' }, 0)
        .from('.title .split-char', { yPercent: 115, duration: 1.6, ease: 'expo.out', stagger: 0.035 }, 0.15)
        .from('.subtitle .split-word', { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.07 }, 1.0)
        .from('.hint', { opacity: 0, y: 12, duration: 0.9, ease: 'power2.out' }, 1.9);
    },
    [reduced],
  );

  // Ambient motion runs for the life of the slide, independent of the intro.
  useLayoutEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => {
      gsap.to('.device-float', { y: -14, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('.glow', { opacity: 0.55, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.fromTo('.led', { opacity: 0.35, scaleX: 0.7 }, { opacity: 0.95, scaleX: 1, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.fromTo('.sweep', { xPercent: -160 }, { xPercent: 420, duration: 2.8, ease: 'power2.inOut', repeat: -1, repeatDelay: 4.5, delay: 2.5 });
      gsap.to('.hint-arrow', { x: 6, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={root} className="absolute inset-0 bg-black text-white">
      <div data-fade>
        <DevicePlaceholder />
      </div>

      <div className="absolute bottom-[190px] left-[120px]">
        <h1 data-fade className="title font-headline text-[208px] font-medium leading-[0.92] tracking-[-0.035em]">
          <SplitText text="Sky Smart Home" />
        </h1>
        <p data-fade className="subtitle mt-10 text-[48px] font-normal tracking-[-0.01em] text-white/55">
          <SplitText text="A more connected experience." by="word" />
        </p>
      </div>

      <p
        data-fade
        className="hint absolute bottom-[64px] right-[120px] flex items-center gap-4 text-[17px] text-white/45"
      >
        Press
        <span className="flex h-8 w-8 items-center justify-center rounded-md border border-white/25 text-white/80">
          <span className="hint-arrow">→</span>
        </span>
        to continue
      </p>
    </div>
  );
}

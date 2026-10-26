import { useScene, gsap, EASE } from '../lib/motion';
import { ASSETS, SKY } from '../content';
import Glass from './Glass';
import Slot from './Slot';
import { Chevron } from './Icons';

function TileCopy({ name, line, body, href }) {
  return (
    <div className="relative z-10 px-6 pt-12 text-center lg:pt-16">
      <h3 className="font-headline text-[36px] font-medium leading-[42px] tracking-[-0.02em] text-ink lg:text-[48px] lg:leading-[54px]">{name}</h3>
      <p className="mx-auto mt-2 max-w-[24ch] text-[19px] leading-[28px] text-ink lg:text-[24px] lg:leading-[32px]">{line}</p>
      <p className="mx-auto mt-2 max-w-[38ch] text-[16px] leading-[24px] text-grey-70">{body}</p>
      <div className="mt-6 flex items-center justify-center gap-6">
        <a href={href} className="btn btn-primary min-h-[40px] px-5 text-[15px]">
          Learn more
        </a>
        <a href={`${SKY}/deals`} className="link text-[16px]">
          <span className="u">See deals</span> <Chevron />
        </a>
      </div>
    </div>
  );
}

// Two screens, two motions: the Stream cable draws itself into "your TV";
// Glass Air's picture switches on as it comes into view.
export default function Screens() {
  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    const cable = root.querySelector('[data-cable]');
    const len = cable.getTotalLength();
    gsap.set(cable, { strokeDasharray: len });
    gsap.fromTo(cable, { strokeDashoffset: len }, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: { trigger: root.querySelector('[data-stream]'), start: 'top 75%', end: 'bottom 85%', scrub: 0.5 },
    });
    gsap.fromTo(root.querySelector('[data-puck]'), { y: 40 }, {
      y: -10,
      ease: 'none',
      scrollTrigger: { trigger: root.querySelector('[data-stream]'), start: 'top bottom', end: 'bottom top', scrub: true },
    });

    // Power-on: a line of light opens into the picture.
    const air = root.querySelector('[data-air]');
    gsap.timeline({ scrollTrigger: { trigger: air, start: 'top 55%', once: true } })
      .fromTo(air.querySelector('[data-line]'), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.45, ease: EASE.settle })
      .fromTo(air.querySelector('[data-picture]'), { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE.settle }, 0.3)
      .to(air.querySelector('[data-line]'), { opacity: 0, duration: 0.3 }, 0.45);
  });

  return (
    <section ref={ref} id="screens" data-nav="light" aria-label="Sky Stream and Sky Glass Air" className="bg-flat px-3 pb-3 lg:px-4 lg:pb-4">
      <div className="mx-auto grid max-w-[1440px] gap-3 lg:grid-cols-2 lg:gap-4">
        <article data-stream className="relative flex min-h-[600px] flex-col overflow-hidden rounded-xl bg-[#f1f0ec] lg:min-h-[720px]">
          <TileCopy
            name="Sky Stream"
            line="Sky on the TV you already have."
            body="A small puck that plugs into your TV’s HDMI port. 4K HDR with Dolby Vision, over Wi‑Fi."
            href={`${SKY}/stream`}
          />
          <Slot name="Sky Stream photography" src={ASSETS.stream} className="mt-auto h-[300px] lg:h-[380px]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <path data-cable d="M236 196 C 300 196 310 140 340 118 S 392 90 430 90" fill="none" stroke="#1d1e22" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div aria-hidden="true" className="absolute left-1/2 top-[66%] h-[7%] w-[36%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl" />
            <div data-puck aria-hidden="true" className="absolute left-1/2 top-[44%] w-[30%] max-w-[220px] -translate-x-1/2">
              <div className="relative aspect-[1.6/1] overflow-hidden rounded-[18%/26%] bg-[linear-gradient(160deg,#4a4b50,#1c1d21_70%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]" />
              <div className="relative -mt-[10%] h-0 rounded-b-[18%] bg-[#141518] pb-[12%]">
                <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/80" />
              </div>
            </div>
          </Slot>
        </article>

        <article data-air className="relative flex min-h-[600px] flex-col overflow-hidden rounded-xl bg-[#e4eee8] lg:min-h-[720px]">
          <TileCopy
            name="Sky Glass Air"
            line="Sky OS on a 4K HDR Quantum Dot screen."
            body="Hands-free voice control and no dish or box. Made for a second room."
            href={`${SKY}/glass`}
          />
          <Slot name="Sky Glass Air photography" src={ASSETS.glassAir} className="mt-auto flex h-[300px] items-end justify-center lg:h-[380px]">
            <Glass finish="#9fbfb2" className="mb-[-2px] w-[78%] max-w-[520px]" label="Sky Glass Air in Sea Green">
              <div
                data-picture
                className="absolute inset-0"
                style={{ background: 'radial-gradient(80% 90% at 30% 100%, #ffb000, transparent 60%), radial-gradient(90% 80% at 80% 10%, #4b2bff, transparent 60%), #0e1030' }}
              />
              <div data-line aria-hidden="true" className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-white opacity-0 shadow-[0_0_12px_#fff]" />
            </Glass>
          </Slot>
        </article>
      </div>
    </section>
  );
}

import { useScene, gsap } from '../lib/motion';
import { SKY } from '../content';
import { Chevron } from './Icons';

// Sky Stream: the cable draws from the puck to the edge of the frame,
// showing in one gesture that it plugs into the TV you already own.
export default function Stream() {
  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    const st = { trigger: root, start: 'top 85%', end: 'bottom 30%', scrub: 0.5 };
    const cable = root.querySelector('[data-cable]');
    const len = cable.getTotalLength();
    gsap.set(cable, { strokeDasharray: len });
    gsap.fromTo(cable, { strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { ...st, end: 'center 45%' } });
    gsap.fromTo(root.querySelector('[data-puck]'), { y: 70 }, { y: -30, ease: 'none', scrollTrigger: st });
    gsap.fromTo(root.querySelector('[data-shadow]'), { scale: 0.8, opacity: 0.5 }, { scale: 1.05, opacity: 1, ease: 'none', scrollTrigger: st });
    gsap.fromTo(root.querySelector('[data-sheen]'), { xPercent: -120 }, { xPercent: 220, ease: 'none', scrollTrigger: { ...st, start: 'top 60%', end: 'center 30%' } });
    gsap.from(root.querySelectorAll('[data-copy] > *'), {
      opacity: 0,
      y: 20,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: root, start: 'top 70%', once: true },
    });
  });

  return (
    <section ref={ref} id="stream" data-nav="light" aria-labelledby="stream-title" className="overflow-hidden bg-flat px-6 py-24 lg:px-8 lg:py-40">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div data-copy className="text-center lg:col-span-5 lg:text-left">
          <p className="t-eyebrow text-grey-70">Sky Stream</p>
          <h2 id="stream-title" className="t-h2 mt-2 text-ink">Sky on the TV you already have.</h2>
          <p className="t-lead mt-4 text-grey-70">A small streaming puck that plugs into your TV’s HDMI port. No dish, just Wi‑Fi.</p>
          <div className="mt-8">
            <a href={`${SKY}/stream`} className="btn btn-primary w-full max-w-[320px] sm:w-auto">
              Explore Sky Stream
            </a>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[radial-gradient(80%_70%_at_50%_35%,#ffffff,#e9eaf2)] lg:rounded-2xl"
            role="img"
            aria-label="Sky Stream puck connected to a TV by an HDMI cable"
            data-slot="Sky Stream product photography"
          >
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
              <path data-cable d="M262 176 C 320 176 330 120 360 96 S 400 70 420 70" fill="none" stroke="#1d1e22" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div data-shadow aria-hidden="true" className="absolute left-1/2 top-[64%] h-[8%] w-[40%] -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl" />
            <div data-puck aria-hidden="true" className="absolute left-1/2 top-[40%] w-[34%] -translate-x-1/2">
              {/* top face */}
              <div className="relative aspect-[1.6/1] overflow-hidden rounded-[18%/26%] bg-[linear-gradient(160deg,#4a4b50,#1c1d21_70%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
                <div data-sheen className="absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </div>
              {/* front edge */}
              <div className="relative -mt-[10%] h-0 rounded-b-[18%] bg-[#141518] pb-[12%]">
                <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

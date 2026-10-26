import { useScene, gsap, bgShift, EASE } from '../lib/motion';
import { ASSETS, SKY } from '../content';
import Slot from './Slot';
import { Chevron } from './Icons';

// Illustrative months: share of the allowance used vs left over.
const MONTHS = [
  { used: 0.6, left: 0.4 },
  { used: 0.75, left: 0.25 },
  { used: 0.5, left: 0.5 },
];
const JAR_CAP = 1.3;

// Explains Piggybank in one motion: each month's unused data lifts off
// and rolls into the Piggybank, which fills step by step.
export default function Mobile() {
  const ref = useScene((root, { motion }) => {
    const jar = root.querySelector('[data-jar-fill]');
    if (!motion) return;
    bgShift(root, '#0c1b87', '#fafafd');

    const target = root.querySelector('[data-jar]');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.querySelector('[data-viz]'), start: 'top 70%', end: 'bottom 55%', scrub: 0.6, invalidateOnRefresh: true },
    });
    tl.fromTo(jar, { scaleY: 0 }, { scaleY: 0, duration: 0.01 }, 0);
    let filled = 0;
    root.querySelectorAll('[data-left]').forEach((seg, i) => {
      const delta = () => {
        const a = seg.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        return { x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height * 0.35 - (a.top + a.height / 2) };
      };
      filled += MONTHS[i].left;
      const at = i * 0.32;
      tl.to(seg, { x: () => delta().x, y: () => delta().y, scale: 0.4, opacity: 0, ease: 'power2.in', duration: 0.26 }, at)
        .to(jar, { scaleY: filled / JAR_CAP, ease: EASE.settle, duration: 0.2 }, at + 0.18);
    });
    tl.to({}, { duration: 0.1 });
  });

  return (
    <section ref={ref} id="mobile" data-nav="light" aria-labelledby="mobile-title" className="overflow-hidden bg-flat px-6 py-24 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-[1180px] text-center">
        <p className="t-eyebrow text-grey-70">Sky Mobile</p>
        <h2 id="mobile-title" className="t-h2 mx-auto mt-2 max-w-[13ch] text-ink lg:max-w-none">Keep the data you don’t use.</h2>
        <p className="t-lead mx-auto mt-4 max-w-[36ch] text-grey-70">Unused data rolls into your Piggybank, where it’s kept for up to three years.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <a href={`${SKY}/mobile`} className="btn btn-primary w-full max-w-[320px] sm:w-auto">
            Explore Sky Mobile
          </a>
          <a href={`${SKY}/deals`} className="link">
            <span className="u">See mobile deals</span> <Chevron />
          </a>
        </div>

        <Slot name="Sky Mobile imagery" src={ASSETS.mobile} className="mx-auto mt-16 max-w-[760px] lg:mt-24">
          <figure data-viz className="flex items-end justify-center gap-4 sm:gap-8">
            <figcaption className="sr-only">
              Illustration: three months of mobile data. The part of each month’s allowance you don’t use moves into Piggybank.
            </figcaption>
            {MONTHS.map((m, i) => (
              <div key={i} className="flex flex-col items-center gap-3" aria-hidden="true">
                <div className="relative flex h-[200px] w-[52px] flex-col-reverse overflow-visible rounded-[16px] bg-grey-5 sm:h-[260px] sm:w-[72px]">
                  <div className="rounded-b-[16px] bg-ink" style={{ height: `${m.used * 100}%` }} />
                  <div data-left className="rounded-t-[16px] bg-[#4b2bff]" style={{ height: `${m.left * 100}%` }} />
                </div>
                <span className="text-[13px] text-grey-70 sm:text-[14px]">Month {i + 1}</span>
              </div>
            ))}
            <div className="ml-2 flex flex-col items-center gap-3 sm:ml-8" aria-hidden="true">
              <div data-jar className="relative h-[240px] w-[110px] overflow-hidden rounded-[28px] border-2 border-ink/80 bg-white sm:h-[320px] sm:w-[150px] sm:rounded-[36px]">
                <div data-jar-fill className="absolute inset-x-0 bottom-0 h-full origin-bottom bg-[#4b2bff]" style={{ transform: `scaleY(${MONTHS.reduce((s, m) => s + m.left, 0) / JAR_CAP})` }} />
              </div>
              <span className="text-[13px] font-medium text-ink sm:text-[14px]">Piggybank</span>
            </div>
          </figure>
        </Slot>
        <div className="mx-auto mt-6 flex max-w-[760px] items-center justify-center gap-6 text-[13px] text-grey-70" aria-hidden="true">
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-ink" /> Used</span>
          <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[#4b2bff]" /> Not used, rolled over</span>
        </div>
      </div>
    </section>
  );
}

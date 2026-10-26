import { useScene, gsap } from '../lib/motion';
import { CHANNEL_ROWS, SKY } from '../content';
import { Chevron } from './Icons';

const LINE = 'The best of TV, all in one place. Sky Atlantic, Netflix and discovery+ come together in Sky Essential TV.';

// Entertainment is told in type, not thumbnails: the statement lights up
// as it is read, then the channel names pass like credits, each row
// drifting against the next with the scroll.
export default function Entertainment() {
  const ref = useScene((root, { motion }) => {
    if (!motion) return;
    gsap.fromTo(
      root.querySelectorAll('[data-word]'),
      { opacity: 0.16 },
      { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: root.querySelector('[data-statement]'), start: 'top 80%', end: 'bottom 50%', scrub: 0.4 } },
    );
    root.querySelectorAll('[data-row]').forEach((row, i) => {
      const dir = i % 2 ? 1 : -1;
      gsap.fromTo(
        row,
        { xPercent: dir > 0 ? -18 : 0 },
        { xPercent: dir > 0 ? 0 : -18, ease: 'none', scrollTrigger: { trigger: root.querySelector('[data-rows]'), start: 'top bottom', end: 'bottom top', scrub: 0.3 } },
      );
    });
  });

  return (
    <section ref={ref} id="tv" data-nav="dark" aria-labelledby="tv-title" className="on-dark overflow-hidden bg-night pb-24 pt-28 text-white lg:pb-40 lg:pt-48">
      <div className="mx-auto max-w-[1100px] px-6 lg:px-8">
        <h2 id="tv-title" className="t-eyebrow text-white/60">Sky TV</h2>
        <p data-statement className="t-statement mt-4">
          {LINE.split(' ').map((w, i) => (
            <span key={i} data-word className="inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
      </div>

      <ul className="sr-only" aria-label="Channels and apps on Sky">
        {[...new Set(CHANNEL_ROWS.flat())].map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <div data-rows aria-hidden="true" className="mt-20 select-none space-y-2 lg:mt-32 lg:space-y-4">
        {CHANNEL_ROWS.map((row, i) => (
          <div key={i} data-row className="flex w-max gap-10 whitespace-nowrap font-headline font-medium tracking-[-0.03em] lg:gap-16" style={{ marginLeft: i % 2 ? '-12vw' : '4vw' }}>
            {[...row, ...row].map((name, j) => (
              <span
                key={j}
                className={`text-[44px] leading-[56px] lg:text-[96px] lg:leading-[112px] ${i === 0 ? 'text-white' : i === 1 ? 'text-white/40' : 'text-white/[0.18]'}`}
              >
                {name}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-[1100px] flex-col items-start gap-4 px-6 sm:flex-row sm:items-center sm:gap-8 lg:mt-24 lg:px-8">
        <a href={`${SKY}/tvandbroadband`} className="btn btn-on-dark w-full max-w-[320px] sm:w-auto">
          Explore Sky TV
        </a>
        <a href={`${SKY}/deals`} className="link">
          <span className="u">See TV deals</span> <Chevron />
        </a>
      </div>
    </section>
  );
}

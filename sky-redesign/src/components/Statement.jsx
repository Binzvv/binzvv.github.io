import { useScene, gsap } from '../lib/motion';
import { Chevron } from './Icons';

const LINE =
  'Your favourite shows, the biggest films and live sport. Sky Atlantic, Netflix and discovery+. All in one place, on one remote.';

// The words light up as you read, like the screen light from the hero
// spilling into the text. Scrubbed, never pinned.
export default function Statement() {
  const ref = useScene((root, { motion }) => {
    const words = root.querySelectorAll('[data-word]');
    if (!motion) return;
    gsap.fromTo(
      words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: root.querySelector('p'), start: 'top 80%', end: 'bottom 45%', scrub: 0.4 },
      },
    );
  });

  return (
    <section ref={ref} data-nav="dark" aria-label="Sky TV" className="on-dark bg-night px-6 py-28 text-white lg:px-8 lg:py-48">
      <div className="mx-auto max-w-[1100px]">
        <p className="t-statement">
          {LINE.split(' ').map((w, i) => (
            <span key={i} data-word className="inline-block">
              {w}&nbsp;
            </span>
          ))}
        </p>
        <div className="mt-10 flex flex-col gap-2 lg:mt-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="t-legal max-w-[52ch] text-white/60">Sky Essential TV includes Sky Atlantic, Netflix Standard with ads and discovery+.</p>
          <a href="#channels" className="link">
            <span className="u">Explore Sky TV</span> <Chevron />
          </a>
        </div>
      </div>
    </section>
  );
}

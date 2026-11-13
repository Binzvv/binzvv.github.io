import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../lib/motion';
import Words from './Words';

/**
 * The reframe: the original thought recedes to a whisper, then two
 * provocations arrive word by word. Enter / Escape or the quiet action
 * returns to a fresh thought.
 */
export default function Reframe({ input, lines, onExit }) {
  const root = useRef(null);
  const exiting = useRef(false);
  const actionRef = useRef(null);

  useLayoutEffect(() => {
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(root);
      const line1 = q('.reframe__line--1 .w__i');
      const line2 = q('.reframe__line--2 .w__i');
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      if (reduce) {
        gsap.set([line1, line2], { opacity: 0 });
        tl.fromTo(q('.reframe__echo'), { opacity: 0 }, { opacity: 1, duration: 0.4 })
          .to(line1, { opacity: 1, duration: 0.5 }, 0.1)
          .to(line2, { opacity: 1, duration: 0.5 }, 1.2)
          .fromTo(q('.reframe__action'), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.9);
      } else {
        gsap.set([line1, line2], { opacity: 0, yPercent: 60, scale: 0.97, filter: 'blur(12px)' });
        tl.fromTo(
          q('.reframe__echo'),
          { opacity: 0, y: 10, letterSpacing: '0.04em' },
          { opacity: 1, y: 0, letterSpacing: '0em', duration: 1.6 },
        )
          .to(line1, { opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.4, stagger: 0.07 }, 0.35)
          .to(q('.reframe__line--1'), { opacity: 0.42, duration: 1.4, ease: 'power2.inOut' }, '+=0.7')
          .to(line2, { opacity: 1, yPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.5, stagger: 0.08 }, '<0.25')
          .fromTo(
            q('.reframe__action'),
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
            '-=0.4',
          );
        // The light behind everything rises, just slightly.
        gsap.to(document.documentElement, { '--glow': 1, duration: 4, ease: 'power2.out' });
      }
      // Focus the way back as soon as it begins to appear.
      tl.call(() => actionRef.current?.focus({ preventScroll: true }), null, '<');
    }, root);
    return () => ctx.revert();
  }, []);

  const exit = () => {
    if (exiting.current) return;
    exiting.current = true;
    const reduce = prefersReducedMotion();
    gsap.to(document.documentElement, { '--glow': 0, duration: reduce ? 0.3 : 1.6, ease: 'power2.inOut' });
    gsap.to(root.current.children, {
      opacity: 0,
      y: reduce ? 0 : -14,
      filter: reduce ? 'none' : 'blur(8px)',
      duration: reduce ? 0.3 : 0.7,
      stagger: reduce ? 0 : 0.06,
      ease: 'power2.in',
      onComplete: onExit,
    });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' || (e.key === 'Enter' && document.activeElement !== actionRef.current)) {
        e.preventDefault();
        exit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section ref={root} className="reframe" aria-live="polite">
      <p className="reframe__echo">“{input}”</p>
      <div className="reframe__lines">
        <h2 className="reframe__line reframe__line--1">
          <Words text={lines[0]} />
        </h2>
        <h2 className="reframe__line reframe__line--2">
          <Words text={lines[1]} />
        </h2>
      </div>
      <button ref={actionRef} type="button" className="reframe__action" onClick={exit}>
        Try another thought
      </button>
    </section>
  );
}

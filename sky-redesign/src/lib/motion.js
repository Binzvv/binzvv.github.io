import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// One motion vocabulary for the whole page.
// "settle" is the physical deceleration used for anything arriving;
// "glide" is the symmetric curve used for scroll-scrubbed moves.
export const EASE = {
  settle: 'expo.out',
  glide: 'power2.inOut',
  exit: 'power2.in',
};
export const DUR = { quick: 0.35, base: 0.9, slow: 1.4 };

export const QUERIES = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 1024px)',
  mobile: '(max-width: 1023px)',
};

// Runs a GSAP scene scoped to a section. The scene is rebuilt whenever the
// breakpoint or reduced-motion preference changes, and fully reverted on unmount.
export function useScene(setup, deps = []) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia(ref.current);
    mm.add(QUERIES, (ctx) => setup(ref.current, ctx.conditions), ref.current);
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(QUERIES.reduce).matches;
}

export { gsap, ScrollTrigger };

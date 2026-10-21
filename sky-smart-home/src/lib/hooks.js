import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import gsap from 'gsap';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribeMotion(cb) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useLayoutEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

/**
 * Runs a slide's intro each time it becomes active. The previous run is
 * reverted on re-entry (while the slide is hidden) rather than on exit, so an
 * outgoing slide never snaps mid-transition.
 */
export function useSlideIntro(active, scope, build, deps = []) {
  const ctx = useRef(null);
  useLayoutEffect(() => {
    if (!active) return;
    ctx.current?.revert();
    ctx.current = gsap.context(build, scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
  useLayoutEffect(() => () => ctx.current?.revert(), []);
}

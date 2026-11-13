import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import head from '../assets/head.webp';
import { prefersReducedMotion } from '../lib/motion';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * A tiny signature from the person behind TRASH. Not a logo, not an avatar.
 * Fades in once on load; on desktop it tilts slightly when hovered.
 */
export default function Signature() {
  const ref = useRef(null);
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        opacity: 0,
        duration: prefersReducedMotion() ? 0.3 : 1.6,
        delay: prefersReducedMotion() ? 0 : 0.6,
        ease: 'power2.out',
      });
    });
    return () => ctx.revert();
  }, []);

  const tilt = (deg) => {
    if (!canHover || prefersReducedMotion()) return;
    gsap.to(ref.current, { rotation: deg, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
  };

  return (
    <img
      ref={ref}
      className="signature"
      src={head}
      alt=""
      aria-hidden="true"
      draggable="false"
      onPointerEnter={() => tilt(-6)}
      onPointerLeave={() => tilt(0)}
    />
  );
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Softer, shorter, opacity-only alternatives when motion is reduced. */
export const m = (full, reduced) => (prefersReducedMotion() ? reduced : full);

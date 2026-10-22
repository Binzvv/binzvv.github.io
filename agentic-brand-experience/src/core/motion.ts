import { gsap } from 'gsap';

export const ease = {
  reveal: 'expo.out',
  settle: 'power3.inOut',
  quiet: 'power2.out',
  exit: 'power2.in',
} as const;

export const dur = {
  reveal: 1.1,
  settle: 1.4,
  quiet: 0.7,
} as const;

export function beatTimes(tl: gsap.core.Timeline): number[] {
  return Object.entries(tl.labels)
    .filter(([name]) => name.startsWith('beat'))
    .map(([, time]) => time)
    .sort((a, b) => a - b);
}

export function makeQ(root: HTMLElement) {
  return (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function newTimeline() {
  return gsap.timeline({ paused: true, defaults: { ease: ease.reveal, duration: dur.reveal } });
}

/** A short pause on the timeline, so a composition reads as still before the next beat. */
export function hold(tl: gsap.core.Timeline, seconds = 0.6) {
  tl.to({}, { duration: seconds });
}

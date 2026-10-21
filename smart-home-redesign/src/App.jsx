import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { gsap, ScrollTrigger } from './lib/gsap.js';
import { MotionContext, useSystemReducedMotion } from './lib/motion.js';
import Dock from './components/Dock.jsx';
import AppleExperience from './directions/apple/AppleExperience.jsx';
import MonzoExperience from './directions/monzo/MonzoExperience.jsx';

export const DIRECTIONS = {
  apple: { label: 'Cinematic', ref: 'Apple-inspired', Component: AppleExperience },
  monzo: { label: 'Playful', ref: 'Monzo-inspired', Component: MonzoExperience },
};

function readInitialDirection() {
  const fromUrl = new URLSearchParams(location.search).get('d');
  if (fromUrl in DIRECTIONS) return fromUrl;
  try {
    const saved = localStorage.getItem('sh-direction');
    if (saved in DIRECTIONS) return saved;
  } catch {
    /* storage unavailable */
  }
  return 'apple';
}

export default function App() {
  const [direction, setDirection] = useState(readInitialDirection);
  const [rendered, setRendered] = useState(direction);
  const [motionOverride, setMotionOverride] = useState(null);
  const systemReduced = useSystemReducedMotion();
  const reduced = motionOverride ?? systemReduced;
  const curtain = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.direction = rendered;
    const url = new URL(location.href);
    url.searchParams.set('d', rendered);
    history.replaceState(null, '', url);
    try {
      localStorage.setItem('sh-direction', rendered);
    } catch {
      /* storage unavailable */
    }
  }, [rendered]);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  }, [reduced]);

  const swap = (next) => {
    flushSync(() => setRendered(next));
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  };

  const switchTo = (next) => {
    if (next === direction || busy.current) return;
    setDirection(next);

    if (reduced) {
      swap(next);
      return;
    }

    busy.current = true;
    const el = curtain.current;
    el.dataset.target = next;
    gsap
      .timeline({ onComplete: () => (busy.current = false) })
      .set(el, { visibility: 'visible' })
      .fromTo(
        el,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'cineInOut' },
      )
      .fromTo(
        el.querySelector('.curtain__label'),
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' },
        '-=0.3',
      )
      .add(() => swap(next))
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'cineInOut' }, '+=0.15')
      .set(el, { visibility: 'hidden' });
  };

  // "D" flips direction, for quick side-by-side comparison.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest('input, textarea, [contenteditable]')) return;
      switchTo(direction === 'apple' ? 'monzo' : 'apple');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const { Component } = DIRECTIONS[rendered];

  return (
    <MotionContext.Provider value={{ reduced }}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Component key={`${rendered}-${reduced}`} />
      <Dock
        direction={direction}
        directions={DIRECTIONS}
        onChange={switchTo}
        reduced={reduced}
        onToggleMotion={() => setMotionOverride(!reduced)}
      />
      <div className="curtain" ref={curtain} aria-hidden="true">
        <span className="curtain__label">
          {DIRECTIONS[direction].label}
          <small>{DIRECTIONS[direction].ref}</small>
        </span>
      </div>
    </MotionContext.Provider>
  );
}

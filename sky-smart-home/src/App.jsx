import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Stage from './components/Stage.jsx';
import Progress from './components/Progress.jsx';
import ExpandedView from './components/ExpandedView.jsx';
import Opening from './slides/Opening.jsx';
import Challenge from './slides/Challenge.jsx';
import Experience from './slides/Experience.jsx';
import { useReducedMotion, useViewport } from './lib/hooks.js';

const SLIDES = [
  { name: 'Opening', bg: '#000000', dark: true },
  { name: 'The challenge', bg: '#F3EFE8', dark: false },
  { name: 'The experience', bg: '#FFFFFF', dark: false },
];

const TRANSITION = 1.15;
const WHEEL_COOLDOWN = 1300; // ms between wheel-driven slide changes
const WHEEL_THRESHOLD = 30; // accumulated delta needed to count as intent

export default function App() {
  const viewport = useViewport();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(null);

  const frameRef = useRef(null);
  const slideRefs = useRef([]);
  const indexRef = useRef(0);
  const busy = useRef(false);
  const expandedRef = useRef(null);
  const closeRef = useRef(null);

  expandedRef.current = expanded;

  useLayoutEffect(() => {
    slideRefs.current.forEach((el, i) => gsap.set(el, { autoAlpha: i === 0 ? 1 : 0, zIndex: i === 0 ? 1 : 0 }));
  }, []);

  const goTo = useCallback(
    (next) => {
      const from = indexRef.current;
      if (busy.current || expandedRef.current || next === from || next < 0 || next >= SLIDES.length) return;
      busy.current = true;
      indexRef.current = next;
      setIndex(next);

      const dir = next > from ? 1 : -1;
      const outEl = slideRefs.current[from];
      const inEl = slideRefs.current[next];
      const settle = () => {
        gsap.set(outEl, { autoAlpha: 0, zIndex: 0, clearProps: 'transform' });
        gsap.set(inEl, { zIndex: 1, clearProps: 'clipPath,transform' });
        busy.current = false;
      };

      gsap.to(frameRef.current, { backgroundColor: SLIDES[next].bg, duration: reduced ? 0.3 : TRANSITION, ease: 'power2.inOut' });

      if (reduced) {
        gsap.set(inEl, { zIndex: 2 });
        gsap.timeline({ onComplete: settle }).fromTo(inEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35 });
        return;
      }

      // Incoming slide wipes over the outgoing one, which drifts away underneath.
      gsap
        .timeline({ defaults: { duration: TRANSITION, ease: 'expo.inOut' }, onComplete: settle })
        .set(inEl, { autoAlpha: 1, zIndex: 2 })
        .fromTo(
          inEl,
          { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', y: 140 * dir },
          { clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
          0,
        )
        .to(outEl, { y: -220 * dir, ease: 'power3.inOut' }, 0);
    },
    [reduced],
  );

  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (expandedRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeRef.current?.();
        }
        return;
      }
      const i = indexRef.current;
      const map = {
        ArrowRight: i + 1,
        ArrowDown: i + 1,
        PageDown: i + 1,
        ' ': i + 1,
        ArrowLeft: i - 1,
        ArrowUp: i - 1,
        PageUp: i - 1,
        Home: 0,
        End: SLIDES.length - 1,
      };
      if (e.key in map && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === ' ' && e.target.closest?.('button')) return;
        e.preventDefault();
        goToRef.current(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Wheel / trackpad. Trackpad momentum keeps emitting decaying deltas for a
  // while, so after a change we wait for the cooldown AND for either a pause
  // in the stream or a fresh spike in delta (a new gesture).
  useEffect(() => {
    let acc = 0;
    let lastNav = -Infinity;
    let lastEvent = -Infinity;
    let lastMag = 0;
    let locked = false;

    const onWheel = (e) => {
      if (expandedRef.current) return;
      const now = performance.now();
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const mag = Math.abs(d);
      const gap = now - lastEvent;
      lastEvent = now;

      if (locked) {
        const fresh = gap > 180 || mag > lastMag * 1.6 + 4;
        lastMag = mag;
        if (now - lastNav < WHEEL_COOLDOWN || !fresh) return;
        locked = false;
        acc = 0;
      }
      lastMag = mag;
      if (gap > 250) acc = 0;
      acc += d;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;

      const before = indexRef.current;
      goToRef.current(before + Math.sign(acc));
      acc = 0;
      if (indexRef.current !== before) {
        lastNav = now;
        locked = true;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  // Simple swipe for touch screens.
  useEffect(() => {
    let start = null;
    const down = (e) => (start = e.touches[0] ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null);
    const up = (e) => {
      if (!start || expandedRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) goToRef.current(indexRef.current + (dx < 0 ? 1 : -1));
      start = null;
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchend', up, { passive: true });
    return () => {
      window.removeEventListener('touchstart', down);
      window.removeEventListener('touchend', up);
    };
  }, []);

  const open = useCallback((item) => {
    if (busy.current || expandedRef.current) return;
    setExpanded(item);
  }, []);
  const closed = useCallback(() => setExpanded(null), []);

  const slide = SLIDES[index];

  return (
    <main ref={frameRef} className="fixed inset-0 overflow-hidden" style={{ backgroundColor: SLIDES[0].bg }}>
      <Stage viewport={viewport}>
        {[Opening, Challenge, Experience].map((Slide, i) => (
          <section
            key={i}
            ref={(el) => (slideRefs.current[i] = el)}
            className="absolute inset-0 overflow-hidden"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}: ${SLIDES[i].name}`}
            aria-hidden={i !== index}
            inert={i !== index ? '' : undefined}
          >
            <Slide active={i === index} viewport={viewport} onOpen={open} />
          </section>
        ))}
        <Progress index={index} total={SLIDES.length} dark={slide.dark} onSelect={goTo} hidden={!!expanded} />
      </Stage>

      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {SLIDES.length}: {slide.name}
      </p>

      {expanded && <ExpandedView item={expanded} onClosed={closed} closeRef={closeRef} />}
    </main>
  );
}

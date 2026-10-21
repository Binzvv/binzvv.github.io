import { useCallback, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import BrowserWindow from './BrowserWindow.jsx';
import { useReducedMotion } from '../lib/hooks.js';

/**
 * Fullscreen browser that grows out of a thumbnail mockup (FLIP).
 * The fullscreen window is laid out at viewport size; its start state is a
 * uniform scale + translate onto the thumbnail, with a clip-path cropping the
 * height and matching the corner radius. The thumbnail renders the same
 * window at the same virtual size, so the handoff is seamless.
 */
export default function ExpandedView({ item, onClosed, closeRef }) {
  const reduced = useReducedMotion();
  const rootRef = useRef(null);
  const winRef = useRef(null);
  const veilRef = useRef(null);
  const scrollerRef = useRef(null);
  const phase = useRef('opening');

  const originState = useCallback(() => {
    const el = item.el;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = r.width / vw;
    const toScreen = r.width / el.offsetWidth;
    const radius = (parseFloat(getComputedStyle(el).borderTopLeftRadius) * toScreen) / s;
    const bottom = Math.max(0, vh - r.height / s);
    return { x: r.left, y: r.top, scale: s, clipPath: `inset(0px 0px ${bottom}px 0px round ${radius}px)` };
  }, [item]);

  const aux = () => rootRef.current.querySelectorAll('.chrome-aux');

  useLayoutEffect(() => {
    scrollerRef.current.scrollTop = item.scrollTop || 0;
    scrollerRef.current.dispatchEvent(new Event('scroll'));
    const done = () => {
      phase.current = 'open';
      scrollerRef.current?.focus({ preventScroll: true });
    };
    const ctx = gsap.context(() => {
      gsap.set(item.el, { visibility: 'hidden' });
      if (reduced) {
        gsap.fromTo(rootRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, onComplete: done });
        return;
      }
      gsap
        .timeline({ onComplete: done })
        .fromTo(veilRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0)
        .fromTo(
          winRef.current,
          originState(),
          { x: 0, y: 0, scale: 1, clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1.1, ease: 'expo.inOut' },
          0,
        )
        .fromTo(aux(), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.85);
    }, rootRef);
    return () => ctx.revert();
  }, [item, reduced, originState]);

  const close = useCallback(() => {
    if (phase.current === 'closing') return;
    phase.current = 'closing';
    gsap.killTweensOf([winRef.current, veilRef.current, scrollerRef.current]);

    const finish = () => {
      gsap.set(item.el, { visibility: 'visible' });
      item.el.closest('button')?.focus({ preventScroll: true });
      onClosed();
    };

    if (reduced) {
      gsap.to(rootRef.current, { autoAlpha: 0, duration: 0.2, onComplete: finish });
      return;
    }

    const sc = scrollerRef.current;
    const tl = gsap.timeline({ onComplete: finish });
    tl.to(aux(), { opacity: 0, duration: 0.25 }, 0);
    if (sc.scrollTop > 0) {
      tl.to(sc, { scrollTop: 0, duration: Math.min(0.9, 0.35 + sc.scrollTop / 5000), ease: 'power3.inOut' }, 0);
    }
    tl.to(winRef.current, { ...originState(), duration: 1, ease: 'expo.inOut' })
      .to(veilRef.current, { opacity: 0, duration: 0.75, ease: 'power2.inOut' }, '<0.3');
  }, [item, reduced, onClosed, originState]);

  closeRef.current = close;

  return (
    <div ref={rootRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${item.id} view`}>
      <div ref={veilRef} className="absolute inset-0 bg-white" />
      <div
        ref={winRef}
        className="absolute inset-0 origin-top-left will-change-transform"
      >
        <BrowserWindow site={item.id} onBack={close} scrollerRef={scrollerRef} />
      </div>
    </div>
  );
}

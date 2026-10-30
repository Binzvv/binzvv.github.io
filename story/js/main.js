// The Living Project Story — scene controller.
// Discrete, art-directed scenes driven by wheel / swipe / keys (GSAP Observer), not a scrolling page:
// each scene owns the pointer while you are in it.

import gsap from 'gsap';
import { Observer } from 'gsap/Observer.js';
import { state, setWorld, reduced, coarse } from './state.js';
import { paintPlaceholders } from './placeholders.js';
import interrupt from './scenes/interrupt.js';
import choose from './scenes/choose.js';
import disrupt from './scenes/disrupt.js';
import respond from './scenes/respond.js';
import reveal from './scenes/reveal.js';

gsap.registerPlugin(Observer);

const scenes = [interrupt, choose, disrupt, respond, reveal];
const NAMES = ['Interrupt', 'Choose', 'Disrupt', 'Respond', 'Reveal'];
const curtain = document.querySelector('.curtain');
const bars = [...curtain.querySelectorAll('i')];
const curtainLabel = curtain.querySelector('.curtain-label');
const hud = {
  index: document.querySelector('.hud-index'),
  steps: [...document.querySelectorAll('.hud-steps li')],
  cue: document.querySelector('.hud-cue-word'),
  next: document.querySelector('.hud-next'),
  nextText: document.querySelector('.hud-next-text'),
};
const cursor = document.querySelector('.cursor');
const cursorLabel = cursor.querySelector('.cursor-label');

let current = -1, busy = false, coolUntil = 0;
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

/* ───────────────────────────── HUD ───────────────────────────── */
function updateHud(i) {
  hud.index.textContent = String(i + 1).padStart(2, '0');
  hud.steps.forEach((li, k) => {
    li.classList.toggle('is-current', k === i);
    li.classList.toggle('is-done', k < i);
  });
  document.body.classList.toggle('is-last', i === scenes.length - 1);
  swapCue(scenes[i].cue);
  cursorLabel.textContent = scenes[i].cursor;
  updateNext();
}
function swapCue(text) {
  if (hud.cue.textContent === text) return;
  if (reduced) { hud.cue.textContent = text; return; }
  gsap.timeline()
    .to(hud.cue, { yPercent: -100, opacity: 0, duration: 0.25, ease: 'power2.in' })
    .add(() => { hud.cue.textContent = text; })
    .fromTo(hud.cue, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
}
function updateNext() {
  const last = current === scenes.length - 1;
  const locked = scenes[current]?.locked;
  hud.next.style.visibility = last ? 'hidden' : 'visible';
  hud.next.classList.toggle('is-locked', !!locked);
  hud.nextText.textContent = locked ? 'Choose to continue' : coarse ? 'Swipe up / Tap' : 'Scroll / Swipe';
}

/* ─────────────────────────── Navigation ─────────────────────────── */
function show(s) { s.el.classList.add('is-active'); }
function hide(s) { s.el.classList.remove('is-active'); gsap.set(s.el, { clearProps: 'all' }); }

function go(target, dir = Math.sign(target - current)) {
  if (busy || target === current || target < 0 || target >= scenes.length) return;
  // Choice is the hinge of the story: you can't skip past it without choosing.
  if (dir > 0 && target > 1 && choose.locked && current <= 1) {
    if (current === 1) { choose.block(); swapCue('Choose first'); setTimeout(() => current === 1 && swapCue(choose.cue), 1400); return; }
    target = 1;
  }
  const from = scenes[current], to = scenes[target];
  busy = true;
  current = target;
  updateHud(target);

  const done = () => { busy = false; coolUntil = performance.now() + 650; };
  const label = `${String(target + 1).padStart(2, '0')} ${NAMES[target]}`;

  if (!from) { show(to); to.enter(dir); done(); return; }

  const tl = gsap.timeline({ onComplete: done });

  if (reduced) {
    tl.add(from.leave(dir), 0)
      .to(from.el, { autoAlpha: 0, duration: 0.25 })
      .add(() => { hide(from); show(to); gsap.set(to.el, { autoAlpha: 0 }); to.enter(dir); })
      .to(to.el, { autoAlpha: 1, duration: 0.25 });
    return;
  }

  if (state.world === 'silence') {
    // Quiet world: an iris opens from wherever you are.
    const at = `${pointer.x}px ${pointer.y}px`;
    tl.add(from.leave(dir), 0)
      .add(() => {
        show(to);
        gsap.set(to.el, { zIndex: 3, clipPath: `circle(0% at ${at})` });
        to.enter(dir);
      }, 0.3)
      .to(to.el, { clipPath: `circle(150% at ${at})`, duration: 1.5, ease: 'power2.inOut' }, 0.3)
      .to(from.el, { scale: 0.94, autoAlpha: 0.3, duration: 1.5, ease: 'power2.inOut' }, 0.3)
      .add(() => { hide(from); gsap.set(to.el, { clearProps: 'clipPath,zIndex' }); });
    return;
  }

  const noise = state.world === 'noise';
  const inOrigin = dir > 0 ? '50% 100%' : '50% 0%';
  const outOrigin = dir > 0 ? '50% 0%' : '50% 100%';
  curtainLabel.textContent = label;
  tl.add(from.leave(dir), 0)
    .to(bars, {
      scaleY: 1, transformOrigin: inOrigin,
      duration: noise ? 0.28 : 0.65, ease: noise ? 'steps(3)' : 'expo.inOut',
      stagger: noise ? { each: 0.03, from: 'random' } : { each: 0.04, from: dir > 0 ? 'start' : 'end' },
    }, 0.2)
    .fromTo(curtainLabel, { opacity: 0, yPercent: dir > 0 ? 60 : -60 }, { opacity: 1, yPercent: 0, duration: 0.4, ease: 'expo.out' }, '-=0.25')
    .add(() => { hide(from); show(to); to.enter(dir); })
    .to(curtainLabel, { opacity: 0, yPercent: dir > 0 ? -60 : 60, duration: 0.3, ease: 'expo.in' }, '+=0.12')
    .to(bars, {
      scaleY: 0, transformOrigin: outOrigin,
      duration: noise ? 0.28 : 0.65, ease: noise ? 'steps(3)' : 'expo.inOut',
      stagger: noise ? { each: 0.03, from: 'random' } : { each: 0.04, from: dir > 0 ? 'start' : 'end' },
    }, '<');
}
const next = () => go(current + 1, 1);
const prev = () => go(current - 1, -1);
const ready = () => !busy && performance.now() > coolUntil;

/* ───────────────────────────── Input ───────────────────────────── */
function bindInput() {
  Observer.create({
    target: window, type: 'wheel', wheelSpeed: -1, tolerance: 12, preventDefault: true,
    onUp: () => ready() && next(),
    onDown: () => ready() && prev(),
  });

  // Swipe: deliberate, fast and vertical — so dragging inside a scene never navigates by accident.
  let t0 = null;
  window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.no-swipe, input')) { t0 = null; return; }
    const p = e.touches[0];
    t0 = { x: p.clientX, y: p.clientY, t: performance.now() };
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!t0) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - t0.x, dy = p.clientY - t0.y, dt = performance.now() - t0.t;
    t0 = null;
    if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx) * 1.6 && Math.abs(dy) / dt > 0.45 && ready()) dy < 0 ? next() : prev();
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.target.closest?.('input, textarea')) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); ready() && next(); }
    if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); ready() && prev(); }
  });

  hud.next.addEventListener('click', next);
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.go)));
  document.addEventListener('story:unlock', updateNext);
  document.addEventListener('story:lock', updateNext);
}

/* ──────────────────────────── Cursor ──────────────────────────── */
function bindCursor() {
  const qx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
  const qy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    qx(e.clientX); qy(e.clientY);
    const hit = e.target.closest?.('[data-cursor], button, a, [role="button"], input');
    cursor.classList.toggle('is-hover', !!hit && !hit.matches('canvas'));
    const label = hit?.dataset?.cursor || (hit?.matches('input') ? 'Type' : null);
    cursorLabel.textContent = label || scenes[current]?.cursor || '';
  }, { passive: true });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
}

/* ───────────────────────────── Boot ───────────────────────────── */
async function boot() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('800 100px Archivo'),
        document.fonts.load('italic 100px "Instrument Serif"'),
        document.fonts.load('400 11px "JetBrains Mono"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (_) { /* fall back to system fonts */ }

  // Optional deep links for review: #3, ?world=noise
  const params = new URLSearchParams(location.search);
  if (['noise', 'silence'].includes(params.get('world'))) { setWorld(params.get('world')); choose.preset(); }

  paintPlaceholders();
  scenes.forEach((s) => s.init());
  bindInput();
  bindCursor();

  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { paintPlaceholders(); scenes.forEach((s) => s.resize?.()); }, 150);
  });

  const start = Math.max(0, Math.min(scenes.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  go(start, 1);
}

boot();

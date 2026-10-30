// 02 — CHOOSE · Choice
// Two identities share one composition. The seam follows you; your choice rewrites the whole world.

import gsap from 'gsap';
import { state, setWorld, reduced } from '../state.js';
import { splitChars } from '../fit.js';

const el = document.querySelector('.s2');
const noise = el.querySelector('.s2-noise');
const silence = el.querySelector('.s2-silence');
const q = el.querySelector('.s2-q');
const after = el.querySelector('.s2-after');
const afterLine = el.querySelector('.s2-after-line');
const again = el.querySelector('.s2-again');
const noiseLetters = [...noise.querySelectorAll('.s2-word span')];
const dot = el.querySelector('.s2-dot');

const split = { v: 50 };
let chosen = false, active = false, jitterT = 0, choosing = false;
const setSplit = gsap.quickTo(split, 'v', { duration: 0.9, ease: 'power3.out', onUpdate: () => el.style.setProperty('--split', `${split.v}%`) });
const portrait = () => window.innerHeight > window.innerWidth;

const LINES = {
  noise: 'The world got <em>louder.</em>',
  silence: 'The world <em>exhaled.</em>',
};

// Leaning toward a side gives it more of the frame.
function lean(e) {
  if (!active || chosen || choosing) return;
  const n = portrait() ? e.clientY / window.innerHeight : e.clientX / window.innerWidth;
  // n < .5 → hovering noise → push the seam away from it.
  setSplit(gsap.utils.clamp(20, 80, 50 + (0.5 - n) * 56));
}

function jitter(_t, dt) {
  jitterT += dt;
  if (jitterT < 90 || reduced) return;
  jitterT = 0;
  noiseLetters.forEach((l) => {
    const hit = Math.random() < 0.35;
    gsap.set(l, { x: hit ? gsap.utils.random(-14, 14) : 0, y: hit ? gsap.utils.random(-10, 10) : 0, skewX: hit ? gsap.utils.random(-12, 12) : 0 });
  });
}

function choose(world) {
  if (choosing || (chosen && state.world === world)) return;
  choosing = true;
  const tl = gsap.timeline({ onComplete: () => { choosing = false; } });
  const winner = world === 'noise' ? noise : silence;
  tl.to(split, { v: world === 'noise' ? 100 : 0, duration: reduced ? 0.2 : (world === 'noise' ? 0.45 : 1.3), ease: world === 'noise' ? 'steps(5)' : 'power3.inOut', onUpdate: () => el.style.setProperty('--split', `${split.v}%`) })
    .to(q, { opacity: 0, duration: 0.2 }, 0)
    .to(winner.querySelector('.s2-word'), { scale: reduced ? 1 : 1.25, transformOrigin: '50% 50%', duration: 0.5, ease: 'power2.in' }, 0.1)
    .add(() => {
      setWorld(world);
      chosen = true;
      el.classList.add('is-chosen');
      animateAfter(world);
      document.dispatchEvent(new CustomEvent('story:unlock'));
    });
}

function animateAfter(world) {
  // Re-split while keeping the accent word.
  const html = LINES[world];
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  afterLine.textContent = '';
  const chars = [];
  tmp.childNodes.forEach((node) => {
    const holder = node.nodeType === 1 ? document.createElement('em') : document.createElement('span');
    chars.push(...splitChars(holder, node.textContent.trim()));
    afterLine.appendChild(holder);
    afterLine.appendChild(document.createTextNode(' '));
  });
  gsap.fromTo(after, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.5 });
  if (reduced) return;
  if (world === 'noise') {
    gsap.fromTo(chars, { opacity: 0, yPercent: () => gsap.utils.random(-80, 80), skewX: () => gsap.utils.random(-30, 30) },
      { opacity: 1, yPercent: 0, skewX: 0, duration: 0.45, ease: 'steps(4)', stagger: { each: 0.025, from: 'random' } });
  } else {
    gsap.fromTo(chars, { opacity: 0, y: 40, filter: 'blur(12px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.6, ease: 'power2.out', stagger: 0.04 });
  }
}

function reopen() {
  chosen = false;
  el.classList.remove('is-chosen');
  gsap.set([noise.querySelector('.s2-word'), silence.querySelector('.s2-word')], { scale: 1 });
  gsap.to(q, { opacity: 1, duration: 0.4 });
  gsap.to(split, { v: 50, duration: 0.8, ease: 'power3.inOut', onUpdate: () => el.style.setProperty('--split', `${split.v}%`) });
  document.dispatchEvent(new CustomEvent('story:lock'));
}

export default {
  el,
  cue: 'Choose',
  cursor: 'Choose',
  init() {
    gsap.set(q, { xPercent: -50, yPercent: -50 });
    window.addEventListener('pointermove', lean, { passive: true });
    [[noise, 'noise'], [silence, 'silence']].forEach(([side, world]) => {
      side.addEventListener('click', () => !chosen && choose(world));
      side.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!chosen) choose(world); }
      });
    });
    again.addEventListener('click', reopen);
    if (!reduced) gsap.to(dot, { x: '4vw', y: '3vh', duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  },
  enter() {
    active = true;
    gsap.ticker.add(jitter);
    if (chosen) { animateAfter(state.world); return gsap.timeline(); }
    const tl = gsap.timeline();
    if (reduced) return tl.fromTo(q, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    tl.fromTo(split, { v: 100 }, { v: 50, duration: 1.4, ease: 'expo.inOut', onUpdate: () => el.style.setProperty('--split', `${split.v}%`) }, 0)
      .fromTo(q.children, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.12 }, 0.5)
      .fromTo(noiseLetters, { yPercent: 100 }, { yPercent: 0, duration: 0.5, ease: 'steps(5)', stagger: 0.05 }, 0.2);
    return tl;
  },
  leave(dir) {
    const tl = gsap.timeline({ onComplete: () => { active = false; gsap.ticker.remove(jitter); } });
    if (!reduced) tl.to(chosen ? afterLine : q.children, { yPercent: dir > 0 ? -40 : 40, opacity: 0, duration: 0.5, ease: 'power3.in' })
      .set(chosen ? afterLine : q.children, { yPercent: 0, opacity: 1 });
    return tl;
  },
  canLeave(dir) { return dir < 0 || chosen; },
  block() {
    if (reduced) return;
    gsap.fromTo(q, { x: -16 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' });
    gsap.fromTo([noise, silence].map((s) => s.querySelector('.s2-word')), { scale: 1.08 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
  },
  get locked() { return !chosen; },
  preset() { chosen = true; el.classList.add('is-chosen'); },
};

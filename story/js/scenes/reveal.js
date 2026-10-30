// 05 — REVEAL · Memory
// Everything the visitor did becomes the art direction of one final, unrepeatable composition.

import gsap from 'gsap';
import { state, motion, reduced, resetState } from '../state.js';
import { computeLayout, placeElement } from './disrupt.js';
import { splitChars, fitText } from '../fit.js';
import { MOODS } from '../personality.js';
import { drawEntity, makeParams } from '../entity.js';
import interrupt from './interrupt.js';

const el = document.querySelector('.s5');
const poster = el.querySelector('.s5-poster');
const title = el.querySelector('.s5-title');
const end = el.querySelector('.s5-end');
const endLines = el.querySelectorAll('.s5-end-line span');
const links = el.querySelector('.s5-links');
const replay = el.querySelector('.s5-replay');
const TITLE = 'You were never just watching.';

let tl = null, final = false, nodes = {}, discNode = null, pathNode = null;

const FALLBACK = { noise: 'Nothing to say.', silence: 'Silence, chosen.', none: 'Unspoken.' };

function edition() {
  const s = JSON.stringify([state.world, state.disrupt.cell, state.respond.message, state.respond.mood, Math.round(state.presence.distance * 100)]);
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return String(h % 10000).padStart(4, '0');
}

function bars(container) {
  const src = state.presence.samples.length ? state.presence.samples : Array.from({ length: 36 }, (_, i) => 0.08 + 0.06 * Math.sin(i));
  const n = 36;
  for (let i = 0; i < n; i++) {
    const v = src[Math.floor((i / n) * src.length)] || 0;
    const b = document.createElement('i');
    b.style.height = `${6 + Math.min(1, v * 1.4) * 94}%`;
    container.appendChild(b);
  }
}

function make(cls, html) {
  const n = document.createElement('div');
  n.className = `p-el ${cls}`;
  n.innerHTML = `<div class="p-in">${html}</div>`;
  poster.appendChild(n);
  return n;
}

function build() {
  poster.innerHTML = '';
  const W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
  const g = Math.min(40, Math.max(16, W * 0.024));
  const box = { x: g, y: g, w: W - g * 2, h: H - g * 2 };
  const L = computeLayout(W, H, state.disrupt.cell || { c: 0.8, r: 0.5 }, box);
  const world = state.world || 'none';
  const mood = state.respond.mood || 'calm';
  const msg = state.respond.message || FALLBACK[world];
  const reply = state.respond.reply || (world === 'noise' ? 'SAID NOTHING. LOUDEST THING IN THE ROOM.' : 'You said nothing. That said enough.');
  const presence = Math.round(Math.min(1, state.presence.distance / 8) * 100);
  const gut = world === 'noise' ? 6 : world === 'silence' ? 24 : 12;
  poster.style.setProperty('--gut', `${gut}px`);

  const shot = interrupt.snapshot(900);
  const msgKind = /\s/.test(msg.trim()) ? 'word' : 'head';

  // Content → which slot of the visitor's own disrupted grid it occupies (biggest slots first).
  const SLOT = { msg: 'head', object: 'img', reply: 'word', face: 'bars', wave: 'img2', cap: 'cap', num: 'num' };
  nodes = {
    msg: make('p-head', `<span class="d-text display">${escapeHTML(msg)}</span>`),
    object: make('p-img', `<figure style="margin:0">${shot ? `<img alt="" src="${shot}">` : ''}<figcaption class="mono">Fig. 01 — Your object</figcaption></figure>`),
    reply: make('p-word', `<span class="d-text">“${escapeHTML(reply)}”<small>— The entity, ${MOODS[mood].label.toLowerCase()}</small></span>`),
    face: make('p-face', '<canvas></canvas><figcaption class="mono">Its last mood</figcaption>'),
    wave: make('p-bars', '<div class="bars"></div>'),
    cap: make('p-cap', `<dl class="mono">
        <dt>World</dt><dd>${world === 'none' ? 'Undecided' : world}</dd>
        <dt>Presence</dt><dd>${presence}%</dd>
        <dt>Disruptions</dt><dd>${String(state.disrupt.moves).padStart(2, '0')}</dd>
        <dt>Mood</dt><dd>${MOODS[mood].label}</dd>
        <dt>Pokes</dt><dd>${state.respond.pokes}</dd>
        <dt>Edition</dt><dd>${edition()} / ∞</dd></dl>`),
    num: make('p-num', `<span class="d-text display">№${edition()}</span>`),
  };
  bars(nodes.wave.querySelector('.bars'));

  nodes.msg.classList.toggle('is-multi', msgKind === 'word');
  const KIND = { msg: msgKind, reply: 'word', num: 'num' };
  Object.keys(SLOT).forEach((k) => placeElement(nodes[k], KIND[k] || k, L.rects[SLOT[k]], { animate: false, gut }));

  // The face, frozen in its last expression.
  const fr = L.rects[SLOT.face];
  if (fr) {
    const c = nodes.face.querySelector('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = fr.w - gut, h = fr.h - gut;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    drawEntity(ctx, makeParams(mood), 1.3, w / 2, h / 2, Math.min(w, h) * 0.32, { x: 0.3, y: -0.2 },
      { body: MOODS[mood].color || accent, eye: '#f4f1ea', ink: '#0a0a0a' });
  }

  // Where the visitor dragged the system.
  pathNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pathNode.setAttribute('class', 'p-path');
  pathNode.setAttribute('viewBox', `0 0 ${W} ${H}`);
  pathNode.setAttribute('preserveAspectRatio', 'none');
  const pts = state.disrupt.path.length > 1 ? state.disrupt.path : [];
  const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  pl.setAttribute('points', pts.map(([x, y]) => `${(box.x + x * box.w).toFixed(1)},${(box.y + y * box.h).toFixed(1)}`).join(' '));
  pathNode.appendChild(pl);
  poster.appendChild(pathNode);

  discNode = document.createElement('div');
  discNode.className = 'p-disc';
  discNode.innerHTML = '<span class="display">You</span>';
  Object.assign(discNode.style, { left: `${L.disc.x}px`, top: `${L.disc.y}px`, width: `${L.disc.d}px`, height: `${L.disc.d}px` });
  poster.appendChild(discNode);

  return { L, pl };
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function finalTransform() {
  const W = window.innerWidth, H = window.innerHeight;
  const g = Math.min(40, Math.max(16, W * 0.024));
  const hud = Math.min(84, Math.max(56, H * 0.08));
  return H > W ? { scale: 0.58, x: 0, y: hud } : { scale: 0.56, x: -g, y: hud };
}

function toFinal(animate = true) {
  final = true;
  el.classList.add('is-final');
  const f = finalTransform();
  const d = animate && !reduced ? 1.3 : 0;
  gsap.to(poster, { ...f, duration: d, ease: 'expo.inOut' });
  gsap.set(end, { visibility: 'inherit' });
  if (d) {
    gsap.fromTo(endLines, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: motion().ease, stagger: 0.15, delay: 0.7 });
    gsap.fromTo(links, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 1.5 });
  } else gsap.set([endLines, links], { opacity: 1, yPercent: 0 });
}

function togglePoster() {
  if (!final) return;
  const f = finalTransform();
  const full = gsap.getProperty(poster, 'scale') > 0.9;
  gsap.to(poster, full ? { ...f, duration: 0.9, ease: 'expo.inOut' } : { scale: 1, x: 0, y: 0, duration: 0.9, ease: 'expo.inOut' });
  gsap.to(end, { autoAlpha: full ? 1 : 0, duration: 0.4 });
}

export default {
  el,
  cue: 'Remember',
  cursor: 'Look',
  init() {
    poster.addEventListener('click', togglePoster);
    replay.addEventListener('click', () => { resetState(); window.location.reload(); });
  },
  enter() {
    tl?.kill();
    final = false;
    el.classList.remove('is-final');
    gsap.set(poster, { scale: 1, x: 0, y: 0, autoAlpha: 1 });
    gsap.set(end, { visibility: 'hidden', opacity: 1 });
    const { pl } = build();
    const chars = splitChars(title, TITLE);
    title.style.fontSize = `${fitText(title, window.innerWidth - 40, window.innerHeight * 0.7, { max: 260 })}px`;

    const ordered = Object.values(nodes)
      .sort((a, b) => dist(a) - dist(b)).map((n) => n.querySelector('.p-in'));
    const len = pl.getTotalLength ? pl.getTotalLength() : 0;
    gsap.set(pl, { strokeDasharray: len, strokeDashoffset: len });

    if (reduced) {
      gsap.set(title, { autoAlpha: 0 });
      gsap.set(pl, { strokeDashoffset: 0 });
      toFinal(false);
      return gsap.timeline();
    }

    gsap.set(title, { autoAlpha: 1 });
    gsap.set(ordered, { clipPath: 'inset(50% 50% 50% 50%)' });
    gsap.set(discNode, { scale: 0 });
    const m = motion();
    tl = gsap.timeline();
    tl.fromTo(chars, { yPercent: 120, opacity: 0, rotation: () => gsap.utils.random(-8, 8) },
      { yPercent: 0, opacity: 1, rotation: 0, duration: 0.9, ease: 'expo.out', stagger: state.world === 'noise' ? { each: 0.02, from: 'random' } : 0.025 }, 0.2)
      .to(chars, { yPercent: () => gsap.utils.random(-260, 260), xPercent: () => gsap.utils.random(-200, 200), rotation: () => gsap.utils.random(-90, 90), opacity: 0, duration: 0.9, ease: 'expo.in', stagger: { each: 0.01, from: 'center' } }, 2.4)
      .to(discNode, { scale: 1, duration: 0.8, ease: m.pop }, 3.0)
      .to(ordered, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.out', stagger: 0.12 }, 3.1)
      .to(pl, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }, 3.2)
      .add(() => toFinal(true), 6.4);
    return gsap.timeline();
  },
  leave() {
    tl?.kill();
    gsap.set(end, { visibility: 'hidden' });
    return gsap.timeline();
  },
  resize() {
    if (!el.classList.contains('is-active')) return;
    build();
    if (final) gsap.set(poster, finalTransform());
  },
};

function dist(n) {
  const d = discNode.getBoundingClientRect();
  const x = gsap.getProperty(n, 'x') + gsap.getProperty(n, 'width') / 2;
  const y = gsap.getProperty(n, 'y') + gsap.getProperty(n, 'height') / 2;
  return Math.hypot(x - (parseFloat(discNode.style.left) + d.width / 2), y - (parseFloat(discNode.style.top) + d.height / 2));
}

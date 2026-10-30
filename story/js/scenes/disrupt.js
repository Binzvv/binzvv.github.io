// 03 — DISRUPT · Adaptation
// A strict grid composition. Drag the disc anywhere: the system re-partitions the grid around it
// and every element re-fits its new cell. It can be broken, but never made ugly.

import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable.js';
import { state, motion, reduced, onWorld } from '../state.js';
import { fitText } from '../fit.js';

gsap.registerPlugin(Draggable);

export const ORDER = ['head', 'img', 'word', 'bars', 'img2', 'cap', 'num'];
const TEXT = { head: 'single', num: 'single', word: 'multi', cap: 'small' };
const START = { c: 0.8, r: 0.5 };

export function boardBox(W, H) {
  const g = Math.min(40, Math.max(16, W * 0.024));
  const hud = Math.min(84, Math.max(56, H * 0.08));
  const top = hud + 6, bottom = hud + (W < 720 ? 34 : 40);
  return { x: g, y: top, w: W - g * 2, h: H - top - bottom };
}

// Guillotine partition of the grid around the disruptor.
export function computeLayout(W, H, cellN, box = boardBox(W, H)) {
  const portrait = H > W;
  const cols = portrait ? 6 : 12, rows = portrait ? 10 : 8;
  const cw = box.w / cols, ch = box.h / rows;
  const dc = 2, dr = 2;
  const c0 = gsap.utils.clamp(0, cols - dc, Math.round(cellN.c * (cols - dc)));
  const r0 = gsap.utils.clamp(0, rows - dr, Math.round(cellN.r * (rows - dr)));
  const vert = (c0 + r0) % 2 === 1;

  let regions = vert ? [
    { c: 0, r: 0, w: c0, h: rows },
    { c: c0 + dc, r: 0, w: cols - c0 - dc, h: rows },
    { c: c0, r: 0, w: dc, h: r0 },
    { c: c0, r: r0 + dr, w: dc, h: rows - r0 - dr },
  ] : [
    { c: 0, r: 0, w: cols, h: r0 },
    { c: 0, r: r0 + dr, w: cols, h: rows - r0 - dr },
    { c: 0, r: r0, w: c0, h: dr },
    { c: c0 + dc, r: r0, w: cols - c0 - dc, h: dr },
  ];
  regions = regions.filter((r) => r.w > 0 && r.h > 0);
  const area = (r) => r.w * cw * r.h * ch;

  while (regions.length < ORDER.length) {
    regions.sort((a, b) => area(b) - area(a));
    const i = regions.findIndex((r) => r.w > 1 || r.h > 1);
    if (i < 0) break;
    const R = regions[i];
    const ratio = (R.c + R.r) % 2 ? 0.382 : 0.618;
    const byCols = (R.w * cw >= R.h * ch && R.w > 1) || R.h < 2;
    let a, b;
    if (byCols) {
      const k = gsap.utils.clamp(1, R.w - 1, Math.round(R.w * ratio));
      a = { ...R, w: k }; b = { ...R, c: R.c + k, w: R.w - k };
    } else {
      const k = gsap.utils.clamp(1, R.h - 1, Math.round(R.h * ratio));
      a = { ...R, h: k }; b = { ...R, r: R.r + k, h: R.h - k };
    }
    regions.splice(i, 1, a, b);
  }
  regions.sort((a, b) => area(b) - area(a));

  const toPx = (r) => ({ x: box.x + r.c * cw, y: box.y + r.r * ch, w: r.w * cw, h: r.h * ch });
  const rects = {};
  ORDER.forEach((id, i) => { rects[id] = regions[i] ? toPx(regions[i]) : null; });
  const cell = toPx({ c: c0, r: r0, w: dc, h: dr });
  const d = Math.min(cell.w, cell.h) * 0.92;
  return {
    cols, rows, cw, ch, box, c0, r0, vert, rects,
    disc: { x: cell.x + (cell.w - d) / 2, y: cell.y + (cell.h - d) / 2, d },
    cellN: { c: c0 / (cols - dc), r: r0 / (rows - dr) },
  };
}

// Place one element (scene 03 or the final poster) into its rect, fitting its type.
export function placeElement(node, id, rect, { animate = true, gut = 14, dur, ease, delay = 0 } = {}) {
  if (!rect) { gsap.set(node, { autoAlpha: 0 }); return; }
  const m = motion();
  const props = { x: rect.x, y: rect.y, width: rect.w, height: rect.h, autoAlpha: 1 };
  const text = node.querySelector('.d-text');
  const iw = rect.w - gut, ih = rect.h - gut;
  let fs = null;
  if (text && TEXT[id] === 'single') {
    const vert = ih > iw * 1.25;
    node.classList.toggle('is-vert', vert);
    fs = fitText(text, vert ? ih : iw, vert ? iw : ih, { single: true }) * 0.98;
  } else if (text && TEXT[id] === 'multi') {
    fs = fitText(text, iw, ih, { max: 400 }) * 0.96;
    gsap.set(text, { width: iw });
  } else if (text && TEXT[id] === 'small') {
    fs = fitText(text, iw, ih, { min: 8, max: 15 });
  }
  if (animate && !reduced) {
    gsap.to(node, { ...props, duration: dur ?? m.dur, ease: ease ?? m.ease, delay, overwrite: 'auto' });
    if (fs) gsap.to(text, { fontSize: fs, duration: dur ?? m.dur, ease: ease ?? m.ease, delay, overwrite: 'auto' });
  } else {
    gsap.set(node, props);
    if (fs) gsap.set(text, { fontSize: fs });
  }
}

const el = document.querySelector('.s3');
const board = el.querySelector('.s3-board');
const grid = el.querySelector('.s3-grid');
const disc = el.querySelector('.d-disc');
const count = el.querySelector('.s3-count');
const nodes = Object.fromEntries(ORDER.map((id) => [id, board.querySelector(`[data-id="${id}"]`)]));
const inners = Object.fromEntries(ORDER.map((id) => [id, nodes[id].querySelector('.d-in')]));
const bars = el.querySelector('.bars');

let L = null, dragging = false, drag = null, lastSample = 0, active = false;
let cellN = { ...START };

function gut() { return parseFloat(getComputedStyle(el).getPropertyValue('--gut')) || 14; }

function buildBars() {
  bars.innerHTML = '';
  for (let i = 0; i < 28; i++) bars.appendChild(document.createElement('i'));
  shuffleBars(false);
}
function shuffleBars(animate = true) {
  const m = motion();
  [...bars.children].forEach((b, i) => {
    const h = 15 + Math.abs(Math.sin(i * 1.7 + state.disrupt.moves * 0.9)) * 85;
    animate && !reduced ? gsap.to(b, { height: `${h}%`, duration: m.dur, ease: m.ease, delay: i * 0.008 }) : gsap.set(b, { height: `${h}%` });
  });
}

function drawGrid() {
  const { box, cw, ch } = L;
  Object.assign(grid.style, {
    left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px`, position: 'absolute',
    backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
    backgroundSize: `${cw}px ${ch}px`,
    boxShadow: 'inset -1px -1px 0 var(--line)',
  });
}

function layout(animate = true) {
  const W = el.clientWidth || window.innerWidth, H = el.clientHeight || window.innerHeight;
  L = computeLayout(W, H, cellN);
  drawGrid();
  const g = gut();
  const m = motion();
  ORDER.forEach((id, i) => placeElement(nodes[id], id, L.rects[id], { animate, gut: g, delay: animate && !reduced ? i * (state.world === 'silence' ? 0.04 : 0.015) : 0 }));
  gsap.set(disc, { width: L.disc.d, height: L.disc.d });
  if (!dragging) {
    animate && !reduced
      ? gsap.to(disc, { x: L.disc.x, y: L.disc.y, duration: m.dur, ease: m.ease, overwrite: 'auto' })
      : gsap.set(disc, { x: L.disc.x, y: L.disc.y });
  }
  state.disrupt.cell = L.cellN;
  state.disrupt.vertical = L.vert;
}

function cellFromPoint(cx, cy) {
  const { box, cols, rows, cw, ch } = L;
  const c = gsap.utils.clamp(0, cols - 2, Math.round((cx - box.x) / cw - 1));
  const r = gsap.utils.clamp(0, rows - 2, Math.round((cy - box.y) / ch - 1));
  return { c, r, n: { c: c / (cols - 2), r: r / (rows - 2) } };
}

function disturbed(c, r) {
  if (c === L.c0 && r === L.r0) return false;
  state.disrupt.moves++;
  count.textContent = `Disruptions ${String(state.disrupt.moves).padStart(2, '0')}`;
  return true;
}

function push(cx, cy, vx) {
  ORDER.forEach((id) => {
    const r = L.rects[id];
    if (!r) return;
    const ex = r.x + r.w / 2, ey = r.y + r.h / 2;
    const dx = ex - cx, dy = ey - cy, dist = Math.hypot(dx, dy) || 1;
    const f = Math.max(0, 1 - dist / (Math.max(L.box.w, L.box.h) * 0.5)) ** 2 * 36;
    gsap.to(inners[id], {
      x: (dx / dist) * f, y: (dy / dist) * f,
      skewX: state.world === 'silence' ? 0 : gsap.utils.clamp(-10, 10, -vx * 0.4) * motion().jitter,
      duration: 0.5, ease: 'power3.out', overwrite: 'auto',
    });
  });
}
function release() {
  ORDER.forEach((id) => gsap.to(inners[id], { x: 0, y: 0, skewX: 0, duration: reduced ? 0 : 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
}

function initDrag() {
  [drag] = Draggable.create(disc, {
    type: 'x,y',
    bounds: { minX: 0, minY: 0, maxX: window.innerWidth, maxY: window.innerHeight },
    zIndexBoost: false,
    onPress() {
      dragging = true;
      this.applyBounds({ minX: L.box.x - L.disc.d * 0.25, minY: L.box.y - L.disc.d * 0.25, maxX: L.box.x + L.box.w - L.disc.d * 0.75, maxY: L.box.y + L.box.h - L.disc.d * 0.75 });
      gsap.to(disc, { scale: 1.12, duration: 0.3, ease: 'power3.out' });
      gsap.to(grid, { opacity: 1, duration: 0.3 });
      document.querySelector('.cursor')?.classList.add('is-down');
    },
    onDrag() {
      const cx = this.x + L.disc.d / 2, cy = this.y + L.disc.d / 2;
      const now = performance.now();
      if (now - lastSample > 40) {
        lastSample = now;
        state.disrupt.path.push([(cx - L.box.x) / L.box.w, (cy - L.box.y) / L.box.h]);
        if (state.disrupt.path.length > 240) state.disrupt.path.shift();
      }
      const { c, r, n } = cellFromPoint(cx, cy);
      if (disturbed(c, r)) { cellN = n; layout(true); shuffleBars(true); }
      push(cx, cy, this.deltaX);
    },
    onRelease() {
      dragging = false;
      gsap.to(disc, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      gsap.to(grid, { opacity: 0.45, duration: 0.6 });
      document.querySelector('.cursor')?.classList.remove('is-down');
      release();
      layout(true);
    },
  });
}

function onKey(e) {
  const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (!map[e.key]) return;
  e.preventDefault();
  e.stopPropagation();
  const [dx, dy] = map[e.key];
  const c = gsap.utils.clamp(0, L.cols - 2, L.c0 + dx), r = gsap.utils.clamp(0, L.rows - 2, L.r0 + dy);
  if (disturbed(c, r)) {
    cellN = { c: c / (L.cols - 2), r: r / (L.rows - 2) };
    const b = L.box;
    state.disrupt.path.push([(b.x + (c + 1) * L.cw - b.x) / b.w, (b.y + (r + 1) * L.ch - b.y) / b.h]);
    layout(true); shuffleBars(true);
  }
}

export default {
  el,
  cue: 'Break it',
  cursor: 'Drag the disc',
  init() {
    buildBars();
    initDrag();
    disc.addEventListener('keydown', onKey);
    gsap.set(grid, { opacity: 0.45 });
    onWorld(() => active && requestAnimationFrame(() => layout(false)));
  },
  enter() {
    active = true;
    layout(false);
    const tl = gsap.timeline();
    if (reduced) return tl;
    const m = motion();
    // The composition assembles from the grid outward.
    tl.fromTo(grid, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'expo.inOut' }, 0)
      .fromTo(ORDER.map((id) => inners[id]), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.2)
      .fromTo(disc, { scale: 0, rotation: -120 }, { scale: 1, rotation: 0, duration: 1, ease: m.pop }, 0.6)
      .fromTo(disc, { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 3, ease: 'power1.inOut' }, 1.8);
    return tl;
  },
  leave(dir) {
    const tl = gsap.timeline({ onComplete: () => { active = false; } });
    if (reduced) return tl;
    tl.to(ORDER.map((id) => inners[id]), { clipPath: dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)', duration: 0.5, ease: 'expo.in', stagger: 0.03 }, 0)
      .to(disc, { scale: 0, duration: 0.4, ease: 'back.in(2)' }, 0)
      .set(ORDER.map((id) => inners[id]), { clipPath: 'none' })
      .set(disc, { scale: 1 });
    return tl;
  },
  resize() { if (active) layout(false); },
};

import { Pipeline } from './gl/pipeline.js';
import { createEnergy } from './energy.js';
import { createApp } from './app.js';

// ─────────────────────────────────────────────────────────────────────────────
// Boot: WebGL energy engine + product layer + adaptive render loop.
// If WebGL is unavailable the product still works, just without the energy.
// ─────────────────────────────────────────────────────────────────────────────

const gsap = window.gsap;
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const canvas = document.getElementById('gl');

let pipe = null;
try {
  pipe = new Pipeline(canvas);
} catch (e) {
  console.warn('WebGL unavailable, running without the energy field.', e);
  canvas.style.display = 'none';
}

const energy = createEnergy(pipe, { reducedMotion });

if (pipe) {
  try {
    const meta = await fetch('assets/swoosh-sdf.json').then((r) => r.json());
    await pipe.loadSwoosh('assets/swoosh-sdf.png', meta);
  } catch (e) {
    console.warn('Swoosh field failed to load', e);
  }
}

await document.fonts?.ready;
const app = createApp({ energy, reducedMotion });

// iOS: no pinch / double-tap zoom, no rubber-band
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => { if (!e.target.closest('.sheet')) e.preventDefault(); }, { passive: false });

// ── adaptive resolution ─────────────────────────────────────────────────────
// Walks the field resolution until frame time sits comfortably inside budget.
// The composite always runs at native resolution so type and grain stay crisp.
const params = new URLSearchParams(location.search);
const quality = { acc: 0, n: 0, cooldown: 90 };
function adapt(dtMs) {
  if (!pipe || params.has('scale')) return;
  quality.acc += dtMs;
  quality.n++;
  if (quality.cooldown > 0) { quality.cooldown--; quality.acc = 0; quality.n = 0; return; }
  if (quality.n < 45) return;
  const avg = quality.acc / quality.n;
  quality.acc = 0; quality.n = 0;
  if (avg > 19) { pipe.setScale(pipe.scale * 0.85); quality.cooldown = 40; }
  else if (avg < 15 && pipe.scale < 0.62) { pipe.setScale(pipe.scale * 1.08); quality.cooldown = 90; }
}
if (pipe && params.has('scale')) pipe.setScale(parseFloat(params.get('scale')));

let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => pipe?.resize(), 120);
});

// ── loop (driven by GSAP's ticker so choreography and render share a clock) ─
let lastT = performance.now();
gsap.ticker.lagSmoothing(500, 33);
gsap.ticker.add(() => {
  const now = performance.now();
  const dtReal = (now - lastT) / 1000;
  lastT = now;
  const dt = Math.min(dtReal, 0.1);

  app.update(dt, dtReal);
  if (pipe && document.visibilityState === 'visible') {
    pipe.uniforms.time += dt;
    energy.apply(dt, pipe.uniforms.time);
    pipe.render(dt);
    adapt(dt * 1000);
  }
});

// ── PWA ─────────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.__nrc = { app, energy, pipe };

import { Pipeline } from './gl/pipeline.js';

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1: energy shader in isolation (review build).
// Tap anywhere to step through the rendering layers.
// ─────────────────────────────────────────────────────────────────────────────

const gsap = window.gsap;
const canvas = document.getElementById('gl');
const hud = document.getElementById('hud');
const params = new URLSearchParams(location.search);

let pipe;
try {
  pipe = new Pipeline(canvas);
} catch (e) {
  hud.textContent = 'WEBGL2 UNAVAILABLE';
  throw e;
}
const U = pipe.uniforms;

// Release-state baseline
const state = { energy: 1, rise: 1, core: 1, coreY: 0.56, perim: 0 };

const VIEWS = [
  { id: 'composite', label: 'COMPOSITE · RELEASE FIELD', mask: [1, 1, 1, 0], perim: 0, optics: true },
  { id: 'rise', label: 'ERUPTION LOOP', mask: [1, 1, 1, 0], perim: 0, optics: true, rise: true },
  { id: 'plasma', label: 'L2+L3 · PLASMA BODY / HUE DEPTH', mask: [1, 0, 0, 0], perim: 0, optics: true },
  { id: 'core', label: 'L4 · HOT CORE', mask: [0, 1, 0, 0], perim: 0, optics: true },
  { id: 'shafts', label: 'L5 · SHAFTS + FILAMENTS', mask: [0, 0, 1, 0], perim: 0, optics: true },
  { id: 'raw', label: 'RAW FIELD · NO OPTICS', mask: [1, 1, 1, 0], perim: 0, optics: false },
  { id: 'perimeter', label: 'L8 · PERIMETER FIELD', mask: [0, 0, 0, 1], perim: 1, optics: true },
];

let viewIndex = Math.max(0, VIEWS.findIndex((v) => v.id === params.get('view')));
let riseTl = null;

function applyView(i) {
  viewIndex = (i + VIEWS.length) % VIEWS.length;
  const v = VIEWS[viewIndex];
  U.mask.set(...v.mask);
  U.optics = v.optics;
  gsap.to(state, { perim: v.perim, duration: 0.6, ease: 'power2.out' });

  riseTl?.kill();
  riseTl = null;
  if (v.rise) {
    // Aggressive acceleration → controlled deceleration, then hold and reset.
    riseTl = gsap.timeline({ repeat: -1, repeatDelay: 0.4 });
    riseTl
      .set(state, { rise: 0, core: 0, coreY: 0.08, energy: 0.6 })
      .to(state, { rise: 1, duration: 1.15, ease: 'expo.out' }, 0)
      .to(state, { energy: 1, duration: 0.5, ease: 'power3.out' }, 0)
      .to(state, { core: 1, duration: 0.35, ease: 'power2.out' }, 0.05)
      .to(state, { coreY: 0.56, duration: 1.3, ease: 'expo.out' }, 0.05)
      .to({}, { duration: 2.2 });
  } else {
    gsap.to(state, { rise: 1, core: 1, coreY: 0.56, energy: 1, duration: 0.5, ease: 'power2.out' });
  }
  hud.querySelector('.label').textContent = `${String(viewIndex + 1).padStart(2, '0')}/${String(VIEWS.length).padStart(2, '0')}  ${v.label}`;
}

canvas.addEventListener('pointerup', () => applyView(viewIndex + 1));
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') applyView(viewIndex + 1);
  if (e.key === 'ArrowLeft') applyView(viewIndex - 1);
});
if (params.has('clean')) hud.style.display = 'none';

// ── adaptive resolution ─────────────────────────────────────────────────────
// Averages GPU-bound frame time and walks the field resolution up/down.
// Composite always runs at native res, so text and grain stay crisp.
const quality = { acc: 0, n: 0, cooldown: 0 };
function adapt(dtMs) {
  if (params.has('scale')) return;
  quality.acc += dtMs;
  quality.n++;
  if (quality.cooldown > 0) { quality.cooldown--; return; }
  if (quality.n < 40) return;
  const avg = quality.acc / quality.n;
  quality.acc = 0; quality.n = 0;
  if (avg > 19.5) { pipe.setScale(pipe.scale * 0.85); quality.cooldown = 30; }
  else if (avg < 14.5 && pipe.scale < 0.8) { pipe.setScale(pipe.scale * 1.08); quality.cooldown = 60; }
}
if (params.has('scale')) pipe.setScale(parseFloat(params.get('scale')));

let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => pipe.resize(), 120);
});

// ── loop ────────────────────────────────────────────────────────────────────
let last = performance.now();
let fpsAcc = 0, fpsN = 0;
const fpsEl = hud.querySelector('.fps');
function frame(now) {
  const dtMs = Math.min(now - last, 100);
  last = now;
  const dt = dtMs / 1000;

  U.time += dt;
  // a living breath on the field, never perfectly static
  const breath = 0.94 + 0.06 * Math.sin(U.time * 1.7) * Math.sin(U.time * 0.61 + 1.3);
  U.energy = state.energy * breath;
  U.rise = state.rise;
  U.core = state.core * (0.95 + 0.05 * Math.sin(U.time * 9.0) * Math.sin(U.time * 3.3));
  U.coreY = state.coreY + Math.sin(U.time * 0.8) * 0.006;
  U.perim = state.perim;

  pipe.render(dt);
  adapt(dtMs);

  fpsAcc += dtMs; fpsN++;
  if (fpsN >= 30) {
    fpsEl.textContent = `${Math.round(1000 / (fpsAcc / fpsN))} FPS · ${pipe.scale.toFixed(2)}× · ${pipe.hdr ? 'HDR' : 'LDR'}`;
    fpsAcc = 0; fpsN = 0;
  }
  requestAnimationFrame(frame);
}

applyView(viewIndex);
requestAnimationFrame(frame);

// Expose for headless capture / tuning from the console
window.__unleash = { pipe, state, applyView };

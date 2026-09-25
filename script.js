import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Composition — Figma frame "World 5000x3200" (node 7:5), bottom-to-top layer
// order. x/y/w/h are the exact Figma values. Images live in assets/cards/.
// ---------------------------------------------------------------------------
const FRAME = { w: 5000, h: 3200 };

const CARDS = [
  { id: '8-15',  x: 1062, y: 1301,    w: 965,  h: 965 },
  { id: '8-8',   x: 1967, y: 634,     w: 836,  h: 966 },
  { id: '8-20',  x: 2710, y: 240.73,  w: 710,  h: 913.53 },
  { id: '8-13',  x: 3318, y: 1254.03, w: 631,  h: 936.94 },
  { id: '8-11',  x: 1052, y: 104,     w: 646,  h: 656.2 },
  { id: '9-55',  x: 1352, y: 2191,    w: 692,  h: 692 },
  { id: '9-75',  x: 3556, y: 2098,    w: 1230, h: 820 },
  { id: '9-79',  x: 3634, y: 302,     w: 1073, h: 715 },
  { id: '9-81',  x: 2168, y: 1669,    w: 919,  h: 577.61 },
  { id: '8-36',  x: 461,  y: 760,     w: 641,  h: 1139.56 },
  { id: '9-99',  x: 2571, y: 2316,    w: 1107, h: 799 },
  { id: '12-16', x: 272,  y: 2118,    w: 649,  h: 882 },
  { id: '9-107', x: 4096, y: 1117,    w: 689.68, h: 687 },
  { id: '12-20', x: 1333, y: 3032,    w: 501,  h: 40, label: 'BINZ® / 2026' },
  { id: '12-22', x: 1967, y: 412,     w: 501,  h: 40, label: 'WORLD_001' },
  { id: '12-21', x: 1232, y: 1011,    w: 501,  h: 40, label: 'BRAND / CULTURE / CODE' },
  { id: '12-42', x: 2754, y: 900,     w: 1200, h: 707 },
  { id: '12-56', x: 161,  y: 104,     w: 995,  h: 586.22 },
];

// ---------------------------------------------------------------------------
// World tuning
// ---------------------------------------------------------------------------
const R = 10;                       // sphere radius (world units)
const RING_FRAMES = 5;              // ring circumference at LAT0, in frame widths (sets scale only)
const LAT0 = THREE.MathUtils.degToRad(45);   // latitude of the frame's vertical centre
// Figma px per radian of arc: RING_FRAMES frame widths wrap once at LAT0.
const PX_PER_RAD = (RING_FRAMES * FRAME.w) / (2 * Math.PI * Math.cos(LAT0));
const UNITS_PER_PX = R / PX_PER_RAD;
const BAND_SPREAD = 0.4;            // Figma Y → latitude, compressed so cards form a ring
const LAYER_BIAS = 0.004;           // pulls higher Figma layers slightly toward the camera

// Camera sits inside the sphere, off-centre; the sphere is tilted so the pole
// it looks toward (the dark centre) sits near screen centre, with the nearest
// wall below/right and the far wall receding up and to the left.
const SPHERE_CENTRE = new THREE.Vector3(-2.6, 6.6, -4.2);
const SPHERE_TILT = new THREE.Euler(
  THREE.MathUtils.degToRad(-30),
  THREE.MathUtils.degToRad(-13),
  0,
  'YXZ'
);

// Depth: distance from camera → brightness / opacity
const DIM_NEAR = 7;                 // at or nearer: full base brightness
const DIM_FAR = 21;                 // at or beyond: black
const FADE_START = 16;              // opacity starts dropping
const FADE_END = 19.5;              // fully gone (the empty centre)
const BASE_BRIGHTNESS = 0.6;        // resting cards are dimmed…
const HOVER_BRIGHTNESS = 1.0;       // …the hovered card comes up to full

// Motion
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOLLOW_TAU = 0.035;           // s, light smoothing while dragging
const GLIDE_TAU = reduceMotion ? 0.04 : 0.28;  // s, ≈1s glide to rest, no bounce
const HOVER_TAU = 0.1;              // s, ≈0.3s brightness transition
const WHEEL_RAD_PER_PX = 0.8;       // spin (rad) per viewport-height of wheel travel
const LAT_MIN = -0.32;              // latitude offset clamp (keeps the band in view)
const LAT_MAX = 0.32;

// ---------------------------------------------------------------------------
// Renderer / scene / fixed camera
// ---------------------------------------------------------------------------
const canvas = document.getElementById('world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);  // at origin, looking down -Z, never moves

const tilt = new THREE.Matrix4().makeRotationFromEuler(SPHERE_TILT);

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------
const geometry = new THREE.PlaneGeometry(1, 1);
const loader = new THREE.TextureLoader();
const maxAniso = renderer.capabilities.getMaxAnisotropy();

function placeholderTexture(card) {
  const scale = card.label ? 4 : 0.25;
  const c = document.createElement('canvas');
  c.width = Math.max(2, Math.round(card.w * scale));
  c.height = Math.max(2, Math.round(card.h * scale));
  const g = c.getContext('2d');
  if (card.label) {
    g.fillStyle = '#fff';
    g.font = `500 ${Math.round(c.height * 0.55)}px Helvetica, Arial, sans-serif`;
    g.textBaseline = 'middle';
    g.fillText(card.label, 0, c.height / 2);
  } else {
    // Mid-grey stand-in with a per-card tone until the Figma export is in assets/.
    const tone = 110 + (parseInt(card.id.replace('-', ''), 10) * 37) % 90;
    g.fillStyle = `rgb(${tone},${tone},${tone})`;
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#222';
    g.font = `${Math.round(c.width * 0.07)}px Helvetica, Arial, sans-serif`;
    g.fillText(card.id, c.width * 0.06, c.width * 0.12);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const materials = CARDS.map((card) => {
  const material = new THREE.MeshBasicMaterial({
    map: placeholderTexture(card),
    transparent: true,
    depthWrite: false,
  });
  const src = `assets/cards/${card.id}.${card.label ? 'png' : 'jpg'}`;
  loader.load(src, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    material.map.dispose();
    material.map = tex;
    material.needsUpdate = true;
  }, undefined, () => {});
  return material;
});

// One instance of every element, each an independent object on the ring:
// Figma X order sets its slot around the full circumference (evenly spaced),
// Figma Y its latitude (distance from the dark centre); size stays at ring scale.
const ringOrder = CARDS.map((c) => c.x + c.w / 2).sort((a, b) => a - b);
const tiles = [];
CARDS.forEach((card, layer) => {
  // Each tile gets its own material so brightness/opacity are per tile.
  const mesh = new THREE.Mesh(geometry, materials[layer].clone());
  // Rigid and upright: never rotated, always parallel to the screen.
  mesh.scale.set(card.w * UNITS_PER_PX, card.h * UNITS_PER_PX, 1);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  const tile = {
    mesh,
    lon: (2 * Math.PI * ringOrder.indexOf(cx)) / CARDS.length,
    lat: LAT0 - BAND_SPREAD * (cy - FRAME.h / 2) / PX_PER_RAD,
    radius: R * (1 - layer * LAYER_BIAS),
    hover: 0,
  };
  mesh.userData = { tile, base: materials[layer] };
  tiles.push(tile);
  scene.add(mesh);
});

// Share late-loading textures with every clone.
function syncMaps() {
  for (const t of tiles) {
    const base = t.mesh.userData.base;
    if (t.mesh.material.map !== base.map) {
      t.mesh.material.map = base.map;
      t.mesh.material.needsUpdate = true;
    }
  }
}

// ---------------------------------------------------------------------------
// Navigation state: spin (around the pole) and latitude offset (toward/away
// from the dark centre). The world moves; the camera never does.
// ---------------------------------------------------------------------------
const nav = {
  spin: -Math.PI * 0.75, spinTarget: -Math.PI * 0.75, spinVel: 0,
  lat: 0, latTarget: 0, latVel: 0,
};

const tmp = new THREE.Vector3();

function tilePosition(t, out, spin = nav.spin, latOffset = nav.lat) {
  const lon = t.lon + spin;
  const lat = t.lat + latOffset;
  const cl = Math.cos(lat);
  out.set(cl * Math.cos(lon), cl * Math.sin(lon), -Math.sin(lat)).multiplyScalar(t.radius);
  return out.applyMatrix4(tilt).add(SPHERE_CENTRE);
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function layout(dt) {
  for (const t of tiles) {
    const p = tilePosition(t, t.mesh.position);
    const d = p.length();
    const visible = p.z < -0.2;
    t.mesh.visible = visible;
    if (!visible) continue;

    const k = 1 - Math.exp(-dt / HOVER_TAU);
    t.hover += ((t === hovered ? 1 : 0) - t.hover) * k;

    const depth = 1 - smoothstep(DIM_NEAR, DIM_FAR, d);
    const bright = depth * depth * (BASE_BRIGHTNESS + (HOVER_BRIGHTNESS - BASE_BRIGHTNESS) * t.hover);
    t.mesh.material.color.setScalar(bright);
    t.mesh.material.opacity = 1 - smoothstep(FADE_START, FADE_END, d);
  }
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const pointer = { x: 0, y: 0, inside: false };
let drag = null;
let hovered = null;
const samples = [];

function screenOf(t, spin, latOffset) {
  tilePosition(t, tmp, spin, latOffset).project(camera);
  return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight };
}

// The card nearest the pointer; dragging keeps it under the pointer.
function grabTile(x, y) {
  let best = null, bestD = Infinity;
  for (const t of tiles) {
    if (!t.mesh.visible || t.mesh.material.opacity < 0.2) continue;
    const s = screenOf(t, nav.spin, nav.lat);
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) { bestD = d; best = t; }
  }
  return best;
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add('dragging');
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, tile: grabTile(e.clientX, e.clientY) };
  nav.spinVel = nav.latVel = 0;
  nav.spinTarget = nav.spin;
  nav.latTarget = nav.lat;
  samples.length = 0;
  hovered = null;
});

canvas.addEventListener('pointermove', (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.inside = true;
  if (!drag || e.pointerId !== drag.id) return;

  // Solve for the spin/latitude change that moves the grabbed card by the
  // pointer delta (local Jacobian), so the surface feels held under the finger.
  const t = drag.tile;
  if (t) {
    const e1 = 1e-3;
    const s0 = screenOf(t, nav.spinTarget, nav.latTarget);
    const sS = screenOf(t, nav.spinTarget + e1, nav.latTarget);
    const sL = screenOf(t, nav.spinTarget, nav.latTarget + e1);
    const a = (sS.x - s0.x) / e1, c = (sS.y - s0.y) / e1;   // d(screen)/d(spin)
    const b = (sL.x - s0.x) / e1, d = (sL.y - s0.y) / e1;   // d(screen)/d(lat)
    const det = a * d - b * c;
    if (Math.abs(det) > 1e-3) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      nav.spinTarget += (d * dx - b * dy) / det;
      nav.latTarget = THREE.MathUtils.clamp(nav.latTarget + (a * dy - c * dx) / det, LAT_MIN, LAT_MAX);
    }
  }

  drag.x = e.clientX;
  drag.y = e.clientY;
  const now = performance.now();
  samples.push({ t: now, spin: nav.spinTarget, lat: nav.latTarget });
  while (samples.length && now - samples[0].t > 100) samples.shift();
});

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  canvas.classList.remove('dragging');
  drag = null;
  const now = performance.now();
  while (samples.length && now - samples[0].t > 100) samples.shift();
  if (samples.length > 1) {
    const a = samples[0], b = samples[samples.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    nav.spinVel = (b.spin - a.spin) / dt;
    nav.latVel = (b.lat - a.lat) / dt;
  }
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => { pointer.inside = false; });

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey) return; // pinch: no zoom in V01
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
  // Impulse whose glide covers the same arc a drag of that many px would.
  const rad = (e.deltaX + e.deltaY) * unit * WHEEL_RAD_PER_PX / innerHeight;
  nav.spinVel -= rad / GLIDE_TAU;
}, { passive: false });

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function updateHover() {
  if (drag || !pointer.inside || !matchMedia('(hover: hover)').matches) { hovered = null; return; }
  ndc.set(pointer.x / innerWidth * 2 - 1, -(pointer.y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(scene.children, false)
    .filter((h) => h.object.visible && h.object.material.opacity > 0.2);
  hovered = hits.length ? hits[0].object.userData.tile : null;
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------
function resize() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = aspect;
  // Keep at least ~64° horizontally on portrait screens.
  const minHFov = THREE.MathUtils.degToRad(64);
  const vFov = Math.max(THREE.MathUtils.degToRad(60), 2 * Math.atan(Math.tan(minHFov / 2) / aspect));
  camera.fov = Math.min(THREE.MathUtils.radToDeg(vFov), 100);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!drag) {
    // Free glide: exponential decay, no overshoot.
    nav.spinTarget += nav.spinVel * dt;
    nav.latTarget = THREE.MathUtils.clamp(nav.latTarget + nav.latVel * dt, LAT_MIN, LAT_MAX);
    const decay = Math.exp(-dt / GLIDE_TAU);
    nav.spinVel *= decay;
    nav.latVel *= decay;
    if (nav.latTarget === LAT_MIN || nav.latTarget === LAT_MAX) nav.latVel = 0;
  }
  const follow = 1 - Math.exp(-dt / FOLLOW_TAU);
  nav.spin += (nav.spinTarget - nav.spin) * follow;
  nav.lat += (nav.latTarget - nav.lat) * follow;

  syncMaps();
  updateHover();
  layout(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

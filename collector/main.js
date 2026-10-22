/*
 * The Collector — scroll-driven 2.5D prototype.
 *
 * Everything on screen is a pure function of one normalised progress value `p`
 * (0..1, from the pinned section's scroll position). Ambient motion (fog drift,
 * artefact hover) uses time but never changes the scene's state, so scrolling
 * backwards always restores earlier frames.
 */
(() => {
  'use strict';

  const ACID = '220,255,46';
  const TAU = Math.PI * 2;

  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  const ctx = canvas.getContext('2d');
  const journey = $('journey');
  const ui = {
    title: $('title'), cue: $('cue'), marker: $('marker'), collect: $('lineCollect'),
    finale: $('finale'), replay: $('replay'), chapter: $('chapter'), coords: $('coords'),
    dist: $('dist'), elev: $('elev'), bar: $('bar'),
  };

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches;

  // ---------------------------------------------------------------- math

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const win = (p, a, b, c, d) => smooth(a, b, p) * (1 - smooth(c, d, p));
  const frac = (x) => x - Math.floor(x);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const rot = (x, y, a) => { const c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; };

  const hash = (i, sd) => { const x = Math.sin(i * 127.1 + sd * 311.7) * 43758.5453123; return x - Math.floor(x); };
  const vnoise = (x, sd) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i, sd), hash(i + 1, sd), u); };
  const fbm = (x, sd, oct = 4) => {
    let a = 0.5, s = 0, n = 0, fr = 1;
    for (let o = 0; o < oct; o++) { s += a * vnoise(x * fr, sd + o * 13.7); n += a; a *= 0.5; fr *= 2.07; }
    return s / n;
  };
  const ridged = (x, sd, oct = 4) => {
    let a = 0.5, s = 0, n = 0, fr = 1;
    for (let o = 0; o < oct; o++) { const v = 1 - Math.abs(vnoise(x * fr, sd + o * 7.3) * 2 - 1); s += a * v * v; n += a; a *= 0.5; fr *= 2.1; }
    return s / n;
  };

  const hexRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };

  // -------------------------------------------------------------- layout

  let W = 0, Hh = 0, DPR = 1;
  let U = 0;      // composition unit (≈ viewport height, capped on portrait)
  let H = 0;      // traveller height
  let S = 0;      // stride: distance covered by one full gait cycle
  let GY = 0;     // ground line on screen
  let D = 0;      // total walking distance
  let TX = 0;     // traveller's screen x during the walk
  const X0 = 0;
  const STRIDES = 16;
  const ZOOM_OUT = 0.8;

  // camera (set every frame)
  let camX = 0, zoom = 1, ax = 0, ay = 0;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === W && h === Hh && dpr === DPR) return;
    W = w; Hh = h; DPR = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    U = Math.min(h, w * 1.35);
    H = U * 0.12;
    S = 0.72 * H;
    D = STRIDES * S;
    GY = h * (w < h ? 0.8 : 0.775);
    TX = w * (w < h ? 0.3 : 0.34);
    buildStructures();
  }

  // ------------------------------------------------------------- terrain

  const groundY = (x) => GY + U * (0.056 * (fbm(x / U * 0.9, 3) - 0.5) + 0.012 * (vnoise(x / U * 7, 9) - 0.5));

  const LAYERS = [
    { par: 0.035, col: '#a9adae', y: (x) => GY - U * 0.30 - U * 0.16 * ridged(x / U * 0.55, 21) },
    { par: 0.08, col: '#91969a', y: (x) => GY - U * 0.215 - U * 0.10 * ridged(x / U * 0.9, 33) },
    { par: 0.2, col: '#75797d', y: (x) => GY - U * 0.15 - U * 0.035 * fbm(x / U * 1.6, 45) },
    { par: 0.45, col: '#4f5357', y: (x) => GY - U * 0.085 - U * 0.04 * fbm(x / U * 1.3, 57) },
    { par: 1, col: '#2a2c2f', y: groundY },
  ];
  const layerByPar = (par) => LAYERS.find((l) => l.par === par);

  // Per-layer zoom: distant layers barely change when the camera eases back.
  const zlAt = (par, z) => 1 + (z - 1) * Math.min(par, 1.6);
  const zl = (par) => zlAt(par, zoom);
  const sx = (par, wx) => ax + (wx - camX * par - ax) * zl(par);
  const sy = (par, wy) => ay + (wy - ay) * zl(par);
  const wxFromSx = (par, X) => (X - ax) / zl(par) + ax + camX * par;
  const surfY = (par, X) => sy(par, layerByPar(par).y(wxFromSx(par, X)));

  function drawLayer(L) {
    ctx.beginPath();
    ctx.moveTo(-10, Hh + 10);
    for (let X = -10; X <= W + 13; X += 3) ctx.lineTo(X, sy(L.par, L.y(wxFromSx(L.par, X))));
    ctx.lineTo(W + 13, Hh + 10);
    ctx.closePath();
    ctx.fillStyle = L.col;
    ctx.fill();
  }

  // Strata and stones give the near ground form and scale.
  function drawGroundDetail() {
    const z = zl(1);
    ctx.lineWidth = 1;
    for (let k = 1; k <= 5; k++) {
      const par = 1 + k * 0.13;
      const depth = U * [0, 0.018, 0.045, 0.085, 0.14, 0.21][k];
      ctx.strokeStyle = `rgba(120,124,128,${0.16 - k * 0.018})`;
      ctx.beginPath();
      let pen = false;
      for (let X = -10; X <= W + 10; X += 4) {
        const wxp = wxFromSx(par, X);
        const on = vnoise(wxp / U * 2.4, 80 + k) > 0.52;
        const y = surfY(1, X) + depth * zl(par) + U * z * 0.012 * (fbm(wxp / U * 3, 70 + k) - 0.5);
        if (on) { pen ? ctx.lineTo(X, y) : ctx.moveTo(X, y); pen = true; } else pen = false;
      }
      ctx.stroke();
    }
    // stones resting on the surface
    const step = U * 0.05;
    const x0 = wxFromSx(1, -20), x1 = wxFromSx(1, W + 20);
    ctx.fillStyle = '#1f2124';
    for (let i = Math.floor(x0 / step); i <= x1 / step; i++) {
      if (hash(i, 5) < 0.55) continue;
      const wx = i * step + hash(i, 6) * step;
      const r = U * (0.003 + 0.011 * Math.pow(hash(i, 7), 2));
      ctx.beginPath();
      ctx.ellipse(sx(1, wx), sy(1, groundY(wx)) + r * 0.25 * z, r * 1.5 * z, r * z, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  function drawForegroundRocks() {
    const par = 1.75, z = zl(par), spacing = U * 0.5;
    const x0 = wxFromSx(par, -U * 0.5), x1 = wxFromSx(par, W + U * 0.5);
    for (let i = Math.floor(x0 / spacing); i <= x1 / spacing; i++) {
      if (hash(i, 91) < 0.38) continue;
      const cx = i * spacing + hash(i, 92) * spacing * 0.6;
      const size = U * (0.05 + 0.12 * hash(i, 93));
      const rh = Math.min(size * z, (Hh - GY) * 0.5);
      const rw = rh * (1.1 + hash(i, 94));
      const bx = sx(par, cx), by = Hh + rh * 0.15;
      ctx.beginPath();
      ctx.moveTo(bx - rw, by + 4);
      for (let j = 0; j <= 10; j++) {
        const a = Math.PI - (j / 10) * Math.PI;
        const r = 0.72 + 0.38 * hash(i * 17 + j, 95);
        ctx.lineTo(bx + Math.cos(a) * rw * r, by - Math.sin(a) * rh * r * (j > 2 && j < 8 ? 1 : 0.8));
      }
      ctx.lineTo(bx + rw, by + 4);
      ctx.lineTo(bx + rw, Hh + 20);
      ctx.lineTo(bx - rw, Hh + 20);
      ctx.closePath();
      ctx.fillStyle = '#121315';
      ctx.fill();
    }
  }

  // --------------------------------------------------------------- fog

  const fogSprite = (() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 192;
    const g = c.getContext('2d');
    for (let i = 0; i < 140; i++) {
      const x = hash(i, 201) * 1024, y = 96 + (hash(i, 202) - 0.5) * 30, r = 30 + hash(i, 203) * 50;
      for (const dx of [-1024, 0, 1024]) {
        const grd = g.createRadialGradient(x + dx, y, 0, x + dx, y, r);
        grd.addColorStop(0, 'rgba(222,223,219,0.14)');
        grd.addColorStop(1, 'rgba(222,223,219,0)');
        g.fillStyle = grd;
        g.fillRect(x + dx - r, y - r, r * 2, r * 2);
      }
    }
    return c;
  })();

  function drawFog(wy, hgt, par, speed, alpha, time) {
    const z = zl(par), tw = Math.max(W * 1.3, 900);
    const off = (((camX * par * z + time * speed) % tw) + tw) % tw;
    const yc = sy(par, wy), hh = hgt * z;
    ctx.globalAlpha = clamp(alpha);
    for (let x = -off; x < W; x += tw) ctx.drawImage(fogSprite, x, yc - hh / 2, tw, hh);
    ctx.globalAlpha = 1;
  }

  // -------------------------------------------------- distant structures

  // Placed so that they spread across the final, eased-back frame.
  const STRUCTURE_DEFS = [
    { id: 1, par: 0.08, fx: 0.1, kind: 'mast', hgt: 0.15 },
    { id: 2, par: 0.2, fx: 0.25, kind: 'dome', hgt: 0.07 },
    { id: 3, par: 0.45, fx: 0.6, kind: 'slab', hgt: 0.12 },
    { id: 4, par: 0.2, fx: 0.77, kind: 'arch', hgt: 0.055 },
    { id: 5, par: 0.45, fx: 0.93, kind: 'tower', hgt: 0.16 },
    { id: 6, par: 0.035, fx: 0.62, kind: 'mast', hgt: 0.07 },
  ];
  let structures = [];

  function finalCamera() {
    const lead = W * 0.06;
    return { camX: X0 + D - TX + lead, zoom: reduced ? 0.9 : ZOOM_OUT, ax: TX - lead };
  }

  function buildStructures() {
    const f = finalCamera();
    structures = STRUCTURE_DEFS.map((d) => {
      const wx = (d.fx * W - f.ax) / zlAt(d.par, f.zoom) + f.ax + f.camX * d.par;
      const col = mix(layerByPar(d.par).col, '#17181a', 0.32);
      return { ...d, wx, col, bx: 0, by: 0, tx: 0, ty: 0, lit: 0 };
    });
  }

  function drawStructure(st) {
    const L = layerByPar(st.par), z = zl(st.par), u = U * z;
    const bx = sx(st.par, st.wx), by = sy(st.par, L.y(st.wx)) + 2 * z;
    const hgt = st.hgt * u;
    ctx.fillStyle = st.col;
    ctx.strokeStyle = st.col;
    let tx = bx, ty = by - hgt;
    ctx.beginPath();
    if (st.kind === 'mast') {
      ctx.lineWidth = Math.max(1, 0.004 * u);
      ctx.moveTo(bx, by); ctx.lineTo(bx, ty);
      for (const k of [0.35, 0.62, 0.84]) { const w = 0.014 * u * (1 - k * 0.5); ctx.moveTo(bx - w, by - hgt * k); ctx.lineTo(bx + w, by - hgt * k); }
      ctx.stroke();
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(bx - 0.05 * u, by); ctx.lineTo(bx, by - hgt * 0.7); ctx.lineTo(bx + 0.045 * u, by);
      ctx.stroke();
    } else if (st.kind === 'dome') {
      const rw = 0.045 * u, rh = hgt * 0.5;
      ctx.ellipse(bx, by, rw, rh, 0, Math.PI, 0);
      ctx.fill();
      ctx.lineWidth = Math.max(1, 0.003 * u);
      ctx.beginPath(); ctx.moveTo(bx + rw * 0.3, by - rh * 0.95); ctx.lineTo(bx + rw * 0.3, ty); ctx.stroke();
      tx = bx + rw * 0.3;
    } else if (st.kind === 'slab') {
      const w0 = 0.03 * u, w1 = 0.022 * u, lean = 0.008 * u;
      ctx.moveTo(bx - w0 / 2, by); ctx.lineTo(bx - w1 / 2 + lean, ty); ctx.lineTo(bx + w1 / 2 + lean, ty + 0.006 * u); ctx.lineTo(bx + w0 / 2, by);
      ctx.fill();
      tx = bx + lean;
    } else if (st.kind === 'arch') {
      const rw = 0.06 * u;
      ctx.ellipse(bx, by, rw, hgt, 0, Math.PI, 0);
      ctx.ellipse(bx, by, rw * 0.72, hgt * 0.7, 0, 0, Math.PI, true);
      ctx.fill();
    } else if (st.kind === 'tower') {
      const pl = by - hgt * 0.72;
      ctx.moveTo(bx - 0.016 * u, by); ctx.lineTo(bx - 0.007 * u, pl); ctx.lineTo(bx + 0.007 * u, pl); ctx.lineTo(bx + 0.016 * u, by);
      ctx.fill();
      ctx.fillRect(bx - 0.024 * u, pl - 0.012 * u, 0.048 * u, 0.012 * u);
      ctx.lineWidth = Math.max(1, 0.0035 * u);
      ctx.beginPath(); ctx.moveTo(bx, pl); ctx.lineTo(bx, ty); ctx.stroke();
    }
    st.bx = bx; st.by = by; st.tx = tx; st.ty = ty;
  }

  // ------------------------------------------------------------ traveller

  // Foot placement is derived from distance travelled, so each planted foot
  // stays fixed in world space and the gait cannot slide.
  function foot(qq, i) {
    const k = Math.floor(qq), ph = qq - k;
    const heelL = 0.035 * H, toeL = 0.105 * H, bh = 0.035 * H;
    const plant = (kk) => X0 + (kk + 0.3 - 0.05 - 0.5 * i) * S;
    const stance = (kk, phase) => {
      const px = plant(kk), g = groundY(px);
      if (phase < 0.07) {
        const th = -0.14 * (1 - smooth(0, 0.07, phase));
        const [dx, dy] = rot(heelL, -bh, th);
        return { x: px - heelL + dx, y: g + dy, th };
      }
      if (phase < 0.42) return { x: px, y: g - bh, th: 0 };
      const t = (phase - 0.42) / 0.18, th = 0.45 * t * t;
      const [dx, dy] = rot(-toeL, -bh, th);
      return { x: px + toeL + dx, y: g + dy, th };
    };
    if (ph < 0.6) return { ...stance(k, ph), ph, planted: true };
    const u = (ph - 0.6) / 0.4;
    const a = stance(k, 0.6), b = stance(k + 1, 0);
    return {
      x: lerp(a.x, b.x, 0.5 - 0.5 * Math.cos(Math.PI * u)),
      y: lerp(a.y, b.y, u) - 0.075 * H * Math.sin(Math.PI * Math.pow(u, 0.8)),
      th: lerp(0.45, -0.14, smooth(0, 0.8, u)),
      ph, planted: false,
    };
  }

  function computePose(p, s) {
    const q = s / S + 0.05;
    const hipX = X0 + s;
    const fN = foot(q, 0), fF = foot(q + 0.5, 1);
    const bob = 4 * Math.PI * (frac(q) - 0.3);
    const legL = 0.48 * H;
    let hipY = groundY(hipX) - 0.485 * H - 0.013 * H * Math.cos(bob);
    for (const f of [fN, fF]) {
      const dx = f.x - hipX, m = legL * 0.995;
      if (Math.abs(dx) < m) hipY = Math.max(hipY, f.y - Math.sqrt(m * m - dx * dx));
    }
    const reach = smooth(0.635, 0.69, p) * (1 - smooth(0.735, 0.775, p));
    const look = smooth(0.5, 0.58, p) * (1 - smooth(0.79, 0.86, p));
    const settle = smooth(0.8, 0.9, p);
    const fwd = (f) => clamp((f.x - hipX) / (0.3 * S), -1.2, 1.2);
    return {
      hipX, hipY, fN, fF, bob, reach, look,
      lean: 0.19 + 0.012 * Math.sin(bob + 1.2) + 0.06 * reach - 0.05 * settle,
      lagRot: 0.03 * Math.sin(bob - 0.9),
      packDy: 0.012 * H * Math.cos(bob - 0.9),
      fwdN: fwd(fN), fwdF: fwd(fF),
    };
  }

  const toWorld = (P, lx, ly) => { const [x, y] = rot(lx * H, ly * H, P.lean); return [P.hipX + x, P.hipY + y]; };
  const PACK_PIVOT = [-0.06, -0.25];
  function packToWorld(P, lx, ly) {
    const [rx, ry] = rot(lx - PACK_PIVOT[0], ly - PACK_PIVOT[1], P.lagRot);
    return toWorld(P, PACK_PIVOT[0] + rx, PACK_PIVOT[1] + ry + P.packDy / H);
  }

  // Two-bone IK; pick chooses between the two joint solutions.
  function ik(x0, y0, x1, y1, l1, l2, pick) {
    const dx = x1 - x0, dy = y1 - y0;
    const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.999);
    const base = Math.atan2(dy, dx);
    const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const j1 = [x0 + Math.cos(base + a) * l1, y0 + Math.sin(base + a) * l1];
    const j2 = [x0 + Math.cos(base - a) * l1, y0 + Math.sin(base - a) * l1];
    const j = pick(j1, j2);
    const ex = x1 - j[0], ey = y1 - j[1], el = Math.hypot(ex, ey) || 1;
    return { j, e: [j[0] + (ex / el) * l2, j[1] + (ey / el) * l2] };
  }

  function limb(a, b, w1, w2, col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2);
    ctx.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
    ctx.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2);
    ctx.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
    ctx.closePath();
    ctx.moveTo(a[0] + w1 / 2, a[1]); ctx.arc(a[0], a[1], w1 / 2, 0, TAU);
    ctx.moveTo(b[0] + w2 / 2, b[1]); ctx.arc(b[0], b[1], w2 / 2, 0, TAU);
    ctx.fill();
  }

  function rr(x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBoot(f, near) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.th);
    ctx.scale(H, H);
    ctx.fillStyle = near ? '#121315' : '#1e2023';
    ctx.beginPath();
    ctx.moveTo(-0.032, -0.06);
    ctx.lineTo(0.026, -0.056);
    ctx.quadraticCurveTo(0.04, -0.012, 0.07, -0.002);
    ctx.quadraticCurveTo(0.1, 0.004, 0.108, 0.022);
    ctx.lineTo(0.104, 0.035);
    ctx.lineTo(-0.036, 0.035);
    ctx.quadraticCurveTo(-0.044, 0.012, -0.032, -0.06);
    ctx.fill();
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(-0.036, 0.026, 0.14, 0.009);
    ctx.restore();
  }

  function drawLeg(P, f, near) {
    const hip = toWorld(P, near ? 0.012 : -0.012, near ? 0 : -0.006);
    const { j: knee } = ik(hip[0], hip[1], f.x, f.y, 0.245 * H, 0.235 * H, (a, b) => (a[0] > b[0] ? a : b));
    const ankle = [f.x, f.y];
    const col = near ? '#1b1c1f' : '#26282c';
    limb(hip, knee, 0.09 * H, 0.066 * H, col);
    limb(knee, ankle, 0.064 * H, 0.05 * H, col);
    limb([lerp(knee[0], ankle[0], 0.5), lerp(knee[1], ankle[1], 0.5)], ankle, 0.062 * H, 0.058 * H, near ? '#202124' : '#292b2f');
    if (near) {
      ctx.fillStyle = '#2a2c30';
      ctx.beginPath(); ctx.ellipse(knee[0] + 0.012 * H, knee[1], 0.022 * H, 0.03 * H, 0.3, 0, TAU); ctx.fill();
    }
    drawBoot(f, near);
  }

  function armPose(P, near, target) {
    const sh = toWorld(P, near ? 0.025 : -0.005, near ? -0.262 : -0.272);
    const fwd = near ? P.fwdN : P.fwdF;
    const a = 0.06 - 0.36 * fwd;
    const bend = 0.25 + 0.3 * clamp(a, 0, 0.6);
    let el = [sh[0] + Math.sin(a) * 0.17 * H, sh[1] + Math.cos(a) * 0.17 * H];
    let wr = [el[0] + Math.sin(a + bend) * 0.155 * H, el[1] + Math.cos(a + bend) * 0.155 * H];
    if (near && P.reach > 0 && target) {
      const r = easeInOut(P.reach);
      const sol = ik(sh[0], sh[1], target[0], target[1], 0.17 * H, 0.155 * H, (x, y) => (x[1] > y[1] ? x : y));
      el = [lerp(el[0], sol.j[0], r), lerp(el[1], sol.j[1], r)];
      wr = [lerp(wr[0], sol.e[0], r), lerp(wr[1], sol.e[1], r)];
    }
    return { sh, el, wr };
  }

  function drawArm(A, near) {
    const sleeve = near ? '#1d1e21' : '#27292d';
    limb(A.sh, A.el, 0.064 * H, 0.054 * H, sleeve);
    limb(A.el, A.wr, 0.054 * H, 0.044 * H, sleeve);
    const dx = A.wr[0] - A.el[0], dy = A.wr[1] - A.el[1], l = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = near ? '#131416' : '#222427';
    ctx.beginPath();
    ctx.ellipse(A.wr[0] + (dx / l) * 0.024 * H, A.wr[1] + (dy / l) * 0.024 * H, 0.028 * H, 0.022 * H, Math.atan2(dy, dx), 0, TAU);
    ctx.fill();
  }

  function drawPack(P) {
    ctx.save();
    ctx.translate(P.hipX, P.hipY);
    ctx.rotate(P.lean);
    ctx.scale(H, H);
    ctx.translate(PACK_PIVOT[0], PACK_PIVOT[1] + P.packDy / H);
    ctx.rotate(P.lagRot);
    ctx.translate(-PACK_PIVOT[0], -PACK_PIVOT[1]);
    const lw = 1 / H;

    // antenna
    ctx.strokeStyle = '#26282b';
    ctx.lineWidth = 0.009;
    ctx.beginPath(); ctx.moveTo(-0.24, -0.53); ctx.lineTo(-0.34, -0.83); ctx.stroke();
    ctx.lineWidth = 0.005;
    ctx.beginPath(); ctx.moveTo(-0.2, -0.53); ctx.lineTo(-0.235, -0.68); ctx.stroke();
    ctx.fillStyle = '#26282b';
    ctx.beginPath(); ctx.arc(-0.34, -0.83, 0.011, 0, TAU); ctx.fill();

    // frame rails
    ctx.strokeStyle = '#3a3d41';
    ctx.lineWidth = 0.012;
    ctx.beginPath(); ctx.moveTo(-0.066, -0.05); ctx.lineTo(-0.07, -0.55); ctx.stroke();

    // main body
    ctx.fillStyle = '#25272b';
    ctx.beginPath(); rr(-0.275, -0.43, 0.215, 0.36, 0.035); ctx.fill();
    // stacked crate
    ctx.save(); ctx.translate(-0.18, -0.48); ctx.rotate(-0.04);
    ctx.fillStyle = '#2e3135';
    ctx.beginPath(); rr(-0.115, -0.06, 0.235, 0.115, 0.018); ctx.fill();
    ctx.strokeStyle = '#4a4e53'; ctx.lineWidth = 0.007;
    ctx.beginPath(); ctx.moveTo(-0.115, -0.05); ctx.lineTo(0.115, -0.055); ctx.stroke();
    ctx.restore();
    // side canister
    ctx.fillStyle = '#34373b';
    ctx.beginPath(); rr(-0.33, -0.385, 0.062, 0.22, 0.03); ctx.fill();
    ctx.strokeStyle = '#1f2124'; ctx.lineWidth = 0.008;
    ctx.beginPath(); ctx.moveTo(-0.33, -0.32); ctx.lineTo(-0.268, -0.32); ctx.moveTo(-0.33, -0.23); ctx.lineTo(-0.268, -0.23); ctx.stroke();
    // bedroll
    ctx.fillStyle = '#1c1e21';
    ctx.beginPath(); rr(-0.305, -0.125, 0.245, 0.078, 0.039); ctx.fill();
    // webbing and seams
    ctx.strokeStyle = '#41454a'; ctx.lineWidth = 0.007;
    ctx.beginPath();
    ctx.moveTo(-0.27, -0.33); ctx.lineTo(-0.065, -0.335);
    ctx.moveTo(-0.27, -0.2); ctx.lineTo(-0.065, -0.205);
    ctx.moveTo(-0.24, -0.125); ctx.lineTo(-0.24, -0.047);
    ctx.moveTo(-0.12, -0.125); ctx.lineTo(-0.12, -0.047);
    ctx.stroke();
    // top-light catching the upper edges
    ctx.strokeStyle = 'rgba(150,155,160,0.35)'; ctx.lineWidth = lw * 1.2;
    ctx.beginPath(); ctx.moveTo(-0.29, -0.535); ctx.lineTo(-0.07, -0.545); ctx.stroke();

    // hanging canister, kept vertical by gravity
    const pv = [-0.3, -0.09];
    ctx.save();
    ctx.translate(pv[0], pv[1]);
    ctx.rotate(-(P.lean + P.lagRot) + 0.22 * Math.sin(P.bob - 1.6));
    ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 0.005;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 0.07); ctx.stroke();
    ctx.fillStyle = '#2a2c30';
    ctx.beginPath(); rr(-0.018, 0.07, 0.036, 0.065, 0.014); ctx.fill();
    ctx.restore();

    // empty dock for the artefact
    ctx.strokeStyle = '#3e4247'; ctx.lineWidth = 0.006;
    ctx.beginPath(); ctx.arc(DOCK[0], DOCK[1], 0.032, 0, TAU); ctx.stroke();

    ctx.restore();
  }
  const DOCK = [-0.165, -0.3];

  function drawBodyAndHead(P) {
    ctx.save();
    ctx.translate(P.hipX, P.hipY);
    ctx.rotate(P.lean);
    ctx.scale(H, H);
    const sway = 0.012 * Math.sin(P.bob + 0.6);
    const push = 0.016 * clamp(Math.max(P.fwdN, P.fwdF), 0, 1);

    // coat
    ctx.fillStyle = '#1c1d20';
    ctx.beginPath();
    ctx.moveTo(-0.045, -0.3);
    ctx.quadraticCurveTo(-0.092, -0.2, -0.088, -0.05);
    ctx.lineTo(-0.115 + sway, 0.15);
    ctx.quadraticCurveTo(0, 0.17, 0.094 + push, 0.14);
    ctx.quadraticCurveTo(0.104, 0.02, 0.094, -0.08);
    ctx.quadraticCurveTo(0.104, -0.23, 0.035, -0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 0.006;
    ctx.beginPath(); ctx.moveTo(0.05, -0.2); ctx.quadraticCurveTo(0.03, -0.02, 0.045, 0.14); ctx.stroke();

    // hip belt
    ctx.strokeStyle = '#34373b'; ctx.lineWidth = 0.024;
    ctx.beginPath(); ctx.moveTo(-0.085, -0.02); ctx.lineTo(0.088, -0.01); ctx.stroke();
    ctx.fillStyle = '#5d6166';
    ctx.fillRect(0.045, -0.026, 0.026, 0.028);

    // hood (tilts up while looking at the artefact)
    ctx.save();
    ctx.translate(0.01, -0.29);
    ctx.rotate(-0.12 * P.look - P.lean * 0.35);
    ctx.translate(-0.01, 0.29);
    ctx.fillStyle = '#1f2023';
    ctx.beginPath();
    ctx.moveTo(-0.05, -0.285);
    ctx.bezierCurveTo(-0.098, -0.33, -0.088, -0.43, -0.03, -0.456);
    ctx.bezierCurveTo(0.02, -0.478, 0.072, -0.456, 0.094, -0.424);
    ctx.lineTo(0.083, -0.41);
    ctx.bezierCurveTo(0.07, -0.37, 0.076, -0.34, 0.062, -0.315);
    ctx.bezierCurveTo(0.042, -0.294, 0.02, -0.29, 0.01, -0.285);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#0a0a0b';
    ctx.beginPath(); ctx.ellipse(0.075, -0.37, 0.026, 0.042, 0.1, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(150,155,160,0.4)'; ctx.lineWidth = 1.2 / H;
    ctx.beginPath(); ctx.moveTo(-0.07, -0.42); ctx.bezierCurveTo(-0.04, -0.465, 0.03, -0.476, 0.092, -0.426); ctx.stroke();
    // respirator
    ctx.fillStyle = '#2f3236';
    ctx.beginPath(); rr(0.056, -0.352, 0.036, 0.024, 0.008); ctx.fill();
    ctx.fillStyle = '#41454a';
    ctx.fillRect(0.088, -0.347, 0.01, 0.014);
    ctx.restore();

    // shoulder strap over the coat
    ctx.strokeStyle = '#45494e'; ctx.lineWidth = 0.02; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.055, -0.335);
    ctx.quadraticCurveTo(0.03, -0.33, 0.066, -0.22);
    ctx.lineTo(0.064, -0.04);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#6b7075';
    ctx.fillRect(0.05, -0.18, 0.03, 0.02);
    ctx.restore();
  }

  function drawShadow(P) {
    const g = groundY(P.hipX);
    ctx.save();
    ctx.translate(P.hipX - 0.04 * H, g);
    ctx.scale(1, 0.13);
    const r = 0.42 * H;
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grd.addColorStop(0, 'rgba(8,8,9,0.45)');
    grd.addColorStop(1, 'rgba(8,8,9,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }

  function drawTraveller(P, reachTarget) {
    drawShadow(P);
    drawArm(armPose(P, false), false);
    drawLeg(P, P.fF, false);
    drawPack(P);
    drawLeg(P, P.fN, true);
    drawBodyAndHead(P);
    drawArm(armPose(P, true, reachTarget), true);
  }

  // ------------------------------------------------------------- artefact

  const FRAGMENTS = [
    { v: [[0, -1], [0.9, 0.6], [-0.9, 0.6]], s: 0.034, r: 0.16, y: -0.02 },
    { v: [[-1, -1], [1, -1], [1, 1], [-1, 1]], s: 0.02, r: 0.19, y: 0.03 },
    { v: [[0, -1.4], [0.35, 0], [0, 1.4], [-0.35, 0]], s: 0.032, r: 0.14, y: -0.05 },
    { v: [[-1.6, -0.25], [1.6, -0.25], [1.6, 0.25], [-1.6, 0.25]], s: 0.022, r: 0.21, y: 0.0 },
    { v: [[0, -1], [1, 0.8], [-0.4, 0.5]], s: 0.03, r: 0.17, y: 0.05 },
    { v: [[-1, -0.6], [0.6, -1], [1, 0.6], [-0.6, 1]], s: 0.022, r: 0.13, y: -0.07 },
    { v: [[-0.8, -0.8], [0.8, -0.8], [0, 1]], s: 0.026, r: 0.2, y: 0.06 },
  ];

  function artefactCenter(p, time) {
    const x = X0 + D + 0.34 * H;
    const float = reduced ? 0 : 0.012 * H * Math.sin(time * 1.3);
    const assemble = smooth(0.675, 0.73, p);
    return [x - 0.03 * H * assemble, groundY(x) - 0.62 * H + float * (1 - assemble)];
  }

  function drawArtefact(p, time, P) {
    const appear = smooth(0.47, 0.56, p);
    if (appear <= 0) return null;
    const assemble = easeInOut(smooth(0.675, 0.73, p));
    const lift = easeInOut(smooth(0.745, 0.79, p));
    const docked = p >= 0.79;
    const c0 = artefactCenter(p, time);
    const dock = packToWorld(P, DOCK[0], DOCK[1]);
    let c = c0, scale = 1;
    if (lift > 0) {
      const ctrl = [(c0[0] + dock[0]) / 2, Math.min(c0[1], dock[1]) - 0.38 * H];
      const t = lift, it = 1 - t;
      c = [it * it * c0[0] + 2 * it * t * ctrl[0] + t * t * dock[0], it * it * c0[1] + 2 * it * t * ctrl[1] + t * t * dock[1]];
      scale = lerp(1, 0.42, t);
    }
    if (docked) { c = dock; scale = 0.42; }

    const pulse = smooth(0.725, 0.765, p);
    const pulseOn = pulse > 0 && pulse < 1;
    const settle = smooth(0.79, 0.825, p);
    const soft = reduced ? 0.5 : 1;

    // light cast on the ground below
    const gx = c0[0], gy = groundY(gx);
    const groundLight = appear * (1 - lift) * (0.12 + 0.25 * (pulseOn ? 1 - pulse : 0) * soft);
    ctx.save();
    ctx.translate(gx, gy);
    ctx.scale(1, 0.16);
    let grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.5 * H);
    grd.addColorStop(0, `rgba(${ACID},${groundLight})`);
    grd.addColorStop(1, `rgba(${ACID},0)`);
    ctx.fillStyle = grd;
    ctx.fillRect(-0.5 * H, -0.5 * H, H, H);
    ctx.restore();

    // halo
    const halo = appear * (0.2 + 0.35 * (pulseOn ? 1 - pulse : 0) * soft + 0.15 * win(p, 0.79, 0.8, 0.81, 0.84) * soft);
    const hr = 0.3 * H * scale;
    grd = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], hr);
    grd.addColorStop(0, `rgba(${ACID},${halo})`);
    grd.addColorStop(1, `rgba(${ACID},0)`);
    ctx.fillStyle = grd;
    ctx.fillRect(c[0] - hr, c[1] - hr, hr * 2, hr * 2);

    // fragments
    const spin = p * 5 + (reduced ? 0 : time * 0.12);
    const disperse = lerp(2.4, 1, easeOut(appear));
    const items = FRAGMENTS.map((f, i) => {
      const a = (i / FRAGMENTS.length) * TAU + hash(i, 300) * 0.6 + spin * (0.7 + hash(i, 301) * 0.6);
      const free = [Math.cos(a) * f.r * H * disperse, (Math.sin(a) * f.r * 0.36 + f.y) * H * disperse];
      const ta = (i / FRAGMENTS.length) * TAU - Math.PI / 2;
      const tight = [Math.cos(ta) * 0.058 * H, Math.sin(ta) * 0.058 * H];
      const depth = lerp(Math.sin(a), 0, assemble);
      return {
        f, depth,
        x: lerp(free[0], tight[0], assemble) * scale,
        y: lerp(free[1], tight[1], assemble) * scale,
        r: lerp(a * 1.3 + i, ta + Math.PI / 2 + spin * 0.15, assemble),
      };
    }).sort((a, b) => a.depth - b.depth);

    const drawFrag = (it) => {
      const k = (0.86 + 0.14 * it.depth) * scale * H * it.f.s * lerp(1, 0.8, assemble);
      ctx.save();
      ctx.translate(c[0] + it.x, c[1] + it.y);
      ctx.rotate(it.r);
      ctx.beginPath();
      it.f.v.forEach(([vx, vy], j) => (j ? ctx.lineTo(vx * k, vy * k) : ctx.moveTo(vx * k, vy * k)));
      ctx.closePath();
      const al = appear * (0.55 + 0.45 * (it.depth * 0.5 + 0.5));
      ctx.fillStyle = `rgba(${ACID},${0.22 * al + 0.3 * assemble})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${ACID},${al})`;
      ctx.lineWidth = Math.max(0.8, 0.008 * H * scale) / zl(1);
      ctx.stroke();
      ctx.restore();
    };
    items.filter((it) => it.depth < 0).forEach(drawFrag);

    // core
    const k = 0.034 * H * scale;
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(spin * 0.2 * (1 - assemble));
    ctx.beginPath();
    ctx.moveTo(0, -k * 1.4); ctx.lineTo(k, 0); ctx.lineTo(0, k * 1.4); ctx.lineTo(-k, 0); ctx.closePath();
    ctx.fillStyle = `rgba(${ACID},${appear * 0.95})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(40,44,20,${appear * 0.5})`;
    ctx.lineWidth = 0.6 / zl(1);
    ctx.beginPath(); ctx.moveTo(-k, 0); ctx.lineTo(k, 0); ctx.moveTo(0, -k * 1.4); ctx.lineTo(k * 0.3, 0); ctx.lineTo(0, k * 1.4); ctx.stroke();
    ctx.restore();

    items.filter((it) => it.depth >= 0).forEach(drawFrag);

    // the pulse: one precise ring at the moment of assembly, a smaller one when it docks
    const ring = (x, y, t, maxR, alpha) => {
      if (t <= 0 || t >= 1) return;
      ctx.strokeStyle = `rgba(${ACID},${(1 - t) * alpha * soft})`;
      ctx.lineWidth = 1 / zl(1);
      ctx.beginPath(); ctx.arc(x, y, 0.06 * H + easeOut(t) * maxR, 0, TAU); ctx.stroke();
    };
    ring(c0[0], c0[1], pulse, 1.1 * H, 0.7);
    ring(c0[0], c0[1], smooth(0.735, 0.775, p), 0.6 * H, 0.35);
    ring(dock[0], dock[1], settle, 0.22 * H, 0.6);

    return { c0, c, dock };
  }

  // -------------------------------------------------------------- network

  const NET = [
    { type: 'drop', t0: 0.8, t1: 0.82 },
    { type: 'face', dir: 1, t0: 0.815, t1: 0.9 },
    { type: 'face', dir: -1, t0: 0.825, t1: 0.91 },
    { type: 'reach', to: 3, t0: 0.83, t1: 0.885 },
    { type: 'reach', to: 2, t0: 0.845, t1: 0.905 },
    { type: 'link', a: 3, b: 4, t0: 0.88, t1: 0.93 },
    { type: 'link', a: 4, b: 5, t0: 0.9, t1: 0.95 },
    { type: 'link', a: 2, b: 1, t0: 0.895, t1: 0.945 },
    { type: 'link', a: 2, b: 6, t0: 0.91, t1: 0.96 },
    { type: 'cable', a: 3, b: 5, t0: 0.93, t1: 0.975 },
    { type: 'cable', a: 1, b: 6, t0: 0.94, t1: 0.98 },
    { type: 'cable', a: 2, b: 3, t0: 0.935, t1: 0.975 },
  ];
  const byId = (id) => structures.find((s) => s.id === id);

  function strokeProgressive(pts, f, width, alpha, widths) {
    if (f <= 0 || pts.length < 2) return;
    const n = (pts.length - 1) * clamp(f), iMax = Math.floor(n), fr = n - iMax;
    const end = iMax < pts.length - 1
      ? [lerp(pts[iMax][0], pts[iMax + 1][0], fr), lerp(pts[iMax][1], pts[iMax + 1][1], fr)]
      : pts[iMax];
    const path = pts.slice(0, iMax + 1).concat([end]);
    ctx.lineCap = 'round';
    for (const [mul, al] of [[4, 0.14], [1, 1]]) {
      ctx.strokeStyle = `rgba(${ACID},${alpha * al})`;
      for (let i = 1; i < path.length; i++) {
        ctx.lineWidth = (widths ? widths[Math.min(i, widths.length - 1)] : width) * mul;
        ctx.beginPath(); ctx.moveTo(path[i - 1][0], path[i - 1][1]); ctx.lineTo(path[i][0], path[i][1]); ctx.stroke();
      }
    }
    if (f < 1) {
      ctx.fillStyle = `rgba(${ACID},${alpha})`;
      ctx.beginPath(); ctx.arc(end[0], end[1], width * 1.8, 0, TAU); ctx.fill();
    }
    ctx.lineCap = 'butt';
  }

  function drawNetwork(p, P, art) {
    if (p < 0.795) { structures.forEach((s) => (s.lit = 0)); }
    const z = zl(1), feetX = sx(1, P.hipX), feetY = sy(1, groundY(P.hipX));
    const N = 56;
    for (const e of NET) {
      const f = smooth(e.t0, e.t1, p);
      if (e.type !== 'drop' && f <= 0) continue;
      let pts = [], width = 1, alpha = 0.9, widths = null;
      if (e.type === 'drop') {
        if (!art || f <= 0) continue;
        const d = [sx(1, art.dock[0]), sy(1, art.dock[1])];
        pts = [d, [lerp(d[0], feetX - 0.05 * H * z, 0.5), lerp(d[1], feetY, 0.5)], [feetX - 0.05 * H * z, feetY]];
        width = 0.8; alpha = 0.7;
      } else if (e.type === 'face') {
        // a path on the near ground plane, widening as it comes towards the viewer
        const len = (e.dir > 0 ? 1.3 : 0.95) * W / z;
        widths = [];
        for (let i = 0; i <= N; i++) {
          const t = i / N, dx = e.dir * len * t;
          const wx = P.hipX + dx;
          const off = U * (e.dir > 0 ? 0.2 : 0.14) * Math.pow(t, 1.7) + U * 0.006 * Math.sin(t * 9 + e.dir);
          pts.push([sx(1, wx), sy(1, groundY(wx) + off)]);
          widths.push(lerp(0.7, 2.2, Math.pow(t, 1.5)));
        }
      } else if (e.type === 'reach' || e.type === 'link') {
        const A = e.type === 'reach' ? { bx: feetX, by: feetY, par: 1 } : byId(e.a);
        const B = byId(e.type === 'reach' ? e.to : e.b);
        const parA = A.par, parB = B.par;
        const dip = U * zl(Math.max(parA, parB)) * (parA === parB ? 0.006 : 0.03);
        for (let i = 0; i <= N; i++) {
          const t = i / N, x = lerp(A.bx, B.bx, t);
          const y = lerp(surfY(parA, x), surfY(parB, x), smooth(0.12, 0.88, t)) + dip * Math.sin(Math.PI * t);
          pts.push([x, i === 0 ? A.by : i === N ? B.by : y]);
        }
        const depth = Math.min(parA, parB);
        width = lerp(0.6, 1.1, Math.sqrt(depth));
        alpha = lerp(0.55, 0.9, Math.sqrt(depth));
      } else if (e.type === 'cable') {
        const A = byId(e.a), B = byId(e.b);
        const sag = Math.abs(B.tx - A.tx) * 0.06;
        for (let i = 0; i <= N; i++) {
          const t = i / N;
          pts.push([lerp(A.tx, B.tx, t), lerp(A.ty, B.ty, t) + sag * Math.sin(Math.PI * t)]);
        }
        width = 0.6; alpha = 0.45;
      }
      strokeProgressive(pts, f, width, alpha, widths);
      if (e.type !== 'drop' && e.type !== 'face') {
        const target = byId(e.type === 'reach' ? e.to : e.b);
        target.lit = Math.max(target.lit, smooth(e.t1 - 0.01, e.t1 + 0.02, p));
      }
    }
  }

  function drawStructureLights() {
    for (const st of structures) {
      const z = zl(st.par), u = U * z;
      const r = Math.max(1.2, 0.0035 * u);
      ctx.fillStyle = `rgba(236,237,233,${0.55 * (1 - st.lit)})`;
      ctx.beginPath(); ctx.arc(st.tx, st.ty, r, 0, TAU); ctx.fill();
      if (st.lit > 0) {
        const gr = 0.03 * u;
        const grd = ctx.createRadialGradient(st.tx, st.ty, 0, st.tx, st.ty, gr);
        grd.addColorStop(0, `rgba(${ACID},${0.45 * st.lit})`);
        grd.addColorStop(1, `rgba(${ACID},0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(st.tx - gr, st.ty - gr, gr * 2, gr * 2);
        ctx.fillStyle = `rgba(${ACID},${st.lit})`;
        ctx.beginPath(); ctx.arc(st.tx, st.ty, r * 1.1, 0, TAU); ctx.fill();
      }
    }
  }

  // ------------------------------------------------------------ timeline

  // Trapezoidal velocity profile: ease into the walk, long steady stretch,
  // slow deliberate approach that stops in front of the artefact.
  function distanceAt(p) {
    const u = clamp((p - 0.15) / (0.6 - 0.15)), a = 0.1, d = 0.35;
    const v = 1 / (1 - a / 2 - d / 2);
    let f;
    if (u < a) f = (v * u * u) / (2 * a);
    else if (u < 1 - d) f = v * (a / 2 + (u - a));
    else { const r = 1 - u; f = 1 - (v * r * r) / (2 * d); }
    return D * f;
  }

  const CHAPTERS = [[0, '00 — Arrival'], [0.15, '01 — The walk'], [0.5, '02 — Discovery'], [0.65, '03 — Collection'], [0.8, '04 — Transformation']];

  function dms(v, pos, neg) {
    const h = v < 0 ? neg : pos; v = Math.abs(v);
    const d = Math.floor(v), mf = (v - d) * 60, m = Math.floor(mf), s = Math.floor((mf - m) * 60);
    return `${h} ${String(d).padStart(h === 'N' || h === 'S' ? 2 : 3, '0')}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
  }

  const textCache = new Map();
  const setText = (el, t) => { if (textCache.get(el) !== t) { el.textContent = t; textCache.set(el, t); } };
  const setOpacity = (el, o) => { el.style.opacity = o.toFixed(3); el.classList.toggle('is-hidden', o < 0.01); };

  function updateOverlays(p, s, P, art) {
    setOpacity(ui.title, 1 - smooth(0.085, 0.13, p));
    ui.title.style.transform = `translateY(${(-p * 220).toFixed(1)}px)`;
    setOpacity(ui.cue, 1 - smooth(0.02, 0.07, p));

    const m = win(p, 0.535, 0.565, 0.765, 0.8);
    setOpacity(ui.marker, m);
    if (m > 0 && art) {
      const x = sx(1, art.c0[0]), y = sy(1, art.c0[1]) - 0.2 * H * zl(1);
      const rise = Math.max(40, y - (GY - U * 0.4));
      ui.marker.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      ui.marker.style.setProperty('--rise', `${rise.toFixed(0)}px`);
    }

    setOpacity(ui.collect, win(p, 0.685, 0.715, 0.8, 0.83));
    const fin = smooth(0.905, 0.94, p);
    setOpacity(ui.finale, fin);
    ui.replay.disabled = p < 0.95;
    ui.replay.style.opacity = smooth(0.95, 0.975, p).toFixed(3);

    let chapter = CHAPTERS[0][1];
    for (const [t, name] of CHAPTERS) if (p >= t) chapter = name;
    setText(ui.chapter, chapter);
    const k = s / U;
    setText(ui.coords, `${dms(64.2022 + k * 0.0009, 'N', 'S')}  ${dms(-18.7475 + k * 0.0031, 'E', 'W')}`);
    setText(ui.dist, `Dist ${(3.2 + 2.4 * (s / D)).toFixed(2)} km`);
    setText(ui.elev, `Elev ${Math.round(1284 + (GY - groundY(P.hipX)) / U * 900).toLocaleString('en-GB')} m`);
    ui.bar.style.width = `${(p * 100).toFixed(1)}%`;
  }

  // -------------------------------------------------------------- render

  const LAYER_FOG = [
    (t, m) => drawFog(GY - U * 0.3, U * 0.18, 0.05, 4, 0.75 * m, t),
    (t, m) => drawFog(GY - U * 0.205, U * 0.13, 0.1, 6, 0.65 * m, t),
    (t, m) => drawFog(GY - U * 0.13, U * 0.1, 0.25, 9, 0.6 * m, t),
    (t, m) => drawFog(GY - U * 0.06, U * 0.09, 0.6, 12, 0.5 * m, t),
    (t, m) => drawFog(GY + U * 0.005, U * 0.05, 1, 16, 0.24 * m, t),
  ];

  function render(p, time, intro) {
    layout();
    const s = distanceAt(p);
    const lead = W * 0.06 * smooth(0.47, 0.62, p);
    camX = X0 + s - TX + lead;
    const zIn = lerp(1.06, 1, easeOut(smooth(0, 0.16, p)));
    const zOut = lerp(1, reduced ? 0.9 : ZOOM_OUT, easeInOut(smooth(0.8, 0.98, p)));
    zoom = zIn * zOut;
    ax = TX - lead;
    ay = GY;
    const fogT = reduced ? 0 : time;
    const fogMul = lerp(1.9, 1, smooth(0, 0.14, p));

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0, '#a7abae');
    sky.addColorStop(0.7, '#cdcecb');
    sky.addColorStop(1, '#d2d3cf');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, Hh);

    LAYERS.forEach((L, i) => {
      drawLayer(L);
      if (L.par === 1) drawGroundDetail();
      structures.forEach((st) => st.par === L.par && drawStructure(st));
      LAYER_FOG[i](fogT, fogMul);
    });

    const P = computePose(p, s);
    const c0 = artefactCenter(p, time);

    // network sits on the terrain, beneath the traveller
    const z = zl(1);
    const worldTransform = () => ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (ax - (camX + ax) * z), DPR * (ay - ay * z));
    const dockWorld = packToWorld(P, DOCK[0], DOCK[1]);
    drawNetwork(p, P, { dock: dockWorld });
    drawStructureLights();

    worldTransform();
    drawTraveller(P, [c0[0] - 0.075 * H, c0[1] + 0.015 * H]);
    const art = drawArtefact(p, time, P);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    drawFog(GY + U * 0.07, U * 0.08, 1.3, 22, 0.14 * fogMul, fogT);
    drawForegroundRocks();

    // arrival: a pale mist that clears as the journey begins, plus a one-off fade from black on load
    const mist = 0.62 * (1 - smooth(0, 0.13, p));
    if (mist > 0) { ctx.fillStyle = `rgba(212,213,209,${mist})`; ctx.fillRect(0, 0, W, Hh); }
    if (intro > 0) { ctx.fillStyle = `rgba(10,10,11,${intro})`; ctx.fillRect(0, 0, W, Hh); }

    updateOverlays(p, s, P, art);
  }

  // ---------------------------------------------------------------- loop

  let target = 0, current = 0, last = performance.now();
  const start = last;

  function readScroll() {
    const r = journey.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    target = span > 0 ? clamp(-r.top / span) : 0;
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    readScroll();
    current = reduced ? target : current + (target - current) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - current) < 1e-5) current = target;
    const intro = reduced ? 0 : 1 - smooth(0, 1.8, (now - start) / 1000);
    render(current, (now - start) / 1000, intro);
    requestAnimationFrame(frame);
  }

  motionQuery.addEventListener('change', (e) => { reduced = e.matches; buildStructures(); });
  window.addEventListener('scroll', readScroll, { passive: true });
  ui.replay.addEventListener('click', () => {
    window.scrollTo({ top: journey.offsetTop, behavior: reduced ? 'auto' : 'smooth' });
  });

  readScroll();
  current = target;
  requestAnimationFrame(frame);

  // Exposed for automated checks only.
  window.__collector = { get progress() { return current; }, get pose() { return computePose(current, distanceAt(current)); }, groundY, distanceAt };
})();

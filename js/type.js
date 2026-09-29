// Typography as objects.
//
// The poster layout lives in CSS. SplitText breaks each line into chars, we
// measure every char where the browser set it, and rebuild it as a plane in
// the 3D world at the exact position that projects back to the same pixels
// from the opening camera. Each line gets its own depth, so the poster is
// flat only from one point of view.
//
// Each char has its own canvas. When a letter's weight changes (pointer
// proximity, heat) it is redrawn at the new variable-font weight and its
// neighbours slide along the line by the change in advance: tracking is a
// consequence of weight, not a separate effect.

import * as THREE from 'three';
import { blackbody } from './glsl.js';
import { Spring } from './input.js';

const FONT = '"Bodoni Moda"';

const VERT = /* glsl */ `
#include <fog_pars_vertex>
varying vec2 vUv;
varying vec3 vWorld;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uPress;
uniform vec3 uLightPos;
uniform float uLight;
uniform vec3 uHeatPos;
uniform float uHeat;
varying vec2 vUv;
varying vec3 vWorld;
#include <fog_pars_fragment>
${blackbody}
void main(){
  float a = texture2D(uMap, vUv).a;
  if (a < 0.003) discard;
  float dl = distance(vWorld, uLightPos);
  float lit = 0.78 + uLight * 0.62 / (1.0 + dl * dl * 0.05);
  vec3 col = uColor * lit * (1.0 - uPress * 0.3);
  float dh = distance(vWorld, uHeatPos);
  float hf = uHeat * uHeat / (1.0 + dh * dh * 0.08);
  col = mix(col, col * 0.35 + blackbody(uHeat) * 3.2, clamp(hf, 0.0, 1.0));
  gl_FragColor = vec4(col, a * uOpacity);
  #include <fog_fragment>
}`;

// Deterministic randomness so the composition is authored, not re-rolled.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

export class TypeWorld {
  constructor({ el, scene, shared, kind, color, mobile, seed, solid = false }) {
    this.solid = solid;
    this.el = el;
    this.scene = scene;
    this.shared = shared;
    this.kind = kind;
    this.color = new THREE.Color(color);
    this.mobile = mobile;
    this.seed = seed;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.chars = [];
    this.lines = [];
    this.geo = new THREE.PlaneGeometry(1, 1);

    // Split once; re-measure on every build.
    this.lineEls = [...el.querySelectorAll('.line')];
    this.splits = this.lineEls.map((line) => {
      const split = SplitText.create(line, { type: 'chars', charsClass: 'ch', aria: 'none' });
      const probe = document.createElement('span');
      probe.className = 'bl';
      line.insertBefore(probe, line.firstChild);
      return { split, probe };
    });
    this._v = new THREE.Vector3();
  }

  // pose: { z: camera z, fov, W, H } of the camera this poster is authored for
  build(pose) {
    this.dispose();
    const { W, H } = pose;
    this.aspect = W / H;
    const tanH = Math.tan(THREE.MathUtils.degToRad(pose.fov) / 2);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const maxTexPx = this.mobile ? 300 : 460;
    const R = rng(this.seed);
    const measureCtx = document.createElement('canvas').getContext('2d');

    this.lineEls.forEach((line, li) => {
      const cs = getComputedStyle(line);
      const fs = parseFloat(cs.fontSize);
      const italic = line.hasAttribute('data-italic');
      const baseWeight = +line.dataset.weight || 400;
      const depth = +line.dataset.depth || 12;
      const rot = THREE.MathUtils.degToRad(+line.dataset.rot || 0);
      const jitter = line.hasAttribute('data-jitter');
      const wpp = (2 * depth * tanH) / H; // world units per css px at this depth
      const tr = Math.min(dpr * 1.25, maxTexPx / fs);
      const padX = fs * (italic ? 0.5 : 0.3), asc = fs * 1.02, desc = fs * 0.32;
      const baseline = this.splits[li].probe.getBoundingClientRect().top;
      // Lines may wrap (portrait); every char box has the same height, so its
      // baseline sits at a constant offset from its top.
      const firstTop = this.splits[li].split.chars[0].getBoundingClientRect().top;
      const blOffset = baseline - firstTop;
      const lineRect = line.getBoundingClientRect();
      const pivot = new THREE.Vector3(
        (lineRect.left - W / 2) * wpp,
        -(baseline - H / 2) * wpp,
        pose.z - depth
      );
      const fontAt = (w, px) => `${italic ? 'italic ' : ''}${Math.round(w)} ${px}px ${FONT}`;
      const lineObj = {
        el: line, li, fs, wpp, depth, rot, pivot, chars: [],
        sep: new THREE.Vector3(+line.dataset.sepx || 0, 0, +line.dataset.sepz || 0),
        spread: new Spring(90, 0.55),
      };

      this.splits[li].split.chars.forEach((chEl, ci) => {
        const r = chEl.getBoundingClientRect();
        const ch = chEl.textContent;
        const cw = r.width;
        const x0 = r.left - padX, x1 = r.right + padX;
        const jy = jitter ? (R() - 0.5) * 0.16 * fs : 0;
        const bl = r.top + blOffset;
        const y0 = bl - asc + jy, y1 = bl + desc + jy;
        const cwPx = Math.ceil((x1 - x0) * tr), chPx = Math.ceil((y1 - y0) * tr);

        const canvas = document.createElement('canvas');
        canvas.width = cwPx; canvas.height = chPx;
        const ctx = canvas.getContext('2d');
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;

        const mat = new THREE.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: true,
          uniforms: {
            ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
            uMap: { value: tex },
            uColor: { value: this.color },
            uOpacity: { value: 1 },
            uPress: { value: 0 },
            uLightPos: this.shared.lightPos,
            uLight: this.shared.light,
            uHeatPos: this.shared.heatPos,
            uHeat: this.shared.heat,
          },
        });
        const mesh = new THREE.Mesh(this.geo, mat);
        mesh.renderOrder = 2;

        // Screen centre of this glyph box, relative to the line pivot, in world units.
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        const local = new THREE.Vector2((cx - lineRect.left) * wpp, -(cy - baseline) * wpp);
        const w = (x1 - x0) * wpp, h = (y1 - y0) * wpp;
        mesh.scale.set(w, h, 1);

        const weight = jitter ? 420 + Math.round(R() * 480) : baseWeight;
        measureCtx.font = fontAt(weight, 100);
        const adv0 = measureCtx.measureText(ch).width / 100 * fs;

        const c = {
          ch, mesh, mat, tex, canvas, ctx, line: lineObj, index: ci,
          fontAt, tr, padX, asc, fs, italic, local, w, h,
          baseWeight: weight, drawnWeight: -1, adv0, advCache: new Map(),
          measureCtx,
          weight: new Spring(70, 0.9, weight),
          press: new Spring(60, 0.8), ry: new Spring(55, 0.7), rz: new Spring(50, 0.6),
          ox: new Spring(60, jitter || this.kind === 'w2' ? 0.28 : 0.8),
          oy: new Spring(60, jitter || this.kind === 'w2' ? 0.28 : 0.8),
          // pendulum (world two)
          th: 0, om: 0,
          jrz: jitter ? (R() - 0.5) * 0.12 : 0,
          rand: [R(), R(), R(), R(), R(), R()],
          home: new THREE.Vector3(),
          shift: 0,
        };
        this.draw(c, weight);
        lineObj.chars.push(c);
        this.chars.push(c);
        this.group.add(mesh);
      });
      this.lines.push(lineObj);
    });

    this.chars.forEach((c, i) => this.assignJourney(c, i));
  }

  // Where each glyph goes when it stops being type.
  assignJourney(c, i) {
    const r = c.rand;
    if (this.kind === 'w1') {
      // Fragments line the corridor walls ahead of the camera.
      const side = (c.line.pivot.x + c.local.x) > -0.4 ? 1 : -1;
      const s2 = r[5] > 0.82 ? -side : side;
      const narrow = Math.min(1, Math.max(0.45, this.aspect / 1.4));
      c.dest = new THREE.Vector3(
        s2 * (3.2 + r[0] * 3.4) * narrow,
        (r[1] - 0.5) * 6.5,
        -13 - r[2] * 36
      );
      c.destRot = new THREE.Euler(
        (r[3] - 0.5) * 0.5,
        -s2 * (Math.PI / 2) * (0.55 + r[4] * 0.35),
        (r[5] - 0.5) * 1.4
      );
      c.destScale = 0.28 + r[0] * 0.3;
      // Some glyphs stretch into tall slivers: type becoming architecture.
      c.destStretch = r[3] > 0.45 ? 4 + r[2] * 9 : 1;
      c.delay = 0.08 + r[4] * 0.38 + (c.line.li === 2 ? 0.0 : 0.05);
    } else {
      // Before assembly, world two's glyphs are loose debris in the approach.
      c.start = new THREE.Vector3(
        (r[0] - 0.5) * 16,
        (r[1] - 0.5) * 9,
        8 + r[2] * 24
      );
      c.startRot = new THREE.Euler((r[3] - 0.5) * 3, (r[4] - 0.5) * 3, (r[5] - 0.5) * 4);
      c.delay = r[2] * 0.45;
    }
  }

  advance(c, w) {
    const k = Math.round(w / 10) * 10;
    let a = c.advCache.get(k);
    if (a === undefined) {
      c.measureCtx.font = c.fontAt(k, 100);
      a = c.measureCtx.measureText(c.ch).width / 100 * c.fs;
      c.advCache.set(k, a);
    }
    return a;
  }

  draw(c, w) {
    const k = Math.round(w / 12) * 12;
    if (k === c.drawnWeight) return;
    c.drawnWeight = k;
    const { ctx, canvas, tr } = c;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = c.fontAt(k, c.fs * tr);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    // Bodoni's hairlines are ~1px at display sizes and vanish when the
    // texture is minified; a hairline stroke under the fill keeps them.
    ctx.lineWidth = Math.max(1.2, c.fs * tr * (this.kind === 'w2' ? 0.011 : 0.006));
    const x = c.padX * tr, y = c.asc * tr;
    ctx.strokeText(c.ch, x, y);
    ctx.fillText(c.ch, x, y);
    c.tex.needsUpdate = true;
  }

  dispose() {
    for (const c of this.chars) {
      c.tex.dispose(); c.mat.dispose();
      this.group.remove(c.mesh);
    }
    this.chars = []; this.lines = [];
  }

  setVisible(v) { this.group.visible = v; }
}

// ------------------------------------------------------------------------

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();

function projectToScreen(v, camera, W, H, out) {
  _p.copy(v).project(camera);
  out.x = (_p.x * 0.5 + 0.5) * W;
  out.y = (-_p.y * 0.5 + 0.5) * H;
  out.z = _p.z;
  return out;
}

const scr = { x: 0, y: 0, z: 0 };

// Fully opaque glyphs render as solid geometry with alpha-to-coverage, so
// they write depth and are seen through the glass (three's transmission
// pass only captures opaque objects). Fading glyphs switch to blending.
function setSolid(c, solid) {
  if (c.solid === solid) return;
  c.solid = solid;
  c.mat.transparent = !solid;
  c.mat.depthWrite = solid;
  c.mat.alphaToCoverage = solid;
}

// World one: letters swell toward the pointer, lean away from it, press
// back into depth. Heat from the sphere softens and sags them.
export function updateW1(tw, st) {
  const { dt, pointer: p, camera, W, H, J, sphere, presence } = st;
  const R = Math.min(W, H) * 0.24;
  const R2 = R * R;
  const heat = sphere.heat;

  for (const line of tw.lines) {
    const spread = line.spread.step(Math.min(p.speed / 2600, 0.5) * presence * (1 - J.frag), dt);
    let cum = 0;
    const n = line.chars.length;
    // First pass: weights and advance deltas.
    for (const c of line.chars) {
      projectToScreen(c.mesh.position, camera, W, H, scr);
      const dx = p.x - scr.x, dy = p.y - scr.y;
      const prox = scr.z < 1 ? Math.exp(-(dx * dx + dy * dy) / R2) * presence * (1 - J.frag) : 0;
      c.prox = prox;
      c.dxn = dx / R; c.dyn = dy / R;
      const d = c.mesh.position.distanceTo(sphere.pos);
      const hn = heat * heat * Math.exp(-(d * d) / 14);
      c.heatNear = hn;
      const target = Math.min(900, c.baseWeight + (900 - c.baseWeight) * 0.8 * prox + 420 * hn);
      const w = c.weight.step(target, dt);
      tw.draw(c, w);
      const delta = tw.advance(c, w) - tw.advance(c, c.baseWeight);
      c.shift = cum + delta / 2;
      cum += delta;
    }
    // Second pass: place.
    const half = cum / 2;
    for (const c of line.chars) {
      const wpp = line.wpp;
      const trk = (c.index - (n - 1) / 2) * spread * line.fs * 0.05;
      const along = (c.local.x + (c.shift - half + trk) * wpp);
      const cos = Math.cos(line.rot), sin = Math.sin(line.rot);
      const lx = along * cos - c.local.y * sin;
      const ly = along * sin + c.local.y * cos;

      const press = c.press.step(-c.prox * 0.55 * (line.depth / 12), dt);
      const ry = c.ry.step(THREE.MathUtils.clamp(-c.dxn, -1, 1) * 0.42 * c.prox, dt);
      const rx = c.rz.step(THREE.MathUtils.clamp(c.dyn, -1, 1) * 0.28 * c.prox, dt);
      const sag = -c.heatNear * 0.35 * c.h;

      // Home in the poster, then the opening separation along depth.
      _p.set(line.pivot.x + lx, line.pivot.y + ly + sag, line.pivot.z + press);
      _p.x += line.sep.x * J.sep;
      _p.z += line.sep.z * J.sep;

      // Fragmentation into environment.
      const e = smooth(clamp01((J.frag - c.delay) / 0.5));
      const pos = c.mesh.position;
      if (e > 0) {
        const bul = Math.sin(Math.PI * e);
        pos.lerpVectors(_p, c.dest, e);
        pos.x += Math.sign(c.dest.x) * bul * 1.2;
        pos.y += (c.rand[1] - 0.5) * bul * 1.5;
      } else pos.copy(_p);

      // Parting: letters near the camera path move aside as it passes.
      const rel = pos.z - st.camPos.z;
      if (rel > -6 && rel < 2) {
        const f = Math.exp(-((rel + 1.4) ** 2) / 2.2) * J.part;
        const ax = pos.x - st.camPos.x, ay = pos.y - st.camPos.y;
        const r = Math.hypot(ax, ay) + 0.4;
        const push = f * 2.6 / (1 + r * 0.35);
        pos.x += (ax / r) * push;
        pos.y += (ay / r) * push;
      }

      _e.set(rx, ry, line.rot);
      _qa.setFromEuler(_e);
      if (e > 0) {
        _qb.setFromEuler(c.destRot);
        c.mesh.quaternion.slerpQuaternions(_qa, _qb, e);
      } else c.mesh.quaternion.copy(_qa);
      const s = 1 + (c.destScale - 1) * e;
      c.mesh.scale.set(c.w * s, c.h * s * (1 + (c.destStretch - 1) * e * e), 1);
      c.mat.uniforms.uPress.value = c.prox;
      const op = J.w1 * (1 - e * (c.destStretch > 1 ? 0.7 : 0.45));
      c.mat.uniforms.uOpacity.value = op;
      setSolid(c, tw.solid && op > 0.995);
    }
  }
}

// World two: the same system with its rules broken. Letters thin out when
// approached instead of swelling, hang from their tops and swing when the
// pointer brushes them, and overshoot on the way back.
export function updateW2(tw, st) {
  const { dt, pointer: p, camera, W, H, J, presence } = st;
  const R = Math.min(W, H) * 0.2;
  const R2 = R * R;
  const pvx = p.vx / W;

  for (const line of tw.lines) {
    const cos = Math.cos(line.rot), sin = Math.sin(line.rot);
    for (const c of line.chars) {
      const e = smooth(clamp01((J.w2 - c.delay) / 0.55));
      projectToScreen(c.mesh.position, camera, W, H, scr);
      const dx = p.x - scr.x, dy = p.y - scr.y;
      const prox = scr.z < 1 ? Math.exp(-(dx * dx + dy * dy) / R2) * presence * e : 0;

      const w = c.weight.step(Math.max(400, c.baseWeight - 480 * prox), dt);
      tw.draw(c, w);

      // Pendulum about the glyph's top edge.
      // A fast sweep (two screen widths a second) swings a glyph ~40deg.
      const push = THREE.MathUtils.clamp(pvx, -3, 3) * 15 * prox;
      const g = 16, damp = 0.7;
      c.om += (-g * Math.sin(c.th) - damp * c.om + push) * dt;
      c.th += c.om * dt;
      if (Math.abs(c.th) > 1.2) { c.th = Math.sign(c.th) * 1.2; c.om *= -0.4; }

      const ox = c.ox.step(-Math.sign(dx) * Math.min(1, Math.abs(dx) / R) * prox * 0.5, dt);
      const oy = c.oy.step(Math.sign(dy) * Math.min(1, Math.abs(dy) / R) * prox * 0.5, dt);

      // Hanging: centre = pivot(top) + rotated (0, -L)
      const L = c.h * 0.36;
      const hx = Math.sin(c.th) * L, hy = -Math.cos(c.th) * L + L;
      const lx0 = c.local.x + hx + ox, ly0 = c.local.y + hy + oy;
      const lx = lx0 * cos - ly0 * sin;
      const ly = lx0 * sin + ly0 * cos;
      _p.set(line.pivot.x + lx, line.pivot.y + ly, line.pivot.z);

      const pos = c.mesh.position;
      if (e < 1) {
        _q.copy(c.mesh.quaternion);
        const a = 1 - e;
        pos.set(
          _p.x + c.start.x * a,
          _p.y + c.start.y * a,
          _p.z + c.start.z * a
        );
        _e.set(c.startRot.x * a, c.startRot.y * a, line.rot + c.jrz + c.th + c.startRot.z * a);
      } else {
        pos.copy(_p);
        _e.set(0, 0, line.rot + c.jrz + c.th);
      }
      c.mesh.quaternion.setFromEuler(_e);
      c.mat.uniforms.uPress.value = 0;
      c.mat.uniforms.uOpacity.value = clamp01(J.w2 * 3) * (0.35 + 0.65 * e);
    }
  }
}

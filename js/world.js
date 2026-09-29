// Everything in the world that is not type or sphere.

import * as THREE from 'three';
import { simplex3, hash } from './glsl.js';
import { Spring } from './input.js';

// ------------------------------------------------------------------ light

// Two studio environments built from emissive shapes, prefiltered for PBR.
// World one: black room, one warm overhead strip, one thin cold edge light.
// World two: overcast bone room, bright ceiling, dark floor.
export function buildEnvironments(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const plane = new THREE.PlaneGeometry(1, 1);

  const room = (bg) => {
    const s = new THREE.Scene();
    const m = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.MeshBasicMaterial({ color: bg, side: THREE.BackSide }));
    s.add(m);
    return s;
  };
  const panel = (s, color, k, pos, scale, look = [0, 0, 0]) => {
    const m = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.scale.set(...scale); m.lookAt(...look);
    s.add(m);
  };

  const a = room(0x000000);
  panel(a, 0xffe2c0, 16, [-6, 9, 4], [14, 1.6, 1]);
  panel(a, 0xffd6a8, 5, [-12, 3, -2], [1.2, 12, 1]);
  panel(a, 0xbfd4ff, 22, [11, 1, -3], [0.5, 16, 1]);
  panel(a, 0xffffff, 2.2, [-9, -2, 7], [2.5, 9, 1]);
  panel(a, 0x2a2622, 1, [0, -12, 0], [40, 40, 1]);
  const envA = pmrem.fromScene(a, 0.02).texture;

  const b = room(0x8d8a83);
  panel(b, 0xffffff, 5, [0, 14, 0], [30, 30, 1]);
  panel(b, 0x0a0a0a, 1, [0, -10, 0], [40, 40, 1]);
  panel(b, 0x2130d8, 3, [12, 3, -6], [6, 10, 1]);
  const envB = pmrem.fromScene(b, 0.03).texture;

  pmrem.dispose();
  return { envA, envB };
}

// -------------------------------------------------------------- materials

const printVert = /* glsl */ `
varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// A photograph that was never taken: domain-warped folds, silver grain,
// misregistered scan slices. Reads as fabric, smoke or skin depending on
// the distance you see it from.
function printMaterial({ tint, seed, opacity = 1, invert = 0, solid = false }) {
  // Solid prints are visible through the glass (transmission sees opaque only).
  return new THREE.ShaderMaterial({
    transparent: !solid,
    depthWrite: solid,
    fog: true,
    side: THREE.DoubleSide,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(tint) },
      uSeed: { value: seed },
      uOpacity: { value: opacity },
      uDistort: { value: 0 },
      uInvert: { value: invert },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader: printVert,
    fragmentShader: /* glsl */ `
      uniform float uTime, uSeed, uOpacity, uDistort, uInvert;
      uniform vec3 uTint;
      uniform vec2 uPointer;
      varying vec2 vUv;
      ${simplex3}
      ${hash}
      #include <fog_pars_fragment>
      float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * snoise(p); p *= 2.02; a *= 0.5; } return s; }
      void main(){
        vec2 uv = vUv;
        float slice = floor(uv.y * 46.0);
        float sh = (hash12(vec2(slice, uSeed)) - 0.5) * (0.012 + uDistort * 0.05) * step(0.72, hash12(vec2(slice * 1.7, uSeed + 3.0)));
        uv.x += sh;
        float t = uTime * 0.015;
        vec2 pd = uv - uPointer;
        uv += pd * exp(-dot(pd, pd) * 18.0) * uDistort * 0.25;
        vec3 p = vec3(uv * vec2(1.4, 2.2), uSeed);
        vec2 q = vec2(fbm(p + vec3(0.0, 0.0, t)), fbm(p + vec3(5.2, 1.3, t)));
        float v = fbm(p * 1.1 + vec3(q * 1.9, t * 0.6));
        v = smoothstep(-0.35, 0.65, v);
        v = pow(v, 1.7);
        v = mix(v, 1.0 - v, uInvert);
        v += (hash12(vUv * 900.0 + fract(uTime * 7.0)) - 0.5) * 0.09;
        float edge = smoothstep(0.0, 0.015, vUv.x) * smoothstep(1.0, 0.985, vUv.x) * smoothstep(0.0, 0.012, vUv.y) * smoothstep(1.0, 0.988, vUv.y);
        if (edge < 0.5 && uOpacity > 0.999) discard;
        gl_FragColor = vec4(uTint * v * (uOpacity > 0.999 ? 1.0 : 1.0), uOpacity * edge);
        #include <fog_fragment>
      }`,
  });
}

// A slit of light, like a door left open in a dark studio.
function slitMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uI: { value: 1 }, uColor: { value: new THREE.Color(0xffe9cf) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uI; uniform vec3 uColor; varying vec2 vUv;
      ${simplex3}
      void main(){
        float x = (vUv.x - 0.5);
        float core = exp(-x * x / 0.0009);
        float halo = exp(-x * x / 0.03) * 0.22;
        float v = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        float flick = 0.9 + 0.1 * snoise(vec3(vUv.y * 3.0, uTime * 0.08, 0.0));
        gl_FragColor = vec4(uColor * (core * 2.2 + halo) * v * flick * uI, 1.0);
      }`,
  });
}

// The threshold between worlds: a sheet of light the camera passes through.
function sheetMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uI: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uI; varying vec2 vUv;
      ${simplex3}
      void main(){
        vec2 c = vUv - 0.5;
        float r = length(c * vec2(1.0, 1.6));
        float n = snoise(vec3(c * 3.0, uTime * 0.1)) * 0.5 + 0.5;
        float streak = pow(abs(snoise(vec3(c.x * 30.0, 0.0, uTime * 0.05))), 3.0);
        float v = exp(-r * r * 5.0) * (0.55 + 0.45 * n) + streak * exp(-r * r * 3.0) * 0.6;
        gl_FragColor = vec4(vec3(1.0, 0.96, 0.9) * v * uI * 2.4, 1.0);
      }`,
  });
}

// Dust. Sprites grow and thin out near the camera, reading as out-of-focus.
function dustMaterial(dpr) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xe9e4d9) },
      uScale: { value: dpr },
      uHeatPos: { value: new THREE.Vector3() },
      uHeat: { value: 0 },
      uAlpha: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime, uScale, uHeat; uniform vec3 uHeatPos;
      varying float vA; varying float vHot;
      void main(){
        vec3 p = position;
        float t = uTime * 0.03 + aSeed * 40.0;
        p += vec3(sin(t * 1.3), cos(t * 0.9), sin(t * 0.7)) * 0.12;
        float dh = distance(p, uHeatPos);
        vHot = uHeat * exp(-dh * dh / 18.0);
        p.y += vHot * 0.8 * fract(aSeed * 13.0 + uTime * 0.2);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        float focus = 13.0;
        float blur = abs(d - focus) / focus;
        gl_PointSize = uScale * (2.2 + blur * 7.0) * (14.0 / max(d, 0.5)) * (0.6 + aSeed);
        vA = (0.6 / (1.0 + blur * blur * 6.0)) * smoothstep(0.4, 2.5, d) * smoothstep(70.0, 30.0, d);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uAlpha; varying float vA; varying float vHot;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float r = length(c);
        float a = smoothstep(0.5, 0.15, r) * vA * uAlpha;
        vec3 col = mix(uColor, vec3(1.0, 0.45, 0.1) * 3.0, clamp(vHot, 0.0, 1.0));
        gl_FragColor = vec4(col, a);
      }`,
  });
}

function glyphTexture(ch, { italic = false, weight = 400, size = 512, stroke = 0 } = {}) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size * 0.8}px "Bodoni Moda"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (stroke) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = stroke;
    ctx.strokeText(ch, size / 2, size * 0.52);
  } else {
    ctx.fillStyle = '#fff';
    ctx.fillText(ch, size / 2, size * 0.52);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textBlockTexture(el, scale) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight) || fs * 1.45;
  const lines = el.innerHTML.split(/<br\s*\/?>/i).map((s) => s.replace(/<[^>]+>/g, '').trim());
  const c = document.createElement('canvas');
  c.width = Math.ceil(r.width * scale); c.height = Math.ceil(r.height * scale);
  const ctx = c.getContext('2d');
  ctx.font = `italic 400 ${fs * scale}px "Bodoni Moda"`;
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, 0, (i * lh + lh * 0.5 + fs * 0.35) * scale));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return { tex: t, rect: r };
}

const flatVert = `varying vec2 vUv;
#include <fog_pars_vertex>
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`;
function maskMaterial(tex, color, opacity) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uMap: { value: tex }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity } },
    vertexShader: flatVert,
    fragmentShader: `uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
      #include <fog_pars_fragment>
      void main(){ float a = texture2D(uMap, vUv).a; gl_FragColor = vec4(uColor, a * uOpacity);
      #include <fog_fragment>
      }`,
  });
}

// ------------------------------------------------------------------ world

export class World {
  constructor({ scene, mobile, dpr, env }) {
    this.scene = scene;
    this.mobile = mobile;
    this.env = env;
    this.w1 = new THREE.Group();
    this.w2 = new THREE.Group();
    scene.add(this.w1, this.w2);
    this.items = [];  // { obj, base: {pos, rot}, k: pointer response, springs }

    const add = (group, obj, k = 0, drift = 0) => {
      group.add(obj);
      const it = {
        obj, k, drift,
        pos: obj.position.clone(),
        rot: obj.rotation.clone(),
        rx: new Spring(8 + k * 6, 0.9), ry: new Spring(8 + k * 6, 0.9),
      };
      this.items.push(it);
      return it;
    };

    // ---- World one --------------------------------------------------
    // Light slit, far right of centre.
    this.slit = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), slitMaterial());
    this.slit.scale.set(5, 34, 1);
    this.slit.position.set(10.5, 3, -26);
    this.slit.rotation.z = 0.035;
    add(this.w1, this.slit, 0.02);

    // A print hanging in space, behind the first line.
    this.print = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.3, 1, 1), printMaterial({ tint: 0x5e5a52, seed: 3.1, opacity: 1, solid: true }));
    this.print.scale.setScalar(6.8);
    this.print.position.set(-9.6, -2.6, -15);
    this.print.rotation.set(0.03, 0.28, 0.04);
    add(this.w1, this.print, 0.25);

    // Chrome calligraphy: one stroke of a pen, left behind.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.8, -0.6, 0.2), new THREE.Vector3(-1.6, 1.6, -0.6), new THREE.Vector3(0.2, 2.4, 0.1),
      new THREE.Vector3(1.2, 0.9, 0.7), new THREE.Vector3(0.1, -0.7, 0.2), new THREE.Vector3(-0.6, 0.4, -0.4),
      new THREE.Vector3(1.4, 2.8, -1.2), new THREE.Vector3(3.6, 3.4, -0.9),
    ], false, 'centripetal');
    const tubeGeo = new THREE.TubeGeometry(curve, mobile ? 200 : 420, 0.075, 18, false);
    // Taper the stroke like ink leaving a nib.
    {
      const pos = tubeGeo.attributes.position;
      const segs = tubeGeo.parameters.tubularSegments, rad = tubeGeo.parameters.radialSegments;
      const pt = new THREE.Vector3(), v = new THREE.Vector3();
      for (let i = 0; i <= segs; i++) {
        const u = i / segs;
        curve.getPointAt(u, pt);
        const taper = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.6) * (0.55 + 0.9 * Math.pow(Math.sin(u * Math.PI * 2.2 + 0.4) * 0.5 + 0.5, 2));
        for (let j = 0; j <= rad; j++) {
          const idx = i * (rad + 1) + j;
          v.fromBufferAttribute(pos, idx).sub(pt).multiplyScalar(Math.max(taper, 0.05)).add(pt);
          pos.setXYZ(idx, v.x, v.y, v.z);
        }
      }
      tubeGeo.computeVertexNormals();
    }
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xdedbd4, metalness: 1, roughness: 0.12, envMapIntensity: 1.4 });
    this.stroke = new THREE.Mesh(tubeGeo, chrome);
    this.stroke.position.set(-4.4, -1.3, -6.5);
    this.stroke.rotation.set(0.25, 0.55, -0.35);
    this.stroke.scale.setScalar(1.05);
    add(this.w1, this.stroke, 0.5);

    // Registration mark: the print world's sign that layers should align.
    // Here, none of them do.
    const reg = new THREE.Group();
    const circ = new THREE.EllipseCurve(0, 0, 0.42, 0.42).getPoints(96).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xe9e4d9, transparent: true, opacity: 0.55, fog: true });
    reg.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circ), lineMat));
    reg.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.72, 0, 0), new THREE.Vector3(0.72, 0, 0), new THREE.Vector3(0, -0.72, 0), new THREE.Vector3(0, 0.72, 0),
    ]), lineMat));
    reg.position.set(-2.1, -3.75, -3);
    add(this.w1, reg, 0.6);

    // Glass slab in the foreground, over the last line. It refracts the type.
    const glassMat = mobile
      ? new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.18, envMapIntensity: 1.6 })
      : new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: 0.03, transmission: 1, thickness: 1.4, ior: 1.5,
        dispersion: 5, envMapIntensity: 0.9, specularIntensity: 0.8, attenuationColor: 0xe6e1d8, attenuationDistance: 9,
      });
    this.glass = new THREE.Mesh(new THREE.BoxGeometry(0.95, 3.4, 0.3, 1, 1, 1), glassMat);
    this.glass.position.set(-3.0, -1.0, 5.2);
    this.glass.rotation.set(0.04, 0.42, 0.19);
    add(this.w1, this.glass, 1.4);

    // Chrome hoop almost touching the lens, top right, mostly out of frame.
    this.hoop = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.045, 24, 180), chrome);
    this.hoop.position.set(3.7, 2.55, 6.8);
    this.hoop.rotation.set(1.1, 0.3, 0.4);
    add(this.w1, this.hoop, 2.2);

    // The aside, lifted from the DOM as one small block of text.
    this.asideEl = document.getElementById('aside');

    // Dust through both worlds.
    const n = mobile ? 700 : 1800;
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const z = 14 - Math.pow(Math.random(), 0.9) * 110;
      const spread = z < -60 ? 12 : 9;
      p[i * 3] = (Math.random() - 0.5) * spread * 2;
      p[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.2;
      p[i * 3 + 2] = z;
      s[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    this.dust = new THREE.Points(g, dustMaterial(dpr));
    this.dust.frustumCulled = false;
    scene.add(this.dust);

    // ---- Threshold ------------------------------------------------------
    this.sheet = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), sheetMaterial());
    this.sheet.position.set(0, 0, -50.5);
    this.sheet.renderOrder = 5;
    scene.add(this.sheet);

    // ---- World two -----------------------------------------------------
    // Klein-blue disc: flat, unlit, a graphic in a lit world.
    this.disc = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.MeshBasicMaterial({ color: 0x1a2fd6, fog: false }));
    this.disc.scale.setScalar(6.2);
    this.disc.position.set(9.2, 2.6, -94);
    add(this.w2, this.disc, 0.1);

    // Ink rules.
    const ruleMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
    [[-6, 4.2, -80, 11, 0.02, -0.02], [4, -4.6, -78, 16, 0.018, 0.01], [7.5, 0, -82, 0.018, 12, 0]].forEach(([x, y, z, w, h, r]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), ruleMat);
      m.position.set(x, y, z); m.rotation.z = r;
      add(this.w2, m, 0.3);
    });

    // Loose metal type: letterpress sorts, spring-held and underdamped,
    // drifting out of their forme.
    const count = mobile ? 18 : 30;
    this.blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.8, 2.2), new THREE.MeshPhysicalMaterial({ color: 0xcfcac1, metalness: 1, roughness: 0.22 }), count);
    this.blockState = [];
    for (let i = 0; i < count; i++) {
      const home = new THREE.Vector3(
        (Math.random() - 0.5) * 17 + 2,
        (Math.random() - 0.5) * 8.5,
        -79 - Math.random() * 12
      );
      this.blockState.push({
        home, pos: home.clone(), vel: new THREE.Vector3(),
        rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3), av: new THREE.Vector3(),
        s: 0.12 + Math.pow(Math.random(), 4) * 0.3,
      });
    }
    this.w2.add(this.blocks);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
    this._v = new THREE.Vector3(); this._u = new THREE.Vector3();
  }

  buildAside(pose, W, H) {
    if (this.aside) { this.w1.remove(this.aside); this.aside.material.uniforms.uMap.value.dispose(); }
    const depth = 17;
    const { tex, rect } = textBlockTexture(this.asideEl, Math.min(devicePixelRatio, 2) * 2);
    const tanH = Math.tan(THREE.MathUtils.degToRad(pose.fov) / 2);
    const wpp = (2 * depth * tanH) / H;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), maskMaterial(tex, 0x9a968e, 0.9));
    m.scale.set(rect.width * wpp, rect.height * wpp, 1);
    m.position.set((rect.left + rect.width / 2 - W / 2) * wpp, -(rect.top + rect.height / 2 - H / 2) * wpp, pose.z - depth);
    this.aside = m;
    this.w1.add(m);
  }

  update(st, ray) {
    const { dt, time, smooth, J, sphere } = st;
    // Pointer response: each object tilts by an amount set by how near it is.
    for (const it of this.items) {
      const k = it.k;
      const tx = it.rx.step(-smooth.y * 0.12 * k, dt);
      const ty = it.ry.step(smooth.x * 0.16 * k, dt);
      it.obj.rotation.set(it.rot.x + tx, it.rot.y + ty, it.rot.z);
    }
    this.hoop.rotation.z = this.items.find((i) => i.obj === this.hoop).rot.z + time * 0.02;

    this.print.material.uniforms.uTime.value = time;
    this.print.material.uniforms.uDistort.value = 0.15 + 0.6 * J.frag + sphere.heat * 0.6;
    this.slit.material.uniforms.uTime.value = time;
    this.slit.material.uniforms.uI.value = 0.85 + sphere.heat * 0.5;
    this.sheet.material.uniforms.uTime.value = time;
    this.sheet.material.uniforms.uI.value = J.sheet;
    this.sheet.visible = J.sheet > 0.001;

    const du = this.dust.material.uniforms;
    du.uTime.value = time;
    du.uHeatPos.value.copy(sphere.pos);
    du.uHeat.value = sphere.heat;
    du.uColor.value.lerpColors(this._c1 || (this._c1 = new THREE.Color(0xe9e4d9)), this._c2 || (this._c2 = new THREE.Color(0x1a1a1a)), J.bg);

    this.w1.visible = J.w1 > 0.001;
    this.w2.visible = J.w2 > 0.001;

    if (this.w2.visible) this.updateBlocks(st, ray);
  }

  updateBlocks(st, ray) {
    const { dt, pointer, presence } = st;
    const k = 38, c = 1.6;
    const pv = Math.min(pointer.speed / 1500, 2);
    for (let i = 0; i < this.blockState.length; i++) {
      const b = this.blockState[i];
      // spring home
      this._v.subVectors(b.home, b.pos).multiplyScalar(k);
      this._v.addScaledVector(b.vel, -c);
      // pointer ray repulsion
      const toB = this._u.subVectors(b.pos, ray.origin);
      const t = toB.dot(ray.direction);
      this._u.copy(ray.direction).multiplyScalar(t).add(ray.origin);
      const off = this._u.subVectors(b.pos, this._u);
      const d = off.length();
      const f = Math.exp(-d * d / 1.4) * presence * (0.4 + pv) * 140;
      if (d > 1e-4) this._v.addScaledVector(off, f / d);
      b.vel.addScaledVector(this._v, dt);
      b.pos.addScaledVector(b.vel, dt);
      b.av.x += (b.vel.y * 0.6 - b.av.x * 0.8) * dt * 4;
      b.av.y += (b.vel.x * 0.6 - b.av.y * 0.8) * dt * 4;
      b.rot.x += b.av.x * dt + dt * 0.03; b.rot.y += b.av.y * dt;
      this._q.setFromEuler(b.rot);
      const s = b.s * st.J.w2;
      this._s.set(s, s, s);
      this._m.compose(b.pos, this._q, this._s);
      this.blocks.setMatrixAt(i, this._m);
    }
    this.blocks.instanceMatrix.needsUpdate = true;
  }
}

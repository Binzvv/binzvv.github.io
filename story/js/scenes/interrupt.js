// 01 — INTERRUPT · Presence
// A liquid object pushes through enormous type. It is calm until you move; movement agitates it.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { state, onWorld, reduced, coarse } from '../state.js';

const NOISE_GLSL = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
uniform float uTime; uniform float uAmp; uniform float uFreq; uniform float uRidge; uniform vec3 uPull;
vec3 blobPos(vec3 p){
  vec3 n = normalize(p);
  float d = snoise(n * uFreq + vec3(0.0, uTime * 0.35, uTime * 0.2));
  d = mix(d, 1.0 - abs(d) * 2.0, uRidge);
  float pull = max(dot(n, normalize(uPull + vec3(1e-4))), 0.0);
  return n * (1.0 + d * uAmp + pull * pull * length(uPull) * 0.35);
}
vec3 orthoTo(vec3 v){ return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y)); }
`;

const WORLD_LOOKS = {
  none:    { color: '#ffffff', metalness: 1, roughness: 0.08, iridescence: 0, clearcoat: 0, freq: 1.35, amp: 0.16, ridge: 0, light: '#ff2e1f' },
  noise:   { color: '#d4ff00', metalness: 1, roughness: 0.2, iridescence: 1, clearcoat: 0, freq: 2.6, amp: 0.2, ridge: 0.85, light: '#d4ff00' },
  silence: { color: '#f3efe6', metalness: 0, roughness: 0.32, iridescence: 0, clearcoat: 1, freq: 0.8, amp: 0.12, ridge: 0, light: '#2337ff' },
};

const el = document.querySelector('.s1');
const mount = el.querySelector('.s1-gl');
const lines = {
  the: el.querySelector('.s1-the'),
  screen: el.querySelector('.s1-screen'),
  exp: el.querySelector('.s1-exp'),
  isnot: el.querySelector('.s1-isnot'),
};
const xyOut = el.querySelector('.s1-xy');
const presOut = el.querySelector('.s1-pres');

let renderer, scene, camera, mesh, material, rim, uniforms;
let active = false, introduced = false;
const ptr = { x: 0, y: 0, sx: 0, sy: 0, px: null, py: null, vx: 0, vy: 0, down: 0 };
const look = { ...WORLD_LOOKS.none };
let time = 0, lastSample = 0;

function initGL() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  uniforms = {
    uTime: { value: 0 }, uAmp: { value: look.amp }, uFreq: { value: look.freq },
    uRidge: { value: 0 }, uPull: { value: new THREE.Vector3() },
  };
  material = new THREE.MeshPhysicalMaterial({ color: look.color, metalness: 1, roughness: 0.08, envMapIntensity: 1.25 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${NOISE_GLSL}`)
      .replace('#include <beginnormal_vertex>', `
        vec3 bN = normalize(position);
        vec3 bT = orthoTo(bN); vec3 bB = normalize(cross(bN, bT));
        vec3 bP = blobPos(position);
        vec3 bP1 = blobPos(position + bT * 0.01);
        vec3 bP2 = blobPos(position + bB * 0.01);
        vec3 objectNormal = normalize(cross(bP1 - bP, bP2 - bP));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`)
      .replace('#include <begin_vertex>', 'vec3 transformed = bP;');
  };

  mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, coarse ? 48 : 72), material);
  scene.add(mesh);

  rim = new THREE.DirectionalLight(look.light, 3.2);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  const key = new THREE.DirectionalLight('#ffffff', 1.2);
  key.position.set(3, 4, 5);
  scene.add(key);

  resize();
}

function applyWorld(world, instant = false) {
  const target = WORLD_LOOKS[world || 'none'];
  const tl = gsap.timeline({ defaults: { duration: instant || reduced ? 0 : 1.4, ease: 'power3.inOut' } });
  const c = new THREE.Color(target.color);
  tl.to(material.color, { r: c.r, g: c.g, b: c.b }, 0)
    .to(material, { metalness: target.metalness, roughness: target.roughness, iridescence: target.iridescence, clearcoat: target.clearcoat }, 0)
    .to(look, { freq: target.freq, amp: target.amp, ridge: target.ridge }, 0);
  const lc = new THREE.Color(target.light);
  tl.to(rim.color, { r: lc.r, g: lc.g, b: lc.b }, 0);
}

function resize() {
  if (!renderer) return;
  const w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // Keep the object ~42% of the short side, whatever the orientation.
  const portrait = h > w;
  mesh.userData.base = portrait ? 0.5 * (w / h) * 2.0 : 1.0;
}

function onMove(e) {
  const w = window.innerWidth, h = window.innerHeight;
  ptr.x = (e.clientX / w) * 2 - 1;
  ptr.y = (e.clientY / h) * 2 - 1;
  if (ptr.px !== null) {
    const d = Math.hypot(e.clientX - ptr.px, e.clientY - ptr.py) / Math.hypot(w, h);
    state.presence.distance += d;
    state.presence.energy = Math.min(1, state.presence.energy + d * 5);
  }
  ptr.px = e.clientX; ptr.py = e.clientY;
}
function onDown(e) { onMove(e); ptr.px = e.clientX; ptr.py = e.clientY; gsap.to(ptr, { down: 1, duration: 0.35, ease: 'power3.out' }); }
function onUp() { gsap.to(ptr, { down: 0, duration: reduced ? 0.2 : 1.1, ease: 'elastic.out(1, 0.35)' }); }

function tick(_t, dtMs) {
  const dt = Math.min(dtMs / 1000, 0.05);
  const inertia = reduced ? 0.2 : (state.world === 'noise' ? 0.14 : state.world === 'silence' ? 0.035 : 0.07);
  ptr.vx = ptr.x - ptr.sx; ptr.vy = ptr.y - ptr.sy;
  ptr.sx += ptr.vx * inertia;
  ptr.sy += ptr.vy * inertia;

  const p = state.presence;
  p.energy *= 0.965;
  p.peak = Math.max(p.peak, p.energy);
  time += dt * (0.35 + p.energy * 2.4) * (reduced ? 0.3 : 1);

  // Record a presence waveform for the final composition.
  lastSample += dt;
  if (lastSample > 0.12) { lastSample = 0; p.samples.push(p.energy); if (p.samples.length > 96) p.samples.shift(); }

  uniforms.uTime.value = time;
  uniforms.uFreq.value = look.freq;
  uniforms.uRidge.value = look.ridge;
  uniforms.uAmp.value = look.amp + p.energy * 0.32 + ptr.down * 0.18;
  uniforms.uPull.value.set(ptr.sx * 0.9, -ptr.sy * 0.9, 0.6).multiplyScalar(0.4 + p.energy);

  const base = mesh.userData.base * mesh.userData.intro;
  mesh.scale.setScalar(base * (1 - ptr.down * 0.14));
  mesh.rotation.y += dt * 0.12 + ptr.vx * 0.6;
  mesh.rotation.x = gsap.utils.interpolate(mesh.rotation.x, ptr.sy * 0.7, 0.08);
  mesh.position.x = ptr.sx * 0.55;
  mesh.position.y = -ptr.sy * 0.32;
  renderer.render(scene, camera);

  // Type moves around the object at different depths.
  const W = window.innerWidth;
  gsap.set(lines.screen, { x: -ptr.sx * W * 0.04, y: -ptr.sy * 14 });
  gsap.set(lines.the, { x: -ptr.sx * W * 0.02, y: -ptr.sy * 8 });
  const expOver = Math.max(0, lines.exp.scrollWidth - W + W * 0.06);
  gsap.set(lines.exp, { x: -((ptr.sx + 1) / 2) * expOver, y: -ptr.sy * 10 });
  gsap.set(lines.isnot, { x: ptr.sx * W * 0.06, y: ptr.sy * 34, rotation: ptr.vx * 40 });
  if (state.world !== 'silence') {
    const lo = state.world === 'noise' ? 62 : 82, hi = state.world === 'noise' ? 100 : 125;
    lines.screen.style.fontVariationSettings = `'wdth' ${(lo + (hi - lo) * (1 - (ptr.sx + 1) / 2)).toFixed(1)}`;
    lines.exp.style.fontVariationSettings = `'wdth' ${(lo + (hi - lo) * ((ptr.sx + 1) / 2)).toFixed(1)}`;
  } else {
    lines.screen.style.fontVariationSettings = lines.exp.style.fontVariationSettings = '';
  }

  const px = Math.round((ptr.sx + 1) * 500), py = Math.round((ptr.sy + 1) * 500);
  xyOut.textContent = `X ${String(px).padStart(3, '0')} · Y ${String(py).padStart(3, '0')}`;
  presOut.textContent = String(Math.round(Math.min(1, p.distance / 8) * 100)).padStart(3, '0');
}

function intro() {
  const spans = [lines.the, lines.screen, lines.exp, lines.isnot].map((l) => l.firstElementChild);
  if (reduced) {
    mesh.userData.intro = 1;
    gsap.fromTo(spans, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    return gsap.timeline();
  }
  const tl = gsap.timeline();
  tl.fromTo(lines.screen.firstElementChild, { yPercent: 105 }, { yPercent: 0, duration: 1.1, ease: 'expo.out' }, 0)
    .fromTo(lines.exp.firstElementChild, { yPercent: -105 }, { yPercent: 0, duration: 1.1, ease: 'expo.out' }, 0.12)
    .fromTo(lines.the.firstElementChild, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }, 0.3)
    .fromTo(mesh.userData, { intro: 0.001 }, { intro: 1, duration: 1.8, ease: 'elastic.out(1, 0.55)' }, 0.25)
    .fromTo(mesh.position, { z: -10 }, { z: 0, duration: 1.4, ease: 'expo.out' }, 0.25)
    .fromTo(lines.isnot.firstElementChild, { opacity: 0, scale: 1.6, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out' }, 0.75)
    .add(() => { state.presence.energy = 0.9; }, 0.4);
  return tl;
}

export default {
  el,
  cue: 'Move',
  cursor: 'Move',
  init() {
    initGL();
    mesh.userData.intro = 0.001;
    applyWorld(state.world, true);
    onWorld((w) => applyWorld(w));
    window.addEventListener('pointermove', (e) => active && onMove(e), { passive: true });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', () => active && onUp());
  },
  enter() {
    active = true;
    resize();
    gsap.ticker.add(tick);
    if (!introduced) { introduced = true; return intro(); }
    return gsap.timeline()
      .fromTo(lines.screen.firstElementChild, { yPercent: 105 }, { yPercent: 0, duration: reduced ? 0 : 0.9, ease: 'expo.out' }, 0)
      .fromTo(lines.exp.firstElementChild, { yPercent: -105 }, { yPercent: 0, duration: reduced ? 0 : 0.9, ease: 'expo.out' }, 0.08);
  },
  leave(dir) {
    const tl = gsap.timeline({ onComplete: () => { active = false; gsap.ticker.remove(tick); } });
    if (reduced) return tl;
    tl.to(lines.screen.firstElementChild, { yPercent: dir > 0 ? -105 : 105, duration: 0.6, ease: 'expo.in' }, 0)
      .to(lines.exp.firstElementChild, { yPercent: dir > 0 ? 105 : -105, duration: 0.6, ease: 'expo.in' }, 0.05)
      .to(mesh.userData, { intro: 1.6, duration: 0.6, ease: 'expo.in' }, 0)
      .to(mesh.userData, { intro: 1, duration: 0 }, '>');
    return tl;
  },
  resize,
  // Render the object as it is now — in the visitor's world — for the final composition.
  snapshot(size = 900) {
    if (!renderer) return null;
    const prev = { w: renderer.domElement.width, h: renderer.domElement.height, pr: renderer.getPixelRatio() };
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    camera.aspect = 1; camera.updateProjectionMatrix();
    const s = mesh.scale.clone(), pos = mesh.position.clone();
    mesh.scale.setScalar(1.45); mesh.position.set(0, 0, 0);
    uniforms.uAmp.value = look.amp + Math.min(1, state.presence.distance / 8) * 0.25;
    renderer.render(scene, camera);
    const url = renderer.domElement.toDataURL('image/png');
    mesh.scale.copy(s); mesh.position.copy(pos);
    renderer.setPixelRatio(prev.pr);
    resize();
    return url;
  },
};

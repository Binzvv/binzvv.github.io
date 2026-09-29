// Orchestration.
//
//   GSAP + ScrollTrigger  choreography: scroll progress -> journey state J
//   Lenis                 scroll feel, synced into ScrollTrigger
//   three.js              the world, camera, light, physics readout
//   springs (input.js)    everything the pointer touches
//
// One clock (gsap.ticker) drives Lenis, the physics and the render, so the
// systems never disagree about what frame it is.

import * as THREE from 'three';
import { Pointer, Cursor, Spring } from './input.js';
import { TypeWorld, updateW1, updateW2 } from './type.js';
import { Sphere } from './sphere.js';
import { World, buildEnvironments } from './world.js';
import { Post } from './post.js';

const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const mobile = !fine || Math.min(innerWidth, innerHeight) < 700;
if (fine) html.classList.add('fine');

const CAM0 = { z: 12, fov: 35 };
const CAM2 = { z: -66 };

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch { return false; }
}

async function boot() {
  if (!webglOK()) { html.classList.add('no-gl'); return; }
  await Promise.all([
    document.fonts.load('440 100px "Bodoni Moda"'),
    document.fonts.load('italic 900 100px "Bodoni Moda"'),
  ]);
  await document.fonts.ready;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ---------------------------------------------------------- renderer
  const canvas = document.getElementById('world');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  let dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const bgA = new THREE.Color(0x050505), bgB = new THREE.Color(0xdcd7cc);
  scene.background = bgA.clone();
  scene.fog = new THREE.Fog(0x050505, 16, 58);

  const camera = new THREE.PerspectiveCamera(CAM0.fov, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, 0, CAM0.z);

  const env = buildEnvironments(renderer);
  scene.environment = env.envA;

  const post = new Post(renderer, { mobile });

  // Uniforms shared by every glyph.
  const shared = {
    lightPos: { value: new THREE.Vector3(0, 0, 4) },
    light: { value: 0 },
    heatPos: { value: new THREE.Vector3() },
    heat: { value: 0 },
  };

  const sphere = new Sphere({ scene, mobile });
  const world = new World({ scene, mobile, dpr, env });
  const w1 = new TypeWorld({ el: document.getElementById('w1'), scene, shared, kind: 'w1', color: 0xe9e4d9, mobile, seed: 7, solid: !mobile });
  const w2 = new TypeWorld({ el: document.getElementById('w2'), scene, shared, kind: 'w2', color: 0x0b0b0b, mobile, seed: 21 });

  // Pointer light: a warm lamp that follows the pointer a little in front of the type.
  const lamp = new THREE.PointLight(0xfff1e0, 0, 16, 1.6);
  scene.add(lamp);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x222222, 0.0);
  scene.add(ambient);

  const layout = () => {
    const W = innerWidth, H = innerHeight;
    w1.build({ z: CAM0.z, fov: CAM0.fov, W, H });
    w2.build({ z: CAM2.z, fov: CAM0.fov, W, H });
    world.buildAside({ z: CAM0.z, fov: CAM0.fov }, W, H);
  };
  layout();
  html.classList.add('gl');

  // ---------------------------------------------------------- journey
  // J is the single state the scroll writes to. Every value is continuous;
  // there is no "section" anywhere in the code.
  const portrait = innerHeight > innerWidth;
  const S2 = portrait ? { x: -1.2, y: 0.9, z: -78, s: 0.5 } : { x: -4.3, y: 1.5, z: -77, s: 0.62 };
  const S0 = portrait ? { x: 1.5, y: 0.15, z: -4, s: 0.68 } : { x: 2.75, y: -0.55, z: -3.6, s: 1 };
  const J = {
    camX: 0, camY: 0, camZ: CAM0.z, roll: 0, lookZ: -30,
    sep: 0, frag: 0, part: 1, w1: 1, w2: 0, sheet: 0, flash: 0, bg: 0, fade: 0,
    sx: S0.x, sy: S0.y, sz: S0.z, ss: S0.s,
  };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  if (!reduced) {
    tl.to(J, { camZ: 10.6, duration: 0.08, ease: 'sine.in' }, 0)
      .to(J, { sep: 1, duration: 0.2, ease: 'power1.inOut' }, 0.03)
      .to(J, { camZ: 5.2, camX: -0.35, duration: 0.14 }, 0.08)
      .to(J, { camZ: -9, camX: -1.35, camY: 0.35, roll: 0.045, duration: 0.2 }, 0.22)
      .to(J, { frag: 1, duration: 0.36 }, 0.2)
      .to(J, { camZ: -44, camX: 0.25, camY: -0.15, roll: -0.03, duration: 0.22 }, 0.42)
      // The sphere: holds its place, then, once passed, comes up from behind
      // and overtakes the camera on the right, leading into the next world.
      .to(J, { sx: 5.5, sy: -2.4, sz: 0, ss: 0.55, duration: 0.05, ease: 'power1.in' }, 0.4)
      .to(J, { sx: 2.2, sy: -0.9, sz: -34, ss: 0.5, duration: 0.14, ease: 'power1.inOut' }, 0.45)
      .to(J, { sx: S2.x, sy: S2.y, sz: S2.z, ss: S2.s, duration: 0.3, ease: 'power2.out' }, 0.59)
      // The threshold is visible from the far end of the corridor: a
      // destination, not a wipe.
      .to(J, { sheet: 1, duration: 0.22, ease: 'power3.in' }, 0.42)
      .to(J, { sheet: 0, duration: 0.03 }, 0.66)
      .to(J, { flash: 1, duration: 0.035, ease: 'power3.in' }, 0.625)
      .to(J, { flash: 0, duration: 0.09, ease: 'power2.out' }, 0.66)
      .to(J, { bg: 1, duration: 0.012 }, 0.652)
      .to(J, { w1: 0, duration: 0.03 }, 0.63)
      .to(J, { part: 0, duration: 0.05 }, 0.4)
      .to(J, { camZ: -66, camX: 0, camY: 0, roll: 0, duration: 0.26, ease: 'power2.out' }, 0.64)
      .to(J, { w2: 1, duration: 0.28, ease: 'power1.out' }, 0.6)
      .to(J, { duration: 0.1 }, 0.9);
  } else {
    // Reduced motion: no flight. The poster holds, a slow fade, the other poster.
    tl.to(J, { fade: 1, duration: 0.1, ease: 'sine.inOut' }, 0.4)
      .set(J, { camZ: CAM2.z, bg: 1, w1: 0, w2: 1, frag: 1, sx: S2.x, sy: S2.y, sz: S2.z, ss: S2.s }, 0.5)
      .to(J, { fade: 0, duration: 0.1, ease: 'sine.inOut' }, 0.5)
      .to(J, { duration: 0.4 }, 0.6);
  }

  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.85, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
  }
  ScrollTrigger.create({
    trigger: '#journey',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    animation: tl,
  });

  // ---------------------------------------------------------- input
  const pointer = new Pointer({ fine });
  const cursor = new Cursor(document.getElementById('cursor'));
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const ray = raycaster.ray;
  const setRay = () => {
    ndc.set(pointer.nx, pointer.ny);
    raycaster.setFromCamera(ndc, camera);
  };

  pointer.on('down', (e) => {
    setRay();
    if (sphere.screen.visible && sphere.hit(ray)) {
      sphere.dragging = true;
      html.classList.add('dragging');
      hintDone();
      if (lenis) lenis.stop();
    }
  });
  pointer.on('up', () => {
    if (sphere.dragging) { sphere.dragging = false; html.classList.remove('dragging'); if (lenis) lenis.start(); }
  });
  // Touch: holding the sphere should not scroll the page.
  addEventListener('touchmove', (e) => { if (sphere.dragging) e.preventDefault(); }, { passive: false });

  const hint = document.getElementById('hint');
  let hinted = false;
  const hintDone = () => { if (!hinted) { hinted = true; hint.classList.add('gone'); } };

  // Heavy smoothing of the pointer for the world, lighter for type.
  const smooth = {
    sx: new Spring(5.5, 0.95), sy: new Spring(5.5, 0.95),
    x: 0, y: 0,
  };
  const presenceSpring = new Spring(4, 1, 0);
  const cam = {
    x: new Spring(9, 1), y: new Spring(9, 1), z: new Spring(30, 1, CAM0.z),
    roll: new Spring(7, 0.8),
  };
  const look = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  let prevCamZ = camera.position.z;
  let vel = 0;

  // Opening: the poster is present from the first frame; the light comes
  // up on it. One orchestrated moment, nothing staggered.
  const intro = { exposure: 0, lamp: 0 };
  gsap.to(intro, { exposure: 1, duration: 2.6, ease: 'power2.inOut', delay: 0.15 });
  gsap.to(intro, { lamp: 1, duration: 3, ease: 'power2.inOut', delay: 1.4 });

  const st = {
    dt: 0, time: 0, pointer, smooth, camera, W: innerWidth, H: innerHeight, J, sphere, presence: 0, camPos,
  };

  // ---------------------------------------------------------- resize
  let resizeT = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    post.setSize();
    st.W = innerWidth; st.H = innerHeight;
    resizeT = setTimeout(() => { layout(); ScrollTrigger.refresh(); }, 180);
  });

  // ---------------------------------------------------------- frame
  let last = performance.now() / 1000;
  let slowFrames = 0, frameCount = 0;
  const lampPos = new THREE.Vector3();

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time) => {
    if (lenis) lenis.raf(time * 1000);

    const now = performance.now() / 1000;
    const dt = Math.min(now - last, 1 / 20);
    last = now;
    st.dt = dt; st.time = now;

    // Adaptive resolution for slow machines.
    frameCount++;
    if (frameCount > 60 && frameCount < 400) {
      slowFrames = dt > 1 / 40 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 30 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25); slowFrames = 0;
        renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false); post.setSize();
      }
    }

    pointer.update(dt, now);

    // Presence: how much the pointer is "in" the world. Without a real
    // pointer (touch, or before the first move), the world drifts on its own.
    const live = fine ? (pointer.seen && pointer.idle < 8 ? 1 : 0) : (pointer.down ? 1 : 0);
    const presence = presenceSpring.step(live, dt) * (reduced ? 0.25 : 1);
    st.presence = presence;
    let tx = pointer.nx, ty = pointer.ny;
    if (presence < 0.999 && !reduced) {
      const a = 1 - presence;
      tx = tx * presence + Math.sin(now * 0.13) * 0.35 * a;
      ty = ty * presence + Math.sin(now * 0.087 + 1.3) * 0.22 * a;
    }
    smooth.x = smooth.sx.step(tx * (reduced ? 0.25 : 1), dt);
    smooth.y = smooth.sy.step(ty * (reduced ? 0.25 : 1), dt);

    // Camera: path from the journey, weight from the springs.
    const px = smooth.x * 0.75 * (1 - J.frag * 0.4);
    const py = smooth.y * 0.42;
    camera.position.set(
      cam.x.step(J.camX + px, dt),
      cam.y.step(J.camY + py, dt),
      cam.z.step(J.camZ, dt)
    );
    camPos.copy(camera.position);
    look.set(J.camX - px * 0.35, J.camY - py * 0.3, camera.position.z - 30);
    camera.lookAt(look);
    const roll = cam.roll.step(J.roll + THREE.MathUtils.clamp(-pointer.vx / 9000, -0.02, 0.02) * presence, dt);
    camera.rotateZ(roll);
    const v = Math.abs(camera.position.z - prevCamZ) / Math.max(dt, 1e-3);
    prevCamZ = camera.position.z;
    vel += (Math.min(v / 60, 1) - vel) * (1 - Math.exp(-dt * 8));

    setRay();

    // Lamp: follows the pointer ray, about seven units out.
    lampPos.copy(ray.direction).multiplyScalar(7.5).add(ray.origin);
    lamp.position.copy(lampPos);
    lamp.intensity = (18 + 40 * sphere.prox) * presence * intro.lamp * (1 - J.bg * 0.6);
    shared.lightPos.value.copy(lampPos);
    shared.light.value = presence * intro.lamp;

    // Background / fog: black room to bone room, switched under the flash.
    scene.background.lerpColors(bgA, bgB, J.bg);
    scene.fog.color.copy(scene.background);
    scene.fog.near = 16 - J.frag * 4 + J.bg * 4;
    scene.fog.far = 58 + J.bg * 12;
    scene.environment = J.bg > 0.5 ? env.envB : env.envA;
    ambient.intensity = J.bg * 0.6;

    sphere.update(st, ray);
    shared.heatPos.value.copy(sphere.pos);
    shared.heat.value = sphere.heat;

    world.update(st, ray);
    if (J.w1 > 0.001) updateW1(w1, st);
    w1.setVisible(J.w1 > 0.001);
    if (J.w2 > 0.001) updateW2(w2, st);
    w2.setVisible(J.w2 > 0.001);

    cursor.update(dt, pointer, {
      prox: sphere.screen.visible ? sphere.prox : 0,
      sx: sphere.screen.x, sy: sphere.screen.y,
      dragging: sphere.dragging,
    });
    if (fine && pointer.seen) cursor.el.classList.add('on');

    // Post.
    const u = post.uniforms;
    u.uTime.value = now;
    u.uHeat.value = sphere.heat;
    u.uHaze.value.set(sphere.screen.x / innerWidth, 1 - sphere.screen.y / innerHeight, sphere.screen.r / innerHeight);
    u.uVel.value = vel;
    u.uFlash.value = J.flash;
    u.uExposure.value = intro.exposure * (1 + J.sheet * 0.6);
    u.uFade.value = J.fade;
    u.uBg.value = J.bg;
    u.uMotion.value = reduced ? 0 : 1;

    post.render(scene, camera);

    if (!hinted && (lenis ? lenis.scroll : scrollY) > innerHeight * 0.15) hintDone();
  });

  // Debug handle for inspection.
  window.__world = { J, sphere, camera, tl, lenis, pointer, w1, w2, world, scene, renderer };
}

boot().catch((err) => {
  console.error(err);
  html.classList.remove('gl');
  html.classList.add('no-gl');
});

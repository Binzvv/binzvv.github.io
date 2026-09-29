// The sphere: a dark, lathe-turned object with a whorl at one pole.
// The whorl is its only "face": it slowly turns to watch the pointer.
// It has mass: drag it and it spins, release and it keeps spinning, and
// the energy friction takes out of the spin does not disappear. It turns
// into heat.

import * as THREE from 'three';
import { simplex3, blackbody } from './glsl.js';

const MAX_SPIN = 30;          // rad/s
const FRICTION = 0.42;        // 1/s, free spin decay
const HEAT_PER_ENERGY = 0.0011;

export class Sphere {
  constructor({ scene, mobile }) {
    this.radius = 2.35;
    this.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.05, -0.35, 0.2));
    this.omega = new THREE.Vector3();
    this.heat = 0;
    this.prox = 0;
    this.dragging = false;
    this.pos = new THREE.Vector3();
    this.screen = { x: 0, y: 0, r: 0 };
    this.pointerLocal = new THREE.Vector3(0, 0, 1);

    const seg = mobile ? 144 : 256;
    const geo = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75));

    this.uniforms = {
      uTime: { value: 0 },
      uProx: { value: 0 },
      uPointer: { value: this.pointerLocal },
      uHeat: { value: 0 },
      uSpin: { value: 0 },
    };

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x141312,
      metalness: 0.92,
      roughness: 0.3,
      anisotropy: 0.85,
      anisotropyRotation: Math.PI / 2,
      clearcoat: 0.35,
      clearcoatRoughness: 0.42,
      envMapIntensity: 1.1,
    });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', /* glsl */ `#include <common>
          uniform float uTime; uniform float uProx; uniform vec3 uPointer; uniform float uHeat; uniform float uSpin;
          varying vec3 vLN; varying vec3 vMerV;
          ${simplex3}
          float dispF(vec3 n){
            float breath = snoise(n * 1.25 + vec3(0.0, uTime * 0.045, uTime * 0.02)) * 0.011;
            float ang = acos(clamp(dot(n, uPointer), -1.0, 1.0));
            float reach = exp(-ang * ang / 0.08) * uProx * 0.085;
            float ripple = sin(ang * 34.0 - uTime * 2.2) * exp(-ang * ang / 0.25) * uProx * 0.0028;
            float unrest = snoise(n * 3.0 + uTime * 0.18) * 0.004 * (uProx + uHeat * 0.8);
            return breath + reach + ripple + unrest;
          }`)
        .replace('#include <beginnormal_vertex>', /* glsl */ `
          vec3 nrm0 = normalize(position);
          vec3 tA = normalize(abs(nrm0.y) < 0.99 ? cross(nrm0, vec3(0.0, 1.0, 0.0)) : cross(nrm0, vec3(1.0, 0.0, 0.0)));
          vec3 tB = cross(nrm0, tA);
          float d0 = dispF(nrm0);
          vec3 n1 = normalize(nrm0 + tA * 0.006);
          vec3 n2 = normalize(nrm0 + tB * 0.006);
          vec3 q0 = nrm0 * (1.0 + d0);
          vec3 q1 = n1 * (1.0 + dispF(n1));
          vec3 q2 = n2 * (1.0 + dispF(n2));
          vec3 objectNormal = normalize(cross(q1 - q0, q2 - q0));
          if (dot(objectNormal, nrm0) < 0.0) objectNormal = -objectNormal;
          vLN = nrm0;
          vMerV = normalMatrix * (vec3(0.0, 1.0, 0.0) - nrm0 * nrm0.y);
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3( tangent.xyz );
          #endif`)
        .replace('#include <begin_vertex>', 'vec3 transformed = nrm0 * (1.0 + d0);');

      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', /* glsl */ `#include <common>
          uniform float uTime; uniform float uHeat; uniform float uProx; uniform float uSpin;
          varying vec3 vLN; varying vec3 vMerV;
          ${blackbody}`)
        .replace('#include <roughnessmap_fragment>', /* glsl */ `#include <roughnessmap_fragment>
          float pupil = smoothstep(0.9965, 0.9992, vLN.y);
          float iris = smoothstep(0.975, 0.992, vLN.y) - pupil;
          roughnessFactor = mix(roughnessFactor, 0.07, pupil);
          roughnessFactor = mix(roughnessFactor, 0.55, iris * 0.6);
          diffuseColor.rgb *= 1.0 - pupil * 0.7;`)
        .replace('#include <normal_fragment_maps>', /* glsl */ `#include <normal_fragment_maps>
          float lat = asin(clamp(vLN.y, -1.0, 1.0));
          float k = 170.0;
          float gw = fwidth(lat * k);
          float aa = 1.0 - smoothstep(0.6, 2.2, gw);
          float nearPole = smoothstep(0.9975, 0.985, abs(vLN.y));
          float gr = sin(lat * k) + 0.35 * sin(lat * k * 2.03 + 1.3);
          vec3 merV = vMerV / max(length(vMerV), 1e-4);
          normal = normalize(normal + merV * gr * 0.1 * aa * nearPole);`)
        .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
          {
            float lat2 = asin(clamp(vLN.y, -1.0, 1.0));
            float g2 = 0.5 + 0.5 * sin(lat2 * 170.0 + 1.2);
            float facing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
            float hg = pow(uHeat, 1.35);
            float crackle = 0.75 + 0.25 * sin(lat2 * 23.0 + uTime * 1.7 + vLN.x * 9.0);
            totalEmissiveRadiance += blackbody(uHeat) * hg * 4.0 * mix(0.12, 1.0, g2 * g2 * g2) * (0.25 + 0.75 * facing) * crackle;
          }`);
    };
    this.material = mat;
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.renderOrder = 1;
    scene.add(this.mesh);

    this.heatLight = new THREE.PointLight(0xff6a1f, 0, 18, 1.4);
    scene.add(this.heatLight);

    this._ray = new THREE.Ray();
    this._v = new THREE.Vector3();
    this._w = new THREE.Vector3();
    this._dq = new THREE.Quaternion();
    this._qi = new THREE.Quaternion();
    this._pole = new THREE.Vector3();
    this._c = new THREE.Color();
  }

  // Ray / sphere; returns distance of the ray from centre in radii.
  probe(ray) {
    const R = this.mesh.scale.x; // world radius
    const toC = this._v.subVectors(this.pos, ray.origin);
    const t = Math.max(0, toC.dot(ray.direction));
    const closest = this._w.copy(ray.direction).multiplyScalar(t).add(ray.origin);
    const d = closest.distanceTo(this.pos);
    return { d: d / R, closest, t };
  }

  hit(ray) {
    return this.probe(ray).d < 1.04;
  }

  update(st, ray) {
    const { dt, time, pointer: p, J, camera, H, presence } = st;
    const scale = this.radius * J.ss;
    this.pos.set(J.sx, J.sy, J.sz);
    this.mesh.position.copy(this.pos);
    this.mesh.scale.setScalar(scale);

    // Screen footprint, for the cursor and post effects.
    this._v.copy(this.pos).project(camera);
    this.screen.x = (this._v.x * 0.5 + 0.5) * innerWidth;
    this.screen.y = (-this._v.y * 0.5 + 0.5) * innerHeight;
    const dist = this.pos.distanceTo(camera.position);
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    this.screen.r = (scale / (dist * tanH)) * (H / 2);
    this.screen.visible = this._v.z < 1 && dist > scale;

    // Proximity + where on the surface the pointer is.
    const pr = this.probe(ray);
    const rawProx = this.screen.visible ? 1 - THREE.MathUtils.smoothstep(pr.d, 0.85, 2.3) : 0;
    this.prox += (rawProx * presence - this.prox) * (1 - Math.exp(-dt * 6));
    if (pr.d < 1) {
      // entry point
      const back = Math.sqrt(1 - pr.d * pr.d) * scale;
      this._w.copy(ray.direction).multiplyScalar(pr.t - back).add(ray.origin);
    } else {
      this._w.copy(pr.closest);
    }
    this._w.sub(this.pos).normalize();
    this._qi.copy(this.q).invert();
    this._w.applyQuaternion(this._qi);
    this.pointerLocal.lerp(this._w, 1 - Math.exp(-dt * 9)).normalize();

    // Rotation.
    const w = this.omega;
    if (this.dragging) {
      const Rpx = Math.max(this.screen.r, 40);
      this._v.set(p.vy / Rpx, p.vx / Rpx, 0);
      w.lerp(this._v, 1 - Math.exp(-dt * 16));
    } else {
      // Friction.
      w.multiplyScalar(Math.exp(-dt * FRICTION));
      // The whorl turns toward the pointer (or toward the viewer).
      const target = this._v;
      if (presence > 0.05) {
        target.copy(ray.direction).multiplyScalar(Math.max(1, pr.t - scale * 1.5)).add(ray.origin).sub(this.pos).normalize();
      } else {
        target.copy(camera.position).sub(this.pos).normalize();
      }
      target.x -= 0.25; target.y += 0.12;
      target.normalize();
      const pole = this._pole.set(0, 1, 0).applyQuaternion(this.q);
      const torque = this._w.crossVectors(pole, target).multiplyScalar(1.4 + 7 * this.prox);
      w.addScaledVector(torque, dt);
      const spin = w.length();
      const settle = 1 - Math.min(spin / 5, 1);
      w.multiplyScalar(Math.exp(-dt * 2.6 * settle));
    }
    const spin = w.length();
    if (spin > MAX_SPIN) w.multiplyScalar(MAX_SPIN / spin);

    if (spin > 1e-5) {
      this._dq.setFromAxisAngle(this._v.copy(w).divideScalar(spin), spin * dt);
      this.q.premultiply(this._dq).normalize();
    }
    this.mesh.quaternion.copy(this.q);

    // Friction -> heat. Only fast spins produce enough to see.
    this.heat += HEAT_PER_ENERGY * spin * spin * dt;
    this.heat -= dt * (0.085 * this.heat + 0.012);
    this.heat = THREE.MathUtils.clamp(this.heat, 0, 1);

    this.uniforms.uTime.value = time;
    this.uniforms.uProx.value = this.prox * (this.dragging ? 0.6 : 1);
    this.uniforms.uHeat.value = this.heat;
    this.uniforms.uSpin.value = Math.min(spin / MAX_SPIN, 1);

    const h = this.heat;
    this._c.setRGB(1, 0.13 + 0.5 * h * h, 0.03 + 0.28 * h * h * h);
    this.heatLight.color.copy(this._c);
    this.heatLight.intensity = h * h * 160;
    this.heatLight.position.copy(this.pos);
  }
}

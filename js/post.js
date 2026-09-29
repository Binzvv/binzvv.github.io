// One composite pass: heat haze around the sphere, travel aberration,
// exposure / tone mapping, the threshold flash, grain.

import * as THREE from 'three';
import { hash } from './glsl.js';

export class Post {
  constructor(renderer, { mobile }) {
    this.renderer = renderer;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      samples: mobile ? 0 : 4,
      depthBuffer: true,
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.uniforms = {
      tScene: { value: this.target.texture },
      uRes: { value: size.clone() },
      uTime: { value: 0 },
      uHeat: { value: 0 },
      uHaze: { value: new THREE.Vector3(0.5, 0.5, 0.2) },
      uVel: { value: 0 },
      uFlash: { value: 0 },
      uExposure: { value: 0 },
      uFade: { value: 0 },
      uFadeColor: { value: new THREE.Color(0xe9e4d9) },
      uBg: { value: 0 },
      uMotion: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D tScene;
        uniform vec2 uRes;
        uniform float uTime, uHeat, uVel, uFlash, uExposure, uFade, uBg, uMotion;
        uniform vec3 uHaze, uFadeColor;
        varying vec2 vUv;
        ${hash}
        vec3 aces(vec3 x){
          const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
          return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
        }
        vec3 toSRGB(vec3 c){
          return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
        }
        void main(){
          vec2 uv = vUv;
          float aspect = uRes.x / uRes.y;

          // Heat haze: strongest in a column rising off the sphere.
          vec2 d = uv - uHaze.xy; d.x *= aspect;
          float r = length(d);
          // A shell hugging the silhouette, plus a column rising off the top.
          float shell = smoothstep(uHaze.z * 1.5, uHaze.z * 1.0, r) * smoothstep(uHaze.z * 0.75, uHaze.z * 1.0, r);
          float column = smoothstep(uHaze.z * 0.9, 0.0, abs(d.x)) * smoothstep(uHaze.z * 0.6, uHaze.z * 1.4, d.y) * smoothstep(uHaze.z * 3.6, uHaze.z * 1.2, d.y);
          float h = uHeat * uHeat * (shell + column * 0.8) * uMotion;
          float wob = sin(uv.y * 70.0 - uTime * 4.0 + sin(uv.x * 23.0 + uTime)) + 0.5 * sin(uv.y * 131.0 - uTime * 6.3);
          uv.x += h * 0.0022 * wob;
          uv.y += h * 0.0012 * cos(uv.x * 57.0 + uTime * 3.1);

          // Travel: radial chromatic separation when the camera moves fast.
          vec2 cc = uv - 0.5;
          float ca = (uVel * 0.022 + 0.0006) * uMotion;
          vec3 col;
          col.r = texture2D(tScene, uv - cc * ca).r;
          col.g = texture2D(tScene, uv).g;
          col.b = texture2D(tScene, uv + cc * ca).b;

          col *= uExposure;
          col = aces(col);
          col = toSRGB(col);

          // Threshold flash.
          col = mix(col, vec3(1.0, 0.985, 0.96), uFlash);

          // Vignette: dark room in world one, faint in the bright world.
          float v = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(aspect * 0.8, 1.0)));
          col *= mix(0.72 + 0.28 * v, 0.9 + 0.1 * v, uBg);

          // Grain.
          float g = hash12(vUv * uRes + fract(uTime * 13.0) * 100.0) - 0.5;
          col += g * mix(0.05, 0.035, uBg);

          col = mix(col, uFadeColor, uFade);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  setSize() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.target.setSize(size.x, size.y);
    this.uniforms.uRes.value.copy(size);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.target);
    r.render(scene, camera);
    r.setRenderTarget(null);
    r.render(this.scene, this.camera);
  }
}

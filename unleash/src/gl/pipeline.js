import * as THREE from 'three';
import { FULLSCREEN_VERT } from './chunks.js';
import { FIELD_FRAG } from './field.js';
import { TRAIL_FRAG, BLOOM_DOWN_FRAG, BLOOM_UP_FRAG, COMPOSITE_FRAG } from './post.js';

const BLOOM_LEVELS = 6;

function rawMat(frag, uniforms) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: frag,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });
}

// Multi-pass renderer:
//   field (HDR, adaptive res) → trails (ping-pong) → bloom mip chain → composite (screen res)
export class Pipeline {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 1);

    const gl = this.renderer.getContext();
    const ext = this.renderer.extensions;
    const canHalf = ext.has('EXT_color_buffer_half_float') || ext.has('EXT_color_buffer_float');
    this.texType = canHalf ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.hdr = canHalf;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.quad = new THREE.Mesh(geo);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    this.uniforms = {
      time: 0,
      energy: 1,
      rise: 1,
      core: 1,
      coreY: 0.55,
      perim: 0,
      mask: new THREE.Vector4(1, 1, 1, 1),
      bloom: 0.75,
      exposure: 0.9,
      ca: 0.02,
      grain: 0.028,
      decay: 0.84,
      drift: new THREE.Vector2(0, -0.0012),
      optics: true,
    };

    this.fieldMat = rawMat(FIELD_FRAG, {
      uTime: { value: 0 }, uAspect: { value: 1 }, uEnergy: { value: 1 }, uRise: { value: 1 },
      uCore: { value: 1 }, uCoreY: { value: 0.55 }, uPerim: { value: 0 }, uMask: { value: this.uniforms.mask },
    });
    this.trailMat = rawMat(TRAIL_FRAG, {
      tCur: { value: null }, tPrev: { value: null }, uDecay: { value: 0.88 },
      uDrift: { value: new THREE.Vector2() }, uTime: { value: 0 },
    });
    this.downMat = rawMat(BLOOM_DOWN_FRAG, {
      tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uPrefilter: { value: 0 },
      uThreshold: { value: 0.55 }, uKnee: { value: 0.45 },
    });
    this.upMat = rawMat(BLOOM_UP_FRAG, {
      tLow: { value: null }, tHigh: { value: null }, uTexel: { value: new THREE.Vector2() },
      uRadius: { value: 1.0 }, uWeight: { value: 1.0 },
    });
    this.compMat = rawMat(COMPOSITE_FRAG, {
      tField: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2() },
      uTime: { value: 0 }, uBloom: { value: 1 }, uCA: { value: 0.03 }, uGrain: { value: 0.04 },
      uExposure: { value: 1 }, uCAOrigin: { value: new THREE.Vector2(0.5, 0.4) },
    });

    this.scale = 0.5;           // field resolution relative to the canvas
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.targets = null;
    this.resize();
  }

  makeRT(w, h) {
    return new THREE.WebGLRenderTarget(Math.max(1, w | 0), Math.max(1, h | 0), {
      type: this.texType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false,
    });
  }

  disposeTargets() {
    if (!this.targets) return;
    const t = this.targets;
    [t.field, t.trailA, t.trailB, ...t.down, ...t.up].forEach((rt) => rt.dispose());
    this.targets = null;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.width = Math.round(w * this.dpr);
    this.height = Math.round(h * this.dpr);
    this.aspect = w / h;
    this.rebuildTargets();
  }

  setScale(s) {
    s = Math.min(0.8, Math.max(0.28, s));
    if (Math.abs(s - this.scale) < 0.02) return;
    this.scale = s;
    this.rebuildTargets();
  }

  rebuildTargets() {
    this.disposeTargets();
    const fw = Math.round(this.width * this.scale);
    const fh = Math.round(this.height * this.scale);
    const down = [];
    const up = [];
    let bw = fw >> 1, bh = fh >> 1;
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      down.push(this.makeRT(bw, bh));
      up.push(this.makeRT(bw, bh));
      bw = Math.max(2, bw >> 1);
      bh = Math.max(2, bh >> 1);
    }
    this.targets = {
      field: this.makeRT(fw, fh),
      trailA: this.makeRT(fw, fh),
      trailB: this.makeRT(fw, fh),
      down,
      up,
    };
    // clear history
    for (const rt of [this.targets.trailA, this.targets.trailB]) {
      this.renderer.setRenderTarget(rt);
      this.renderer.clear();
    }
  }

  pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  render(dt) {
    const U = this.uniforms;
    const T = this.targets;

    // 1. field
    const fu = this.fieldMat.uniforms;
    fu.uTime.value = U.time;
    fu.uAspect.value = this.aspect;
    fu.uEnergy.value = U.energy;
    fu.uRise.value = U.rise;
    fu.uCore.value = U.core;
    fu.uCoreY.value = U.coreY;
    fu.uPerim.value = U.perim;
    this.pass(this.fieldMat, T.field);

    let src = T.field.texture;

    if (U.optics) {
      // 2. temporal trails (frame-rate independent decay)
      const tu = this.trailMat.uniforms;
      const f = Math.min(dt * 60, 3);
      tu.tCur.value = T.field.texture;
      tu.tPrev.value = T.trailA.texture;
      tu.uDecay.value = Math.pow(U.decay, f);
      tu.uDrift.value.copy(U.drift).multiplyScalar(f);
      tu.uTime.value = U.time;
      this.pass(this.trailMat, T.trailB);
      [T.trailA, T.trailB] = [T.trailB, T.trailA];
      src = T.trailA.texture;

      // 3. bloom down chain
      const du = this.downMat.uniforms;
      let s = src;
      let sw = T.field.width, sh = T.field.height;
      for (let i = 0; i < BLOOM_LEVELS; i++) {
        du.tSrc.value = s;
        du.uTexel.value.set(1 / sw, 1 / sh);
        du.uPrefilter.value = i === 0 ? 1 : 0;
        this.pass(this.downMat, T.down[i]);
        s = T.down[i].texture;
        sw = T.down[i].width; sh = T.down[i].height;
      }
      // 4. bloom up chain: wider mips weigh more → soft atmospheric haze
      const uu = this.upMat.uniforms;
      let low = T.down[BLOOM_LEVELS - 1];
      for (let i = BLOOM_LEVELS - 2; i >= 0; i--) {
        uu.tLow.value = low.texture;
        uu.tHigh.value = T.down[i].texture;
        uu.uTexel.value.set(1 / low.width, 1 / low.height);
        uu.uRadius.value = 1.0;
        uu.uWeight.value = 0.85 + i * 0.05;
        this.pass(this.upMat, T.up[i]);
        low = T.up[i];
      }
    }

    // 5. composite to screen
    const cu = this.compMat.uniforms;
    cu.tField.value = src;
    cu.tBloom.value = U.optics ? T.up[0].texture : null;
    cu.uRes.value.set(this.width, this.height);
    cu.uTime.value = U.time;
    cu.uBloom.value = U.optics ? U.bloom / BLOOM_LEVELS : 0;
    cu.uCA.value = U.optics ? U.ca : 0;
    cu.uGrain.value = U.optics ? U.grain : 0;
    cu.uExposure.value = U.exposure;
    this.renderer.setViewport(0, 0, this.width / this.dpr, this.height / this.dpr);
    this.pass(this.compMat, null);
  }
}

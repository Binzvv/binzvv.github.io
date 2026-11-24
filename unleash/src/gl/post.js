import { HEADER, NOISE } from './chunks.js';

// ── L9a TEMPORAL TRAILS ─────────────────────────────────────────────────────
// Persistence buffer: the field leaves decaying, slightly drifting ghosts of
// itself. Everything that moves smears opposite to its velocity, which is
// how the reference's stem and plume get their cinematic motion blur.
export const TRAIL_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tCur;
uniform sampler2D tPrev;
uniform float uDecay;   // frame-rate corrected persistence
uniform vec2  uDrift;   // per-frame advection of the history
uniform float uTime;
${NOISE}
void main() {
  vec3 cur = texture(tCur, vUv).rgb;
  // small turbulent displacement so trails shimmer rather than ghost
  float n = vnoise(vec3(vUv * vec2(6.0, 3.0), uTime * 0.7)) - 0.5;
  // smear the history along its drift so persistence reads as continuous light, not copies
  vec2 base = vUv - uDrift + vec2(n * 0.0018, 0.0);
  vec2 sm = uDrift * 1.6 + vec2(0.0, -0.0015);
  vec3 prev = texture(tPrev, base).rgb * 0.5
            + texture(tPrev, base + sm).rgb * 0.3
            + texture(tPrev, base + sm * 2.2).rgb * 0.2;
  fragColor = vec4(max(cur, prev * uDecay), 1.0);
}
`;

// ── L9b BLOOM ─────────────────────────────────────────────────────────────
// Physically flavoured mip-chain bloom (13-tap downsample / 9-tap tent upsample).
// Each mip contributes its own radius, so the result is layered from tight
// halo to a wide atmospheric haze.
export const BLOOM_DOWN_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tSrc;
uniform vec2 uTexel;       // 1 / source size
uniform float uPrefilter;  // 1 on the first pass
uniform float uThreshold;
uniform float uKnee;
vec3 tap(vec2 o) { return texture(tSrc, vUv + o * uTexel).rgb; }
void main() {
  vec3 a = tap(vec2(-2.0,  2.0)), b = tap(vec2( 0.0,  2.0)), c = tap(vec2( 2.0,  2.0));
  vec3 d = tap(vec2(-2.0,  0.0)), e = tap(vec2( 0.0,  0.0)), f = tap(vec2( 2.0,  0.0));
  vec3 g = tap(vec2(-2.0, -2.0)), h = tap(vec2( 0.0, -2.0)), i = tap(vec2( 2.0, -2.0));
  vec3 j = tap(vec2(-1.0,  1.0)), k = tap(vec2( 1.0,  1.0));
  vec3 l = tap(vec2(-1.0, -1.0)), m = tap(vec2( 1.0, -1.0));
  vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  if (uPrefilter > 0.5) {
    float br = max(col.r, max(col.g, col.b));
    float rq = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    rq = (rq * rq) / (4.0 * uKnee + 1e-4);
    col *= max(rq, br - uThreshold) / max(br, 1e-4);
  }
  fragColor = vec4(col, 1.0);
}
`;

export const BLOOM_UP_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tLow;    // smaller (already upsampled) level
uniform sampler2D tHigh;   // current level from the down chain
uniform vec2 uTexel;       // 1 / low size
uniform float uRadius;
uniform float uWeight;
void main() {
  vec2 o = uTexel * uRadius;
  vec3 s = texture(tLow, vUv).rgb * 4.0;
  s += (texture(tLow, vUv + vec2(-o.x, 0.0)).rgb + texture(tLow, vUv + vec2(o.x, 0.0)).rgb
      + texture(tLow, vUv + vec2(0.0, -o.y)).rgb + texture(tLow, vUv + vec2(0.0, o.y)).rgb) * 2.0;
  s += texture(tLow, vUv + vec2(-o.x, -o.y)).rgb + texture(tLow, vUv + vec2(o.x, -o.y)).rgb
     + texture(tLow, vUv + vec2(-o.x,  o.y)).rgb + texture(tLow, vUv + vec2(o.x,  o.y)).rgb;
  fragColor = vec4(s / 16.0 + texture(tHigh, vUv).rgb * uWeight, 1.0);
}
`;

// ── L9c COMPOSITE / LENS ───────────────────────────────────────────────────
// Radial chromatic aberration, layered bloom, filmic tonemap, a vignette
// that keeps blacks pure, animated grain, and blue-noise-ish dither so the
// long dark gradients never band.
export const COMPOSITE_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D tField;
uniform sampler2D tBloom;
uniform vec2  uRes;
uniform float uTime;
uniform float uBloom;
uniform float uCA;
uniform float uGrain;
uniform float uExposure;
uniform vec2  uCAOrigin;

float h12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 acesFitted(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}
vec3 toSRGB(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec2 uv  = vUv;
  vec2 dir = uv - uCAOrigin;
  // CA peaks mid-field and relaxes at the frame so the volt perimeter never fringes red
  vec2 e2 = min(uv, 1.0 - uv);
  float frame = smoothstep(0.0, 0.12, min(e2.x, e2.y));
  float k  = uCA * dot(dir, dir) * 2.0 * frame;

  vec3 f;
  f.r = texture(tField, uv + dir * k).r;
  f.g = texture(tField, uv).g;
  f.b = texture(tField, uv - dir * k).b;

  vec3 b;
  b.r = texture(tBloom, uv + dir * k * 2.5).r;
  b.g = texture(tBloom, uv).g;
  b.b = texture(tBloom, uv - dir * k * 2.5).b;

  vec3 c = (f + b * uBloom) * uExposure;
  c = acesFitted(c);

  float v = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(1.05, 0.85)));
  c *= mix(0.72, 1.0, v);

  c = toSRGB(c);

  vec2 px = uv * uRes;
  float g = h12(px + fract(uTime * 7.31) * 517.0) - 0.5;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c += g * uGrain * (0.35 + lum);                   // grain lives in the light
  c += (h12(px * 1.37 + 11.0) - 0.5) / 255.0;       // dither
  fragColor = vec4(max(c, 0.0), 1.0);
}
`;

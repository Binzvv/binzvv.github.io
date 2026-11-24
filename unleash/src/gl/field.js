import { HEADER, NOISE, SDF } from './chunks.js';

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY FIELD (v3): one interaction, five layers, all luminous on black.
//
//   GLOW   idle/touch: a quiet halo around the Start Run circle, tightening under the thumb
//   CLOUD  the rising light body: soft, saturated, fades to black through its
//          edges (never through murky dark tones)
//   SWOOSH formed from the baked distance field of the supplied artwork;
//          white-hot core, volt halo, light travelling along the contour,
//          motion and growth streaks when it travels to the edges
//   RING   thick, soft, iridescent band carrying the energy to the display edges
//   FRAME  perimeter illumination: crisp rim, soft inner glow pooling at the
//          base, slow hue drift, travelling light for the payoff
// ─────────────────────────────────────────────────────────────────────────────

export const FIELD_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform float uFlowT;
uniform float uAspect;

uniform float uEnergy;
uniform float uRise;
uniform vec2  uOrigin;

uniform sampler2D tSwoosh;
uniform vec2  uSwUvScale;
uniform vec2  uSwUvCenter;
uniform vec2  uSwUnits;
uniform float uSw;
uniform float uSwForm;
uniform vec3  uSwX;
uniform vec2  uSwVel;
uniform float uSwGrow;     // relative scale velocity → radial streaks

uniform float uGlow;       // idle halo around the CTA
uniform float uCharge;     // touch pressure
uniform vec4  uCta;        // centre xy, radius, unused
uniform vec2  uTouch;

uniform vec4  uRing;       // centre xy, radius, amplitude
uniform float uRingV;      // radius velocity → analytic motion blur
uniform float uPerim;
uniform float uPerimDrive;
uniform float uPerimRich;  // payoff richness: travelling light, deeper hue
uniform float uCorner;     // display corner radius (height units)
uniform vec4  uShock;

${NOISE}
${SDF}

const vec3 VOLT  = vec3(0.620, 1.000, 0.000);
const vec3 ACID  = vec3(1.000, 0.950, 0.420);
const vec3 COOL  = vec3(0.420, 0.700, 1.000);   // electric, cool side
const vec3 WHITE = vec3(1.000, 1.000, 0.960);
const vec3 DEEP  = vec3(0.030, 0.060, 0.140);   // dim light leans cool, never olive

// light, not paint: pick a luminous hue first, then intensity
vec3 lightColor(float d, float temp) {
  vec3 hue = mix(COOL, VOLT, smoothstep(0.30, 0.80, temp));
  hue = mix(hue, ACID, smoothstep(0.82, 1.0, temp) * 0.6);
  vec3 c = mix(DEEP, hue, smoothstep(0.12, 0.75, d));
  c = mix(c, WHITE, smoothstep(1.15, 1.80, d));
  return c * (0.55 * d + 0.45 * d * d);
}

// palette cycle used by the ring's iridescence (volt → acid → white → cool → volt)
vec3 irid(float h) {
  h = fract(h) * 4.0;
  vec3 a = VOLT, b = ACID, c = mix(WHITE, COOL, 0.45), d = COOL;
  if (h < 1.0) return mix(a, b, smoothstep(0.0, 1.0, h));
  if (h < 2.0) return mix(b, c, smoothstep(1.0, 2.0, h));
  if (h < 3.0) return mix(c, d, smoothstep(2.0, 3.0, h));
  return mix(d, a, smoothstep(3.0, 4.0, h));
}

vec3 swSample(vec2 p) {
  vec2 lp  = (p - uSwX.xy) / uSwX.z;
  vec2 tuv = uSwUvCenter + lp * uSwUvScale;
  vec2 e2  = min(tuv, 1.0 - tuv);
  float fade = smoothstep(0.0, 0.07, min(e2.x, e2.y));
  vec3 s = texture(tSwoosh, clamp(tuv, 0.0, 1.0)).rgb;
  float fr     = s.r - 0.5;
  float fine   = fr * uSwUnits.x * uSwX.z;
  float coarse = (s.g - 0.5) * uSwUnits.y * uSwX.z;
  float d      = mix(fine, coarse, smoothstep(0.40, 0.48, abs(fr)));
  return vec3(mix(1.0, d, fade), mix(1.0, coarse, fade), s.b);
}

void main() {
  vec2 uv = vUv;
  float t  = uTime;
  float ft = uFlowT;
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y);

  vec2 sp = p;
  if (uShock.w > 0.001) {
    vec2 dv = p - uShock.xy;
    float dl = length(dv) + 1e-4;
    sp -= dv / dl * exp(-pow((dl - uShock.z) * 5.0, 2.0)) * uShock.w * 0.05;
  }

  vec3 col = vec3(0.0);

  // ── GLOW ─ idle halo + touch ──────────────────────────────────────────────
  if (uGlow + uCharge > 0.002) {
    vec2 cp = p - uCta.xy;
    float r = length(cp);
    float edge = max(r - uCta.z, 0.0);
    float a = atan(cp.y, cp.x);
    float wob = fbm3(vec3(cos(a) * 1.4, sin(a) * 1.4, t * 0.35));
    float halo = exp(-edge / (0.018 + 0.03 * wob)) * (0.55 + 0.6 * wob);
    float rim  = exp(-edge / 0.004);
    vec3 hc = mix(COOL, VOLT, 0.35 + 0.5 * wob);
    col += hc * (halo * 0.22 + rim * 0.10) * uGlow;
    // touch: light gathers to the thumb and the circle's edge tightens
    float td = length(p - uTouch);
    col += mix(VOLT, WHITE, 0.4) * (exp(-edge / (0.010 + 0.02 * uCharge)) * 0.45 + exp(-td * 18.0) * 0.25) * uCharge;
  }

  // ── CLOUD ─ rising light body ─────────────────────────────────────────────
  float top = mix(uOrigin.y - 0.10, 1.20, uRise);
  if (uEnergy > 0.002 && sp.y < top + 0.45) {
    vec2 fp   = (sp - vec2(uOrigin.x, 0.0)) * vec2(1.05, 0.85);
    vec2 rise = vec2(0.0, ft * 0.16);
    float z   = ft * 0.08;
    vec2 q = vec2(fbm4(vec3(fp - rise, z)), fbm4(vec3(fp - rise + vec2(5.2, 1.3), z + 3.1)));
    vec2 r = vec2(fbm4(vec3(fp + 1.7 * q - rise * 1.4 + vec2(1.7, 9.2), z * 1.4)),
                  fbm4(vec3(fp + 1.7 * q - rise * 1.4 + vec2(8.3, 2.8), z * 1.4 + 7.0)));
    float f = fbm3(vec3(fp * 0.85 + 1.5 * r - rise * 1.8, z * 0.8 + 11.0));

    float edge = (r.x - 0.5) * 0.50 + (q.y - 0.5) * 0.28;
    float env  = smoothstep(top + 0.08, top - 0.40, sp.y + edge * 0.6);
    float dx   = sp.x - uOrigin.x;
    float column = mix(0.55, 1.0, exp(-dx * dx * mix(9.0, 3.0, uRise)));
    float base   = 0.45 + 0.65 * exp(-max(sp.y - uOrigin.y, 0.0) * 2.0);
    // luminous inside: low internal contrast, the envelope does the fading
    float dens = (0.18 + 1.05 * smoothstep(0.28, 0.88, f)) * env * column * base * uEnergy;
    float temp = smoothstep(0.32, 0.66, r.y + (q.x - 0.5) * 0.8);
    col += lightColor(dens, temp);
  }

  // ── SWOOSH ───────────────────────────────────────────────────────────────
  if (uSw > 0.002) {
    float S   = uSwX.z;
    float spd = length(uSwVel);
    vec2 tb = uSwUvCenter + (sp - uSwX.xy) / S * uSwUvScale;
    bool moving = spd > 0.02 || uSwGrow > 0.02;
    if ((tb.x > 0.0 && tb.x < 1.0 && tb.y > 0.0 && tb.y < 1.0) || moving) {
      vec2 lpn = (sp - uSwX.xy) / S;
      float n1 = fbm3(vec3(lpn * 4.0 + vec2(-t * 0.3, 0.0), t * 0.4));
      float n2 = fbm3(vec3(lpn * 4.0 + vec2(7.3, 2.1), t * 0.4 + 4.0));
      vec2 tw  = (vec2(n1, n2) - 0.5) * S * 0.018;
      vec3 s   = swSample(sp + tw);
      float dF = s.x, dC = s.y, al = s.z;
      float w  = S * 0.010;

      float form   = uSwForm * 1.15;
      float formed = smoothstep(form, form - 0.16, al);
      float head   = exp(-abs(al - form + 0.06) * 16.0) * step(0.001, uSwForm) * (1.0 - smoothstep(0.92, 1.12, uSwForm));

      float travel = al * 5.0 - t * 0.9;
      float pulse  = pow(0.5 + 0.5 * sin(travel * 6.2831), 6.0);
      float acc    = fbm3(vec3(al * 4.0 - t * 0.5, 0.0, t * 0.2));
      float light  = 0.55 + 0.45 * acc + 0.35 * pulse;

      float ad     = abs(dF);
      float core   = exp(-ad / (w * 0.55));
      float glow   = exp(-ad / (w * 2.8));
      float inside = smoothstep(w * 0.5, -w * 0.5, dF);
      float halo   = exp(-max(dC, 0.0) / (S * 0.06)) * (0.4 + 0.6 * al);

      float tone = smoothstep(0.35, 0.70, n2);
      vec3 swc = WHITE * core * 1.25 * light
               + mix(COOL, VOLT, 0.55 + 0.35 * tone) * glow * 0.55 * light
               + mix(VOLT, WHITE, 0.35) * inside * (0.18 + 0.25 * acc)
               + mix(COOL, VOLT, 0.6) * halo * 0.16
               + WHITE * head * (core + glow) * 0.9;
      float near = 1.0 - smoothstep(0.08 * S, 0.19 * S, dC);
      swc *= formed * near;

      // streaks: translation and growth, sampled where the contour came from
      if (moving) {
        float streak = 0.0;
        vec2 span = uSwVel * min(0.10, 0.30 / max(spd, 1e-3));
        float jit = hash12(gl_FragCoord.xy + fract(t) * 91.0);
        for (int i = 0; i < 10; i++) {
          float u = (float(i) + jit) / 10.0;
          vec2 qp = sp + tw + span * u;
          qp = uSwX.xy + (qp - uSwX.xy) * (1.0 + uSwGrow * u);
          vec3 si = swSample(qp);
          streak += exp(-abs(si.x) / (w * (1.0 + 2.5 * u))) * (1.0 - u);
        }
        swc += mix(WHITE, VOLT, 0.45) * streak * 0.16;
      }
      col += swc * uSw;
    }
  }

  // ── RING ─ carries the energy to the edges ────────────────────────────────
  if (uRing.w > 0.002) {
    vec2 rv = p - uRing.xy;
    float rd = length(rv);
    float ra = atan(rv.y, rv.x);
    float rn = fbm3(vec3(cos(ra) * 1.3, sin(ra) * 1.3, t * 0.5));
    float R  = uRing.z * (1.0 + (rn - 0.5) * 0.16);
    float th = 0.030 + 0.055 * uRing.z + min(uRingV, 4.0) * 0.022;  // faster = softer, never stacked copies
    float x  = (rd - R) / th;
    float band = exp(-x * x);
    vec3 rc = irid(ra / 6.2831 + x * 0.10 + rn * 0.35 + t * 0.04);
    col += rc * band * (0.30 + 0.45 * rn) * uRing.w / (1.0 + min(uRingV, 4.0) * 0.5);
  }

  // ── FRAME ─ perimeter illumination ────────────────────────────────────────
  if (uPerim > 0.001) {
    vec2 pc  = (uv - 0.5) * vec2(uAspect, 1.0);
    float sdb = sdRoundBox(pc, vec2(uAspect * 0.5, 0.5), uCorner);
    float bd  = max(-sdb, 0.0);
    float drive = uPerimDrive;
    float cutoff = 1.0 - smoothstep(0.0, 0.0025, sdb);       // nothing outside the display's rounded corners
    // hard spatial budget, independent of drive: the centre always stays black
    float zone = (1.0 - smoothstep(0.03, 0.10, bd)) * cutoff;
    if (zone > 0.0) {
      float ang = atan(pc.y, pc.x / uAspect);
      float flow = ft * 0.11;
      // light pools at the base and lower corners, as in the reference
      float weight = mix(1.0, 0.45, smoothstep(0.05, 0.95, uv.y));
      float h1  = 0.5 + 0.5 * sin(ang - flow * 2.0 + 0.6);
      float h2  = 0.5 + 0.5 * sin(2.0 * ang + flow * 1.3 + 2.1);
      float wob = fbm3(vec3(cos(ang) * 1.1, sin(ang) * 1.1, ft * 0.14));

      float thick = (0.007 + 0.013 * wob + 0.005 * h2) * (0.65 + 0.35 * drive) * weight + 0.002;
      float band  = exp(-bd / thick);                     // bright inner band
      float haze  = exp(-bd / (thick * 3.2));             // soft atmosphere
      float rim   = exp(-bd / 0.0018);                    // crisp edge line

      // Volt lives in the bright band; the wide haze leans cool so it stays rich, never olive
      // hue travels along the edge: volt → acid → cool white → electric, as the reference's frame drifts
      vec3 cb = mix(irid(ang / 6.2831 - flow * 0.35 + wob * 0.25), VOLT, 0.25);
      vec3 ch = mix(COOL, mix(COOL, VOLT, 0.35), h1);

      float pk = pow(0.5 + 0.5 * cos(ang - ft * 0.85), 22.0) + pow(0.5 + 0.5 * cos(ang + ft * 0.6 + 2.5), 28.0);
      float bright = (0.70 + 0.50 * wob) * (0.55 + 0.45 * drive) * (1.0 + uPerimRich * (0.30 + 1.4 * pk));
      vec3 frame = (cb * band * 0.95 + ch * haze * 0.16) * bright * weight
                 + mix(WHITE, cb, 0.35) * rim * (0.45 + 0.55 * h1) * (0.6 + 0.4 * weight);
      col += frame * zone * uPerim;
    }
  }

  fragColor = vec4(col, 1.0);
}
`;

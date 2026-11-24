import { HEADER, NOISE, SDF } from './chunks.js';

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY FIELD: the HDR source pass, rendered at adaptive resolution.
// Every layer sits behind a uniform branch, so inactive layers cost nothing.
//
//   L2  plasma body       3-level domain-warped fBm with a far atmospheric layer
//   L3  hue depth         temperature channel: abyss → emerald → volt → acid
//   L1  charge            energy converging on the touch point and the CTA rim
//   SW  swoosh            the Swoosh rendered from a baked multi-channel distance field
//                         (R fine distance · G wide distance · B contour arc-length);
//                         travelling pulses, iso-contour filaments, turbulent
//                         edges, velocity-sampled motion streaks
//   L7  shock ring        noisy iridescent ring for every energy pulse
//   FL  flash             volumetric light behind emerging typography
//   L8  perimeter field   living inner-edge field, driven by run intensity
// ─────────────────────────────────────────────────────────────────────────────

export const FIELD_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform float uFlowT;      // integrated flow time (speed changes never jump)
uniform float uAspect;

uniform float uEnergy;
uniform float uRise;
uniform vec2  uOrigin;     // plasma source (p space)

uniform sampler2D tSwoosh;
uniform vec2  uSwUvScale;
uniform vec2  uSwUvCenter;
uniform vec2  uSwUnits;    // fine, coarse distance units (swoosh widths per encoded 1.0)
uniform float uSw;
uniform float uSwForm;
uniform vec3  uSwX;        // centre xy, width (p space)
uniform vec2  uSwVel;      // p units / second

uniform float uCharge;
uniform vec4  uCta;        // centre xy, half-size xy
uniform vec2  uTouch;

uniform vec4  uRing;       // centre xy, radius, amplitude
uniform vec3  uFlash;      // centre xy, amplitude
uniform float uPerim;
uniform float uPerimDrive;
uniform vec4  uShock;      // centre xy, radius, amplitude
uniform float uShake;

${NOISE}
${SDF}

const vec3 VOLT  = vec3(0.620, 1.000, 0.000);
const vec3 ACID  = vec3(1.000, 0.940, 0.330);
const vec3 EMER  = vec3(0.020, 0.400, 0.180);
const vec3 WHITE = vec3(1.000, 1.000, 0.920);

vec3 energyColor(float d, float temp) {
  vec3 cool = mix(vec3(0.000, 0.018, 0.016), vec3(0.000, 0.150, 0.110), smoothstep(0.00, 0.45, d));
  cool      = mix(cool, vec3(0.060, 0.480, 0.200), smoothstep(0.35, 0.85, d));
  cool      = mix(cool, vec3(0.420, 0.950, 0.150), smoothstep(0.80, 1.25, d));
  vec3 warm = mix(vec3(0.012, 0.030, 0.000), vec3(0.200, 0.420, 0.000), smoothstep(0.00, 0.45, d));
  warm      = mix(warm, VOLT, smoothstep(0.35, 0.90, d));
  warm      = mix(warm, ACID, smoothstep(0.85, 1.30, d));
  vec3 c = mix(cool, warm, temp);
  c = mix(c, WHITE, smoothstep(1.40, 1.95, d));
  return c * (0.05 + d * d * 0.85);
}

// Swoosh distance field lookup → (distance, coarse distance, arc-length), distances in p units.
// The fine channel is precise but saturates ~24 texels out, so beyond that we hand
// over to the coarse channel; everything fades to "far away" at the baked border.
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
  float t = uTime;
  if (uShake > 0.001) {
    uv += (vec2(vnoise(vec3(t * 37.0, 0.0, 0.0)), vnoise(vec3(0.0, t * 41.0, 3.0))) - 0.5) * uShake * 0.007;
  }
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y);

  // Shock: the environment physically recoils from a release
  vec2 sp = p;
  if (uShock.w > 0.001) {
    vec2 dv = p - uShock.xy;
    float dl = length(dv) + 1e-4;
    float wave = exp(-pow((dl - uShock.z) * 6.0, 2.0));
    sp -= dv / dl * wave * uShock.w * 0.07;
  }

  vec3 col = vec3(0.0);
  float ft = uFlowT;

  // ── L2/L3 ─ plasma ───────────────────────────────────────────────────────
  float top = mix(uOrigin.y - 0.10, 1.18, uRise);
  if (uEnergy > 0.002 && sp.y < top + 0.45) {
    vec2 fp   = (sp - vec2(uOrigin.x, 0.0)) * vec2(1.15, 0.95);
    vec2 rise = vec2(0.0, ft * 0.17);
    float z   = ft * 0.085;
    vec2 q = vec2(fbm4(vec3(fp - rise, z)), fbm4(vec3(fp - rise + vec2(5.2, 1.3), z + 3.1)));
    vec2 r = vec2(fbm4(vec3(fp + 1.9 * q - rise * 1.5 + vec2(1.7, 9.2), z * 1.4)),
                  fbm4(vec3(fp + 1.9 * q - rise * 1.5 + vec2(8.3, 2.8), z * 1.4 + 7.0)));
    float f = fbm3(vec3(fp * 0.9 + 1.7 * r - rise * 2.0, z * 0.8 + 11.0));

    float edge = (r.x - 0.5) * 0.55 + (q.y - 0.5) * 0.30;
    float env  = smoothstep(top + 0.10, top - 0.45, sp.y + edge * 0.65);
    float dx   = sp.x - uOrigin.x;
    float column = mix(0.42, 1.0, exp(-dx * dx * mix(12.0, 4.0, uRise)));
    float base   = 0.30 + 0.80 * exp(-max(sp.y - uOrigin.y, 0.0) * 2.4);

    float dens = smoothstep(0.34, 0.92, f) * 1.10 + 0.08 * q.x;
    dens *= env * column * base * uEnergy;
    float temp = smoothstep(0.25, 0.68, r.y + (q.x - 0.5) * 0.7);
    col += energyColor(dens, temp);

    // far atmospheric layer: slow, dim, cold. Gives the field parallax depth
    float far = fbm3(vec3(sp * vec2(0.8, 0.6) - rise * 0.35 + 20.0, z * 0.6));
    col += vec3(0.000, 0.090, 0.065) * smoothstep(0.35, 0.80, far) * env * uEnergy * 0.6;

    // near layer: ridged filaments riding the dense regions
    float fil = 1.0 - abs(2.0 * fbm3(vec3(fp * 2.4 + 2.2 * r - rise * 3.0, z * 2.0 + 5.0)) - 1.0);
    fil = pow(fil, 12.0) * env * smoothstep(0.35, 0.95, dens);
    col += mix(vec3(0.45, 0.95, 0.10), ACID, temp) * fil * 0.6;
  }

  // ── L1 ─ charge ─────────────────────────────────────────────────────────
  if (uCharge > 0.002) {
    vec2 cp = p - uCta.xy;
    float dB = max(sdRoundBox(cp, uCta.zw, uCta.w), 0.0);
    float bn = fbm3(vec3(cp * 9.0 + vec2(0.0, -t * 0.9), t * 1.3));
    float rim = exp(-dB / (0.003 + 0.022 * uCharge * bn)) * (0.35 + bn);
    vec2 dv = p - uTouch;
    float dist = length(dv) + 1e-3;
    vec2 dir = dv / dist;
    // log-polar noise sampled forward in time = streaks converging on the thumb
    float conv = fbm3(vec3(dir * 2.6, log(dist) * 3.2 + t * (2.0 + 6.0 * uCharge)));
    conv = pow(smoothstep(0.52, 0.92, conv), 2.0) * exp(-dist * 3.2) * smoothstep(0.0, 0.04, dist);
    float hot = exp(-dist * 24.0);
    vec3 cc = mix(vec3(0.20, 0.70, 0.05), VOLT, bn) * rim * 1.2
            + mix(VOLT, ACID, conv) * conv * (0.8 + 1.4 * uCharge)
            + vec3(0.85, 1.0, 0.55) * hot * uCharge * 0.6;
    col += cc * uCharge;
  }

  // ── SW ─ swoosh made of energy ──────────────────────────────────────────
  if (uSw > 0.002) {
    float S   = uSwX.z;
    float spd = length(uSwVel);
    // cheap bounds test: only shade inside the baked field (or along a motion streak)
    vec2 tb = uSwUvCenter + (sp - uSwX.xy) / S * uSwUvScale;
    if ((tb.x > 0.0 && tb.x < 1.0 && tb.y > 0.0 && tb.y < 1.0) || spd > 0.02) {
      vec2 lpn = (sp - uSwX.xy) / S;
      float n1 = fbm3(vec3(lpn * 5.0 + vec2(-t * 0.35, 0.0), t * 0.45));
      float n2 = fbm3(vec3(lpn * 5.0 + vec2(7.3, 2.1), t * 0.45 + 4.0));
      vec2 tw  = (vec2(n1, n2) - 0.5) * S * (0.020 + 0.05 * min(spd, 2.0));
      vec3 s   = swSample(sp + tw);
      float dF = s.x, dC = s.y, al = s.z;
      float w  = S * 0.010;

      // formation: energy pours in along the contour, hook → blade tip
      float form   = uSwForm * 1.15;
      float formed = smoothstep(form, form - 0.14, al);
      float head   = exp(-abs(al - form + 0.05) * 20.0) * step(0.001, uSwForm) * (1.0 - smoothstep(0.95, 1.12, uSwForm));

      // light travelling along the contour, accumulating and dissipating
      float travel = al * 7.0 - t * 1.25;
      float pulse  = pow(0.5 + 0.5 * sin(travel * 6.2831), 5.0);
      float acc    = fbm3(vec3(al * 4.5 - t * 0.55, dF / w * 0.12, t * 0.22));
      float light  = 0.30 + 0.85 * smoothstep(0.35, 0.80, acc) + 0.55 * pulse * acc;

      float ad      = abs(dF);
      float rimCore = exp(-ad / (w * 0.32));
      float rimGlow = exp(-ad / (w * 2.0));
      float inside  = smoothstep(w * 0.4, -w * 0.4, dF);
      float depth   = clamp(-dF / (S * 0.045), 0.0, 1.0);
      float body    = inside * (0.06 + 0.50 * acc * acc) * (1.0 - 0.6 * depth);
      // filaments: offset contours of the true geometry, broken by turbulence
      float iso = dF / w * 0.55 + (n1 - 0.5) * 2.4 - t * 0.18;
      float fil = pow(1.0 - abs(fract(iso) - 0.5) * 2.0, 16.0) * exp(-ad / (w * 4.5)) * (0.35 + pulse) * smoothstep(0.3, 0.7, n2)
                * (1.0 - smoothstep(w * 4.0, w * 6.5, ad));   // stay inside the precise channel
      // asymmetric atmosphere: swells toward the blade tip
      float halo = exp(-max(dC, 0.0) / (S * 0.085)) * (0.30 + 0.70 * al) * (0.45 + acc);

      float tone = smoothstep(0.30, 0.75, n2 + (al - 0.5) * 0.4);
      vec3 rimC  = mix(mix(VOLT, ACID, tone * 0.6), WHITE, 0.30 * pulse);
      vec3 swc = rimC * rimCore * 1.05 * light
               + mix(EMER, VOLT, 0.45 + 0.55 * tone) * rimGlow * 0.42 * light
               + mix(EMER, VOLT, acc) * body
               + mix(VOLT, ACID, tone) * fil * 0.55
               + mix(EMER * 0.8, VOLT * 0.55, al) * halo * 0.20
               + WHITE * head * (rimCore + rimGlow * 0.5) * 1.4;
      // hard energy budget: the layer fades out well before the distance field saturates
      float near = 1.0 - smoothstep(0.08 * S, 0.19 * S, dC);
      swc *= formed * near;

      // directional motion streaks: sample where the contour was
      // continuous: per-pixel jittered taps along the velocity, so copies never stack
      if (spd > 0.02) {
        float streak = 0.0;
        vec2 span = uSwVel * min(0.11, 0.35 / max(spd, 1e-3)) ;
        float jit = hash12(gl_FragCoord.xy + fract(t) * 91.0);
        for (int i = 0; i < 10; i++) {
          float u = (float(i) + jit) / 10.0;
          vec3 si = swSample(sp + tw + span * u);
          streak += exp(-abs(si.x) / (w * (0.8 + 2.2 * u))) * (1.0 - u) * step(si.z, form);
        }
        streak *= 0.32 * min(spd * 0.8, 1.3);
        swc += mix(VOLT, ACID, 0.25 + 0.5 * n2) * streak * 0.5;
      }
      col += swc * uSw;
    }
  }

  // ── L7 ─ shock ring ─────────────────────────────────────────────────────
  if (uRing.w > 0.002) {
    vec2 rv = p - uRing.xy;
    float rd = length(rv);
    float rn  = fbm3(vec3(rv * 3.2, t * 0.6));
    float rn2 = fbm3(vec3(rv * 6.0 + 4.0, t * 0.9));
    float R   = uRing.z * (1.0 + (rn - 0.5) * 0.30);
    float th  = 0.030 + 0.075 * uRing.z;
    float band  = exp(-pow((rd - R) / th, 2.0));
    float inner = exp(-pow((rd - R + th * 0.55) / (th * 0.16), 2.0));
    float tone = smoothstep(0.30, 0.75, rn2);
    vec3 rc = mix(vec3(0.02, 0.42, 0.24), VOLT, smoothstep(0.0, 0.55, tone));
    rc = mix(rc, ACID, smoothstep(0.55, 1.0, tone));
    col += (rc * band * (0.55 + 0.8 * rn2) + WHITE * inner * 0.45 * rn) * uRing.w;
  }

  // ── FL ─ flash: the light typography emerges from ───────────────────────
  if (uFlash.z > 0.002) {
    vec2 fv = (p - uFlash.xy) * vec2(1.0, 0.75);
    float fd = length(fv);
    float fn = fbm3(vec3(fv * 4.0 + vec2(0.0, -t * 0.4), t * 0.8));
    float g = exp(-fd * 6.5) * (0.30 + fn) + exp(-fd * 16.0) * 0.40;
    col += mix(vec3(0.05, 0.45, 0.14), vec3(0.72, 1.0, 0.22), smoothstep(0.15, 0.9, g)) * g * uFlash.z;
  }

  // ── L8 ─ perimeter field ────────────────────────────────────────────────
  if (uPerim > 0.001) {
    float drive = uPerimDrive;
    vec2 pc  = (uv - 0.5) * vec2(uAspect, 1.0);
    float sdb = sdRoundBox(pc, vec2(uAspect * 0.5, 0.5), 0.075);
    float bd  = max(-sdb, 0.0);
    float outside = exp(-max(sdb, 0.0) * 400.0);
    float zone = 1.0 - smoothstep(0.02 * drive, 0.085 * drive, bd);
    float ca = cos(ft * 0.16), sa = sin(ft * 0.16);
    vec2 rp = mat2(ca, -sa, sa, ca) * pc;
    float a1 = fbm4(vec3(rp * 2.6, ft * 0.16));
    float a2 = fbm3(vec3(rp.yx * 4.2 + 3.0, ft * 0.27 + 9.0));
    float tend = fbm3(vec3(pc * 11.0 + vec2(a1, a2) * 2.5 + vec2(0.0, ft * 0.2), ft * 0.5));

    float thick = (0.003 + 0.013 * pow(a1, 1.8) + 0.004 * tend) * drive;
    float line  = exp(-bd * 320.0);
    float glow  = exp(-bd / thick);
    float haze  = exp(-bd / (0.028 * drive)) * smoothstep(0.50, 0.85, a1) * 0.14 * tend * drive;

    float ptemp = smoothstep(0.32, 0.72, a2 + (a1 - 0.5) * 0.6);
    vec3 pcol = mix(vec3(0.01, 0.45, 0.26), VOLT, smoothstep(0.0, 0.5, ptemp));
    pcol      = mix(pcol, vec3(0.95, 0.95, 0.35), smoothstep(0.55, 1.0, ptemp));
    float pulse = 0.55 + 0.9 * smoothstep(0.3, 0.8, a1);
    vec3 perim = pcol * (glow * 0.55 * pulse + haze) + vec3(0.95, 1.0, 0.85) * line * 0.45 * pulse;
    col += perim * zone * outside * uPerim;
  }

  fragColor = vec4(col, 1.0);
}
`;

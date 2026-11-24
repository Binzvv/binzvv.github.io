import { HEADER, NOISE, SDF } from './chunks.js';

// ─────────────────────────────────────────────────────────────────────────────
// ENERGY FIELD: the HDR source pass. Rendered at an adaptive resolution
// that's lower than the screen. The field is low-frequency by design (the
// reference never shows sharp detail); the optics passes downstream add the
// diffusion.
//
//   L2  plasma body       3-level domain-warped fBm, rising, ragged envelope
//   L3  hue patches       separate warped "temperature" channel: deep emerald
//                         ↔ volt ↔ acid yellow. This is what gives the body depth
//   L4  hot core          warped SDF chevron, burning apex, smeared stem
//   L5  shafts/filaments  vertical light shafts under the core plus ridged
//                         plasma filaments inside the dense regions
//   L8  perimeter field   living inner-edge glow that flows along the border
// ─────────────────────────────────────────────────────────────────────────────

export const FIELD_FRAG = /* glsl */ `${HEADER}
in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform float uAspect;     // width / height
uniform float uEnergy;     // global intensity of the release field
uniform float uRise;       // 0 = plume at the bottom, 1 = fills the screen
uniform float uCore;       // core chevron intensity
uniform float uCoreY;      // core vertical position (0 bottom, 1 top)
uniform float uPerim;      // perimeter field intensity
uniform vec4  uMask;       // layer isolation: plasma, core, shafts, perimeter

${NOISE}
${SDF}

// Volt palette in linear light. Two ramps (cool and warm) are blended by the
// temperature channel, then everything converges to white-hot at high density.
vec3 energyColor(float d, float temp) {
  vec3 cool = mix(vec3(0.000, 0.030, 0.026), vec3(0.000, 0.260, 0.190), smoothstep(0.00, 0.55, d));
  cool      = mix(cool, vec3(0.300, 0.900, 0.260), smoothstep(0.45, 1.10, d));
  vec3 warm = mix(vec3(0.020, 0.045, 0.000), vec3(0.420, 0.820, 0.000), smoothstep(0.00, 0.50, d));
  warm      = mix(warm, vec3(1.000, 0.930, 0.260), smoothstep(0.55, 1.15, d));
  vec3 c = mix(cool, warm, temp);
  c = mix(c, vec3(1.0, 1.0, 0.93), smoothstep(1.05, 1.65, d));
  return c * (0.06 + d * d * 0.95);
}

void main() {
  vec2 uv = vUv;
  vec2 p  = vec2((uv.x - 0.5) * uAspect, uv.y);
  float t = uTime;
  vec3 col = vec3(0.0);

  // ── L2/L3 ─ domain-warped plasma ────────────────────────────────────────
  vec2 fp   = p * vec2(1.15, 0.95);
  vec2 rise = vec2(0.0, t * 0.17);     // sampling downward = content flows up
  float z   = t * 0.085;

  vec2 q = vec2(fbm4(vec3(fp - rise,                    z)),
                fbm4(vec3(fp - rise + vec2(5.2, 1.3),   z + 3.1)));
  vec2 r = vec2(fbm4(vec3(fp + 1.9 * q - rise * 1.5 + vec2(1.7, 9.2), z * 1.4)),
                fbm4(vec3(fp + 1.9 * q - rise * 1.5 + vec2(8.3, 2.8), z * 1.4 + 7.0)));
  float f = fbm3(vec3(fp * 0.9 + 1.7 * r - rise * 2.0, z * 0.8 + 11.0));

  // Ragged rising envelope: the top edge is torn by the warp field itself
  float top  = mix(-0.15, 1.12, uRise);
  float edge = (r.x - 0.5) * 0.55 + (q.y - 0.5) * 0.30;
  float env  = smoothstep(top + 0.10, top - 0.50, p.y + edge * 0.65);
  float column = mix(0.50, 1.0, exp(-p.x * p.x * 6.0));
  float base   = 0.30 + 0.80 * exp(-p.y * 2.4);

  // Core position + organic wobble borrowed from the warp field (free)
  vec2 warp = (r - 0.5) * 0.045 + (q - 0.5) * 0.022;
  vec2 c    = p - vec2(0.0, uCoreY) + warp;

  float dens = smoothstep(0.34, 0.92, f) * 1.10 + 0.08 * q.x;
  // the core heats the plasma around it
  dens += exp(-length(c * vec2(1.0, 1.35)) * 6.0) * 0.28 * uCore;
  dens *= env * column * base * uEnergy;

  float temp = smoothstep(0.25, 0.68, r.y + (q.x - 0.5) * 0.7);
  col += energyColor(dens, temp) * uMask.x;

  // ── L5 ─ filaments + shafts ─────────────────────────────────────────────
  // Ridged turbulence: thin electric seams riding inside the dense regions
  float fil = 1.0 - abs(2.0 * fbm3(vec3(fp * 2.4 + 2.2 * r - rise * 3.0, z * 2.0 + 5.0)) - 1.0);
  fil = pow(fil, 12.0) * env * smoothstep(0.35, 0.95, dens) * uEnergy;
  vec3 filCol = mix(vec3(0.55, 1.0, 0.10), vec3(1.0, 0.97, 0.55), temp);

  // Vertical shafts: anisotropic noise (high x-frequency, low y-frequency),
  // racing upward under the core, like the motion-blurred column in the reference
  float sx = p.x * 16.0 + (r.x - 0.5) * 1.6;
  float sh = fbm3(vec3(sx, p.y * 0.45 - t * 1.9, z * 2.4));
  sh = pow(smoothstep(0.40, 0.90, sh), 2.4);
  float shMask = exp(-p.x * p.x * 45.0)
               * smoothstep(uCoreY + 0.02, uCoreY - 0.20, p.y)
               * smoothstep(-0.05, 0.30, p.y);
  vec3 shafts = vec3(0.72, 1.0, 0.30) * sh * shMask * 0.42 * uCore;

  col += (filCol * fil * 0.6 + shafts) * uMask.z;

  // ── L4 ─ hot core chevron ───────────────────────────────────────────────
  const float W = 0.118, H = 0.058;
  float tipT  = clamp(abs(c.x) / W, 0.0, 1.0);
  float dWing = min(sdSeg(c, vec2(0.0), vec2(-W, -H)), sdSeg(c, vec2(0.0), vec2(W, -H)));
  dWing = max(dWing - 0.0095 * (1.0 - tipT * 0.55), 0.0);                // tapered wings
  float stemW = 0.0085 * smoothstep(-0.24, 0.0, c.y);
  float dStem = max(sdSeg(c, vec2(0.0, -0.01), vec2(0.0, -0.24)) - stemW, 0.0);
  float stemFade = smoothstep(-0.26, -0.02, c.y);

  float wing = exp(-dWing * 120.0) + exp(-dWing * 34.0) * 0.32 + exp(-dWing * 11.0) * 0.05;
  float stem = (exp(-dStem * 80.0) * 0.80 + exp(-dStem * 20.0) * 0.28) * stemFade;
  float apex = exp(-length(c) * 34.0) * 0.6;
  float core = (wing + stem + apex) * uCore;
  vec3 coreCol = mix(vec3(0.70, 1.0, 0.20), vec3(1.0, 1.0, 0.95), smoothstep(0.35, 1.1, core));
  col += coreCol * core * 1.15 * uMask.y;

  // ── L8 ─ perimeter field ────────────────────────────────────────────────
  if (uPerim > 0.001) {
    vec2 pc  = (uv - 0.5) * vec2(uAspect, 1.0);
    float sdb = sdRoundBox(pc, vec2(uAspect * 0.5, 0.5), 0.075);
    float bd = max(-sdb, 0.0);                             // depth inside, ≥ 0
    float outside = exp(-max(sdb, 0.0) * 400.0);          // screen-corner cut-off
    float zone = 1.0 - smoothstep(0.02, 0.085, bd);       // hard budget: never reaches centre
    // Positional noise on a slowly rotating frame: the pattern travels along
    // the border without the radial streaks an angle parameter would produce.
    float ca = cos(t * 0.16), sa = sin(t * 0.16);
    vec2 rp = mat2(ca, -sa, sa, ca) * pc;
    float a1 = fbm4(vec3(rp * 2.6, t * 0.16));
    float a2 = fbm3(vec3(rp.yx * 4.2 + 3.0, t * 0.27 + 9.0));
    float tend = fbm3(vec3(pc * 11.0 + vec2(a1, a2) * 2.5 + vec2(0.0, t * 0.2), t * 0.5));

    float thick = 0.003 + 0.013 * pow(a1, 1.8) + 0.004 * tend;
    float line  = exp(-bd * 320.0);
    float glow  = exp(-bd / thick);
    float haze  = exp(-bd / 0.028) * smoothstep(0.50, 0.85, a1) * 0.14 * tend;

    float ptemp = smoothstep(0.32, 0.72, a2 + (a1 - 0.5) * 0.6);
    vec3 pcol = mix(vec3(0.01, 0.45, 0.26), vec3(0.55, 1.00, 0.00), smoothstep(0.0, 0.5, ptemp));
    pcol      = mix(pcol, vec3(0.95, 0.95, 0.35), smoothstep(0.55, 1.0, ptemp));
    float pulse = 0.55 + 0.9 * smoothstep(0.3, 0.8, a1);
    vec3 perim = pcol * (glow * 0.55 * pulse + haze) + vec3(0.95, 1.0, 0.85) * line * 0.45 * pulse;
    col += perim * zone * outside * uPerim * uMask.w;
  }

  fragColor = vec4(col, 1.0);
}
`;

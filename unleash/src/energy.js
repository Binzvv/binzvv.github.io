// ─────────────────────────────────────────────────────────────────────────────
// ENERGY STATE: plain numbers choreographed by GSAP, translated every frame
// into shader uniforms, plus the living layer (breathing, flow, velocities).
// p-space: x centred and aspect-scaled, y = 0 at the bottom, 1 at the top.
// ─────────────────────────────────────────────────────────────────────────────

export function createEnergy(pipe, { reducedMotion = false } = {}) {
  const E = {
    energy: 0, rise: 0, flow: 1, originX: 0, originY: 0.2,
    sw: 0, swForm: 0, swX: 0, swY: 0.5, swScale: 0.3,
    glow: 0, charge: 0, touchX: 0, touchY: 0.2, ctaX: 0, ctaY: 0.2, ctaR: 0.08,
    ringX: 0, ringY: 0.5, ringR: 0, ringA: 0,
    shockX: 0, shockY: 0.5, shockR: 0, shockA: 0,
    perim: 0, perimDrive: 1, perimRich: 0,
    bloom: 0.7, exposure: 0.95, ca: 0.012, decay: 0.74, driftY: -0.001,
  };

  const view = { w: innerWidth, h: innerHeight, aspect: innerWidth / innerHeight };
  const measure = () => { view.w = innerWidth; view.h = innerHeight; view.aspect = view.w / view.h; };
  const toP = (x, y) => [(x / view.w - 0.5) * view.aspect, 1 - y / view.h];
  const len = (px) => px / view.h;
  const rectToP = (r) => {
    const [x, y] = toP(r.left + r.width / 2, r.top + r.height / 2);
    return { x, y, hw: len(r.width / 2), hh: len(r.height / 2) };
  };

  // iOS display corner radius ≈ 47–55 pt on Face ID iPhones; none on home-button models
  const cornerPx = () => (screen.height >= 812 || screen.width >= 812 ? 50 : 0);

  let flowT = 0;
  let ringV = 0, prevRing = 0;
  let prev = null;
  const vel = { x: 0, y: 0, g: 0 };

  function apply(dt, time) {
    if (!pipe) return;
    const f = pipe.field;
    const U = pipe.uniforms;
    flowT += dt * E.flow;
    f.uFlowT.value = flowT;

    const breath = 0.94 + 0.06 * Math.sin(time * 1.6) * Math.sin(time * 0.57 + 1.2);
    f.uEnergy.value = E.energy * breath;
    f.uRise.value = E.rise;
    f.uOrigin.value.set(E.originX, E.originY);

    f.uSw.value = E.sw * (1 + 0.06 * Math.sin(time * 1.3));
    f.uSwForm.value = E.swForm;
    f.uSwX.value.set(E.swX, E.swY, E.swScale);
    if (prev && Math.hypot(E.swX - prev.x, E.swY - prev.y) > 0.35) prev = null;
    if (prev && dt > 0) {
      const k = Math.min(1, dt * 16);
      vel.x += ((E.swX - prev.x) / dt - vel.x) * k;
      vel.y += ((E.swY - prev.y) / dt - vel.y) * k;
      const g = Math.max(0, (E.swScale - prev.s) / dt / Math.max(E.swScale, 1e-3));
      vel.g += (g - vel.g) * k;
    }
    prev = { x: E.swX, y: E.swY, s: E.swScale };
    f.uSwVel.value.set(reducedMotion ? 0 : vel.x, reducedMotion ? 0 : vel.y);
    f.uSwGrow.value = reducedMotion ? 0 : Math.min(0.7, vel.g * 0.12);

    f.uGlow.value = E.glow * (0.82 + 0.18 * Math.sin(time * 1.9));
    f.uCharge.value = E.charge;
    f.uCta.value.set(E.ctaX, E.ctaY, E.ctaR, 0);
    f.uTouch.value.set(E.touchX, E.touchY);

    f.uRing.value.set(E.ringX, E.ringY, E.ringR, E.ringA);
    if (dt > 0) ringV += (Math.abs(E.ringR - prevRing) / dt - ringV) * Math.min(1, dt * 20);
    prevRing = E.ringR;
    f.uRingV.value = reducedMotion ? 0 : ringV;
    f.uShock.value.set(E.shockX, E.shockY, E.shockR, reducedMotion ? 0 : E.shockA);
    f.uPerim.value = E.perim;
    f.uPerimDrive.value = E.perimDrive;
    f.uPerimRich.value = E.perimRich;
    f.uCorner.value = len(cornerPx());

    U.bloom = E.bloom;
    U.exposure = E.exposure;
    U.ca = E.ca;
    U.decay = reducedMotion ? Math.min(E.decay, 0.6) : E.decay;
    U.drift.set(0, E.driftY);
  }

  addEventListener('resize', measure);
  return { E, apply, toP, len, rectToP, measure, view };
}

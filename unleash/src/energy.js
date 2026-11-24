// ─────────────────────────────────────────────────────────────────────────────
// ENERGY STATE: a flat bag of numbers that GSAP choreographs.
// Every frame it is translated into shader uniforms, with the "living" layer
// added on top: breathing, flow integration, touch charge, swoosh velocity.
// Coordinates: DOM pixels in, shader p-space out (x centred and aspect-scaled,
// y = 0 at the bottom).
// ─────────────────────────────────────────────────────────────────────────────

export function createEnergy(pipe, { reducedMotion = false } = {}) {
  const E = {
    // plasma
    energy: 0, rise: 0, flow: 1, originX: 0, originY: 0.08,
    // swoosh
    sw: 0, swForm: 0, swX: 0, swY: 0.5, swScale: 0.3, swBreath: 1,
    // touch charge
    charge: 0, touchX: 0, touchY: 0.1, ctaX: 0, ctaY: 0.1, ctaHW: 0.2, ctaHH: 0.04,
    // pulses
    ringX: 0, ringY: 0.5, ringR: 0, ringA: 0,
    flashX: 0, flashY: 0.5, flash: 0,
    shockX: 0, shockY: 0.1, shockR: 0, shockA: 0, shake: 0,
    // perimeter
    perim: 0, perimDrive: 1,
    // optics
    ca: 0.02, bloom: 0.75, exposure: 0.92, decay: 0.84, driftY: -0.0012,
  };

  let flowT = 0;
  let prevSw = null;
  const vel = { x: 0, y: 0 };
  const rm = reducedMotion;

  const view = { w: window.innerWidth, h: window.innerHeight, aspect: window.innerWidth / window.innerHeight };
  function measure() {
    view.w = window.innerWidth;
    view.h = window.innerHeight;
    view.aspect = view.w / view.h;
  }
  /** DOM pixel → p-space */
  function toP(x, y) {
    return [(x / view.w - 0.5) * view.aspect, 1 - y / view.h];
  }
  /** DOM length in px → p-space length */
  function len(px) { return px / view.h; }
  function rectToP(r) {
    const [x, y] = toP(r.left + r.width / 2, r.top + r.height / 2);
    return { x, y, hw: len(r.width / 2), hh: len(r.height / 2) };
  }

  function apply(dt, time) {
    if (!pipe) return;
    const f = pipe.field;
    const U = pipe.uniforms;
    const c = E.charge;

    flowT += dt * (E.flow + c * 1.8);
    f.uFlowT.value = flowT;

    // touch charge pressurises the whole environment
    const breath = 0.94 + 0.06 * Math.sin(time * 1.7) * Math.sin(time * 0.61 + 1.3);
    f.uEnergy.value = (E.energy + c * 0.32) * breath;
    f.uRise.value = Math.min(1, E.rise + c * 0.16);
    f.uOrigin.value.set(E.originX, E.originY);

    // swoosh: breathing and velocity for the directional streaks
    const swBreath = 1 + E.swBreath * (0.16 * Math.sin(time * 1.35) + 0.06 * Math.sin(time * 3.1 + 0.7)) + c * 0.45;
    f.uSw.value = E.sw * swBreath;
    f.uSwForm.value = E.swForm;
    f.uSwX.value.set(E.swX, E.swY, E.swScale);
    // a teleport (re-placing the Swoosh) is not motion: drop the velocity history
    if (prevSw && Math.hypot(E.swX - prevSw.x, E.swY - prevSw.y) > 0.35) { vel.x = 0; vel.y = 0; prevSw = null; }
    if (prevSw && dt > 0) {
      const k = Math.min(1, dt * 18);
      vel.x += ((E.swX - prevSw.x) / dt - vel.x) * k;
      vel.y += ((E.swY - prevSw.y) / dt - vel.y) * k;
    }
    prevSw = { x: E.swX, y: E.swY };
    f.uSwVel.value.set(rm ? 0 : vel.x, rm ? 0 : vel.y);

    f.uCharge.value = c;
    f.uCta.value.set(E.ctaX, E.ctaY, E.ctaHW, E.ctaHH);
    f.uTouch.value.set(E.touchX, E.touchY);

    f.uRing.value.set(E.ringX, E.ringY, E.ringR, E.ringA);
    f.uFlash.value.set(E.flashX, E.flashY, E.flash);
    f.uShock.value.set(E.shockX, E.shockY, E.shockR, rm ? 0 : E.shockA);
    f.uShake.value = rm ? 0 : E.shake + c * c * 0.45;

    f.uPerim.value = E.perim + c * 0.16;
    f.uPerimDrive.value = E.perimDrive + c * 0.35;

    U.ca = E.ca + c * 0.035;
    U.bloom = E.bloom;
    U.exposure = E.exposure;
    U.decay = rm ? Math.min(E.decay, 0.6) : E.decay;
    U.drift.set(0, E.driftY);
  }

  window.addEventListener('resize', measure);
  return { E, apply, toP, len, rectToP, measure, view };
}

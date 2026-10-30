// The entity: a soft body with an attitude. Pure canvas so it can also be printed into the final poster.

export const EXPRESSIONS = {
  neutral:   { amp: 0.04, spike: 0, speed: 1, bounce: 0, shake: 0, pulse: 0, scale: 1, sx: 1, sy: 1, tilt: 0, sink: 0, eyeOpen: 1, lidY: 0.15, lidTilt: 0, pupil: 0.5, happy: 0, heart: 0, smile: 0.15, open: 0, zig: 0, wob: 0 },
  joy:       { amp: 0.06, spike: 0, speed: 2, bounce: 1, shake: 0, pulse: 0, scale: 1.04, sx: 1, sy: 1, tilt: 0, sink: 0, eyeOpen: 1, lidY: 0, lidTilt: 0, pupil: 0.55, happy: 1, heart: 0, smile: 1, open: 0.55, zig: 0, wob: 0.2 },
  love:      { amp: 0.05, spike: 0, speed: 1.2, bounce: 0.2, shake: 0, pulse: 1, scale: 1.06, sx: 1, sy: 1, tilt: 0.08, sink: 0, eyeOpen: 1, lidY: 0.2, lidTilt: -0.2, pupil: 0.7, happy: 0, heart: 1, smile: 0.8, open: 0.1, zig: 0, wob: 0 },
  angry:     { amp: 0.03, spike: 1, speed: 3.2, bounce: 0, shake: 1, pulse: 0, scale: 1.14, sx: 1.08, sy: 0.92, tilt: 0, sink: 0, eyeOpen: 1, lidY: 0.6, lidTilt: 1, pupil: 0.32, happy: 0, heart: 0, smile: -0.7, open: 0.25, zig: 1, wob: 0 },
  sad:       { amp: 0.03, spike: 0, speed: 0.45, bounce: 0, shake: 0, pulse: 0, scale: 0.9, sx: 1.08, sy: 0.84, tilt: -0.08, sink: 1, eyeOpen: 0.8, lidY: 0.55, lidTilt: -1, pupil: 0.55, happy: 0, heart: 0, smile: -0.8, open: 0, zig: 0, wob: 0 },
  surprised: { amp: 0.08, spike: 0.2, speed: 2.4, bounce: 0.4, shake: 0.2, pulse: 0, scale: 1.12, sx: 0.92, sy: 1.12, tilt: 0, sink: 0, eyeOpen: 1.25, lidY: 0, lidTilt: 0, pupil: 0.25, happy: 0, heart: 0, smile: 0, open: 1, zig: 0, wob: 0 },
  confused:  { amp: 0.05, spike: 0, speed: 1, bounce: 0, shake: 0, pulse: 0, scale: 1, sx: 1, sy: 1, tilt: 0.16, sink: 0, eyeOpen: 1, lidY: 0.25, lidTilt: 0.3, pupil: 0.45, happy: 0, heart: 0, smile: -0.1, open: 0.1, zig: 0, wob: 1 },
  calm:      { amp: 0.025, spike: 0, speed: 0.4, bounce: 0, shake: 0, pulse: 0, scale: 0.98, sx: 1.04, sy: 0.97, tilt: 0, sink: 0.2, eyeOpen: 0.15, lidY: 0, lidTilt: 0, pupil: 0.5, happy: 0.6, heart: 0, smile: 0.35, open: 0, zig: 0, wob: 0 },
  listening: { amp: 0.05, spike: 0, speed: 1.4, bounce: 0, shake: 0, pulse: 0, scale: 1.03, sx: 0.97, sy: 1.04, tilt: 0.1, sink: 0, eyeOpen: 1.1, lidY: 0, lidTilt: 0, pupil: 0.5, happy: 0, heart: 0, smile: 0, open: 0.45, zig: 0, wob: 0 },
};

export function makeParams(mood = 'neutral') { return { ...EXPRESSIONS[mood] }; }

export function lerpParams(p, target, k) {
  for (const key in target) p[key] += (target[key] - p[key]) * k;
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  ctx.closePath();
}

// p: params · t: seconds · look: {x,y} in -1..1 · c: {body, eye, ink}
export function drawEntity(ctx, p, t, cx, cy, R, look, c, blink = 1) {
  const sp = t * p.speed;
  const bounce = -Math.abs(Math.sin(sp * 3.2)) * p.bounce * R * 0.22;
  const sink = p.sink * R * 0.18;
  const shake = p.shake ? (Math.random() - 0.5) * p.shake * R * 0.05 : 0;
  const beat = 1 + p.pulse * Math.pow(Math.max(0, Math.sin(t * 7)), 10) * 0.1;
  const breath = 1 + Math.sin(t * 1.6) * 0.015;
  const wob = Math.sin(t * 2.2) * p.wob * 0.18;
  const squash = 1 + Math.sin(sp * 6.4) * p.bounce * 0.05;

  ctx.save();
  ctx.translate(cx + shake + look.x * R * 0.08, cy + bounce + sink + look.y * R * 0.05);
  ctx.rotate(p.tilt * (look.x >= 0 ? 1 : -1) * 0.6 + wob + look.x * 0.06);
  ctx.scale(p.scale * p.sx * beat * breath / squash, p.scale * p.sy * beat * breath * squash);

  // Body
  const N = 96;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let r = 1
      + p.amp * (Math.sin(3 * a + sp * 1.3) * 0.6 + Math.sin(5 * a - sp * 1.7) * 0.4)
      + p.spike * Math.pow(Math.abs(Math.sin(a * 6 + sp * 2)), 8) * 0.22;
    pts.push([Math.cos(a) * r * R, Math.sin(a) * r * R * 0.94]);
  }
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = pts[i % N], b = pts[(i + 1) % N];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    i === 0 ? ctx.moveTo(mx, my) : ctx.quadraticCurveTo(a[0], a[1], mx, my);
  }
  ctx.fillStyle = c.body;
  ctx.fill();

  // Eyes
  const ex = R * 0.17, ey = R * 0.2;
  const open = Math.max(0.04, Math.min(1.3, p.eyeOpen * blink));
  [-1, 1].forEach((s) => {
    const x0 = s * R * 0.34 + look.x * R * 0.05, y0 = -R * 0.12 + look.y * R * 0.04;
    ctx.save();
    ctx.translate(x0, y0);
    if (p.happy > 0.5) {
      // closed, happy arcs
      ctx.strokeStyle = c.ink; ctx.lineWidth = R * 0.055; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, ey * 0.35, ex * 0.85, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 0, ex, ey * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.eye; ctx.fill();
      ctx.save(); ctx.clip();
      const px = look.x * ex * 0.45, py = look.y * ey * 0.4;
      ctx.fillStyle = c.ink;
      if (p.heart > 0.5) { heartPath(ctx, px, py + ey * 0.1, ex * 0.7); ctx.fillStyle = '#ff4f9a'; ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(px, py, ex * p.pupil, 0, Math.PI * 2); ctx.fill(); }
      // lids
      const base = -ey * 1.7 + p.lidY * ey * 1.4;
      // Lid edge y(x) = base − tilt·s·x/ex: angry drops toward the nose, sad drops outward.
      const k = p.lidTilt * s * 1.4 * ey * 0.7;
      ctx.beginPath();
      ctx.moveTo(-ex * 1.4, -ey * 2);
      ctx.lineTo(ex * 1.4, -ey * 2);
      ctx.lineTo(ex * 1.4, base - k);
      ctx.lineTo(-ex * 1.4, base + k);
      ctx.closePath();
      ctx.fillStyle = c.body; ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  });

  // Mouth
  const my = R * 0.32, mw = R * 0.26;
  ctx.strokeStyle = c.ink; ctx.fillStyle = c.ink;
  ctx.lineWidth = R * 0.05; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (p.zig > 0.5) {
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) ctx.lineTo(-mw + (i / 6) * mw * 2, my + (i % 2 ? -1 : 1) * R * 0.04 + R * 0.03);
    ctx.stroke();
  } else if (p.open > 0.3) {
    ctx.beginPath();
    ctx.ellipse(0, my + p.smile * R * 0.03, mw * (0.35 + p.smile * 0.25 + 0.2), R * 0.1 * p.open, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(-mw, my);
    ctx.quadraticCurveTo(0, my + p.smile * R * 0.22, mw, my);
    ctx.stroke();
  }
  ctx.restore();
}

// Art-directed generative placeholders.
// Any `.ph` element with a non-empty data-src renders that image/video instead — swap in real assets there.

const painters = {
  // High-contrast halftone figure with glitch displacement.
  halftone(ctx, w, h) {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, w, h);
    const step = Math.max(6, Math.round(Math.min(w, h) / 70));
    const hx = w * 0.52, hy = h * 0.36, hr = Math.min(w, h) * 0.24;
    ctx.fillStyle = '#ededed';
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const dh = Math.hypot((x - hx) / 0.82, y - hy) / hr;               // head
        const sh = Math.hypot((x - w * 0.5) / 2.1, (y - h * 1.02) / 1.1) / hr; // shoulders
        const light = Math.max(0, 1 - Math.min(dh, sh)) * (0.55 + 0.45 * Math.sin(x * 0.012 - y * 0.004));
        const rim = Math.max(0, 1 - Math.abs(dh - 1) * 6) * 0.6;
        const v = Math.min(1, light + rim + (Math.random() < 0.02 ? 0.6 : 0));
        if (v < 0.04) continue;
        ctx.beginPath();
        ctx.arc(x, y, (step / 2) * Math.sqrt(v), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < 7; i++) {
      const y = Math.random() * h, bh = 4 + Math.random() * h * 0.05;
      const dx = (Math.random() - 0.5) * w * 0.18;
      ctx.drawImage(ctx.canvas, 0, y, w, bh, dx, y, w, bh);
    }
  },

  // Quiet seascape: soft sky, a hard horizon, one moon.
  horizon(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#d9d4c8');
    g.addColorStop(0.6, '#ece8df');
    g.addColorStop(0.601, '#b9b4a8');
    g.addColorStop(1, '#8f8a80');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f7f5f0';
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.34, Math.min(w, h) * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.08;
    for (let y = h * 0.61; y < h; y += 3) {
      ctx.fillStyle = Math.random() < 0.5 ? '#fff' : '#000';
      ctx.fillRect(Math.random() * w * 0.4, y, w * (0.3 + Math.random() * 0.6), 1);
    }
    ctx.globalAlpha = 1;
  },

  // Moiré rings and a raking beam of light.
  crowd(ctx, w, h) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.3, cy = h * 0.7, R = Math.hypot(w, h);
    ctx.lineWidth = Math.max(2, R / 160);
    ctx.strokeStyle = '#e8e8e8';
    for (let r = 8; r < R; r += ctx.lineWidth * 2.2) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(w * 0.55, 0); ctx.lineTo(w, 0); ctx.lineTo(w * 0.35, h); ctx.lineTo(w * 0.05, h);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  },

  // Studio sphere under one hard light.
  sphere(ctx, w, h) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#9a9a9a'); bg.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const r = Math.min(w, h) * 0.32, x = w * 0.5, y = h * 0.52;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(x + r * 0.3, y + r * 1.05, r * 1.1, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r);
    g.addColorStop(0, '#fff'); g.addColorStop(0.35, '#bdbdbd'); g.addColorStop(1, '#0c0c0c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  },
};

function paint(el) {
  const src = el.dataset.src;
  if (src) {
    if (el.dataset.painted === src) return;
    el.textContent = '';
    const media = /\.(mp4|webm)$/i.test(src) ? Object.assign(document.createElement('video'), { muted: true, loop: true, autoplay: true, playsInline: true }) : new Image();
    media.src = src;
    media.alt = '';
    el.appendChild(media);
    el.dataset.painted = src;
    return;
  }
  const r = el.dataset.size === 'viewport'
    ? { width: window.innerWidth * 0.7, height: window.innerHeight * 0.7 }
    : el.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let c = el.querySelector('canvas');
  if (!c) { c = document.createElement('canvas'); el.appendChild(c); }
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (c.width === w && c.height === h) return;
  c.width = w; c.height = h;
  (painters[el.dataset.ph] || painters.sphere)(c.getContext('2d'), w, h);
}

export function paintPlaceholders(root = document) {
  root.querySelectorAll('.ph').forEach(paint);
}

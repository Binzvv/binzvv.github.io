/* ==========================================================================
   NIGHT CITY // SIGNAL LOST
   Scene map
     01 boot       fixed overlay, scroll locked, typed system messages
     02 city       procedural parallax skyline, pointer-reactive
     03 descent    pinned, scrubbed camera travel through three depth layers
        NC-OS      cyberware application system (engine.js, operator.js, ncos.js)
     04 archive    pinned horizontal dossier run (vertical on mobile)
     05 psychosis  pinned, interface loses stability, cut to black
     06 end        silence, one red RECONNECT
   One value, psy (0..1), is derived from scroll and drives colour,
   instability, grain and glitch frequency across every scene.
   Humanity itself comes from NC-OS state; scroll only projects its collapse.
   ========================================================================== */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const isStatic = reduced || !hasGsap;
  const isMobile = () => innerWidth <= 760;
  if (isStatic) root.classList.add('is-static');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const pick = (arr, R) => arr[Math.floor(R() * arr.length)];
  const GLYPHS = 'アカサタナハマヤラワ#%&@$<>/\\01▓▒░ﾊﾐﾋｰ';
  const NEON = ['var(--cyan)', 'var(--yellow)', '#ff2a8a', 'var(--red)', 'var(--cyan)'];

  /* ------------------------------------------------------------------
     Film grain texture, generated once
     ------------------------------------------------------------------ */
  (() => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'); const img = x.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    $('.fx--grain').style.backgroundImage = `url(${c.toDataURL()})`;
  })();

  /* ------------------------------------------------------------------
     The humanity variable
     ------------------------------------------------------------------ */
  const ui = {
    hum: $('#humanity'), gauge: $('#gauge'), alt: $('#alt'), scene: $('#sceneName'),
  };
  let psy = -1;
  function setPsy(v, scene, alt) {
    v = clamp(v, 0, 1);
    if (scene && ui.scene.textContent !== scene) ui.scene.textContent = scene;
    if (alt !== undefined) ui.alt.textContent = Math.round(alt);
    if (Math.abs(v - psy) < 0.002) return;
    psy = v;
    const heat = smooth(0.38, 0.88, v);
    const instab = Math.pow(smooth(0.22, 1, v), 1.4);
    root.style.setProperty('--psy', v.toFixed(3));
    root.style.setProperty('--heat', heat.toFixed(3));
    root.style.setProperty('--instab', instab.toFixed(3));
    renderHum();
    psyHook(instab);
  }
  /* the gauge shows real humanity from NC-OS; only the psychosis scene projects it toward zero */
  let humanityBase = 100;
  function renderHum() {
    const drain = smooth(0.44, 1, Math.max(psy, 0));
    const hum = Math.max(3, Math.round(humanityBase - drain * (humanityBase - 3)));
    root.style.setProperty('--hum', (hum / 100).toFixed(3));
    ui.hum.textContent = hum;
    ui.gauge.setAttribute('aria-valuenow', hum);
  }
  let psyHook = () => {};

  /* every unstable element gets its own drift direction */
  function seedJitter(els) {
    els.forEach((el) => {
      el.style.setProperty('--jx', (Math.random() * 2 - 1).toFixed(2));
      el.style.setProperty('--jy', (Math.random() * 2 - 1).toFixed(2));
      el.style.setProperty('--jr', (Math.random() * 2 - 1).toFixed(2));
    });
  }

  /* ------------------------------------------------------------------
     Glitch bursts
     ------------------------------------------------------------------ */
  const tear = $('#tear'); const flash = $('#flash');
  let glitchTimer;
  function glitch(power = 0.5, dur, force) {
    if (isStatic) return;
    if (!force && (root.classList.contains('is-silent') || root.classList.contains('is-locked'))) return;
    dur = dur || 110 + power * 260;
    root.style.setProperty('--gp', ((Math.random() < 0.5 ? -1 : 1) * (0.5 + power * 1.6)).toFixed(2));
    root.classList.add('is-glitch');
    let html = '';
    const n = 2 + Math.round(power * 7);
    const cols = ['var(--yellow)', 'var(--cyan)', 'var(--red)', '#fff'];
    for (let i = 0; i < n; i++) {
      html += `<i style="top:${(Math.random() * 100).toFixed(1)}%;height:${(2 + Math.random() * (6 + power * 70)).toFixed(0)}px;background:${cols[i % 4]};opacity:${(0.4 + Math.random() * 0.6).toFixed(2)};transform:translateX(${((Math.random() - 0.5) * 20).toFixed(1)}%)"></i>`;
    }
    tear.innerHTML = html;
    if (psy > 0.55 && Math.random() < psy * 0.55) flashFrame(dur);
    if (power > 0.65) gsap.fromTo(flash, { opacity: 0.32 * power }, { opacity: 0, duration: 0.35, ease: 'power2.out' });
    const signs = $$('.sign:not(.is-dead)');
    if (signs.length) {
      const s = signs[Math.floor(Math.random() * signs.length)];
      s.classList.add('is-dead'); setTimeout(() => s.classList.remove('is-dead'), 900 + Math.random() * 1600);
    }
    clearTimeout(glitchTimer);
    glitchTimer = setTimeout(() => { root.classList.remove('is-glitch'); tear.innerHTML = ''; }, dur);
  }
  /* a near-subliminal cut to the psycho frame */
  const psyFlash = $('#psyFlash');
  function flashFrame(ms = 90) {
    psyFlash.style.setProperty('--fx', ((Math.random() - 0.5) * 6).toFixed(1) + '%');
    psyFlash.classList.add('is-on');
    setTimeout(() => psyFlash.classList.remove('is-on'), Math.min(ms, 160));
  }

  /* ambient malfunction: rare at first, constant near the end */
  function ambient() {
    if (!document.hidden && Math.random() < 0.06 + Math.max(psy, 0) * 0.9) glitch(0.15 + Math.max(psy, 0) * 0.85);
    gsap.delayedCall(0.9 + Math.random() * (3.4 - Math.max(psy, 0) * 2.6), ambient);
  }

  /* ------------------------------------------------------------------
     02 Procedural Night City
     ------------------------------------------------------------------ */
  const SIGNS_V = ['ラーメン', '義体', 'クローム', '医者', '二十四時間', 'バー', 'ホテル', '質屋', '電脳', '夜明け', '修理'];
  const SIGNS_H = ['ラーメン 24h', 'CHROME FIX', '義眼', 'LAST CALL', 'NO REFUNDS', '診療所'];

  function winPattern(id, cw, ch, ww, wh, cols, rows, p, palette, R) {
    let s = `<pattern id="${id}" width="${cw * cols}" height="${ch * rows}" patternUnits="userSpaceOnUse">`;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + (cw - ww) / 2; const y = r * ch + (ch - wh) / 2;
      if (R() < p) s += `<rect x="${x}" y="${y}" width="${ww}" height="${wh}" class="${pick(palette, R)}" opacity="${(0.3 + R() * 0.7).toFixed(2)}"/>`;
      else if (R() < 0.35) s += `<rect x="${x}" y="${y}" width="${ww}" height="${wh}" class="wd"/>`;
    }
    return s + '</pattern>';
  }
  const sign = (x, y, text, size, opts = {}) =>
    `<div class="sign${opts.h ? ' sign--h' : ''}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;font-size:${size.toFixed(0)}px;--c:${opts.c};--fd:${(5 + Math.random() * 9).toFixed(1)}s;--fdl:-${(Math.random() * 9).toFixed(1)}s">${text}</div>`;

  function buildCity() {
    const H = $('#stage').clientHeight;
    const R = rng(2077);
    const layers = { far: $('.layer--far'), mid: $('.layer--mid'), near: $('.layer--near') };

    /* far: skyline silhouettes and one corporate megatower */
    {
      const el = layers.far; const W = el.offsetWidth; const LH = el.offsetHeight;
      const s = clamp(W / 1700, 0.55, 1.2);
      let defs = '';
      for (let k = 0; k < 3; k++) defs += winPattern(`pf${k}`, 6 * s, 9 * s, 2 * s, 3 * s, 8, 10, 0.22, ['wc', 'wc', 'wm', 'wy'], R);
      let g = '';
      let x = 0;
      while (x < W) {
        const bw = (34 + R() * 90) * s;
        let top = H * (0.24 + R() * 0.36);
        if (R() < 0.1) top = H * (0.1 + R() * 0.12);
        g += `<rect class="bld bld--far" x="${x}" y="${top}" width="${bw}" height="${LH - top}"/>`;
        g += `<rect x="${x}" y="${top + 6}" width="${bw}" height="${LH - top}" fill="url(#pf${Math.floor(R() * 3)})" opacity=".5"/>`;
        if (R() < 0.3) g += `<line class="edge" x1="${x + bw / 2}" x2="${x + bw / 2}" y1="${top}" y2="${top - 26 * s}"/><rect class="beacon" x="${x + bw / 2 - 1.5}" y="${top - 28 * s}" width="3" height="3" style="animation-delay:-${(R() * 2).toFixed(2)}s"/>`;
        x += bw + (R() < 0.3 ? R() * 14 * s : 0);
      }
      /* megatower */
      const mx = W * (isMobile() ? 0.58 : 0.66); const mw = Math.max(64, W * 0.075); const mt = H * 0.06;
      g += `<polygon class="bld bld--far" points="${mx},${LH} ${mx},${mt + 60 * s} ${mx + mw * 0.18},${mt + 30 * s} ${mx + mw * 0.18},${mt} ${mx + mw * 0.82},${mt} ${mx + mw * 0.82},${mt + 30 * s} ${mx + mw},${mt + 60 * s} ${mx + mw},${LH}"/>`;
      g += `<rect x="${mx + mw * 0.18}" y="${mt + 10}" width="${mw * 0.64}" height="${LH}" fill="url(#pf0)" opacity=".7"/>`;
      g += `<line class="edge edge--hot" x1="${mx}" x2="${mx}" y1="${mt + 60 * s}" y2="${LH}"/><line class="edge edge--hot" x1="${mx + mw}" x2="${mx + mw}" y1="${mt + 60 * s}" y2="${LH}"/>`;
      g += `<line class="edge edge--hot" x1="${mx + mw / 2}" x2="${mx + mw / 2}" y1="${mt}" y2="${mt - 110 * s}"/><rect class="beacon" x="${mx + mw / 2 - 2}" y="${mt - 114 * s}" width="4" height="4"/>`;
      el.firstElementChild.innerHTML =
        `<svg viewBox="0 0 ${W} ${LH}" preserveAspectRatio="none" aria-hidden="true"><defs>${defs}</defs>${g}</svg>` +
        sign(mx + mw * 0.32, mt + H * 0.1, '夜の街', 18 * s, { c: 'var(--red)' });
    }

    /* mid: dense towers, vertical neon, air traffic */
    {
      const el = layers.mid; const W = el.offsetWidth; const LH = el.offsetHeight;
      const s = clamp(W / 1600, 0.6, 1.25);
      let defs = '';
      for (let k = 0; k < 4; k++) defs += winPattern(`pm${k}`, 10 * s, 13 * s, 4 * s, 5 * s, 9, 12, 0.26, ['wc', 'wy', 'wm', 'wc', 'wd'], R);
      let g = ''; let dom = '';
      let x = -20;
      while (x < W) {
        const bw = (64 + R() * 140) * s;
        let top = H * (0.42 + R() * 0.5);
        if (R() < 0.16) top = H * (0.2 + R() * 0.16);
        g += `<rect class="bld bld--mid" x="${x}" y="${top}" width="${bw}" height="${LH - top}"/>`;
        g += `<rect x="${x}" y="${top + 8}" width="${bw}" height="${LH - top}" fill="url(#pm${Math.floor(R() * 4)})" opacity=".75"/>`;
        g += `<line class="edge" x1="${x}" x2="${x}" y1="${top}" y2="${LH}"/>`;
        if (R() < 0.35) g += `<rect x="${x + bw - 4 * s}" y="${top}" width="${2 * s}" height="${LH - top}" class="${R() < 0.5 ? 'wc' : 'wm'}" opacity=".55"/>`;
        if (bw > 80 * s && R() < 0.45) {
          const sy = top + H * (0.08 + R() * 1.3);
          if (sy < LH - H * 0.3) dom += sign(x + bw * (0.15 + R() * 0.4), sy, pick(SIGNS_V, R), (13 + R() * 12) * s, { c: pick(NEON, R) });
        }
        x += bw + (R() < 0.5 ? (10 + R() * 40) * s : 0);
      }
      for (let i = 0; i < 8; i++) {
        dom += `<i class="av${i % 3 === 0 ? ' av--r' : ''}" style="top:${(H * (0.12 + R() * 1.1)).toFixed(0)}px;--d:${(9 + R() * 16).toFixed(1)}s;--dl:-${(R() * 20).toFixed(1)}s"></i>`;
      }
      el.firstElementChild.innerHTML =
        `<svg viewBox="0 0 ${W} ${LH}" preserveAspectRatio="none" aria-hidden="true"><defs>${defs}</defs>${g}</svg>` + dom;
    }

    /* near: canyon walls, skybridge, billboards, rail, street */
    {
      const el = layers.near; const W = el.offsetWidth; const LH = el.offsetHeight;
      const V0 = W * 6 / 112; const VW = W * 100 / 112; const vx = (f) => V0 + VW * f;
      const mob = isMobile();
      const s = clamp(VW / 1440, 0.6, 1.3);
      const defs = winPattern('pn0', 26 * s, 16 * s, 18 * s, 3 * s, 5, 12, 0.2, ['wy', 'wc', 'wd'], R) +
                   winPattern('pn1', 26 * s, 16 * s, 18 * s, 3 * s, 5, 12, 0.16, ['wm', 'wc', 'wd'], R) +
                   winPattern('pn2', 9 * s, 30 * s, 6 * s, 18 * s, 10, 1, 0.8, ['wc', 'wc', 'wy'], R);
      const L = mob ? 0.1 : 0.17; const Rr = mob ? 0.88 : 0.8;
      let g = '';
      const wall = (x1, x2, top, pat) =>
        `<rect class="bld bld--near" x="${x1}" y="${top}" width="${x2 - x1}" height="${LH - top}"/><rect x="${x1}" y="${top + 10}" width="${x2 - x1}" height="${LH - top}" fill="url(#${pat})" opacity=".8"/>`;
      g += wall(0, vx(L), H * 0.52, 'pn0') + wall(vx(L), vx(L + 0.05), H * 0.86, 'pn1');
      g += wall(vx(Rr), W, H * 0.3, 'pn1') + wall(vx(Rr - 0.04), vx(Rr), H * 1.05, 'pn0');
      g += `<line class="edge" x1="${vx(L)}" x2="${vx(L)}" y1="${H * 0.52}" y2="${LH}"/><line class="edge edge--hot" x1="${vx(Rr)}" x2="${vx(Rr)}" y1="${H * 0.3}" y2="${LH}"/>`;
      /* skybridge */
      const by = H * 1.16; const bh = H * 0.065;
      g += `<rect class="bld bld--near" x="${vx(L)}" y="${by}" width="${vx(Rr) - vx(L)}" height="${bh}"/>`;
      g += `<rect x="${vx(L)}" y="${by + bh * 0.25}" width="${vx(Rr) - vx(L)}" height="${bh * 0.5}" fill="url(#pn2)" opacity=".8"/>`;
      g += `<line class="edge" x1="${vx(L)}" x2="${vx(Rr)}" y1="${by}" y2="${by}"/>`;
      /* power and data lines */
      [0.92, 1.72, 2.3, 2.38, 3.05].forEach((f) => {
        const y = H * f; const x1 = vx(L); const x2 = vx(Rr);
        g += `<path class="cable" d="M${x1} ${y} Q ${(x1 + x2) / 2} ${y + H * (0.05 + R() * 0.08)} ${x2} ${y + (R() - 0.5) * 30}"/>`;
      });
      /* elevated rail */
      const ry = H * 2.62; const rh = H * 0.045;
      g += `<rect class="bld bld--near" x="0" y="${ry}" width="${W}" height="${rh}"/><line class="edge edge--hot" x1="0" x2="${W}" y1="${ry}" y2="${ry}"/>`;
      for (let px = vx(0.08); px < W; px += VW * (mob ? 0.4 : 0.22)) g += `<rect class="bld bld--near" x="${px}" y="${ry}" width="${22 * s}" height="${LH - ry}"/>`;
      /* street */
      g += `<rect class="bld bld--near" x="0" y="${LH - H * 0.07}" width="${W}" height="${H * 0.07}"/><line class="edge" x1="0" x2="${W}" y1="${LH - H * 0.07}" y2="${LH - H * 0.07}"/>`;

      let dom = '';
      /* signs on the canyon walls */
      [0.7, 1.4, 1.95, 2.85].forEach((f, i) => dom += sign(vx(L * 0.45), H * f, SIGNS_V[(i * 3) % SIGNS_V.length], (22 + R() * 14) * s, { c: pick(NEON, R) }));
      [0.62, 1.5, 2.25, 2.95].forEach((f, i) => dom += sign(vx(Rr + 0.04), H * f, SIGNS_V[(i * 3 + 1) % SIGNS_V.length], (22 + R() * 14) * s, { c: pick(NEON, R) }));
      /* billboards (original placeholder brands) */
      const bw = Math.max(VW * 0.4, 260);
      dom += `<div class="board board--img" style="left:${vx(0.04)}px;top:${H * 1.42}px;width:${bw}px;height:${H * 0.4}px;--c:var(--yellow);--c2:var(--cyan);--fd:11s">
        <img src="img/board-vesna.jpg" alt="" style="object-position:55% 35%" decoding="async" /><span class="board__small">Sundown Pharmaceuticals</span><span class="board__big">FEEL<br>NOTHING.</span><span class="board__jp">痛みのない明日</span></div>`;
      dom += `<div class="board" style="left:${vx(mob ? 0.96 : 0.58) - (mob ? bw : 0)}px;top:${H * 1.98}px;width:${bw}px;height:${H * 0.38}px;--c:var(--cyan);--c2:#ff2a8a;--fd:8s">
        <img src="img/board-kid.jpg" alt="" style="object-position:55% 35%" decoding="async" /><span class="board__small">Hakuren Chrome. Finance from 0%</span><span class="board__big">NEW ARMS<br>BY FRIDAY.</span><span class="board__jp">義体ローン</span></div>`;
      /* train on the rail */
      dom += `<div class="train" style="top:${ry - H * 0.05}px;height:${H * 0.05}px"></div>`;
      /* street level shopfronts and steam */
      SIGNS_H.slice(0, mob ? 3 : 6).forEach((t, i, a) => {
        dom += sign(vx(0.06 + (i / a.length) * 0.86), LH - H * (0.28 + R() * 0.12), t, (15 + R() * 8) * s, { h: true, c: pick(NEON, R) });
      });
      dom += `<i class="steam" style="left:${vx(0.1)}px"></i><i class="steam" style="left:${vx(0.55)}px;animation-delay:-4s"></i>`;
      el.firstElementChild.innerHTML =
        `<svg viewBox="0 0 ${W} ${LH}" preserveAspectRatio="none" aria-hidden="true"><defs>${defs}</defs>${g}</svg>` + dom;
    }
  }

  /* psychosis skyline: same city, flattened to a silhouette */
  function buildPsyCity() {
    const R = rng(66); const W = 1600; const H = 600;
    let g = ''; let x = 0;
    const defs = winPattern('pp', 12, 16, 4, 6, 8, 8, 0.18, ['wc'], R);
    while (x < W) {
      const bw = 40 + R() * 120; const top = 120 + R() * 380;
      g += `<rect class="bld" x="${x}" y="${top}" width="${bw}" height="${H - top}"/><rect x="${x}" y="${top + 6}" width="${bw}" height="${H - top}" fill="url(#pp)"/>`;
      x += bw + R() * 8;
    }
    $('#psyCity').innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice"><defs>${defs}</defs>${g}</svg>`;
    /* heart monitor traces */
    let calm = 'M0 100'; for (let i = 0; i < 1200; i += 150) calm += ` H${i + 40} q 8 -14 16 0 H${i + 64} L${i + 70} 30 L${i + 76} 160 L${i + 82} 100 H${i + 100} q 12 -20 24 0`;
    let wild = 'M0 100'; const Rw = rng(9); for (let i = 6; i <= 1200; i += 6) wild += ` L${i} ${(100 + (Rw() - 0.5) * (Rw() < 0.15 ? 190 : 60)).toFixed(0)}`;
    $('.ecg--calm').setAttribute('d', calm); $('.ecg--wild').setAttribute('d', wild);
  }

  /* ------------------------------------------------------------------
     Rain
     ------------------------------------------------------------------ */
  const rain = { on: !isStatic, drops: [], w: 0, h: 0, wind: 0.18 };
  const rc = $('#rain'); const rx = rc.getContext('2d');
  function sizeRain() {
    rain.w = rc.width = Math.round(rc.clientWidth / 1.5); rain.h = rc.height = Math.round(rc.clientHeight / 1.5);
    const n = Math.min(240, Math.round((rain.w * rain.h) / 2600));
    rain.drops = Array.from({ length: n }, () => ({ x: Math.random() * rain.w, y: Math.random() * rain.h, l: 6 + Math.random() * 16, v: 6 + Math.random() * 9, a: 0.12 + Math.random() * 0.35 }));
  }
  function drawRain(step = true) {
    rx.clearRect(0, 0, rain.w, rain.h);
    rx.lineWidth = 1;
    for (const d of rain.drops) {
      if (step) { d.y += d.v; d.x += d.v * rain.wind; if (d.y > rain.h) { d.y = -d.l; d.x = Math.random() * rain.w; } if (d.x > rain.w) d.x = 0; if (d.x < 0) d.x = rain.w; }
      rx.strokeStyle = `rgba(190,215,255,${d.a})`;
      rx.beginPath(); rx.moveTo(d.x, d.y); rx.lineTo(d.x - d.l * rain.wind, d.y - d.l); rx.stroke();
    }
  }

  /* ------------------------------------------------------------------
     04 Archive data (original placeholder characters)
     ------------------------------------------------------------------ */
  const FILES = [
    {
      id: '0417', first: 'VESNA', last: 'KOI', alias: 'Operator 01', role: 'netrunner', jp: 'ヴェスナ・コイ',
      c: 'var(--yellow)', status: 'Active', sc: 'var(--cyan)',
      img: 'img/char-vesna.jpg', pos: '60% 30%', rx: 66, ry: 58, match: '98.4',
      quote: 'The city remembers everything.',
      fields: [['Role', 'Netrunner', 0], ['Affiliation', 'Halcyon crew', 1], ['Clearance', 'Level 4', 0], ['Combat style', 'Network infiltration', 0]],
      implants: [['Neural link', 72], ['Optical suite', 40], ['Synaptic accelerator', 64], ['Thermal control', 30]], cost: 58,
    },
    {
      id: '1188', first: 'KID', last: 'HALCYON', alias: 'Operator 02', role: 'solo', jp: 'キッド・ハルシオン',
      c: 'var(--red)', status: 'Wanted', sc: 'var(--yellow)',
      img: 'img/char-kid.jpg', pos: '50% 30%', rx: 60, ry: 46, match: '91.0',
      quote: 'Stay fast. Stay gone.',
      fields: [['Role', 'Solo', 0], ['Combat style', 'Close quarters, mobility', 0], ['Last seen', 'Elevated rail, car 6, 23:40', 1], ['Bounty', '€$ 40,000. Alive preferred', 1]],
      implants: [['Skeleton reinforcement', 66], ['Reflex booster', 82], ['Leg actuators', 70], ['Subdermal armour', 54]], cost: 71,
    },
    {
      id: '2001', first: 'AUNTIE', last: 'RUST', alias: 'Operator 03', role: 'heavy gunner', jp: 'アンティ・ラスト',
      c: 'var(--cyan)', status: 'Under contract', sc: 'var(--red)',
      img: 'img/char-rust.jpg', pos: '50% 30%', rx: 50, ry: 41, match: '88.7',
      quote: 'Jobs pay. Attachments get you killed.',
      fields: [['Real name', 'Adaeze Okonkwo-Rust', 1], ['Role', 'Heavy weapons', 0], ['Combat style', 'Mid range, suppressive', 0], ['Licence', 'Revoked 2071. Still working', 1]],
      implants: [['Smart weapon interface', 60], ['Targeting optic', 35], ['Adrenaline regulator', 48], ['Pain editor', 92]], cost: 63,
    },
    {
      id: '0932', first: 'DOMINO', last: 'RECK', alias: 'Operator 04', role: 'infiltrator', jp: 'ドミノ・レック',
      c: '#ff2a8a', status: 'Signal lost', sc: 'var(--red)',
      img: 'img/char-domino.jpg', pos: '50% 30%', rx: 55, ry: 37, match: '76.3',
      quote: 'Silence is a weapon.',
      fields: [['Real name', '[Redacted by corp security]', 0], ['Role', 'Infiltrator', 0], ['Combat style', 'Stealth, assassination', 0], ['Kills on file', '41 confirmed. 9 disputed', 1]],
      implants: [['Cardio booster', 44], ['Thermal cloak', 76], ['Audio masking', 38], ['Balance control', 30]], cost: 52,
    },
    {
      id: '0664', first: 'RAIL', last: 'RAT', alias: 'Operator 05', role: 'tech', jp: 'レイルラット',
      c: '#b6ff1f', status: 'Unknown', sc: 'var(--dim)',
      img: 'img/char-railrat.jpg', pos: '50% 30%', rx: 60, ry: 45, match: '64.9',
      quote: 'Some people see ghosts. I see opportunity.',
      fields: [['Real name', 'None registered', 0], ['Age', '17, claimed', 1], ['Combat style', 'Recon, support', 0], ['Last seen', 'Stolen AV, northbound, no plates', 1]],
      implants: [['Drone interface', 50], ['Signal scrambler', 34], ['Environmental scan', 22], ['Utility arm', 46]], cost: 39,
    },
  ];

  /* each file is a portrait graded in the file's colour until decrypted */
  function portrait(f) {
    return `<img src="${f.img}" alt="Portrait of ${f.first} ${f.last}, ${f.role}" style="object-position:${f.pos}" decoding="async" loading="lazy" />
      <span class="d__duo" aria-hidden="true"></span>
      <span class="d__reticle" aria-hidden="true" style="left:${f.rx}%;top:${f.ry}%"><i></i><b>Match ${f.match}%</b></span>
      <span class="d__scan" aria-hidden="true"></span>
      <figcaption>REC ${f.id}<span>${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}</span></figcaption>`;
  }
  const NOISE = '▓▒░#%&/\\';
  const corrupt = (t) => t.replace(/[^ ]/g, () => NOISE[Math.floor(Math.random() * NOISE.length)]);

  function buildArchive() {
    const track = $('#archiveTrack');
    track.insertAdjacentHTML('beforeend', FILES.map((f, i) => `
      <article class="dossier dossier--${i % 2 ? 'b' : 'a'}" tabindex="0" style="--c:${f.c};--sc:${f.sc}" aria-labelledby="dn${i}" aria-describedby="dq${i}">
        <div class="d__id"><span>File <b>${f.id}</b></span><span class="d__status">${f.status}</span></div>
        <p class="d__jp" lang="ja" aria-hidden="true">${f.jp}</p>
        <figure class="d__portrait">${portrait(f)}</figure>
        <h3 class="d__name" id="dn${i}"><span class="d__alias">${f.alias}, ${f.role}</span><span>${f.first}</span><span>${f.last}</span></h3>
        <div class="d__data">
          <p class="d__quote" id="dq${i}">${f.quote}</p>
          <dl class="d__fields">${f.fields.map(([k, v, bad]) => `<dt>${k}</dt><dd${bad ? ` class="is-corrupt" data-real="${v}" data-fake="${corrupt(v)}" aria-label="${v}"` : ''}>${bad ? corrupt(v) : v}</dd>`).join('')}</dl>
        </div>
        <div class="d__ware">
          <h3><span>Installed cyberware</span><span>Humanity cost <b>${f.cost}%</b></span></h3>
          <ul class="ware">${f.implants.map(([n, v]) => `<li><span>${n}</span><span data-v="${v}">00</span><span class="ware__bar"><i style="--v:0" data-v="${v / 100}"></i></span></li>`).join('')}</ul>
        </div>
      </article>`).join(''));

    $$('.dossier').forEach((d) => {
      const open = (on) => {
        if (d.classList.contains('is-open') === on) return;
        d.classList.toggle('is-open', on);
        $$('dd[data-real]', d).forEach((dd) => scramble(dd, on ? dd.dataset.real : dd.dataset.fake, on ? 650 : 300));
        if (on) { reveal(d); glitch(0.25, 90); }
      };
      d.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && open(true));
      d.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && open(false));
      d.addEventListener('focus', () => open(true));
      d.addEventListener('blur', () => open(false));
      d.addEventListener('click', (e) => { if (e.pointerType !== 'mouse') open(!d.classList.contains('is-open')); });
    });
  }
  function reveal(d) {
    if (d.dataset.revealed) return; d.dataset.revealed = 1;
    $$('.ware__bar i', d).forEach((b, i) => setTimeout(() => b.style.setProperty('--v', b.dataset.v), i * 120));
    $$('.ware span[data-v]', d).forEach((s) => {
      const to = +s.dataset.v;
      if (isStatic) { s.textContent = to; return; }
      const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.1, ease: 'power2.out', onUpdate: () => (s.textContent = String(Math.round(o.v)).padStart(2, '0')) });
    });
  }
  function scramble(el, to, dur) {
    cancelAnimationFrame(el._raf);
    if (isStatic) { el.textContent = to; return; }
    const len = Math.max(el.textContent.length, to.length); let t0;
    const step = (t) => {
      t0 = t0 || t; const p = Math.min(1, (t - t0) / dur); let out = '';
      for (let i = 0; i < len; i++) out += i / len < p ? (to[i] || '') : (to[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
      el.textContent = out;
      if (p < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------
     05 Psychosis content
     ------------------------------------------------------------------ */
  const WARNINGS = [
    ['Threshold breached', 'Humanity below safe operating level. Rising instability.'],
    ['Foreign signal', 'Motor cortex is receiving instructions you did not send.'],
    ['Optic desync', 'What you see is 140 ms late. Or early.'],
    ['Pain inhibitor', 'Disabled. Re-enable? You can’t.'],
    ['Voice detected', 'It sounds like you. It isn’t.'],
    ['Memory sector 7', 'Mother’s face: file not found.'],
    ['Reflex accelerator', 'Running at 340%. Heart rate 212.'],
    ['Psycho squad', 'Dispatched. ETA 04:12. Do not resist.'],
    ['Self-test', 'Name? Name? Name?'],
    ['Last warning', 'Do not trust the voice in the chrome.'],
  ];
  const SPOTS = [[6, 12], [62, 8], [70, 58], [10, 64], [38, 74], [78, 30], [22, 30], [48, 16], [4, 40], [56, 46]];
  function buildPsy() {
    $('#psyPanels').innerHTML = WARNINGS.map(([t, b], i) => {
      const [l, tp] = SPOTS[i];
      return `<div class="warn" style="left:${isMobile() ? Math.min(l, 26) : l}%;top:${tp}%"><b>${t}</b>${b}</div>`;
    }).join('');
    const line = $('#psyLine');
    line.innerHTML = line.textContent.split(' ').map((w) =>
      `<span class="wd" aria-hidden="true">${[...w].map((c) => `<span class="ch" data-c="${c}">${c}</span>`).join('')}</span>`).join(' ');
  }

  /* ------------------------------------------------------------------
     01 Boot
     ------------------------------------------------------------------ */
  const BOOT = [
    { t: '', hold: 1100 },
    { t: 'nc-os 3.1.7    kernel ok    jack 2 of 2', cls: '' },
    { t: 'NEURAL LINK DETECTED', cls: 'is-loud', hold: 380 },
    { t: 'handshake 0x7f3a    ', ok: 'accepted', cls: '' },
    { t: 'UNAUTHORISED CONNECTION', cls: 'is-loud is-red', hold: 420 },
    { t: 'trace countermeasures    offline', cls: '' },
    { t: 'ENTER NIGHT CITY', cls: 'is-loud', hold: 700 },
  ];
  const boot = $('#boot'); const term = $('#bootTerm');
  let bootRun = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  function lock(on) { root.classList.toggle('is-locked', on); }

  async function runBoot() {
    const run = ++bootRun;
    const alive = () => run === bootRun;
    lock(true);
    boot.style.display = ''; boot.style.clipPath = ''; boot.style.opacity = 1; boot.style.visibility = 'visible';
    term.style.transform = '';
    const cursor = document.createElement('span'); cursor.className = 'boot__cursor'; cursor.setAttribute('aria-hidden', 'true');
    term.innerHTML = ''; term.append(cursor);
    if (!isStatic) gsap.set('.hero__line > span', { yPercent: 110 });

    if (isStatic) {
      term.innerHTML = BOOT.filter((l) => l.t).map((l) => `<p class="${l.cls}">${l.t}${l.ok ? `<span class="is-ok">${l.ok}</span>` : ''}</p>`).join('');
      await wait(1600); if (!alive()) return;
      boot.style.display = 'none'; lock(false); return;
    }
    for (const l of BOOT) {
      if (!l.t) { await wait(l.hold); if (!alive()) return; continue; }
      const p = document.createElement('p'); p.className = l.cls; term.append(p); p.append(cursor);
      const loud = l.cls.includes('loud');
      for (const ch of l.t) {
        cursor.before(ch);
        await wait(loud ? 34 : 9 + Math.random() * 14); if (!alive()) return;
      }
      if (loud) glitch(0.3, 70, true);
      if (l.ok) { await wait(260); const s = document.createElement('span'); s.className = 'is-ok'; s.textContent = l.ok; cursor.before(s); }
      await wait(l.hold || 120); if (!alive()) return;
    }
    exitBoot(run);
  }
  function exitBoot(run) {
    if (run !== bootRun || boot.style.display === 'none') return;
    bootRun++;
    if (isStatic) { boot.style.display = 'none'; lock(false); return; }
    gsap.timeline({ onComplete: () => { boot.style.display = 'none'; lock(false); heroIn(); ScrollTrigger.refresh(); } })
      .call(() => glitch(1, 360, true))
      .to(term, { x: 40, skewX: 24, duration: 0.05 })
      .to(term, { x: -70, skewX: -12, duration: 0.05 })
      .to(term, { x: 0, skewX: 0, duration: 0.04 })
      .to(flash, { opacity: 0.7, duration: 0.04 }, 0.1)
      .to(flash, { opacity: 0, duration: 0.4 })
      .to(boot, { clipPath: 'inset(49.6% 0 49.6% 0)', duration: 0.2, ease: 'power4.in' }, 0.16)
      .to(boot, { autoAlpha: 0, duration: 0.06 });
  }
  function skipBoot() { if (boot.style.display !== 'none') exitBoot(bootRun); }
  $('#bootSkip').addEventListener('click', skipBoot);
  addEventListener('keydown', (e) => {
    if (root.classList.contains('is-locked') && ['Escape', 'Enter', ' '].includes(e.key)) {
      e.preventDefault(); skipBoot();
      if (window.NCOS) window.NCOS.signals.skippedBootByKey = true;
    }
  });

  function heroIn() {
    gsap.fromTo('.hero__line > span', { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
    gsap.fromTo('.hero__jp, .hero__sub', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.8, delay: 0.5, stagger: 0.1, ease: 'power3.out' });
    gsap.fromTo('.layer--near .layer__in', { scale: 1.06 }, { scale: 1, duration: 2.2, ease: 'expo.out' });
    gsap.fromTo('#heroStill', { scale: 1.12, filter: 'brightness(2.4) contrast(1.6)' }, { scale: 1, filter: 'brightness(1) contrast(1)', duration: 1.8, ease: 'expo.out', clearProps: 'filter' });
    gsap.delayedCall(0.9, () => glitch(0.45, 140));
  }

  /* ------------------------------------------------------------------
     Build + wire up
     ------------------------------------------------------------------ */
  buildCity();
  buildPsyCity();
  buildArchive();
  buildPsy();
  seedJitter($$('.hud > *, .d__id, .d__data, .d__ware, .warn'));
  setPsy(0, 'Skyline', 812);
  window.SL = { glitch };

  /* NC-OS state flows into the rest of the experience */
  if (window.NCOS) {
    const warns = $$('.warn');
    const setWarn = (i, title, body) => { if (warns[i]) warns[i].innerHTML = `<b>${title}</b>${body}`; };
    window.NCOS.subscribe((s) => {
      humanityBase = s.background ? s.humanity : 100; renderHum();
      $('#hudPath').textContent = s.background ? `Path: ${window.NCOS_ENGINE.BACKGROUNDS[s.background].name}` : 'Unofficial concept';
      const open = s.obligations.filter((o) => o.status === 'open');
      const last = s.cyberware[s.cyberware.length - 1];
      setWarn(0, 'Threshold breached', s.background ? `Humanity ${s.humanity}%. ${s.cyberware.length} implant${s.cyberware.length === 1 ? '' : 's'}. ${open.length} debt${open.length === 1 ? '' : 's'} unpaid.` : WARNINGS[0][1]);
      setWarn(6, last ? last.name : WARNINGS[6][0], last ? `Running hot. Installed by ${last.how}. Nobody checked the firmware.` : WARNINGS[6][1]);
      setWarn(7, 'Psycho squad', s.exposure >= 60 ? `Your exposure is ${s.exposure}%. They already know where you are.` : WARNINGS[7][1]);
      $('#finalHumanity').textContent = String(s.background ? s.humanity : 3).padStart(2, '0');
      $('#psySub').textContent = s.background ? `${s.cyberware.length} upgrade${s.cyberware.length === 1 ? '' : 's'}. ${s.debt ? '\u20ac$' + s.debt.toLocaleString() + ' owed. ' : ''}${open.length} obligation${open.length === 1 ? '' : 's'}. Exposure ${s.exposure}%.` : '';
      const lines = window.NCOS_ENGINE.summary(s);
      $('#endLedger').innerHTML = (lines || ['You never told the system who you were. It decided anyway.']).map((l) => `<p>${l}</p>`).join('');
    });
  }
  sizeRain(); drawRain(false);

  $('#reconnect').addEventListener('click', () => {
    glitch(1, 420, true);
    const go = () => {
      root.classList.remove('is-silent');
      if (window.NCOS) window.NCOS.reset();
      window.scrollTo(0, 0);
      if (!isStatic) ScrollTrigger.update();
      setPsy(0, 'Skyline', 812);
      runBoot();
    };
    if (isStatic) go(); else gsap.to(flash, { opacity: 0.9, duration: 0.25, onComplete: () => { go(); gsap.to(flash, { opacity: 0, duration: 0.6 }); } });
  });

  /* static composition: scroll still drains humanity, nothing moves */
  if (isStatic) {
    $$('.dossier').forEach(reveal);
    let raf;
    addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const p = scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
        setPsy(p, p < 0.3 ? 'Descent' : p < 0.6 ? 'Archive' : p < 0.85 ? 'Breach' : 'Flatline', 812 - p * 850);
      });
    }, { passive: true });
    runBoot();
    return;
  }

  /* ------------------------------------------------------------------
     Motion composition
     ------------------------------------------------------------------ */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* pointer: the city leans toward the cursor, deeper layers lean further */
  const movers = $$('.layer').map((l) => {
    const d = +l.dataset.depth; const inn = l.firstElementChild;
    return { d, x: gsap.quickTo(inn, 'x', { duration: 1.2, ease: 'power3.out' }), y: gsap.quickTo(inn, 'y', { duration: 1.2, ease: 'power3.out' }) };
  });
  const heroX = gsap.quickTo('.hero__title', 'x', { duration: 1.4, ease: 'power3.out' });
  const stillX = gsap.quickTo('.still__img', 'x', { duration: 1.6, ease: 'power3.out' });
  const stillY = gsap.quickTo('.still__img', 'y', { duration: 1.6, ease: 'power3.out' });
  let pointerWind = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const px = e.clientX / innerWidth - 0.5; const py = e.clientY / innerHeight - 0.5;
    movers.forEach((m) => { m.x(-px * m.d * 46); m.y(-py * m.d * 20); });
    heroX(px * 14);
    stillX(-px * 26); stillY(-py * 14);
    pointerWind = px * 0.3;
  }, { passive: true });

  gsap.ticker.add(() => {
    rain.wind += (0.18 + pointerWind + (psy > 0 ? psy * 0.4 : 0) - rain.wind) * 0.05;
    if (rain.on) drawRain();
  });
  gsap.delayedCall(4, ambient);

  /* psychosis: characters swap to glyphs as instability climbs */
  const chars = $$('#psyLine .ch');
  let lastBucket = -1;
  psyHook = (instab) => {
    const b = Math.round(instab * 20);
    if (b === lastBucket) return; lastBucket = b;
    chars.forEach((c, i) => { c.textContent = ((i * 37) % 23) / 23 < instab * 0.55 ? GLYPHS[(i * 7) % GLYPHS.length] : c.dataset.c; });
  };

  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 761px)', mob: '(max-width: 760px)' }, (ctx) => {
    const { mob } = ctx.conditions;
    const st = {}; let inNcos = false;
    ScrollTrigger.create({ trigger: '#ncos', start: 'top 55%', end: 'bottom 45%', onToggle: (s) => { inNcos = s.isActive; update(); } });
    const update = () => {
      const p1 = st.descent ? st.descent.progress : 0;
      const p2 = st.archive ? st.archive.progress : 0;
      const p3 = st.psy ? st.psy.progress : 0;
      let v; let scene;
      if (p3 > 0) { v = 0.44 + 0.56 * Math.min(1, p3 / 0.8); scene = p3 < 0.83 ? 'Breach' : 'Flatline'; }
      else if (p2 > 0) { v = 0.15 + 0.29 * p2; scene = 'Archive'; }
      else if (inNcos) { v = 0.15; scene = 'NC-OS'; }
      else { v = 0.15 * p1; scene = p1 < 0.18 ? 'Skyline' : p1 < 0.8 ? 'Descent' : 'Street level'; }
      setPsy(v, scene, 812 - 850 * p1 - 14 * p2 - 30 * p3);
      root.classList.toggle('is-silent', p3 > 0.83);
    };

    /* 03 descent */
    const stage = $('#stage');
    const travel = (sel) => () => -($(sel).offsetHeight - stage.offsetHeight);
    const d = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#city', start: 'top top', end: () => '+=' + innerHeight * (mob ? 3.6 : 5.4),
        pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: update, onToggle: (s) => (rain.on = s.isActive || s.progress === 0),
      },
    });
    st.descent = d.scrollTrigger;
    d.to('.layer--far', { y: travel('.layer--far'), duration: 10 }, 0)
      .to('.layer--mid', { y: travel('.layer--mid'), duration: 10 }, 0)
      .to('.layer--near', { y: travel('.layer--near'), duration: 10 }, 0)
      .to('.sky__glow--a', { yPercent: -60, opacity: 0.25, duration: 10 }, 0)
      .to('.sky__glow--b', { yPercent: -120, duration: 10 }, 0)
      .fromTo('.hero__line:nth-child(1)', { xPercent: 0, opacity: 1 }, { xPercent: -40, opacity: 0, duration: 1.4, immediateRender: false }, 0.15)
      .fromTo('.hero__line:nth-child(2)', { xPercent: 0, skewX: 0, opacity: 1 }, { xPercent: 30, skewX: -18, opacity: 0, duration: 1.4, immediateRender: false }, 0.25)
      .fromTo('.hero__line:nth-child(3)', { xPercent: 0, yPercent: 0, opacity: 1 }, { xPercent: -18, yPercent: -60, opacity: 0, duration: 1.4, immediateRender: false }, 0.35)
      .fromTo('.hero__slice', { opacity: 1, xPercent: 0 }, { opacity: 0, xPercent: 12, duration: 0.6, immediateRender: false }, 0.15)
      .fromTo('.hero__jp, .hero__sub', { opacity: 1 }, { opacity: 0, duration: 0.6, immediateRender: false }, 0.1)
      .fromTo('#heroStill', { yPercent: 0, opacity: 1 }, { yPercent: -22, opacity: 0.2, duration: 10, immediateRender: false }, 0)
      .call(() => glitch(0.5), null, 0.5)
      .call(() => glitch(0.7), null, 1.6);

    $$('.frag').forEach((f, i) => {
      const t = [1.8, 3.9, 6.0, 8.2][i];
      const spans = $$('span', f);
      d.fromTo(f, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, t)
        .fromTo(spans, { clipPath: 'inset(0 100% 0 0)', x: -50 }, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.6, stagger: 0.18, ease: 'power3.out' }, t)
        .call(() => glitch(0.35 + i * 0.1), null, t);
      if (i < 3) d.to(f, { autoAlpha: 0, y: -80, skewY: -4, duration: 0.6, ease: 'power2.in' }, t + 1.45);
      else d.to(f, { autoAlpha: 0, duration: 0.4 }, 9.6);
    });
    d.to({}, { duration: 0.01 }, 10);

    /* 04 archive */
    const track = $('#archiveTrack');
    let horiz = null;
    if (!mob) {
      horiz = gsap.to(track, {
        x: () => -(track.scrollWidth - innerWidth), ease: 'none',
        scrollTrigger: {
          trigger: '#archive', start: 'top top', end: () => '+=' + (track.scrollWidth - innerWidth),
          pin: true, scrub: 0.6, invalidateOnRefresh: true, onUpdate: update,
        },
      });
      st.archive = horiz.scrollTrigger;
    } else {
      st.archive = ScrollTrigger.create({ trigger: '#archive', start: 'top 80%', end: 'bottom bottom', onUpdate: update });
    }
    $$('.dossier').forEach((el) => {
      ScrollTrigger.create(horiz
        ? { trigger: el, containerAnimation: horiz, start: 'left 55%', onEnter: () => { reveal(el); glitch(0.3); } }
        : { trigger: el, start: 'top 65%', onEnter: () => reveal(el) });
      /* a slow drift inside each file while it passes */
      if (horiz) gsap.fromTo($('.d__portrait', el), { x: 60 }, { x: -60, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true } });
    });

    /* 05 psychosis */
    const pchars = $$('#psyLine .ch');
    const R = rng(13);
    const p = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#psychosis', start: 'top top', end: () => '+=' + innerHeight * (mob ? 3.4 : 4.6),
        pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, onUpdate: update,
      },
    });
    st.psy = p.scrollTrigger;
    p.fromTo('#psyLine', { scale: 0.92, opacity: 0.0 }, { scale: 1, opacity: 1, duration: 0.8 }, 0)
      .to(pchars, {
        x: () => (R() - 0.5) * innerWidth * 0.3,
        y: () => (R() - 0.5) * innerHeight * 0.5,
        rotation: () => (R() - 0.5) * 90,
        duration: 6.6, ease: 'power3.in', stagger: { each: 0.03, from: 'random' },
      }, 1.2)
      .to('.ecg--calm', { opacity: 0, duration: 0.6 }, 3.2)
      .to('.ecg--wild', { opacity: 1, duration: 0.6 }, 3.2)
      .to('.ecg--wild', { opacity: 0, duration: 0.2 }, 7.9)
      .to('.ecg--flat', { opacity: 1, duration: 0.2 }, 7.9)
      .fromTo('#psyCity', { yPercent: 0 }, { yPercent: 12, scale: 1.08, duration: 8 }, 0);
    $$('.warn').forEach((w, i) => {
      const t = 0.8 + i * 0.68;
      p.fromTo(w, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.18, ease: 'steps(3)' }, t)
        .call(() => glitch(0.3 + i * 0.07), null, t);
    });
    [4.6, 5.9, 6.8, 7.4, 7.8, 8.05].forEach((t, i) => {
      p.set('#psyFlash', { className: 'psy__flash is-on' }, t).set('#psyFlash', { className: 'psy__flash' }, t + 0.06 + i * 0.02);
    });
    p.call(() => glitch(1, 500), null, 8.1)
      .set('#psyBlack', { autoAlpha: 1 }, 8.3)
      .fromTo('.psy__q', { opacity: 0, letterSpacing: '0.06em' }, { opacity: 1, letterSpacing: '0em', duration: 0.9, ease: 'power2.out' }, 8.8)
      .fromTo('.psy__q-read', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 9.4)
      .to({}, { duration: 0.01 }, 10.4);

    update();
    return () => { root.classList.remove('is-silent'); };
  });

  /* NC-OS grows as the conversation does; pinned scenes below it need fresh positions */
  if (window.ResizeObserver && $('#ncos')) {
    let rh; let lastH = 0;
    new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height); if (h === lastH) return; lastH = h;
      clearTimeout(rh); rh = setTimeout(() => ScrollTrigger.refresh(), 160);
    }).observe($('#ncos'));
  }

  /* rebuild the procedural city when the width changes meaningfully */
  let lastW = innerWidth; let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      sizeRain();
      if (Math.abs(innerWidth - lastW) < 40) return;
      lastW = innerWidth; buildCity(); ScrollTrigger.refresh();
    }, 200);
  });

  runBoot();
})();

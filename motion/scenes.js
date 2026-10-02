/**
 * Scene factories.
 *
 * Each factory receives a ctx and returns a gsap timeline that starts at 0.
 * ctx = { scene, cfg, W, H, rand, j, hero }
 *   scene : the scene's full-frame layer (already in the DOM, laid out but hidden)
 *   W, H  : stage size in px — the whole sequence is rebuilt on resize
 *   rand  : seeded random (deterministic, so every loop is identical)
 *   j(d)  : jittered duration — rhythm is deliberately uneven
 *
 * Every tween is created with immediateRender:false and explicit start states,
 * so the master timeline can be scrubbed in either direction from any point.
 * main.js handles showing/hiding each scene layer (the hard cuts).
 */
(function () {
  const S = {};

  // ---- helpers -------------------------------------------------------------
  const set = (tl, t, vars, pos) => tl.set(t, Object.assign({ immediateRender: false }, vars), pos);
  const ft = (tl, t, from, to, pos) => tl.fromTo(t, from, Object.assign({ immediateRender: false }, to), pos);
  const pad = (tl, t) => { if (tl.duration() < t) tl.to({}, { duration: t - tl.duration() }, tl.duration()); return tl; };

  function el(tag, cls, parent, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }

  function img(ctx, i) {
    const list = ctx.cfg.images;
    const a = list[((i % list.length) + list.length) % list.length];
    const im = document.createElement('img');
    im.src = a.src;
    im.alt = a.alt || '';
    im.draggable = false;
    return im;
  }

  function imagePlane(ctx, parent, i) {
    const p = el('div', 'plane', parent);
    p.appendChild(img(ctx, i));
    return p;
  }

  // Type plate: headline lines + the last line repeated down past the bottom edge.
  function buildPlate(ctx, parent) {
    const { cfg, W } = ctx;
    const plate = el('div', 'plate', parent);
    const wrap = el('div', 'plate-lines', plate);
    wrap.style.fontSize = W * 0.19 + 'px';
    const head = cfg.type.headline;
    const lines = head.map((t) => el('div', '', wrap, t));
    const echoes = [0, 1, 2].map(() => el('div', '', wrap, head[head.length - 1]));
    return { plate, lines, echoes };
  }

  // ---- 1. GRID: tiny repeated type, stutter, fragment, hard zoom into one tile
  S.grid = function (ctx) {
    const { scene, cfg, W, H, j } = ctx;
    const tl = gsap.timeline();
    const fs = Math.max(9, W * 0.011);
    const field = el('div', 'grid-field', scene);
    field.style.fontSize = fs + 'px';

    let rowsN = Math.ceil(H / (fs * 2.4)) + 4;
    if (rowsN % 2 === 0) rowsN++;
    const colsN = 15;
    const rows = [];
    for (let r = 0; r < rowsN; r++) {
      const row = el('div', 'grid-row', field);
      for (let c = 0; c < colsN; c++) el('span', '', row, cfg.type.tile);
      rows.push(row);
    }
    const mid = (rowsN - 1) / 2;
    const tileW = rows[0].children[0].getBoundingClientRect().width;
    const others = rows.filter((_, i) => i !== mid);

    set(tl, field, { scale: 1, transformOrigin: '50% 50%' }, 0);
    set(tl, rows, { x: 0, autoAlpha: 1 }, 0);

    let t = j(0.55); // stillness

    // rows slip in stepped, out-of-phase jumps; the centre row holds
    others.forEach((row) => {
      const i = rows.indexOf(row);
      const dir = i % 2 ? 1 : -1;
      ft(tl, row, { x: 0 }, { x: dir * tileW * (1 + (i % 3)) * 0.5, duration: 0.42, ease: 'steps(3)' }, t + (i % 4) * 0.025);
    });
    t += 0.5 + j(0.28);

    // fragment: knock out rows in two hard cuts
    set(tl, others.filter((_, i) => i % 3 === 0), { autoAlpha: 0 }, t);
    t += j(0.2);
    set(tl, others.filter((_, i) => i % 3 === 1), { autoAlpha: 0 }, t);
    t += j(0.24);

    // tiny → oversized → cropped (force3D off keeps glyphs crisp at scale)
    ft(tl, field, { scale: 1 }, { scale: 18, duration: 0.5, ease: 'expo.in', force3D: false }, t);
    t += 0.5;
    return pad(tl, t);
  };

  // ---- 2. SLAM: headline cut in line by line, cropped; plate snaps down into a card
  S.slam = function (ctx) {
    const { j } = ctx;
    const tl = gsap.timeline();
    const { plate, lines, echoes } = buildPlate(ctx, ctx.scene);
    const K = ctx.cfg.card.scale;

    set(tl, plate, { scale: 1, borderRadius: 0, transformOrigin: '50% 50%' }, 0);
    set(tl, [...lines, ...echoes], { autoAlpha: 0 }, 0);

    let t = 0.04;
    lines.forEach((l) => { set(tl, l, { autoAlpha: 1 }, t); t += j(0.18); });
    echoes.forEach((l) => { set(tl, l, { autoAlpha: 1 }, t); t += j(0.07, 0.35); });
    t += j(0.42);

    ft(tl, plate, { scale: 1, borderRadius: 0 },
      { scale: K, borderRadius: ctx.cfg.card.radius / K, duration: 0.38, ease: 'expo.out' }, t);
    t += 0.38 + j(0.3);
    return pad(tl, t);
  };

  // ---- 3. STACK: card bursts into overlapping 3D planes, steps through, front plane takes the frame
  S.stack = function (ctx) {
    const { scene, W, j, rand, hero } = ctx;
    const tl = gsap.timeline();
    const K = ctx.cfg.card.scale;
    const R = ctx.cfg.card.radius / K;
    scene.classList.add('is-3d');
    const rig = el('div', 'rig', scene);

    // type plate continues from the slam scene as the first plane
    const planes = [buildPlate(ctx, rig).plate];
    planes[0].classList.add('plane');
    for (let i = 0; i < hero + 4; i++) planes.push(imagePlane(ctx, rig, i));

    const tilt = planes.map((_, i) => (i ? rand() * 3 - 1.5 : 0));
    const gapX = W * 0.085;
    const gapZ = 240;

    set(tl, rig, { rotationY: 0, rotationX: 0 }, 0);
    planes.forEach((p, i) => set(tl, p, {
      x: 0, y: 0, z: -i * 2, rotation: 0, scale: K, borderRadius: R, autoAlpha: 1, transformOrigin: '50% 50%'
    }, 0));

    // depth burst
    let t = j(0.14);
    tl.to(rig, { rotationY: -34, rotationX: 6, duration: 0.45, ease: 'expo.out' }, t);
    planes.forEach((p, i) => tl.to(p, {
      x: i * gapX, z: -i * gapZ, rotation: tilt[i], duration: 0.45, ease: 'expo.out'
    }, t + i * 0.015));
    t += 0.45 + j(0.4);

    // step through: front plane is thrown off, the rest advance — uneven holds
    const holds = [0.3, 0.5, 0.2, 0.36];
    for (let s = 1; s <= hero + 1; s++) {
      const out = planes[s - 1];
      tl.to(out, { x: -W * 0.9, z: 300, rotation: -6, duration: 0.32, ease: 'power4.out' }, t);
      set(tl, out, { autoAlpha: 0 }, t + 0.32);
      planes.slice(s).forEach((p, k) => tl.to(p, {
        x: k * gapX, z: -k * gapZ, duration: 0.32, ease: 'power4.out'
      }, t + k * 0.012));
      t += 0.32 + j(holds[(s - 1) % holds.length]);
    }

    // takeover: front plane flattens and fills the frame
    const front = planes[hero + 1];
    tl.to(rig, { rotationY: 0, rotationX: 0, duration: 0.48, ease: 'expo.out' }, t);
    tl.to(front, { x: 0, z: 0, rotation: 0, scale: 1, borderRadius: 0, duration: 0.48, ease: 'expo.out' }, t);
    set(tl, planes.slice(hero + 2), { autoAlpha: 0 }, t + 0.1);
    t += 0.48 + 0.06;
    return pad(tl, t);
  };

  // ---- 4. TAKEOVER: image owns the frame; oversized type slams in, echoes, punch-in crop
  S.takeover = function (ctx) {
    const { scene, cfg, W, H, j, hero } = ctx;
    const tl = gsap.timeline();
    const bg = el('div', 'fill', scene);
    bg.appendChild(img(ctx, hero));

    const makeType = () => {
      const d = el('div', 'take-type', scene);
      d.style.fontSize = W * 0.22 + 'px';
      cfg.type.headline.forEach((l) => el('div', '', d, l));
      return d;
    };
    const echoes = [0, 1, 2, 3, 4].map(makeType).reverse(); // nearest echo sits just under main
    const main = makeType();

    set(tl, bg, { scale: 1, xPercent: 0 }, 0);
    set(tl, [main, ...echoes], { autoAlpha: 0, x: 0, y: 0, scale: 1 }, 0);

    let t = j(0.18); // image alone, still
    ft(tl, main, { autoAlpha: 1, y: H * 0.12 }, { y: 0, duration: 0.28, ease: 'expo.out' }, t);
    t += 0.28 + j(0.38);

    // repetition: echoes stutter in, each smaller and further up-right
    echoes.slice().reverse().forEach((e, i) => {
      set(tl, e, { autoAlpha: 1, x: (i + 1) * W * 0.028, y: -(i + 1) * H * 0.08, scale: 1 - (i + 1) * 0.07 }, t);
      t += j(0.065, 0.35);
    });
    t += j(0.22);

    // hard cut: type gone, image punched-in and cropped
    set(tl, [main, ...echoes], { autoAlpha: 0 }, t);
    set(tl, bg, { scale: 1.6, xPercent: -8 }, t);
    t += j(0.42);
    return pad(tl, t);
  };

  // ---- 5. VOID: almost-empty black, one tiny word, then it blows past the frame
  S.void = function (ctx) {
    const { scene, cfg, W, j } = ctx;
    const tl = gsap.timeline();
    const w = el('div', 'void-word', scene, cfg.type.whisper);
    w.style.fontSize = Math.max(11, W * 0.009) + 'px';

    set(tl, w, { autoAlpha: 0, xPercent: -50, yPercent: -50, scale: 1 }, 0);
    let t = j(0.3);
    set(tl, w, { autoAlpha: 1 }, t);
    t += j(0.65);
    ft(tl, w, { scale: 1 }, { scale: 70, duration: 0.36, ease: 'expo.in', force3D: false }, t);
    t += 0.36;
    return pad(tl, t);
  };

  // ---- 6. FLOOD: dense repeated lines stutter in, then the column jumps upward in steps
  S.flood = function (ctx) {
    const { scene, cfg, W, H, j, rand } = ctx;
    const tl = gsap.timeline();
    const fs = W * 0.034;
    const lineH = fs * 1.02;
    const col = el('div', 'flood', scene);
    col.style.fontSize = fs + 'px';
    col.style.paddingLeft = W * 0.025 + 'px';

    const visible = Math.ceil(H / lineH) + 1;
    const n = visible * 2 + 2;
    const pieces = [...cfg.type.headline, cfg.type.tile];
    const lines = [];
    for (let i = 0; i < n; i++) {
      let text;
      if (cfg.type.flood && cfg.type.flood.length) text = cfg.type.flood[i % cfg.type.flood.length];
      else {
        const p = pieces[Math.floor(rand() * pieces.length)];
        text = Array(1 + Math.floor(rand() * 3)).fill(p).join(' ');
      }
      const line = el('div', '', col, text);
      line.style.paddingLeft = (rand() < 0.35 ? rand() * W * 0.3 : 0) + 'px';
      lines.push(line);
    }

    set(tl, col, { y: 0 }, 0);
    set(tl, lines, { autoAlpha: 0 }, 0);

    let t = 0.02;
    lines.slice(0, visible).forEach((l) => { set(tl, l, { autoAlpha: 1 }, t); t += j(0.03, 0.5); });
    t += j(0.25);
    set(tl, lines.slice(visible), { autoAlpha: 1 }, t);
    ft(tl, col, { y: 0 }, { y: -(n - visible) * lineH, duration: 0.75, ease: 'steps(6)' }, t);
    t += 0.75 + j(0.18);
    return pad(tl, t);
  };

  // ---- 7. SMALL STACK: tiny card cluster in a lot of black; hard cuts between front images
  S.smallStack = function (ctx) {
    const { scene, cfg, W, j } = ctx;
    const tl = gsap.timeline();
    const K = cfg.card.small;
    const R = cfg.card.radius / K;
    scene.classList.add('is-3d');
    const rig = el('div', 'rig', scene);

    const sideDefs = [-2, -1, 1, 2];
    const sides = sideDefs.map((k, i) => imagePlane(ctx, rig, i + 1));
    const front = el('div', 'plane', rig);
    const n = cfg.images.length;
    const frontImgs = cfg.images.map((_, i) => front.appendChild(img(ctx, i)));

    sides.forEach((p) => set(tl, p, { x: 0, z: -300, rotationY: 0, scale: K, borderRadius: R, autoAlpha: 1 }, 0));
    set(tl, front, { scale: K, borderRadius: R, z: 0 }, 0);
    set(tl, frontImgs, { autoAlpha: 0 }, 0);
    set(tl, frontImgs[0], { autoAlpha: 1 }, 0);

    let t = j(0.1);
    sides.forEach((p, i) => {
      const k = sideDefs[i];
      const a = Math.abs(k);
      const sgn = Math.sign(k);
      tl.to(p, {
        x: sgn * (a === 1 ? W * 0.075 : W * 0.13), z: -a * 160, rotationY: -sgn * a * 16,
        duration: 0.4, ease: 'expo.out'
      }, t + a * 0.03);
    });
    t += 0.4 + j(0.35);

    const cuts = Math.min(4, Math.max(1, n - 1));
    for (let c = 1; c <= cuts; c++) {
      set(tl, frontImgs, { autoAlpha: 0 }, t);
      set(tl, frontImgs[c % n], { autoAlpha: 1 }, t);
      ft(tl, front, { scale: K * 0.93 }, { scale: K, duration: 0.22, ease: 'expo.out' }, t);
      t += j(0.5, 0.3);
    }
    return pad(tl, t);
  };

  // ---- 8. BLACK: held empty frame before the loop restarts
  S.black = function (ctx) {
    return pad(gsap.timeline(), ctx.j(0.45));
  };

  window.SCENES = S;
})();

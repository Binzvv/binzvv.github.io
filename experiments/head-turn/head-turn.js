/* Binz Tamang — coming soon · head-turn experiment
 * The head turns towards the pointer by choosing poses from the rendered turn footage.
 * The eyes lead: they glance first, the head follows, and the eyes relax as it catches up.
 * Tiles, clouds and the opening are shared with the main page (script.js).
 * Offsets marked "source px" are measured on the 528 x 720 footage.
 */
(() => {
  "use strict";

  const MOTION = {
    head: {
      range: 1,             // share of the clean turn used (1 = the full ±79 px set of poses)
      reach: 0.42,          // fraction of viewport width from the head at which it reaches its limit
      smoothing: 0.5,       // s, the head follows with a little weight
      returnSmoothing: 0.85,// s, easing back to forward when the pointer leaves
      focusSmoothing: 0.8,  // s, when acknowledging a tile
      focusStrength: 0.55,  // how far the head turns towards a hovered tile
      hysteresis: 0.18,     // share of a pose step to overshoot before changing pose (stops flicker)
      tiltX: 1.6,           // deg, a hint of looking up or down (the footage has no pitch)
      lift: 2,              // px paired with the tilt
      tiltSmoothing: 0.6,   // s
    },
    eyes: {
      maxX: 2.5,            // source px, also limited per pose by the sclera available
      maxUp: 1.3,
      maxDown: 0.9,
      lead: 2.4,            // offset per unit of turn the head has yet to make
      hold: 0.35,           // share kept when the pointer is beyond the head's range
      smoothing: 0.12,      // s
      returnSmoothing: 0.3, // s
      relax: 0.6,           // source px below which the untouched footage pixels are shown
      touchStrength: 0.6,
      touchHold: 1.4,       // s
    },
    autoTurn: { amplitude: 0.32, period: 9 },    // touch screens: gentle turn when untouched
    float: { amplitude: 4, period: 6 },          // px peak-to-peak, s per cycle
    clouds: { speed: 7, parallax: 7 },           // px/s at depth 1, px of pointer parallax

    // Opening, in seconds from the moment the artwork has decoded. Plays once per load.
    entrance: {
      rise: 35, fromScale: 0.96, headAt: 0.25, headDuration: 1.2, overshoot: 1.1,
      glanceAt: 1.85,       // eyes look towards the first tile's arrival spot
      tilesAt: 2.3,         // first tile starts to emerge from behind the head
      tileStagger: 0.2,
      tileDuration: 1.15,
      releaseGlanceAt: 2.85,
      textAt: 2.9,
      textStagger: 0.12,
      handoverAt: 3.5,      // pointer tracking and the trail take over
    },

    tiles: {
      size: 0.4,            // tile width as a fraction of head width (phones use sizeCompact)
      sizeCompact: 0.36,
      pool: 8,              // reusable nodes
      maxVisible: 7,        // tiles on screen at once, resting ones included
    },

    trail: {
      spacingSlow: 150,     // px of travel between tiles when moving slowly
      spacingFast: 64,      // ... and during a quick sweep
      speedSlow: 250,       // px/s treated as slow
      speedFast: 1700,      // px/s treated as a full flourish
      speedCap: 2600,       // px/s, intensity never exceeds this
      speedSmoothing: 0.09, // s
      maxPerMove: 2,        // tiles from one pointer event, at most
      wakeDistance: 140,    // px travelled before a trail starts
      releaseSpeed: 1300,   // px/s a sweep must hold for the resting tiles to join the flourish ...
      releaseDistance: 220, // ... over this much travel
      keepClear: 28,        // px around resting tiles where no trail tiles spawn (keeps hover easy)
      travel: 0.85,         // s glide from the previous tile to the pointer
      holdSlow: 0.85,       // s a tile stays before fading (slow) ...
      holdFast: 0.34,       // ... and during a flourish
      fade: 0.75,           // s fade and shrink
      tilt: 5,              // deg rotation at rest pace; grows a little with speed
      tiltFast: 9,
      settleDelay: 0.5,     // s of stillness before tiles settle around the head
      settleDuration: 1.1,
    },

    hover: {
      scale: 1.07,
      lift: 4,              // px
      straighten: 0.9,      // share of the tile's tilt removed
      dim: 0.55,            // opacity of the other tiles
      dimScale: 0.97,
      inDuration: 0.6,
      outDuration: 0.75,
      touchHold: 1.6,       // s a tapped tile stays acknowledged on touch screens
    },

    idleTiles: { amplitude: 3, rotate: 0.8, period: [5.2, 7.4] }, // touch screens only
  };

  // Teaser imagery for the tiles. Replace these with real work images later;
  // they stay teasers: no links, captions or click actions.
  const ROOT = "../../";
  const TEASER_TILES = [
    ROOT + "assets/trail-star.webp",
    ROOT + "assets/trail-eye.webp",
    ROOT + "assets/trail-heart.webp",
    ROOT + "assets/trail-septum.webp",
    ROOT + "assets/trail-flower.webp",
    ROOT + "assets/trail-earrings.webp",
    ROOT + "assets/trail-cloud.webp",
  ];

  // Resting arrangement around the head: offsets from the head centre in head widths,
  // rotation in degrees. Wide screens keep tiles clear of the face; phones tuck them behind it.
  const SLOTS = {
    wide: [
      { x: -0.84, y: -0.32, r: -7 },
      { x: 0.92, y: -0.06, r: 6 },
      { x: -0.9, y: 0.34, r: 4 },
    ],
    compact: [
      { x: -0.72, y: -0.4, r: -8 },
      { x: 0.74, y: -0.1, r: 7 },
      { x: -0.68, y: 0.3, r: 4 },
    ],
  };

  // Pose footage: frames/manifest.json lists poses screen-left to screen-right with the
  // measured face displacement of each; the eye atlas holds each pose's iris, opening mask
  // and untouched eye pixels. Width/height are the shared crop; forwardWidth is the head itself.
  const VIDEO = { dir: "frames/", w: 469, h: 605, forwardWidth: 376, eyeY: 261.5, still: 0.985 };

  // Cloud banks cut from the artwork's own sky (edge-cut sprites joined seamlessly): [width, height]
  const CLOUD_SPRITES = { a: [810, 348], b: [360, 391], c: [269, 257] };
  // x: start position across the drift span (0..1), y: top as viewport-height fraction
  // (bottom: true anchors to the bottom edge), s: scale relative to the head,
  // d: depth (speed and parallax multiplier), f: mirror, o: opacity
  const CLOUD_LAYOUT = [
    { id: "c", x: 0.62, y: -0.04, s: 0.75, d: 0.4, f: true, o: 0.9 },
    { id: "b", x: 0.18, y: 0.0, s: 0.8, d: 0.5 },
    { id: "c", x: 0.95, y: 0.5, s: 0.85, d: 0.6 },
    { id: "b", x: 0.4, y: 0.34, s: 1.0, d: 0.7, f: true },
    { id: "a", x: 0.7, y: 0.18, s: 0.95, d: 0.85, f: true, bottom: true },
    { id: "a", x: 0.08, y: 0.12, s: 1.25, d: 1.0, bottom: true },
  ];

  const $ = (sel) => document.querySelector(sel);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (current, target, tau, dt) => current + (target - current) * (1 - Math.exp(-dt / tau));
  const rand = (a, b) => a + Math.random() * (b - a);

  const el = {
    body: document.body,
    stage: document.querySelector(".stage"),
    copy: document.querySelector(".copy"),
    headEnter: $("#headEnter"),
    headFloat: $("#headFloat"),
    headFollow: $("#headFollow"),
    headTilt: $("#headTilt"),
    head: $("#head"),
    still: $("#still"),
    canvas: $("#frames"),
    reveal: [...document.querySelectorAll("[data-reveal]")],
    clouds: $("#clouds"),
    tiles: $("#tiles"),
  };

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchQuery = window.matchMedia("(hover: none), (pointer: coarse)");

  function preload() {
    const imgs = [...document.querySelectorAll("img")];
    const extra = Object.keys(CLOUD_SPRITES)
      .map((id) => `${ROOT}assets/cloud-${id}.webp`)
      .concat(TEASER_TILES)
      .map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
    const all = imgs.concat(extra).map((img) =>
      (img.decode ? img.decode() : Promise.resolve()).catch(
        () => new Promise((res) => (img.complete ? res() : img.addEventListener("load", res, { once: true })))
      )
    );
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    // Never hold the page hostage to a slow font
    return Promise.all([Promise.all(all), Promise.race([fonts, new Promise((r) => setTimeout(r, 600))])]);
  }

  function buildClouds() {
    el.clouds.textContent = "";
    return CLOUD_LAYOUT.map((c) => {
      const [w, h] = CLOUD_SPRITES[c.id];
      const node = document.createElement("div");
      node.className = "cloud";
      const img = document.createElement("img");
      img.src = `${ROOT}assets/cloud-${c.id}.webp`;
      img.alt = "";
      img.width = w;
      img.height = h;
      if (c.f) img.style.transform = "scaleX(-1)";
      if (c.o) node.style.opacity = c.o;
      node.appendChild(img);
      el.clouds.appendChild(node);
      return { ...c, w, h, node, width: 0 };
    });
  }

  function buildTiles(count) {
    el.tiles.textContent = "";
    const tiles = [];
    for (let i = 0; i < count; i++) {
      const node = document.createElement("div");
      node.className = "tile";
      const idle = document.createElement("div");
      idle.className = "tile-idle";
      const hover = document.createElement("div");
      hover.className = "tile-hover";
      const card = document.createElement("div");
      card.className = "tile-card";
      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      card.appendChild(img);
      hover.appendChild(card);
      idle.appendChild(hover);
      node.appendChild(idle);
      el.tiles.appendChild(node);
      tiles.push({
        node, idle, hover, img,
        mode: "free",       // free | trail | settled
        born: 0,
        rot: 0,
        depth: 1,
        slot: -1,
        fade: null,         // pending fade call for trail tiles
        idleTween: null,
      });
    }
    return tiles;
  }

  function init() {
    const reduced = reducedQuery.matches;
    const touch = touchQuery.matches;
    const cleanup = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanup.push(() => target.removeEventListener(type, fn, opts));
    };
    const ctx = gsap.context(() => {});
    const later = (fn) => ctx.add(fn);

    const clouds = buildClouds();
    const tiles = buildTiles(MOTION.tiles.pool);

    // Mutable motion state — never triggers layout or rendering on its own
    const state = {
      engage: 0,           // 0..1 blend from entrance into live gaze
      tracking: false,     // pointer drives the gaze once the entrance hands over
      pointer: { x: 0, y: 0, active: false, strength: 1, lastMove: 0 },
      touchTimer: 0,
      focus: null,         // {x, y, head, tau} while the eyes acknowledge something
      yaw: 0,              // -1 screen-left .. 1 screen-right (smoothed head turn)
      pitch: 0,            // smoothed look up/down hint
      eye: { x: 0, y: 0 }, // shared iris offset, source px
      pose: -1,
      time: 0,
      geo: null,
    };

    const trail = {
      ready: false,        // after the entrance
      active: false,       // a trail is running
      released: false,     // the resting tiles have joined a quick sweep
      fastPath: 0,         // px travelled at sweep speed
      hovered: null,
      path: 0,             // px travelled since the last tile
      wake: 0,             // px travelled while at rest
      speed: 0,            // smoothed px/s
      last: null,          // last pointer sample {x, y, t}
      lastSpawn: null,
      lastMove: 0,
      img: 0,
      z: 10,
    };

    // ---------- geometry ----------
    function measure() {
      const r = el.stage.getBoundingClientRect();
      // the head itself is narrower than the crop; tiles and clouds scale from the head
      const headW = (r.width * VIDEO.forwardWidth) / VIDEO.w / VIDEO.still;
      const s = headW / 776;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const compact = vw < 720;
      const tileW = Math.round(headW * (compact ? MOTION.tiles.sizeCompact : MOTION.tiles.size));
      const tileH = Math.round(tileW * 1.25);
      el.tiles.style.setProperty("--tile-w", `${tileW}px`);
      const head = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: headW, h: r.height };
      const copyR = el.copy.getBoundingClientRect();
      const margin = 10;
      const slots = (compact ? SLOTS.compact : SLOTS.wide).map((sl) => {
        let x = head.x + sl.x * head.w;
        let y = head.y + sl.y * head.w;
        // keep the copy clear: if a tile would touch it, mirror to the other side of the head
        const hit = (cx, cy) =>
          cx + tileW / 2 > copyR.left - 12 && cx - tileW / 2 < copyR.right + 12 &&
          cy + tileH / 2 > copyR.top - 12 && cy - tileH / 2 < copyR.bottom + 12;
        if (hit(x, y)) x = head.x - (x - head.x);
        x = clamp(x, margin + tileW / 2, vw - margin - tileW / 2);
        y = clamp(y, margin + tileH / 2, vh - margin - tileH / 2);
        return { x, y, r: sl.r };
      });
      state.geo = {
        scale: s,
        headW,
        head,
        mid: { x: r.left + r.width / 2, y: r.top + (VIDEO.eyeY / VIDEO.h) * r.height },
        vw,
        vh,
        tileW,
        tileH,
        slots,
      };
      for (const c of clouds) {
        c.width = c.w * s * c.s * 1.35;
        c.node.style.width = `${c.width}px`;
      }
    }

    // ---------- pose engine ----------
    const video = { manifest: null, frames: [], atlas: null, ready: false, eyeCanvas: null, dpr: 1, drawn: "" };
    const cvs = el.canvas;
    const g2d = cvs.getContext("2d");

    function sizeCanvas() {
      const r = el.head.getBoundingClientRect();
      video.dpr = Math.min(window.devicePixelRatio || 1, 2);
      // use the untransformed layout size so the entrance scale never resizes the bitmap
      const w = el.head.offsetWidth || r.width;
      const h = el.head.offsetHeight || r.height;
      cvs.width = Math.max(1, Math.round(w * video.dpr));
      cvs.height = Math.max(1, Math.round(h * video.dpr));
      video.drawn = "";
    }

    function loadImage(src) {
      return new Promise((res, rej) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => res(img));
        img.onerror = rej;
        img.src = src;
      });
    }

    async function loadPoses() {
      const man = await fetch(VIDEO.dir + "manifest.json").then((r) => r.json());
      const [atlas, ...frames] = await Promise.all(
        [loadImage(VIDEO.dir + "eyes.webp")].concat(man.poses.map((p) => loadImage(VIDEO.dir + p.file)))
      );
      video.manifest = man;
      video.atlas = atlas;
      video.frames = frames;
      video.eyeCanvas = document.createElement("canvas");
      video.ready = true;
      state.pose = man.forwardIndex;
      sizeCanvas();
      draw(true);
      el.head.classList.add("is-live");
    }

    // nearest pose to a displacement, with hysteresis so the pose never flickers between two
    function choosePose(disp) {
      const poses = video.manifest.poses;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < poses.length; i++) {
        const d = Math.abs(poses[i].disp - disp);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const cur = state.pose;
      if (cur >= 0 && cur !== best) {
        const step = Math.abs(poses[best].disp - poses[cur].disp);
        const curD = Math.abs(poses[cur].disp - disp);
        if (curD - bestD < step * MOTION.head.hysteresis) return cur;
      }
      return best;
    }

    function draw(force) {
      if (!video.ready) return;
      const man = video.manifest;
      const pose = man.poses[state.pose];
      const ex = state.eye.x;
      const ey = state.eye.y;
      const key = `${state.pose}|${ex.toFixed(2)}|${ey.toFixed(2)}|${cvs.width}`;
      if (!force && key === video.drawn) return;
      video.drawn = key;
      const k = cvs.width / man.width;
      g2d.clearRect(0, 0, cvs.width, cvs.height);
      g2d.imageSmoothingQuality = "high";
      g2d.drawImage(video.frames[state.pose], 0, 0, cvs.width, cvs.height);
      // eyes: the base frame has rebuilt sockets; the iris is drawn shifted, clipped by the
      // opening, so lids, lashes, glasses and reflections stay exactly as rendered
      const mag = Math.hypot(ex, ey);
      const rig = clamp(mag / MOTION.eyes.relax, 0, 1);
      const ec = video.eyeCanvas;
      const ectx = ec.getContext("2d");
      for (const e of pose.eyes) {
        const [px, py, pw, ph] = e.patch;
        const W = Math.ceil(pw * k);
        const H = Math.ceil(ph * k);
        if (rig > 0) {
          if (ec.width !== W || ec.height !== H) {
            ec.width = W;
            ec.height = H;
          } else ectx.clearRect(0, 0, W, H);
          const [ix, iy, iw, ih] = e.iris;
          ectx.globalCompositeOperation = "source-over";
          ectx.drawImage(video.atlas, e.irisAt[0], e.irisAt[1], iw, ih, (ix - px + ex) * k, (iy - py + ey) * k, iw * k, ih * k);
          ectx.globalCompositeOperation = "destination-in";
          ectx.drawImage(video.atlas, e.clip[0], e.clip[1], pw, ph, 0, 0, pw * k, ph * k);
          g2d.drawImage(ec, 0, 0, W, H, px * k, py * k, W, H);
        }
        if (rig < 1) {
          // near rest the untouched footage is shown, so the face is exactly as rendered
          g2d.globalAlpha = 1 - rig;
          g2d.drawImage(video.atlas, e.orig[0], e.orig[1], pw, ph, px * k, py * k, pw * k, ph * k);
          g2d.globalAlpha = 1;
        }
      }
    }

    function currentTarget(now) {
      if (state.focus) {
        return { point: state.focus, strength: 1, head: state.focus.head, tau: state.focus.tau };
      }
      if (state.tracking && state.pointer.active) {
        return { point: state.pointer, strength: state.pointer.strength, head: 1 };
      }
      if (state.tracking && touch) {
        // gentle autonomous turn on touch screens
        const a = MOTION.autoTurn;
        const geo = state.geo;
        const u = a.amplitude * Math.sin((now / a.period) * Math.PI * 2);
        return { point: { x: geo.mid.x + u * geo.vw * MOTION.head.reach * 0.7, y: geo.mid.y }, strength: 1, head: 1, tau: 1.2 };
      }
      return null;
    }

    function tick(_, deltaMs) {
      const dt = Math.min(deltaMs / 1000, 0.05);
      state.time += dt;
      const now = state.time;
      const geo = state.geo;
      if (!geo) return;
      const H = MOTION.head;
      const E = MOTION.eyes;
      const t = currentTarget(now);

      // ----- where the head wants to point, -1..1, softly saturated -----
      let goal = 0;
      let beyond = 0;
      let vy = 0;
      if (t) {
        const rx = (t.point.x - geo.mid.x) / (geo.vw * H.reach);
        const soft = clamp((rx / Math.sqrt(1 + rx * rx)) * Math.SQRT2, -1, 1);
        goal = soft * t.head * state.engage;
        beyond = clamp(rx - soft, -1, 1) * state.engage;
        vy = clamp((t.point.y - geo.mid.y) / (geo.vh * 0.5), -1, 1) * state.engage;
      }
      const tauHead = t ? t.tau || H.smoothing : H.returnSmoothing;
      state.yaw = damp(state.yaw, goal, tauHead, dt);
      state.pitch = damp(state.pitch, vy * (t ? t.strength : 0), H.tiltSmoothing, dt);

      // ----- eyes lead: they cover what the head has not turned yet, then relax -----
      let ex = 0;
      let ey = 0;
      if (t) {
        const s = t.strength * state.engage;
        ex = ((goal - state.yaw) * E.lead + beyond * E.hold) * E.maxX * s;
        if (t.head < 1) ex += (goal / Math.max(t.head, 0.01) - goal) * E.maxX * 0.6 * s; // tile glance: eyes do the rest
        ey = vy * (vy < 0 ? E.maxUp : E.maxDown) * s;
      }
      if (video.ready) {
        const pose = video.manifest.poses[state.pose];
        // keep the iris inside this pose's openings; both eyes share one offset so they never cross
        const roomL = Math.min(pose.eyes[0].room[0], pose.eyes[1].room[0]) - 2;
        const roomR = Math.min(pose.eyes[0].room[1], pose.eyes[1].room[1]) - 2;
        ex = clamp(ex, -Math.max(0, Math.min(E.maxX, roomL)), Math.max(0, Math.min(E.maxX, roomR)));
      }
      ey = clamp(ey, -E.maxUp, E.maxDown);
      const tauEye = t ? E.smoothing : E.returnSmoothing;
      state.eye.x = damp(state.eye.x, ex, tauEye, dt);
      state.eye.y = damp(state.eye.y, ey, tauEye, dt);

      // ----- pose + render -----
      if (video.ready) {
        const man = video.manifest;
        const span = Math.min(-man.maxDisp[0], man.maxDisp[1]) * H.range;
        state.pose = choosePose(state.yaw * span);
        draw(false);
      }
      el.headTilt.style.transform = `translate3d(0, ${(state.pitch * H.lift).toFixed(2)}px, 0) rotateX(${(-state.pitch * H.tiltX).toFixed(3)}deg)`;

      // ----- trail rest: settle once the pointer has been still for a moment -----
      if (trail.active && !trail.hovered) {
        trail.speed = damp(trail.speed, 0, MOTION.trail.speedSmoothing * 3, dt);
        if (now - trail.lastMove > MOTION.trail.settleDelay) settle();
      }

      // ----- clouds -----
      if (!reduced) renderClouds(now, state.yaw * 0.6, state.pitch * 0.4);
    }

    function renderClouds(now, hX = 0, hY = 0) {
      const { vw, vh } = state.geo;
      const cs = MOTION.clouds;
      for (const c of clouds) {
        const span = vw + c.width;
        let x = (c.x * span - now * cs.speed * c.d) % span;
        if (x < 0) x += span;
        x = x - c.width - hX * cs.parallax * c.d;
        const top = c.bottom ? vh - c.width * (c.h / c.w) * (1 - c.y) : c.y * vh;
        const y = top - hY * cs.parallax * 0.5 * c.d;
        c.node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
    }

    // ---------- tiles ----------
    function nextImage() {
      const src = TEASER_TILES[trail.img % TEASER_TILES.length];
      trail.img += 1;
      return src;
    }

    function setSettled(tile, settled) {
      tile.node.classList.toggle("is-settled", settled);
    }

    function startIdle(tile) {
      if (!touch || reduced || tile.idleTween) return;
      const it = MOTION.idleTiles;
      later(() => {
        tile.idleTween = gsap.to(tile.idle, {
          y: rand(-it.amplitude, it.amplitude) || it.amplitude,
          rotation: rand(-it.rotate, it.rotate),
          duration: rand(it.period[0], it.period[1]) / 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: rand(0, 1.2),
        });
      });
    }

    function stopIdle(tile) {
      if (!tile.idleTween) return;
      tile.idleTween.kill();
      tile.idleTween = null;
      gsap.to(tile.idle, { y: 0, rotation: 0, duration: 0.6, ease: "power2.out" });
    }

    function resetHoverLayer(tile) {
      gsap.killTweensOf(tile.hover);
      gsap.set(tile.hover, { clearProps: "transform,opacity" });
    }

    // Tile emerges from behind the head (fully occluded at its start) and glides to a slot
    function emergeToSlot(tile, slotIndex, delay = 0) {
      const { head, slots, tileW, tileH } = state.geo;
      const sl = slots[slotIndex];
      gsap.killTweensOf(tile.node);
      tile.mode = "settled";
      tile.slot = slotIndex;
      tile.rot = sl.r;
      tile.img.src = nextImage();
      resetHoverLayer(tile);
      const tl = gsap.timeline({ delay });
      tl.set(tile.node, {
        x: head.x - tileW / 2,
        y: head.y - tileH / 2 - head.h * 0.08,
        rotation: 0,
        scale: 0.72,
        opacity: 1,
        zIndex: ++trail.z,
      })
        .to(tile.node, {
          x: sl.x - tileW / 2,
          y: sl.y - tileH / 2,
          duration: MOTION.entrance.tileDuration,
          ease: "expo.out",
        }, 0)
        .to(tile.node, { scale: 1, rotation: sl.r, duration: MOTION.entrance.tileDuration * 0.9, ease: "power3.out" }, 0)
        .add(() => {
          setSettled(tile, true);
          startIdle(tile);
        }, MOTION.entrance.tileDuration * 0.5);
      return tl;
    }

    function placeSettledStatic() {
      const { slots, tileW, tileH } = state.geo;
      tiles.forEach((tile, i) => {
        if (i < slots.length) {
          const sl = slots[i];
          tile.mode = "settled";
          tile.slot = i;
          tile.rot = sl.r;
          if (!tile.img.src) tile.img.src = nextImage();
          gsap.set(tile.node, { x: sl.x - tileW / 2, y: sl.y - tileH / 2, rotation: sl.r, scale: 1, zIndex: i + 1 });
          setSettled(tile, true);
        } else {
          tile.mode = "free";
          gsap.set(tile.node, { opacity: 0 });
        }
      });
    }

    function fadeOut(tile, { delay = 0, duration = MOTION.trail.fade, drift = 12 } = {}) {
      if (tile.fade) tile.fade.kill();
      tile.fade = null;
      tile.mode = "leaving";
      setSettled(tile, false);
      stopIdle(tile);
      later(() => {
        gsap.to(tile.node, {
          opacity: 0,
          scale: 0.5 * tile.depth,
          y: `+=${drift}`,
          duration,
          delay,
          ease: "power2.in",
          overwrite: "auto",
          onComplete: () => {
            if (tile.mode === "leaving") tile.mode = "free";
          },
        });
      });
    }

    // The resting tiles make way when a trail begins
    function releaseSettled() {
      tiles.forEach((tile, i) => {
        if (tile.mode !== "settled") return;
        resetHoverLayer(tile);
        fadeOut(tile, { delay: i * 0.04, duration: 0.45, drift: 6 });
      });
    }

    function visibleTrail() {
      return tiles.filter((t) => t.mode === "trail").sort((a, b) => a.born - b.born);
    }

    function pickNode() {
      const free = tiles.find((t) => t.mode === "free");
      if (free) return free;
      // reuse a leaving tile first, then the oldest trail tile, never a resting one
      const pool = tiles.filter((t) => t.mode !== "settled");
      return pool.find((t) => t.mode === "leaving") || pool.sort((a, b) => a.born - b.born)[0];
    }

    function spawn(x, y, intensity) {
      const cfg = MOTION.trail;
      const live = visibleTrail();
      const resting = tiles.filter((t) => t.mode === "settled").length;
      const leaving = tiles.filter((t) => t.mode === "leaving").length;
      // keep the trail bounded: the oldest tiles start leaving early, one after another
      const surplus = live.length + resting + Math.max(0, leaving - 1) - (MOTION.tiles.maxVisible - 1);
      for (let i = 0; i < surplus; i++) fadeOut(live[i], { delay: i * 0.05, duration: 0.45 });

      const tile = pickNode();
      if (!tile) return;
      const { tileW, tileH } = state.geo;
      if (tile.fade) tile.fade.kill();
      gsap.killTweensOf(tile.node);
      stopIdle(tile);
      resetHoverLayer(tile);
      tile.mode = "trail";
      tile.born = state.time;
      tile.depth = rand(0.9, 1.04) * (1 - intensity * 0.08);
      tile.rot = rand(-1, 1) * lerp(cfg.tilt, cfg.tiltFast, intensity);
      tile.img.src = nextImage();
      const from = trail.lastSpawn || { x, y };
      const hold = lerp(cfg.holdSlow, cfg.holdFast, intensity) + rand(0, 0.08);
      later(() => {
        gsap
          .timeline()
          .set(tile.node, {
            x: from.x - tileW / 2,
            y: from.y - tileH / 2,
            rotation: tile.rot * 0.4,
            scale: tile.depth * 0.8,
            opacity: 0,
            zIndex: ++trail.z,
          })
          .to(tile.node, { x: x - tileW / 2, y: y - tileH / 2, duration: cfg.travel, ease: "expo.out" }, 0)
          .to(tile.node, { rotation: tile.rot, scale: tile.depth, duration: 0.55, ease: "expo.out" }, 0)
          .to(tile.node, { opacity: 1, duration: 0.18, ease: "power1.out" }, 0);
        tile.fade = gsap.delayedCall(hold, () => fadeOut(tile));
      });
      trail.lastSpawn = { x, y };
    }

    // Pointer has rested: the freshest tiles glide to the slots, the rest fade away
    function settle() {
      const released = trail.released;
      trail.active = false;
      trail.released = false;
      trail.fastPath = 0;
      trail.wake = 0;
      trail.path = 0;
      trail.lastSpawn = null;
      const { slots, tileW, tileH } = state.geo;
      const live = visibleTrail().reverse(); // newest first
      if (!released) {
        // the resting tiles never left: the trail simply fades, newest last
        live.reverse().forEach((t, i) => fadeOut(t, { delay: i * 0.07, duration: 0.6 }));
        return;
      }
      const keep = live.slice(0, slots.length);
      live.slice(slots.length).forEach((t, i) => fadeOut(t, { delay: i * 0.06, duration: 0.55 }));

      // assign kept tiles to slots with the least total travel
      const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((v, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [v, ...p])));
      const slotIdx = slots.map((_, i) => i);
      let best = null;
      let bestCost = Infinity;
      for (const p of perms(slotIdx)) {
        let cost = 0;
        keep.forEach((t, i) => {
          const gx = gsap.getProperty(t.node, "x") + tileW / 2;
          const gy = gsap.getProperty(t.node, "y") + tileH / 2;
          cost += Math.hypot(gx - slots[p[i]].x, gy - slots[p[i]].y);
        });
        if (cost < bestCost) {
          bestCost = cost;
          best = p;
        }
      }
      const used = new Set();
      keep.forEach((t, i) => {
        const si = best[i];
        used.add(si);
        const sl = slots[si];
        if (t.fade) t.fade.kill();
        t.fade = null;
        t.mode = "settled";
        t.slot = si;
        t.rot = sl.r;
        later(() => {
          gsap.to(t.node, {
            x: sl.x - tileW / 2,
            y: sl.y - tileH / 2,
            rotation: sl.r,
            scale: 1,
            opacity: 1,
            duration: MOTION.trail.settleDuration,
            delay: i * 0.06,
            ease: "power3.out",
            overwrite: "auto",
            onStart: () => setSettled(t, true),
          });
        });
      });
      // any empty slot is filled from behind the head
      slots.forEach((_, si) => {
        if (used.has(si)) return;
        const t = pickNode();
        if (t) later(() => emergeToSlot(t, si, 0.15 + used.size * 0.08));
        used.add(si);
      });
    }

    // near a resting tile the pointer is probably heading for it: keep that area calm
    function nearResting(x, y) {
      const { tileW, tileH } = state.geo;
      const pad = MOTION.trail.keepClear;
      return tiles.some((t) => {
        if (t.mode !== "settled") return false;
        const cx = gsap.getProperty(t.node, "x") + tileW / 2;
        const cy = gsap.getProperty(t.node, "y") + tileH / 2;
        return Math.abs(x - cx) < tileW / 2 + pad && Math.abs(y - cy) < tileH / 2 + pad;
      });
    }

    function trailMove(x, y, t) {
      const cfg = MOTION.trail;
      if (!trail.last) {
        trail.last = { x, y, t };
        return;
      }
      const dx = x - trail.last.x;
      const dy = y - trail.last.y;
      const dist = Math.hypot(dx, dy);
      const dts = Math.max((t - trail.last.t) / 1000, 0.004);
      const inst = Math.min(dist / dts, cfg.speedCap);
      trail.speed = damp(trail.speed, inst, cfg.speedSmoothing, dts);
      const from = trail.last;
      trail.last = { x, y, t };
      if (dist < 0.5) return;
      trail.lastMove = state.time;

      if (!trail.ready || trail.hovered || reduced || touch) return;
      const intensity = clamp((trail.speed - cfg.speedSlow) / (cfg.speedFast - cfg.speedSlow), 0, 1);

      const near = nearResting(x, y);
      if (!trail.active) {
        trail.wake = near ? 0 : trail.wake + dist;
        if (trail.wake < cfg.wakeDistance) return;
        trail.active = true;
        trail.path = Infinity; // first tile right away
        trail.lastSpawn = { x: from.x, y: from.y };
      }

      // a sustained quick sweep lets the resting tiles join in; they settle again afterwards
      if (!trail.released) {
        trail.fastPath = trail.speed > cfg.releaseSpeed ? trail.fastPath + dist : Math.max(0, trail.fastPath - dist * 0.5);
        if (trail.fastPath > cfg.releaseDistance) {
          trail.released = true;
          releaseSettled();
        }
      }
      if (near && !trail.released) {
        trail.lastSpawn = null;
        trail.path = 0;
        return;
      }

      const spacing = lerp(cfg.spacingSlow, cfg.spacingFast, intensity);
      trail.path = Math.min(trail.path + dist, spacing * cfg.maxPerMove + 1);
      let n = 0;
      while (trail.path >= spacing && n < cfg.maxPerMove) {
        trail.path -= spacing;
        // place along this pointer segment so a quick sweep leaves an even flourish
        const k = clamp(1 - trail.path / Math.max(dist, 1), 0, 1);
        spawn(from.x + dx * k, from.y + dy * k, intensity);
        n += 1;
      }
    }

    // ---------- tile acknowledgement ----------
    function tileCentre(tile) {
      const r = tile.node.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function acknowledge(tile) {
      if (tile.mode !== "settled") return;
      const hv = MOTION.hover;
      trail.hovered = tile;
      trail.wake = 0;
      const c = tileCentre(tile);
      state.focus = { x: c.x, y: c.y, head: MOTION.head.focusStrength, tau: MOTION.head.focusSmoothing };
      gsap.set(tile.node, { zIndex: ++trail.z });
      tiles.forEach((t) => {
        if (t.mode !== "settled") return;
        if (t === tile) {
          gsap.to(t.hover, {
            rotation: reduced ? 0 : -t.rot * hv.straighten,
            scale: reduced ? 1 : hv.scale,
            y: reduced ? 0 : -hv.lift,
            opacity: 1,
            duration: reduced ? 0.3 : hv.inDuration,
            ease: "power3.out",
            overwrite: "auto",
          });
        } else {
          gsap.to(t.hover, {
            rotation: 0,
            scale: reduced ? 1 : hv.dimScale,
            y: 0,
            opacity: hv.dim,
            duration: reduced ? 0.3 : hv.inDuration,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      });
    }

    function release(tile) {
      if (trail.hovered !== tile) return;
      const hv = MOTION.hover;
      trail.hovered = null;
      trail.wake = 0;
      trail.lastMove = state.time;
      state.focus = null;
      tiles.forEach((t) => {
        if (t.mode !== "settled") return;
        gsap.to(t.hover, {
          rotation: 0,
          scale: 1,
          y: 0,
          opacity: 1,
          duration: reduced ? 0.3 : hv.outDuration,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    }

    tiles.forEach((tile) => {
      let touchTimer = 0;
      on(tile.node, "pointerenter", (e) => {
        if (e.pointerType === "touch") return;
        acknowledge(tile);
      });
      on(tile.node, "pointerleave", (e) => {
        if (e.pointerType === "touch") return;
        release(tile);
      });
      on(tile.node, "pointerdown", (e) => {
        if (e.pointerType !== "touch") return;
        if (trail.hovered && trail.hovered !== tile) release(trail.hovered);
        acknowledge(tile);
        clearTimeout(touchTimer);
        touchTimer = setTimeout(() => release(tile), MOTION.hover.touchHold * 1000);
      });
      cleanup.push(() => clearTimeout(touchTimer));
    });

    // ---------- input ----------
    function onPointerMove(e) {
      if (e.pointerType === "touch") return;
      trailMove(e.clientX, e.clientY, e.timeStamp);
      state.pointer.x = e.clientX;
      state.pointer.y = e.clientY;
      state.pointer.active = true;
      state.pointer.strength = 1;
      state.pointer.lastMove = state.time;
    }
    function onTouch(e) {
      if (e.pointerType !== "touch") return;
      clearTimeout(state.touchTimer);
      state.pointer.x = e.clientX;
      state.pointer.y = e.clientY;
      state.pointer.active = true;
      state.pointer.strength = MOTION.eyes.touchStrength;
      state.pointer.lastMove = state.time;
    }
    function onTouchEnd(e) {
      if (e.pointerType !== "touch") return;
      clearTimeout(state.touchTimer);
      state.touchTimer = setTimeout(() => (state.pointer.active = false), MOTION.eyes.touchHold * 1000);
    }
    function onLeave(e) {
      if (e.relatedTarget) return;
      state.pointer.active = false;
      trail.last = null;
      if (trail.hovered) release(trail.hovered);
      if (trail.active) settle();
    }
    function onBlur() {
      state.pointer.active = false;
      trail.last = null;
      if (trail.hovered) release(trail.hovered);
    }

    let resizeRaf = 0;
    function onResize() {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        measure();
        sizeCanvas();
        draw(true);
        if (reduced) renderClouds(0);
        // keep the resting tiles in their slots
        const { slots, tileW, tileH } = state.geo;
        tiles.forEach((t) => {
          if (t.mode !== "settled" || t.slot < 0) return;
          const sl = slots[t.slot];
          gsap.to(t.node, { x: sl.x - tileW / 2, y: sl.y - tileH / 2, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        });
      });
    }

    function onVisibility() {
      if (document.hidden) gsap.globalTimeline.pause();
      else gsap.globalTimeline.resume();
    }

    // ---------- choreography ----------
    let floatTween = null;
    function startFloat() {
      if (reduced || floatTween) return;
      const a = MOTION.float.amplitude / 2;
      floatTween = gsap.fromTo(
        el.headFloat,
        { y: 0 },
        { y: -a, duration: MOTION.float.period / 4, ease: "sine.out", onComplete: () => {
          floatTween = gsap.to(el.headFloat, { y: a, duration: MOTION.float.period / 2, ease: "sine.inOut", yoyo: true, repeat: -1 });
        } }
      );
    }

    function entrance() {
      const en = MOTION.entrance;
      const replay = entrancePlayed;
      entrancePlayed = true;
      later(() => {
        if (reduced || replay) {
          // static composition, simple fades (also used if the page re-initialises after the opening)
          placeSettledStatic();
          gsap.set(el.headEnter, { y: 0, scale: 1 });
          gsap.set(el.reveal, { y: 0 });
          el.body.classList.remove("is-loading");
          gsap.fromTo([el.headEnter, ...el.reveal], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out" });
          gsap.fromTo(tiles.slice(0, state.geo.slots.length).map((t) => t.node), { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.15, ease: "power1.out" });
          if (!reduced) {
            gsap.to(state, { engage: 1, duration: 0.8, ease: "power2.inOut" });
            state.tracking = true;
            trail.ready = true;
            tiles.forEach((t) => t.mode === "settled" && startIdle(t));
            startFloat();
          }
          return;
        }
        gsap.set(el.headEnter, { autoAlpha: 0, y: en.rise, scale: en.fromScale, transformOrigin: "50% 60%" });
        gsap.set(el.reveal, { autoAlpha: 0, y: 12 });
        el.body.classList.remove("is-loading");

        const firstSlot = state.geo.slots[0];
        const tl = gsap.timeline();
        tl.to(el.headEnter, { y: 0, scale: 1, duration: en.headDuration, ease: `back.out(${en.overshoot})` }, en.headAt)
          .to(el.headEnter, { autoAlpha: 1, duration: en.headDuration * 0.6, ease: "power1.out" }, en.headAt)
          .add(startFloat, en.headAt + en.headDuration * 0.85)
          // a beat to register the face, then the eyes glance to where the first tile will land
          .add(() => {
            state.focus = { x: firstSlot.x, y: firstSlot.y, head: 0.3, tau: MOTION.head.focusSmoothing };
          }, en.glanceAt)
          .to(state, { engage: 1, duration: 0.35, ease: "power2.out" }, en.glanceAt);
        state.geo.slots.forEach((_, i) => {
          tl.add(() => emergeToSlot(tiles[i], i), en.tilesAt + i * en.tileStagger);
        });
        tl.add(() => (state.focus = null), en.releaseGlanceAt)
          .to(el.reveal, { autoAlpha: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: en.textStagger }, en.textAt)
          // hand over to the pointer: damping blends from wherever the eyes are, no snap
          .add(() => {
            state.tracking = true;
            trail.ready = true;
            trail.wake = 0;
          }, en.handoverAt);
      });
    }

    // ---------- wire up ----------
    measure();
    renderClouds(0);

    on(window, "resize", onResize);
    if (!reduced) {
      on(window, "pointermove", onPointerMove, { passive: true });
      on(window, "pointerdown", onTouch, { passive: true });
      on(window, "pointermove", onTouch, { passive: true });
      on(window, "pointerup", onTouchEnd, { passive: true });
      on(window, "pointercancel", onTouchEnd, { passive: true });
      on(document, "mouseout", onLeave);
      on(window, "blur", onBlur);
      on(document, "visibilitychange", onVisibility);
      gsap.ticker.add(tick);
      cleanup.push(() => gsap.ticker.remove(tick));
    }

    let alive = true;
    preload().then(() => alive && entrance());
    if (!reduced) loadPoses().catch(() => {}); // the still stays if the poses cannot load

    inspect = () => ({ yaw: +state.yaw.toFixed(3), eye: +state.eye.x.toFixed(2), eyeY: +state.eye.y.toFixed(2), pose: state.pose, live: video.ready });

    return function destroy() {
      alive = false;
      cleanup.forEach((fn) => fn());
      clearTimeout(state.touchTimer);
      cancelAnimationFrame(resizeRaf);
      floatTween && floatTween.kill();
      tiles.forEach((t) => {
        if (t.fade) t.fade.kill();
        if (t.idleTween) t.idleTween.kill();
      });
      ctx.revert();
      gsap.killTweensOf([el.headFloat, el.headEnter, ...el.reveal, ...tiles.flatMap((t) => [t.node, t.idle, t.hover])]);
      gsap.set([el.headFollow, el.headTilt, el.headFloat], { clearProps: "transform" });
      video.ready = false;
      video.frames = [];
      el.head.classList.remove("is-live");
      gsap.set([el.headEnter, ...el.reveal], { clearProps: "all" });
      el.tiles.textContent = "";
      gsap.globalTimeline.resume();
    };
  }

  let entrancePlayed = false; // the opening plays once per page load
  let inspect = () => null;   // read-only snapshot for tuning
  let destroy = init();
  // Re-initialise if reduced motion or the input type changes while the page is open
  const onEnvChange = () => {
    destroy();
    destroy = init();
  };
  [reducedQuery, touchQuery].forEach((q) =>
    q.addEventListener ? q.addEventListener("change", onEnvChange) : q.addListener(onEnvChange)
  );

  // Exposed for tuning in the console, e.g. binzHeadTurn.motion.head.smoothing = 0.6
  window.binzHeadTurn = { motion: MOTION, tiles: TEASER_TILES, inspect: () => inspect(), destroy: () => destroy() };
})();

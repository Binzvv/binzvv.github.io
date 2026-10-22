/* Binz Tamang — coming soon
 * Eyes notice the pointer first; the head follows slightly behind.
 * Teaser tiles emerge from behind the head, trail the pointer and settle around it.
 * All tunable motion lives in MOTION. Offsets marked "source px" are measured on the
 * 776 x 1215 head artwork and scale with the rendered head.
 */
(() => {
  "use strict";

  const MOTION = {
    gaze: {
      maxX: 9,              // source px of iris travel left/right
      maxUp: 3.4,           // source px upward
      maxDown: 2.2,         // source px downward (lower lid is close)
      depth: 1.15,          // virtual target distance, in head widths (higher = calmer eyes)
      convergence: 0.5,     // max per-eye difference, source px (stops crossed eyes)
      smoothing: 0.14,      // s, time constant while tracking
      returnSmoothing: 0.34,// s, easing back to a relaxed forward gaze
      catchlightFollow: 0.35, // catchlights move this fraction of the iris (they sit on the cornea)
      touchStrength: 0.6,   // restrained response to touch position
      touchHold: 1.4,       // s to keep looking at the last touch
    },
    head: {
      rotateY: 5,           // deg, max
      rotateX: 3,           // deg, max
      x: 8,                 // px, max
      y: 5,                 // px, max
      reach: 0.75,          // fraction of half-viewport at which the head reaches its limits
      smoothing: 0.55,      // s
      returnSmoothing: 0.9, // s
      focusSmoothing: 0.95, // s, slower follow when the eyes acknowledge a tile
      focusStrength: 0.35,  // how far the head follows a glance at a tile
    },
    float: { amplitude: 4, period: 6 },          // px peak-to-peak, s per cycle
    idleGlance: { after: 3.5, every: [2.4, 5.2], range: 0.22 }, // range is normalised gaze
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
  const TEASER_TILES = [
    "assets/trail-star.webp",
    "assets/trail-eye.webp",
    "assets/trail-heart.webp",
    "assets/trail-septum.webp",
    "assets/trail-flower.webp",
    "assets/trail-earrings.webp",
    "assets/trail-cloud.webp",
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

  // Geometry of the supplied artwork (head crop)
  const ART = {
    w: 776,
    h: 1215,
    irisBox: 88,
    eyes: [{ cx: 238.6, cy: 519.0 }, { cx: 543.7, cy: 518.8 }],
  };

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
    irises: [...document.querySelectorAll(".eye .iris")],
    catches: [...document.querySelectorAll(".eye .catch")],
    reveal: [...document.querySelectorAll("[data-reveal]")],
    clouds: $("#clouds"),
    tiles: $("#tiles"),
  };

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchQuery = window.matchMedia("(hover: none), (pointer: coarse)");

  function preload() {
    const imgs = [...document.querySelectorAll("img")];
    const extra = Object.keys(CLOUD_SPRITES)
      .map((id) => `assets/cloud-${id}.webp`)
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
      img.src = `assets/cloud-${c.id}.webp`;
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
      idle: { x: 0, y: 0, next: 0 },
      eyes: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
      head: { x: 0, y: 0 },
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
      const s = r.width / ART.w;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const compact = vw < 720;
      const tileW = Math.round(r.width * (compact ? MOTION.tiles.sizeCompact : MOTION.tiles.size));
      const tileH = Math.round(tileW * 1.25);
      el.tiles.style.setProperty("--tile-w", `${tileW}px`);
      const head = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
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
        headW: r.width,
        head,
        eyes: ART.eyes.map((e) => ({ x: r.left + e.cx * s, y: r.top + e.cy * s })),
        mid: { x: r.left + ((ART.eyes[0].cx + ART.eyes[1].cx) / 2) * s, y: r.top + ART.eyes[0].cy * s },
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

    // ---------- gaze ----------
    // Normalised direction from a point to the target with a virtual depth: smooth, bounded, never snaps
    function gazeFrom(from, target, depth) {
      const dx = target.x - from.x;
      const dy = target.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy + depth * depth);
      return { x: dx / len, y: dy / len };
    }

    function gazeOffset(n, g) {
      let x = n.x * g.maxX;
      let y = n.y * (n.y < 0 ? g.maxUp : g.maxDown);
      // Keep each iris inside an elliptical range of the eye opening
      const ry = y < 0 ? g.maxUp : g.maxDown;
      const k = (x / g.maxX) ** 2 + (y / ry) ** 2;
      if (k > 1) {
        const f = 1 / Math.sqrt(k);
        x *= f;
        y *= f;
      }
      return { x, y };
    }

    function currentTarget() {
      if (state.focus) {
        return { point: state.focus, strength: 1, head: state.focus.head, tau: state.focus.tau };
      }
      if (state.tracking && state.pointer.active) {
        return { point: state.pointer, strength: state.pointer.strength, head: state.pointer.strength };
      }
      return null;
    }

    function updateIdle(now) {
      const ig = MOTION.idleGlance;
      const idleFor = now - state.pointer.lastMove;
      if (reduced || !state.tracking || state.focus || (state.pointer.active && idleFor < ig.after)) {
        state.idle.x = 0;
        state.idle.y = 0;
        state.idle.next = now + rand(ig.every[0], ig.every[1]);
        return;
      }
      if (now >= state.idle.next) {
        // Mostly small glances, with a regular return to centre so it never feels restless
        const back = Math.random() < 0.4;
        state.idle.x = back ? 0 : rand(-ig.range, ig.range);
        state.idle.y = back ? 0 : rand(-ig.range * 0.5, ig.range * 0.35);
        state.idle.next = now + rand(ig.every[0], ig.every[1]);
      }
    }

    let lastWrite = "";
    function tick(_, deltaMs) {
      const dt = Math.min(deltaMs / 1000, 0.05);
      state.time += dt;
      const now = state.time;
      const g = MOTION.gaze;
      const h = MOTION.head;
      const geo = state.geo;
      if (!geo) return;

      updateIdle(now);
      const t = currentTarget();
      const depth = g.depth * geo.headW;

      // ----- eyes -----
      let common = { x: state.idle.x, y: state.idle.y };
      let perEye = [common, common];
      if (t) {
        const c = gazeFrom(geo.mid, t.point, depth);
        common = { x: c.x * t.strength, y: c.y * t.strength };
        perEye = geo.eyes.map((e) => {
          const n = gazeFrom(e, t.point, depth);
          return { x: n.x * t.strength, y: n.y * t.strength };
        });
      }
      const tauEye = t ? g.smoothing : g.returnSmoothing;
      const conv = g.convergence;
      const cOff = gazeOffset(common, g);
      for (let i = 0; i < 2; i++) {
        const own = gazeOffset(perEye[i], g);
        const tx = (cOff.x + clamp(own.x - cOff.x, -conv, conv)) * state.engage;
        const ty = (cOff.y + clamp(own.y - cOff.y, -conv * 0.5, conv * 0.5)) * state.engage;
        const e = state.eyes[i];
        e.x = damp(e.x, tx, tauEye, dt);
        e.y = damp(e.y, ty, tauEye, dt);
      }

      // ----- head -----
      let hx = 0;
      let hy = 0;
      if (t) {
        const rx = (t.point.x - geo.mid.x) / (geo.vw * 0.5 * h.reach);
        const ry = (t.point.y - geo.mid.y) / (geo.vh * 0.5 * h.reach);
        // soft saturation keeps the head calm near its limits
        hx = clamp((rx / Math.sqrt(1 + rx * rx)) * Math.SQRT2, -1, 1) * t.head;
        hy = clamp((ry / Math.sqrt(1 + ry * ry)) * Math.SQRT2, -1, 1) * t.head;
      } else {
        hx = state.idle.x * 0.25;
        hy = state.idle.y * 0.25;
      }
      const tauHead = t ? t.tau || h.smoothing : h.returnSmoothing;
      state.head.x = damp(state.head.x, hx * state.engage, tauHead, dt);
      state.head.y = damp(state.head.y, hy * state.engage, tauHead, dt);

      // ----- write transforms (one string per element, only when changed) -----
      const ex = state.eyes;
      const pct = 100 / ART.irisBox;
      const cf = g.catchlightFollow;
      const hX = state.head.x;
      const hY = state.head.y;
      const sig = `${ex[0].x.toFixed(3)}${ex[0].y.toFixed(3)}${ex[1].x.toFixed(3)}${ex[1].y.toFixed(3)}${hX.toFixed(4)}${hY.toFixed(4)}`;
      if (sig !== lastWrite) {
        lastWrite = sig;
        for (let i = 0; i < 2; i++) {
          el.irises[i].style.transform = `translate3d(${(ex[i].x * pct).toFixed(3)}%, ${(ex[i].y * pct).toFixed(3)}%, 0)`;
          el.catches[i].style.transform = `translate3d(${(ex[i].x * pct * cf).toFixed(3)}%, ${(ex[i].y * pct * cf).toFixed(3)}%, 0)`;
        }
        el.headFollow.style.transform = `translate3d(${(hX * h.x).toFixed(2)}px, ${(hY * h.y).toFixed(2)}px, 0)`;
        el.headTilt.style.transform = `rotateX(${(-hY * h.rotateX).toFixed(3)}deg) rotateY(${(hX * h.rotateY).toFixed(3)}deg)`;
      }

      // ----- trail rest: settle once the pointer has been still for a moment -----
      if (trail.active && !trail.hovered) {
        trail.speed = damp(trail.speed, 0, MOTION.trail.speedSmoothing * 3, dt);
        if (now - trail.lastMove > MOTION.trail.settleDelay) settle();
      }

      // ----- clouds: slow drift with a touch of depth parallax -----
      if (!reduced) renderClouds(now, hX, hY);
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
      state.pointer.strength = MOTION.gaze.touchStrength;
      state.pointer.lastMove = state.time;
    }
    function onTouchEnd(e) {
      if (e.pointerType !== "touch") return;
      clearTimeout(state.touchTimer);
      state.touchTimer = setTimeout(() => (state.pointer.active = false), MOTION.gaze.touchHold * 1000);
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
      gsap.set([el.headFollow, el.headTilt, el.headFloat, ...el.irises, ...el.catches], { clearProps: "transform" });
      gsap.set([el.headEnter, ...el.reveal], { clearProps: "all" });
      el.tiles.textContent = "";
      gsap.globalTimeline.resume();
    };
  }

  let entrancePlayed = false; // the opening plays once per page load
  let destroy = init();
  // Re-initialise if reduced motion or the input type changes while the page is open
  const onEnvChange = () => {
    destroy();
    destroy = init();
  };
  [reducedQuery, touchQuery].forEach((q) =>
    q.addEventListener ? q.addEventListener("change", onEnvChange) : q.addListener(onEnvChange)
  );

  // Exposed for tuning in the console, e.g. binzOpener.motion.trail.spacingSlow = 200
  window.binzOpener = { motion: MOTION, tiles: TEASER_TILES, destroy: () => destroy() };
})();

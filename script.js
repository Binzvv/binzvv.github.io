/* Binz Tamang — spatial archive
 * The head stays anchored; its eyes notice the pointer first and the head follows slightly.
 * Project images travel along one tilted, gently irregular ellipse in 3D around the head:
 * near cards are larger and brighter, far ones smaller and darker, and the head occludes
 * whatever passes behind it. All tunable motion lives in MOTION.
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
      rotateY: 3.5,         // deg, max (subtle parallax only)
      rotateX: 2,           // deg, max
      x: 6,                 // px, max
      y: 4,                 // px, max
      reach: 0.75,          // fraction of half-viewport at which the head reaches its limits
      smoothing: 0.55,      // s
      returnSmoothing: 0.9, // s
    },
    float: { amplitude: 4, period: 6 },          // px peak-to-peak, s per cycle
    idleGlance: { after: 3.5, every: [2.4, 5.2], range: 0.22 }, // range is normalised gaze

    entrance: {
      rise: 35, fromScale: 0.96, headAt: 0.2, headDuration: 1.2, overshoot: 1.1,
      archiveAt: 0.5,       // the procession fades in ...
      archiveDuration: 2.4,
      arrivalSpeed: 5,      // ... arriving faster, then easing to its walking pace
      textAt: 1.7,
      textStagger: 0.12,
      handoverAt: 2.2,
    },

    // Work first: the head is drawn at 93.6% of its original size (the 72% work-first size,
    // enlarged by 30%) and sits off-centre. The archive keeps the scale of the original
    // composition: one "world unit" = the head's original width.
    composition: {
      headScale: 0.936,     // must match the factor on --head-w in style.css
      // the orbit is centred on the head itself, nudged right for an asymmetric composition
      orbitX: 0.2,          // world units right of the head centre (desktop)
      orbitXCompact: 0,     // phones: the orbit is centred on the head too
      orbitY: 0.02,         // world units below it
    },

    // The orbit, in world units so it scales with the screen. A loop around the head, tipped
    // towards the viewer: tiles pass behind the hair at the back, beside the ears at the
    // sides, and in front of the lower face at the front, so the order keeps changing:
    // work in front → face → work behind.
    // A circle in a horizontal plane, made irregular, turned so its depth runs diagonally,
    // tilted towards the viewer and rolled: the near side sweeps past the lower right of the
    // head, the far side recedes up-left and passes behind the hair.
    path: {
      radiusX: 1.85,
      radiusZ: 1.3,
      wobble: [0.07, 0.045],// radius variation, 2 and 3 lobes, keeps it from reading as a ring
      lift: 0.06,           // gentle vertical undulation along the path
      yaw: 8,               // deg, the nearest point sits just right of the face
      tilt: 23,             // deg, front passes across the lower face, back above the hair
      roll: -6,             // deg, a slight lean in the picture
      focal: 3.4,           // camera focal length; lower = stronger perspective
    },

    archive: {
      cards: 16,
      maxWidth: 1.05,       // world units, widest any tile may be
      // Tile sizes by area (world units²) and share of the rail: large hero images, medium
      // tiles and small fragments. Each tile keeps its image's own proportion.
      tiers: [
        { name: "large", share: 0.45, area: 0.62 },
        { name: "medium", share: 0.35, area: 0.3 },
        { name: "small", share: 0.2, area: 0.11 },
      ],
      spacing: 0.6,         // gap between neighbours as a share of their half-widths (<1 overlaps)
      spacingJitter: 0.45,  // irregular rhythm along the path
      offsetRadial: 0.1,    // ± share of the radius each tile sits in or out of the path
      offsetLift: 0.2,      // ± world units each tile sits above or below it
      loop: 150,            // s for one full procession at rest
      near: 1,              // brightness of the nearest tile
      far: 0.36,            // ... and the most distant
      falloff: 1.8,         // higher keeps more of the rail bright; dimming only in the distance
      parallax: 18,         // px of camera drift with the pointer
      eyeGuard: true,       // tiles crossing the face in front dip below the eye line
    },

    rail: {
      friction: 2.6,        // 1/s, how quickly a flung rail comes to rest
      maxVelocity: 0.45,    // loops per second, at most
      wheelGain: 1,         // 1 = a wheel/trackpad delta moves the front of the rail by the same px
      clickThreshold: 6,    // px a press may travel and still count as a click
      idleResume: 2.4,      // s after the last interaction before the slow drift returns
      resumeSmoothing: 1.4, // s, the drift fades back in
      seekSmoothing: 0.55,  // s, keyboard focus brings a card round to the front
      hoverPause: 0.35,     // s, the rail eases to a stop under a hovered card
    },

    hover: {
      scale: 1.08,
      lift: 6,              // px towards the top of the screen
      dim: 0.32,            // extra darkening of the other cards (share of their remaining light)
      smoothing: 0.22,      // s
    },

    viewer: {
      open: 0.95,           // s, shared-element flight into the fullscreen layout
      close: 0.85,
      ease: "power3.inOut",
      margin: [72, 6, 84], // px top, vw sides, px bottom
      sideMin: 84,          // px kept clear at each side for the arrows when a project has several slides
      slideOut: 0.28,       // s, the current slide steps aside ...
      slideIn: 0.55,        // ... and the next one settles in
      slideShift: 28,       // px of sideways travel between slides
      maxSlides: 5,
    },

    pointerPace: {
      boost: 1.2,           // extra speed at a brisk pointer
      speedFull: 1400,      // px/s counted as brisk
      smoothing: 0.8,       // s, so the pace swells and settles slowly
    },
  };

  // Projects come from projects.js: { id, title, coverImage, slides[] }
  const PROJECTS = window.BINZ_PROJECTS || [];

  // Geometry of the supplied artwork (head crop)
  const ART = {
    w: 776,
    h: 1215,
    irisBox: 88,
    eyes: [{ cx: 238.6, cy: 519.0 }, { cx: 543.7, cy: 518.8 }],
  };

  const $ = (sel) => document.querySelector(sel);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const damp = (current, target, tau, dt) => current + (target - current) * (1 - Math.exp(-dt / tau));
  const rand = (a, b) => a + Math.random() * (b - a);
  const rad = (d) => (d * Math.PI) / 180;

  // Seeded random so the archive's rhythm is the same on every visit
  function seeded(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const el = {
    body: document.body,
    stage: document.querySelector(".stage"),
    anchor: $("#anchor"),
    headEnter: $("#headEnter"),
    headFloat: $("#headFloat"),
    headFollow: $("#headFollow"),
    headTilt: $("#headTilt"),
    irises: [...document.querySelectorAll(".eye .iris")],
    catches: [...document.querySelectorAll(".eye .catch")],
    reveal: [...document.querySelectorAll("[data-reveal]")],
    archive: $("#archive"),
    space: $("#space"),
    credit: document.querySelector(".credit"),
    label: $("#cardLabel"),
    viewer: $("#viewer"),
    viewerBackdrop: $("#viewerBackdrop"),
    viewerFigure: $("#viewerFigure"),
    viewerImg: $("#viewerImg"),
    viewerShade: $("#viewerShade"),
    viewerUi: [...document.querySelectorAll("[data-viewer-ui]")],
    viewerTitle: $("#viewerTitle"),
    viewerCaption: $("#viewerCaption"),
    viewerCount: $("#viewerCount"),
    viewerPrev: $("#viewerPrev"),
    viewerNext: $("#viewerNext"),
    viewerMeta: $("#viewerMeta"),
    viewerPlaceholder: $("#viewerPlaceholder"),
    viewerPlaceholderLabel: $("#viewerPlaceholderLabel"),
    viewerClose: $("#viewerClose"),
  };

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function preload() {
    const imgs = [...document.querySelectorAll("img")];
    const extra = PROJECTS.map(({ coverImage }) => {
      const img = new Image();
      img.src = coverImage.src;
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

  // Tiles are laid out once along the path. Everything is seeded, so each tile keeps the same
  // size, offset and place in the rhythm on every frame and every visit.
  function buildArchive() {
    const cfg = MOTION.archive;
    const rnd = seeded(20261030);
    el.archive.textContent = "";
    const n = cfg.cards;

    // tier list in the configured proportions, shuffled, with no two small fragments adjacent
    const tiers = [];
    let left = n;
    cfg.tiers.forEach((t, i) => {
      const count = i === cfg.tiers.length - 1 ? left : Math.round(t.share * n);
      for (let j = 0; j < count; j++) tiers.push(t);
      left -= count;
    });
    for (let i = tiers.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
    }
    for (let i = 0; i < n; i++) {
      if (tiers[i].name === "small" && tiers[(i + 1) % n].name === "small") {
        const j = tiers.findIndex((t, k) => t.name !== "small" && tiers[(k + 1) % n].name !== "small" && tiers[(k - 1 + n) % n].name !== "small");
        if (j >= 0) [tiers[(i + 1) % n], tiers[j]] = [tiers[j], tiers[(i + 1) % n]];
      }
    }

    const cards = [];
    for (let i = 0; i < n; i++) {
      const pi = i % PROJECTS.length;
      const project = PROJECTS[pi];
      const { src, width, height } = project.coverImage;
      const aspect = height / width;
      const area = tiers[i].area * (1 + (rnd() - 0.5) * 0.24);
      // very wide banners are capped so a single tile never walls off the head
      const w = Math.min(Math.sqrt(area / aspect), cfg.maxWidth);
      const node = document.createElement("div");
      node.className = "card";
      node.tabIndex = 0;
      node.setAttribute("role", "button");
      node.setAttribute("aria-label", `View project: ${project.title}`);
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      const shade = document.createElement("div");
      shade.className = "card-shade";
      node.append(img, shade);
      el.archive.appendChild(node);
      cards.push({
        node, shade, pi, project, tier: tiers[i].name, u: 0, w, h: w * aspect,
        dr: (rnd() - 0.5) * 2 * cfg.offsetRadial,
        dy: (rnd() - 0.5) * 2 * cfg.offsetLift,
        z: -1, shadeO: -1, hm: 0,
        // last drawn screen box and depth, used for hit testing
        l: 0, t: 0, r: 0, b: 0, zi: 0, behind: false, alpha: 0, shadeV: 0,
      });
    }
    // spacing follows the tiles' own widths, so large images get room and fragments tuck in
    const gaps = cards.map((c, i) => ((c.w + cards[(i + 1) % n].w) / 2) * cfg.spacing * (1 + (rnd() - 0.5) * 2 * cfg.spacingJitter));
    const total = gaps.reduce((a, b) => a + b, 0);
    let u = 0;
    cards.forEach((c, i) => {
      c.u = u / total;
      u += gaps[i];
    });
    return cards;
  }

  function init() {
    const reduced = reducedQuery.matches;
    const cleanup = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanup.push(() => target.removeEventListener(type, fn, opts));
    };
    const ctx = gsap.context(() => {});
    const later = (fn) => ctx.add(fn);

    const cards = buildArchive();

    // Mutable motion state — never triggers layout or rendering on its own
    const state = {
      engage: 0,           // 0..1 blend from entrance into live gaze
      tracking: false,     // pointer drives the gaze once the entrance hands over
      pointer: { x: 0, y: 0, active: false, strength: 1, lastMove: 0 },
      touchTimer: 0,
      idle: { x: 0, y: 0, next: 0 },
      eyes: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
      head: { x: 0, y: 0 },
      time: 0,
      geo: null,
      // archive
      phase: 0.18,         // position of the whole procession along the path (0..1)
      pace: 1,             // speed multiplier (entrance arrival, pointer)
      arrival: 1,
      pointerSpeed: 0,
      lastPointer: null,
      cam: { x: 0, y: 0 },
      reveal: 0,           // archive fade-in, applied per card so the stacking with the head is kept
      // rail interaction
      vel: 0,              // user velocity, loops per second (inertia)
      autoMix: reduced ? 0 : 1, // 0..1 share of the slow drift; any interaction takes it to 0
      autoDir: 1,          // the drift continues in the direction the visitor last sent it
      lastInteract: -Infinity,
      drag: null,
      seek: null,          // target phase while keyboard focus brings a card to the front
      hovered: null,
      focused: null,
      hoverSlow: 0,
      dim: 0,
      viewing: null,       // the card shown fullscreen; the rail is paused meanwhile
      focusTime: -Infinity, // when keyboard focus last moved to a tile
    };

    // ---------- geometry ----------
    function measure() {
      const r = el.stage.getBoundingClientRect();
      const s = r.width / ART.w;
      const comp = MOTION.composition;
      state.geo = {
        scale: s,
        headW: r.width,
        unit: r.width / comp.headScale,
        head: { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height },
        eyes: ART.eyes.map((e) => ({ x: r.left + e.cx * s, y: r.top + e.cy * s })),
        mid: { x: r.left + ((ART.eyes[0].cx + ART.eyes[1].cx) / 2) * s, y: r.top + ART.eyes[0].cy * s },
        // the eye band, kept clear of cards passing in front
        eyeBand: { left: r.left + r.width * 0.16, right: r.left + r.width * 0.84, top: r.top + r.height * 0.36, bottom: r.top + r.height * 0.5 },
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
      state.geo.center = {
        x: state.geo.head.x + (state.geo.vw < 720 ? comp.orbitXCompact : comp.orbitX) * state.geo.unit,
        y: state.geo.head.y + comp.orbitY * state.geo.unit,
      };
      // the nearest point of the path, and how fast it moves across the screen per loop:
      // dragging maps pointer px to phase through this, so the front of the rail follows the hand
      let uFront = 0;
      let zMin = Infinity;
      for (let i = 0; i < 360; i++) {
        project(i / 360, pt);
        if (pt.z < zMin) {
          zMin = pt.z;
          uFront = i / 360;
        }
      }
      // where keyboard focus brings a card: the nearest point that is still comfortably on screen
      let uShow = uFront;
      let zShow = Infinity;
      for (let i = 0; i < 360; i++) {
        project(i / 360, pt);
        const ok = pt.x > state.geo.vw * 0.14 && pt.x < state.geo.vw * 0.86 && pt.y > state.geo.vh * 0.2 && pt.y < state.geo.vh * 0.72;
        if (ok && pt.z < zShow) {
          zShow = pt.z;
          uShow = i / 360;
        }
      }
      state.geo.uShow = uShow;
      const ax = project((uFront + 0.999) % 1, pt).x;
      const bx = project((uFront + 0.001) % 1, pt).x;
      state.geo.uFront = uFront;
      state.geo.dxdu = (bx - ax) / 0.002 || 1;
      for (const c of cards) {
        c.pw = c.w * state.geo.unit;
        c.ph = c.h * state.geo.unit;
        c.node.style.width = `${c.pw.toFixed(1)}px`;
        c.node.style.height = `${c.ph.toFixed(1)}px`;
      }
    }

    // ---------- archive ----------
    // Position on the path for parameter u (0..1): returns screen centre, scale and depth
    function project(u, out, dr = 0, dy = 0) {
      const p = MOTION.path;
      const geo = state.geo;
      const W = geo.unit;
      const th = u * Math.PI * 2;
      const wob = (1 + p.wobble[0] * Math.sin(2 * th + 0.7) + p.wobble[1] * Math.sin(3 * th + 1.9)) * (1 + dr);
      const X0 = p.radiusX * W * wob * Math.cos(th);
      const Z0 = p.radiusZ * W * wob * Math.sin(th);
      const Y = p.lift * W * Math.sin(2.5 * th + 0.4) + dy * W;
      // turn the ellipse in its own plane so near and far sit on a diagonal
      const c = rad(p.yaw);
      const X = X0 * Math.cos(c) - Z0 * Math.sin(c);
      const Z = X0 * Math.sin(c) + Z0 * Math.cos(c);
      // tilt the plane towards the viewer, then roll it in the picture
      const a = rad(p.tilt);
      const Y1 = Y - Z * Math.sin(a);
      const Z1 = Z * Math.cos(a) + Y * Math.sin(a);
      const b = rad(p.roll);
      const X2 = X * Math.cos(b) - Y1 * Math.sin(b);
      const Y2 = X * Math.sin(b) + Y1 * Math.cos(b);
      const f = p.focal * W;
      const k = f / (f + Z1);
      const cx = geo.center.x;
      const cy = geo.center.y;
      out.x = cx + X2 * k;
      out.y = cy + Y2 * k;
      out.k = k;
      out.z = Z1; // positive = behind the head's plane
      out.zMax = Math.max(p.radiusX, p.radiusZ) * W * 1.12 * Math.cos(a);
      return out;
    }

    const pt = { x: 0, y: 0, k: 1, z: 0, zMax: 1 };
    function renderArchive() {
      const cfg = MOTION.archive;
      const H = MOTION.hover;
      const geo = state.geo;
      const band = geo.eyeBand;
      const active = state.hovered || state.focused;
      let labelCard = null;
      for (const c of cards) {
        let u = (c.u + state.phase) % 1;
        if (u < 0) u += 1;
        project(u, pt, c.dr, c.dy);
        const k = pt.k;
        // a touch of camera parallax: near cards drift with the pointer, far ones against it
        const px = pt.x + state.cam.x * (k - 1) * cfg.parallax;
        let py = pt.y + state.cam.y * (k - 1) * cfg.parallax * 0.6;
        // hover: the card comes forward, the others step back a little
        const hm = c.hm;
        const kk = k * (1 + (reduced ? 0 : H.scale - 1) * hm);
        if (!reduced) py -= H.lift * hm;
        const w = c.pw * kk;
        const h = c.ph * kk;
        // depth → brightness: near is clear, far sinks into the dark
        const d = clamp((pt.z + pt.zMax) / (2 * pt.zMax), 0, 1); // 0 near .. 1 far
        const bright = cfg.near + (cfg.far - cfg.near) * Math.pow(d, cfg.falloff);
        const base = 1 - bright;
        const dimmed = base + (1 - base) * H.dim * state.dim;
        const shadeV = dimmed * (1 - hm);
        // Tiles in front may cross the lower face, but not the eyes: a tile passing in front
        // dips just below the eye line while it crosses the face, eased by how much of it is
        // over the eyes horizontally, then rejoins its path. It stays solid throughout.
        const alpha = state.reveal;
        if (cfg.eyeGuard && pt.z < 0) {
          const ox = Math.min(px + w / 2, band.right) - Math.max(px - w / 2, band.left);
          if (ox > 0) {
            const top = py - h / 2;
            const need = band.bottom + 4 - top;
            const bottomOfTile = py + h / 2;
            // only tiles whose body is below the eyes are pushed down; tiles that pass mostly
            // above them (rare at the front) are left alone
            if (need > 0 && bottomOfTile > band.bottom) {
              const f = clamp(ox / Math.min(w, band.right - band.left), 0, 1);
              const g = clamp((py - band.top) / (h * 0.3), 0, 1); // fades out for tiles riding high
              py += Math.min(need, h * 0.7) * f * f * (3 - 2 * f) * g;
            }
          }
        }
        c.node.style.transform = `translate3d(${(px - c.pw / 2).toFixed(2)}px, ${(py - c.ph / 2).toFixed(2)}px, 0) scale(${kk.toFixed(4)})`;
        const so = shadeV.toFixed(3);
        if (so !== c.shadeO) {
          c.shadeO = so;
          c.shade.style.opacity = so;
        }
        const op = alpha.toFixed(3);
        if (op !== c.op) {
          c.op = op;
          c.node.style.opacity = op;
        }
        // stacking: the head sits at 2000, nearer cards above it, farther below.
        // A hovered card rises to the top of its own side, so the head always stays visible.
        const behind = pt.z > 0;
        let z = 2000 - 2 * Math.round(pt.z);
        if (hm > 0.5) z = behind ? 1999 : 9000;
        if (z !== c.z) {
          c.z = z;
          c.node.style.zIndex = z;
        }
        c.l = px - w / 2;
        c.r = px + w / 2;
        c.t = py - h / 2;
        c.b = py + h / 2;
        c.zi = z;
        c.behind = behind;
        c.alpha = alpha;
        c.shadeV = shadeV;
        if (c === active) labelCard = c;
      }
      placeLabel(labelCard);
    }

    // "View project" sits just under the hovered card (or above it near the bottom edge)
    let labelShown = -1;
    function placeLabel(c) {
      const o = c && c !== state.viewing ? c.hm * Math.min(1, c.alpha * 1.5) : 0;
      const ov = o.toFixed(3);
      if (ov !== labelShown) {
        labelShown = ov;
        el.label.style.opacity = ov;
      }
      if (!c || o <= 0) return;
      const lh = el.label.offsetHeight || 14;
      const below = c.b + 12 + lh < state.geo.vh - 8;
      const x = clamp(c.l, 12, state.geo.vw - el.label.offsetWidth - 12);
      const y = below ? c.b + 12 : c.t - 12 - lh;
      el.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }

    // Topmost card under a screen point. Cards behind the head are hidden by its silhouette,
    // so they cannot be hovered or opened through the face.
    function hitTest(x, y) {
      const head = state.geo.head;
      const inHead = ((x - head.x) / (head.w * 0.44)) ** 2 + ((y - head.y + head.h * 0.02) / (head.h * 0.49)) ** 2 < 1;
      let best = null;
      for (const c of cards) {
        if (c.alpha < 0.35) continue;
        if (x < c.l || x > c.r || y < c.t || y > c.b) continue;
        if (c.behind && inHead) continue;
        if (!best || c.zi > best.zi) best = c;
      }
      return best;
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
      if (state.tracking && state.pointer.active) {
        return { point: state.pointer, strength: state.pointer.strength, head: state.pointer.strength };
      }
      return null;
    }

    function updateIdle(now) {
      const ig = MOTION.idleGlance;
      const idleFor = now - state.pointer.lastMove;
      if (reduced || !state.tracking || (state.pointer.active && idleFor < ig.after)) {
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

      // ----- head (subtle parallax) -----
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
      const tauHead = t ? h.smoothing : h.returnSmoothing;
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

      // ----- archive: autonomous procession; the pointer only swells its pace -----
      const pp = MOTION.pointerPace;
      state.pointerSpeed = damp(state.pointerSpeed, 0, 0.25, dt);
      const brisk = clamp(state.pointerSpeed / pp.speedFull, 0, 1);
      state.pace = damp(state.pace, 1 + brisk * pp.boost, pp.smoothing, dt);
      const R = MOTION.rail;
      const busy = state.drag || state.seek !== null || Math.abs(state.vel) > 0.004;
      const idle = !busy && now - state.lastInteract > R.idleResume;
      // drift, hover-slow and highlights are frozen while the gallery is open, so the rail
      // comes back exactly as it was left
      if (!state.viewing) state.autoMix = damp(state.autoMix, idle && !reduced ? 1 : 0, idle ? R.resumeSmoothing : 0.12, dt);

      // hover: only for a resting pointer, never mid-drag or while the rail is coasting
      // a resting mouse never steals the highlight from a keyboard-focused tile; moving it does
      const mouseLed = state.pointer.lastMove > state.focusTime;
      if (!state.viewing && !state.drag && mouseLed && state.pointer.active && state.pointer.strength === 1 && Math.abs(state.vel) < 0.03) {
        setHovered(hitTest(state.pointer.x, state.pointer.y));
      } else if (state.hovered && (state.drag || state.viewing)) {
        setHovered(null);
      }
      const active = state.hovered || state.focused;
      if (!state.viewing) state.hoverSlow = damp(state.hoverSlow, active ? 1 : 0, R.hoverPause, dt);
      const hs = reduced ? 0.08 : MOTION.hover.smoothing;
      if (!state.viewing) {
        // frozen while the viewer is open, so the card returns to exactly where it left
        state.dim = damp(state.dim, active ? 1 : 0, hs, dt);
        for (const c of cards) c.hm = damp(c.hm, c === active ? 1 : 0, hs, dt);
      }

      if (!state.viewing && !state.drag) {
        if (state.seek !== null) {
          const dPh = wrap(state.seek - state.phase);
          state.phase += dPh * (1 - Math.exp(-dt / (reduced ? 0.12 : R.seekSmoothing)));
          if (Math.abs(dPh) < 1e-4) state.seek = null;
        } else {
          state.vel *= Math.exp(-R.friction * dt);
          if (Math.abs(state.vel) < 1e-5) state.vel = 0;
          const drift = (1 / MOTION.archive.loop) * state.pace * state.arrival * state.autoMix * state.autoDir * (1 - state.hoverSlow);
          state.phase += (drift + state.vel) * dt;
        }
        state.phase = ((state.phase % 1) + 1) % 1;
      }
      if (!state.viewing) {
        state.cam.x = damp(state.cam.x, hX, 0.8, dt);
        state.cam.y = damp(state.cam.y, hY, 0.8, dt);
      }
      renderArchive();
    }

    // ---------- rail interaction ----------
    const wrap = (v) => v - Math.round(v);

    function setHovered(c) {
      if (c === state.hovered) return;
      state.hovered = c;
      el.body.classList.toggle("is-over-card", !!c);
    }

    function interacted() {
      state.lastInteract = state.time;
      state.seek = null;
    }

    function onRailDown(e) {
      if (state.viewing || state.drag) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      interacted();
      state.vel = 0; // catching a coasting rail stops it
      state.drag = {
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        x: e.clientX,
        t: e.timeStamp,
        v: 0,
        moved: false,
        target: hitTest(e.clientX, e.clientY),
      };
      try {
        el.space.setPointerCapture(e.pointerId);
      } catch (_) {}
    }

    function onRailMove(e) {
      const d = state.drag;
      if (!d || e.pointerId !== d.id) return;
      if (!d.moved) {
        if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < MOTION.rail.clickThreshold) return;
        d.moved = true;
        setHovered(null);
        el.body.classList.add("is-dragging");
      }
      const dts = Math.max((e.timeStamp - d.t) / 1000, 0.001);
      const dPhase = (e.clientX - d.x) / state.geo.dxdu;
      state.phase = (((state.phase + dPhase) % 1) + 1) % 1;
      // velocity estimate, weighted towards the latest movement
      d.v = d.v * 0.25 + (dPhase / dts) * 0.75;
      d.x = e.clientX;
      d.t = e.timeStamp;
      interacted();
    }

    function endDrag(e, cancelled) {
      const d = state.drag;
      if (!d || (e && e.pointerId !== d.id)) return;
      state.drag = null;
      el.body.classList.remove("is-dragging");
      try {
        el.space.releasePointerCapture(d.id);
      } catch (_) {}
      interacted();
      if (cancelled) return;
      if (d.moved) {
        // fling: keep the release velocity unless the hand had already stopped
        const stale = e.timeStamp - d.t > 90;
        const maxV = MOTION.rail.maxVelocity;
        state.vel = reduced || stale ? 0 : clamp(d.v, -maxV, maxV);
        if (state.vel) state.autoDir = Math.sign(state.vel);
      } else {
        const c = hitTest(e.clientX, e.clientY);
        if (c && c === d.target) openViewer(c, false);
      }
    }

    function onWheel(e) {
      if (state.viewing) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? state.geo.vh : 1;
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit;
      // scrolling forwards moves the front of the rail the same distance, with inertia
      const dPhase = (-delta * MOTION.rail.wheelGain) / state.geo.dxdu;
      interacted();
      if (reduced) {
        state.phase = (((state.phase + dPhase) % 1) + 1) % 1;
        return;
      }
      const maxV = MOTION.rail.maxVelocity;
      state.vel = clamp(state.vel + dPhase * MOTION.rail.friction, -maxV, maxV);
      if (state.vel) state.autoDir = Math.sign(state.vel);
    }

    // keyboard: focusing a card brings it round to the front; Enter or Space opens it
    let restoringFocus = false;
    function onCardFocus(c) {
      if (restoringFocus || !c.node.matches(":focus-visible") || state.viewing) return;
      state.focused = c;
      state.focusTime = state.time;
      state.vel = 0;
      state.lastInteract = state.time;
      state.seek = state.phase + wrap(state.geo.uShow - c.u - state.phase);
    }
    function onCardBlur(c) {
      if (state.focused === c) state.focused = null;
    }
    function onCardKey(e, c) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      openViewer(c, true);
    }

    // ---------- fullscreen viewer: shared-element flight from the card ----------
    let viewerTl = null;
    let openedByKey = false;

    // The gallery: one reusable viewer driven entirely by the project's data
    const gallery = { project: null, slides: [], index: 0, shownSrc: "", tl: null };

    function gallerySlides(project) {
      // the cover is always slide 1; the project's other real images follow, up to five
      const cover = project.coverImage;
      // placeholder slots take the cover's proportions, so the frame keeps its shape
      const rest = (project.slides || [])
        .filter((sl) => sl && (sl.placeholder || (sl.src && sl.src !== cover.src)))
        .map((sl) => (sl.placeholder ? { ...sl, width: cover.width, height: cover.height, alt: sl.label } : sl));
      const first = (project.slides || []).find((sl) => sl && sl.src === cover.src) || cover;
      const slides = [first, ...rest].slice(0, MOTION.viewer.maxSlides);
      // warm every slide so switching never waits on the network or a decode
      slides.forEach((sl) => {
        if (sl.placeholder) return;
        const img = new Image();
        img.src = sl.src;
        img.decode && img.decode().catch(() => {});
      });
      return slides;
    }

    // contain-fit an image (by its width/height) into the viewer, leaving room for the UI
    function viewerLayout(image) {
      const V = MOTION.viewer;
      const [top, side, bottom] = V.margin;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let sx = (side / 100) * vw;
      sx = Math.max(sx, V.sideMin);
      const aw = vw - sx * 2;
      const ah = vh - top - bottom;
      const s = Math.min(aw / image.width, ah / image.height);
      const w = image.width * s;
      const h = image.height * s;
      return { x: (vw - w) / 2, y: top + (ah - h) / 2, w, h };
    }

    // where the card is on screen right now, expressed as a transform of the viewer figure
    function cardPose(c, fit) {
      const r = c.node.getBoundingClientRect();
      return { x: r.left, y: r.top, scale: r.width / fit.w };
    }

    const pad2 = (n) => String(n).padStart(2, "0");

    function setMeta() {
      const sl = gallery.slides[gallery.index];
      const multi = gallery.slides.length > 1;
      el.viewerTitle.textContent = gallery.project.title;
      el.viewerCaption.textContent = sl.caption || "";
      el.viewerCaption.hidden = !sl.caption;
      el.viewerCount.textContent = `${pad2(gallery.index + 1)} / ${pad2(gallery.slides.length)}`;
      el.viewerImg.alt = sl.alt || "";
      // the arrows are always shown; with a single image they rest, dimmed, until more are added
      el.viewerPrev.disabled = !multi;
      el.viewerNext.disabled = !multi;
    }

    // put an image into the figure at its fitted place (instant; the figure is hidden or still)
    function placeImage(image, extra = {}) {
      const fit = viewerLayout(image);
      if (image.placeholder) {
        el.viewerImg.hidden = true;
        el.viewerPlaceholder.hidden = false;
        el.viewerPlaceholderLabel.textContent = image.label;
        gallery.shownSrc = `placeholder:${image.label}`;
      } else {
        el.viewerPlaceholder.hidden = true;
        el.viewerImg.hidden = false;
        el.viewerImg.src = image.src;
        gallery.shownSrc = image.src;
      }
      gsap.set(el.viewerFigure, { x: fit.x, y: fit.y, width: fit.w, height: fit.h, scale: 1, ...extra });
      return fit;
    }

    // restrained slide change: the current image steps aside and fades, the next settles in
    function goTo(i, dir) {
      if (!state.viewing || viewerTl.data === "closing" || viewerTl.isActive()) return;
      const n = gallery.slides.length;
      if (n < 2) return;
      const next = ((i % n) + n) % n;
      if (next === gallery.index) return;
      const V = MOTION.viewer;
      const shift = reduced ? 0 : V.slideShift * dir;
      gallery.index = next;
      const sl = gallery.slides[next];
      gallery.tl && gallery.tl.progress(1).kill();
      gallery.tl = gsap
        .timeline()
        .to(el.viewerFigure, { opacity: 0, x: `-=${shift}`, duration: V.slideOut, ease: "power2.in" })
        .to(el.viewerMeta, { opacity: 0, duration: V.slideOut * 0.8, ease: "power1.in" }, 0)
        .add(() => {
          const fit = placeImage(sl, { opacity: 0 });
          gsap.set(el.viewerFigure, { x: fit.x + shift });
          setMeta();
        })
        .to(el.viewerFigure, { opacity: 1, x: () => viewerLayout(sl).x, duration: V.slideIn, ease: "power3.out" })
        .to(el.viewerMeta, { opacity: 1, duration: V.slideIn, ease: "power2.out" }, "<0.1");
    }

    // keyboard users land on Close; after a click the dialog itself holds focus (no ring)
    function focusViewer() {
      (openedByKey ? el.viewerClose : el.viewer).focus({ preventScroll: true });
    }

    function openViewer(c, byKey) {
      if (state.viewing) return;
      const V = MOTION.viewer;
      state.viewing = c;
      openedByKey = byKey;
      gallery.wasFocused = state.focused === c;
      state.seek = null; // the rail holds exactly where it is while the gallery is open
      state.vel = 0;
      setHovered(null);
      state.focused = null;
      gallery.project = c.project;
      gallery.slides = gallerySlides(c.project);
      gallery.index = 0;
      setMeta();
      // the flight always carries the tile's own image, so it leaves the rail seamlessly
      const cover = c.project.coverImage;
      const fit = placeImage(cover);
      gsap.set(el.viewerFigure, { transformOrigin: "0 0" });
      el.viewer.hidden = false;
      el.space.inert = true;
      el.credit.inert = true;
      el.body.classList.add("is-viewing");
      viewerTl && viewerTl.kill();
      // then, if slide 1 is a different image from the cover, settle onto it
      const toFirst = () => {
        if (gallery.slides[0].src !== gallery.shownSrc) {
          gallery.index = -1;
          goTo(0, 1);
        }
        focusViewer();
      };
      if (reduced) {
        gsap.set(el.viewerFigure, { opacity: 0 });
        gsap.set(el.viewerShade, { opacity: 0 });
        viewerTl = gsap
          .timeline({ onComplete: toFirst })
          .fromTo([el.viewerBackdrop, el.viewerFigure, ...el.viewerUi], { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" });
        return;
      }
      const from = cardPose(c, fit);
      gsap.set(el.viewerFigure, { ...from, opacity: c.alpha });
      gsap.set(el.viewerShade, { opacity: c.shadeV });
      gsap.set(el.viewerBackdrop, { opacity: 0 });
      gsap.set(el.viewerUi, { opacity: 0, y: 6 });
      c.node.style.visibility = "hidden";
      viewerTl = gsap
        .timeline({ onComplete: toFirst })
        .to(el.viewerBackdrop, { opacity: 1, duration: V.open * 0.7, ease: "power2.out" }, 0)
        .to(el.viewerFigure, { x: fit.x, y: fit.y, scale: 1, opacity: 1, duration: V.open, ease: V.ease }, 0)
        .to(el.viewerShade, { opacity: 0, duration: V.open * 0.75, ease: "power2.out" }, 0.05)
        .to(el.viewerUi, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.06 }, V.open * 0.7)
        .add(focusViewer, V.open);
    }

    function closeViewer() {
      const c = state.viewing;
      if (!c || (viewerTl && viewerTl.data === "closing")) return;
      const V = MOTION.viewer;
      viewerTl && viewerTl.kill();
      gallery.tl && gallery.tl.progress(1).kill();
      const done = () => {
        c.node.style.visibility = "";
        el.viewer.hidden = true;
        el.space.inert = false;
        el.credit.inert = false;
        el.body.classList.remove("is-viewing");
        state.viewing = null;
        state.lastInteract = state.time;
        // hand focus back without re-seeking, and restore the tile's focus highlight as it was
        if (openedByKey) {
          restoringFocus = true;
          c.node.focus({ preventScroll: true });
          restoringFocus = false;
          if (gallery.wasFocused) {
            state.focused = c;
            state.focusTime = state.time;
          }
        }
        else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      };
      if (reduced) {
        viewerTl = gsap.timeline({ onComplete: done }).to([el.viewerBackdrop, el.viewerFigure, ...el.viewerUi], { opacity: 0, duration: 0.25, ease: "power1.in" });
        viewerTl.data = "closing";
        return;
      }
      // the rail has been paused, so the tile is exactly where it was; fly back into it,
      // first returning to the cover image if another slide is showing
      renderArchive();
      const cover = c.project.coverImage;
      const to = cardPose(c, viewerLayout(cover));
      viewerTl = gsap.timeline({ onComplete: done });
      viewerTl.data = "closing";
      let t = 0;
      viewerTl.to(el.viewerUi, { opacity: 0, y: 6, duration: 0.25, ease: "power2.in" }, 0);
      if (gallery.shownSrc !== cover.src) {
        viewerTl
          .to(el.viewerFigure, { opacity: 0, duration: 0.24, ease: "power2.in" }, 0)
          .add(() => placeImage(cover, { opacity: 0 }), 0.24)
          .to(el.viewerFigure, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0.26);
        t = 0.56;
      }
      viewerTl
        .to(el.viewerFigure, { ...to, opacity: c.alpha, duration: V.close, ease: V.ease }, t + 0.05)
        .to(el.viewerShade, { opacity: c.shadeV, duration: V.close * 0.8, ease: "power2.in" }, t + 0.05 + V.close * 0.2)
        .to(el.viewerBackdrop, { opacity: 0, duration: V.close * 0.75, ease: "power2.inOut" }, t + 0.05 + V.close * 0.25);
    }

    function onKey(e) {
      if (!state.viewing) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeViewer();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(gallery.index + 1, 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(gallery.index - 1, -1);
      } else if (e.key === "Tab") {
        // keep focus inside the viewer while it is open
        e.preventDefault();
        const list = [el.viewerPrev, el.viewerNext, el.viewerClose].filter((b) => !b.disabled);
        const at = list.indexOf(document.activeElement);
        const step = e.shiftKey ? -1 : 1;
        list[(at + step + list.length) % list.length].focus({ preventScroll: true });
      }
    }

    // ---------- input ----------
    function onPointerMove(e) {
      if (e.pointerType === "touch") return;
      const lp = state.lastPointer;
      if (lp) {
        const dts = Math.max((e.timeStamp - lp.t) / 1000, 0.004);
        const v = Math.min(Math.hypot(e.clientX - lp.x, e.clientY - lp.y) / dts, 4000);
        state.pointerSpeed = Math.max(state.pointerSpeed, damp(state.pointerSpeed, v, 0.12, dts));
      }
      state.lastPointer = { x: e.clientX, y: e.clientY, t: e.timeStamp };
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
      state.lastPointer = null;
      setHovered(null);
    }
    function onBlur() {
      state.pointer.active = false;
      state.lastPointer = null;
      endDrag(null, true);
    }

    let resizeRaf = 0;
    function onResize() {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        measure();
        renderArchive();
        // keep the open image fitted; its flight back is measured afresh on close
        if (state.viewing && !(viewerTl && viewerTl.isActive())) {
          gallery.tl && gallery.tl.progress(1).kill();
          const sl = gallery.slides[gallery.index] || gallery.project.coverImage;
          const fit = viewerLayout(sl);
          gsap.set(el.viewerFigure, { x: fit.x, y: fit.y, width: fit.w, height: fit.h, scale: 1 });
        }
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
          gsap.set(el.headEnter, { y: 0, scale: 1 });
          gsap.set(el.reveal, { y: 0 });
          el.body.classList.remove("is-loading");
          gsap.fromTo([el.headEnter, ...el.reveal], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out" });
          gsap.to(state, { reveal: 1, duration: 0.6, ease: "power1.out", onUpdate: renderArchive });
          if (!reduced) {
            gsap.to(state, { engage: 1, duration: 0.8, ease: "power2.inOut" });
            state.tracking = true;
            startFloat();
          }
          return;
        }
        gsap.set(el.headEnter, { autoAlpha: 0, y: en.rise, scale: en.fromScale, transformOrigin: "50% 60%" });
        gsap.set(el.reveal, { autoAlpha: 0, y: 8 });
        el.body.classList.remove("is-loading");
        state.arrival = en.arrivalSpeed;

        const tl = gsap.timeline();
        tl.to(el.headEnter, { y: 0, scale: 1, duration: en.headDuration, ease: `back.out(${en.overshoot})` }, en.headAt)
          .to(el.headEnter, { autoAlpha: 1, duration: en.headDuration * 0.6, ease: "power1.out" }, en.headAt)
          .add(startFloat, en.headAt + en.headDuration * 0.85)
          // the archive drifts in from the dark, arriving briskly and settling into its pace
          .to(state, { reveal: 1, duration: en.archiveDuration, ease: "power2.out" }, en.archiveAt)
          .to(state, { arrival: 1, duration: en.archiveDuration + 0.8, ease: "power3.out" }, en.archiveAt)
          .to(el.reveal, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: en.textStagger }, en.textAt)
          .to(state, { engage: 1, duration: 0.9, ease: "power2.inOut" }, en.handoverAt - 0.4)
          .add(() => (state.tracking = true), en.handoverAt);
      });
    }

    // ---------- wire up ----------
    measure();
    renderArchive();

    on(window, "resize", onResize);
    on(el.space, "pointerdown", onRailDown);
    on(el.space, "pointermove", onRailMove);
    on(el.space, "pointerup", (e) => endDrag(e, false));
    on(el.space, "pointercancel", (e) => endDrag(e, true));
    on(el.space, "lostpointercapture", (e) => state.drag && e.pointerId === state.drag.id && endDrag(e, true));
    on(el.space, "wheel", onWheel, { passive: false });
    on(el.space, "dragstart", (e) => e.preventDefault());
    on(document, "keydown", onKey);
    on(el.viewerClose, "click", closeViewer);
    on(el.viewerBackdrop, "click", closeViewer);
    on(el.viewerPrev, "click", () => goTo(gallery.index - 1, -1));
    on(el.viewerNext, "click", () => goTo(gallery.index + 1, 1));
    cards.forEach((c) => {
      on(c.node, "focus", () => onCardFocus(c));
      on(c.node, "blur", () => onCardBlur(c));
      on(c.node, "keydown", (e) => onCardKey(e, c));
    });
    // the rail, hover and viewer run under reduced motion too; only drift, float and gaze stay off
    gsap.ticker.add(tick);
    cleanup.push(() => gsap.ticker.remove(tick));
    {
      on(window, "pointermove", onPointerMove, { passive: true });
      on(window, "pointerdown", onTouch, { passive: true });
      on(window, "pointermove", onTouch, { passive: true });
      on(window, "pointerup", onTouchEnd, { passive: true });
      on(window, "pointercancel", onTouchEnd, { passive: true });
      on(document, "mouseout", onLeave);
      on(window, "blur", onBlur);
      on(document, "visibilitychange", onVisibility);
    }

    let alive = true;
    preload().then(() => alive && entrance());
    inspect = () => ({
      phase: +state.phase.toFixed(5), vel: +state.vel.toFixed(4), autoMix: +state.autoMix.toFixed(3),
      hovered: state.hovered ? cards.indexOf(state.hovered) : -1, viewing: state.viewing ? cards.indexOf(state.viewing) : -1, slide: gallery.index, shown: gallery.shownSrc,
      dxdu: Math.round(state.geo.dxdu),
      cards: cards.map((c) => ({ tier: c.tier, h: c.b - c.t, x: (c.l + c.r) / 2, y: (c.t + c.b) / 2, w: c.r - c.l, z: c.zi, a: c.alpha, behind: c.behind, hm: +c.hm.toFixed(2) })),
      focused: state.focused ? cards.indexOf(state.focused) : -1, active: [...document.querySelectorAll('.card')].indexOf(document.activeElement),
    });

    return function destroy() {
      alive = false;
      cleanup.forEach((fn) => fn());
      clearTimeout(state.touchTimer);
      cancelAnimationFrame(resizeRaf);
      floatTween && floatTween.kill();
      ctx.revert();
      gsap.killTweensOf([el.headFloat, el.headEnter, state, ...el.reveal]);
      gallery.tl && gallery.tl.kill();
      gsap.set([el.headFollow, el.headTilt, el.headFloat, ...el.irises, ...el.catches], { clearProps: "transform" });
      gsap.set([el.headEnter, ...el.reveal], { clearProps: "all" });
      el.archive.textContent = "";
      viewerTl && viewerTl.kill();
      el.viewer.hidden = true;
      el.space.inert = false;
      el.credit.inert = false;
      el.body.classList.remove("is-viewing", "is-dragging", "is-over-card");
      gsap.globalTimeline.resume();
    };
  }

  let entrancePlayed = false; // the opening plays once per page load
  let inspect = () => null;   // read-only snapshot for tuning
  let destroy = init();
  // Re-initialise if reduced motion changes while the page is open
  const onEnvChange = () => {
    destroy();
    destroy = init();
  };
  reducedQuery.addEventListener ? reducedQuery.addEventListener("change", onEnvChange) : reducedQuery.addListener(onEnvChange);

  // Exposed for tuning in the console, e.g. binzSpace.motion.path.tilt = 34
  window.binzSpace = { motion: MOTION, projects: PROJECTS, inspect: () => inspect(), destroy: () => destroy() };
})();

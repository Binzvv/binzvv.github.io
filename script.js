/* Binz Tamang — opener
 * Eyes notice the pointer first; the head follows slightly behind.
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
      buttonStrength: 0.45, // how far the head follows a glance at the button
    },
    float: { amplitude: 4, period: 6 },          // px peak-to-peak, s per cycle
    idleGlance: { after: 3.5, every: [2.4, 5.2], range: 0.22 }, // range is normalised gaze
    entrance: { rise: 35, fromScale: 0.96, duration: 1.2, overshoot: 1.1 },
    clouds: { speed: 7, parallax: 7 },           // px/s at depth 1, px of pointer parallax
    trail: {
      threshold: 90,        // px of pointer travel between images
      travel: 0.9,          // s for an image to glide from the previous spot to the pointer
      hold: 0.45,           // s fully visible before it leaves
      out: 0.7,             // s to shrink and fade away
      tilt: 6,              // deg of random rotation
      pool: 10,             // reusable nodes
    },
  };

  // The CTA reads "Coming soon" for now; flip this to wire it to the projects section again
  const WORK_ENABLED = false;

  // Trail images, cropped from the artwork
  const TRAIL_IMAGES = ["star", "eye", "heart", "septum", "flower", "earrings", "cloud"].map((n) => `assets/trail-${n}.webp`);

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
  const damp = (current, target, tau, dt) => current + (target - current) * (1 - Math.exp(-dt / tau));
  const rand = (a, b) => a + Math.random() * (b - a);

  const el = {
    body: document.body,
    intro: $("#intro"),
    stage: document.querySelector(".stage"),
    headEnter: $("#headEnter"),
    headFloat: $("#headFloat"),
    headFollow: $("#headFollow"),
    headTilt: $("#headTilt"),
    irises: [...document.querySelectorAll(".eye .iris")],
    catches: [...document.querySelectorAll(".eye .catch")],
    reveal: [...document.querySelectorAll("[data-reveal]")],
    explore: $("#explore"),
    work: $("#work"),
    workTitle: $("#workTitle"),
    workItems: [...document.querySelectorAll("[data-work]")],
    back: $("#back"),
    clouds: $("#clouds"),
    trail: $("#trail"),
  };

  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function preload() {
    const imgs = [...document.querySelectorAll("img")];
    const sprites = Object.keys(CLOUD_SPRITES)
      .map((id) => `assets/cloud-${id}.webp`)
      .concat(TRAIL_IMAGES)
      .map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
    const all = imgs.concat(sprites).map((img) =>
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

  function init() {
    const reduced = reducedQuery.matches;
    const cleanup = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanup.push(() => target.removeEventListener(type, fn, opts));
    };

    const clouds = buildClouds();

    // Mutable motion state — never triggers layout or rendering on its own
    const state = {
      engage: 0,           // 0..1 blend from entrance into live tracking
      pointer: { x: 0, y: 0, active: false, strength: 1, lastMove: 0 },
      touchTimer: 0,
      button: null,        // {x, y} while the CTA is hovered/focused
      idle: { x: 0, y: 0, next: 0 },
      eyes: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
      head: { x: 0, y: 0 },
      time: 0,
      geo: null,
      view: "intro",
    };

    function measure() {
      const r = el.stage.getBoundingClientRect();
      const s = r.width / ART.w;
      state.geo = {
        scale: s,
        headW: r.width,
        eyes: ART.eyes.map((e) => ({ x: r.left + e.cx * s, y: r.top + e.cy * s })),
        mid: { x: r.left + ((ART.eyes[0].cx + ART.eyes[1].cx) / 2) * s, y: r.top + ART.eyes[0].cy * s },
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
      for (const c of clouds) {
        c.width = c.w * s * c.s * 1.35;
        c.node.style.width = `${c.width}px`;
      }
    }

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

    function currentTarget(now) {
      if (state.button) return { point: state.button, strength: 1, head: MOTION.head.buttonStrength };
      if (state.pointer.active) {
        return { point: state.pointer, strength: state.pointer.strength, head: state.pointer.strength };
      }
      return null;
    }

    function updateIdle(now) {
      const ig = MOTION.idleGlance;
      const idleFor = now - state.pointer.lastMove;
      if (reduced || state.button || (state.pointer.active && idleFor < ig.after)) {
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
      const t = currentTarget(now);
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
        const rx = ((t.point.x - geo.mid.x) / (geo.vw * 0.5 * h.reach));
        const ry = ((t.point.y - geo.mid.y) / (geo.vh * 0.5 * h.reach));
        // soft saturation keeps the head calm near its limits
        hx = (rx / Math.sqrt(1 + rx * rx)) * Math.SQRT2;
        hy = (ry / Math.sqrt(1 + ry * ry)) * Math.SQRT2;
        hx = clamp(hx, -1, 1) * t.head;
        hy = clamp(hy, -1, 1) * t.head;
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

    // ---------- image trail ----------
    const trail = { nodes: [], next: 0, img: 0, z: 1, last: null, ready: false };
    if (!reduced) {
      el.trail.textContent = "";
      for (let i = 0; i < MOTION.trail.pool; i++) {
        const node = document.createElement("div");
        node.className = "trail-item";
        const img = document.createElement("img");
        img.alt = "";
        img.decoding = "async";
        node.appendChild(img);
        el.trail.appendChild(node);
        trail.nodes.push({ node, img });
      }
    }

    function spawnTrail(x, y) {
      const cfg = MOTION.trail;
      const item = trail.nodes[trail.next];
      trail.next = (trail.next + 1) % trail.nodes.length;
      item.img.src = TRAIL_IMAGES[trail.img];
      trail.img = (trail.img + 1) % TRAIL_IMAGES.length;
      const w = item.node.offsetWidth;
      const h = item.node.offsetHeight;
      const from = trail.last;
      gsap.killTweensOf(item.node);
      ctx.add(() => {
        gsap
          .timeline()
          .set(item.node, {
            x: from.x - w / 2,
            y: from.y - h / 2,
            rotation: rand(-cfg.tilt, cfg.tilt),
            scale: 0.82,
            opacity: 0,
            zIndex: trail.z++,
          })
          .to(item.node, { x: x - w / 2, y: y - h / 2, duration: cfg.travel, ease: "expo.out" }, 0)
          .to(item.node, { opacity: 1, duration: 0.2, ease: "power1.out" }, 0)
          .to(item.node, { scale: 1, duration: 0.5, ease: "expo.out" }, 0)
          .to(item.node, { opacity: 0, scale: 0.35, duration: cfg.out, ease: "power2.in" }, cfg.hold);
      });
    }

    function updateTrail(x, y) {
      if (reduced || !trail.ready || state.view !== "intro") return;
      if (!trail.last) {
        trail.last = { x, y };
        return;
      }
      const dx = x - trail.last.x;
      const dy = y - trail.last.y;
      if (dx * dx + dy * dy < MOTION.trail.threshold ** 2) return;
      spawnTrail(x, y);
      trail.last = { x, y };
    }

    // ---------- input ----------
    function onPointerMove(e) {
      if (e.pointerType === "touch") return;
      updateTrail(e.clientX, e.clientY);
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
      if (!e.relatedTarget) state.pointer.active = false;
    }
    function onBlur() {
      state.pointer.active = false;
      state.button = null;
    }
    function lookAtButton() {
      const r = el.explore.getBoundingClientRect();
      state.button = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function onButtonEnter(e) {
      if (e.pointerType === "touch") return;
      lookAtButton();
    }
    function onButtonLeave() {
      if (document.activeElement !== el.explore || !el.explore.matches(":focus-visible")) state.button = null;
    }
    function onButtonFocus() {
      if (el.explore.matches(":focus-visible")) lookAtButton();
    }
    function onButtonBlur() {
      state.button = null;
    }

    let resizeRaf = 0;
    function onResize() {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        measure();
        if (reduced) renderClouds(0);
        if (state.button) lookAtButton();
      });
    }

    function onVisibility() {
      if (document.hidden) gsap.globalTimeline.pause();
      else gsap.globalTimeline.resume();
    }

    // ---------- choreography ----------
    const ctx = gsap.context(() => {});
    let floatTween = null;

    function startFloat() {
      if (reduced || floatTween) return;
      const a = MOTION.float.amplitude / 2;
      gsap.set(el.headFloat, { y: a });
      floatTween = gsap.to(el.headFloat, {
        y: -a,
        duration: MOTION.float.period / 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }

    function showWork(instant) {
      el.work.hidden = false;
      el.intro.inert = true;
      el.intro.setAttribute("aria-hidden", "true");
      if (instant) {
        gsap.set(el.workItems, { opacity: 1, y: 0 });
        el.workTitle.focus({ preventScroll: true });
        return null;
      }
      return gsap.fromTo(
        el.workItems,
        { opacity: 0, y: reduced ? 0 : 16 },
        {
          opacity: 1,
          y: 0,
          duration: reduced ? 0.35 : 0.8,
          ease: "power3.out",
          stagger: reduced ? 0 : 0.07,
          onStart: () => el.workTitle.focus({ preventScroll: true }),
        }
      );
    }

    let transition = null;
    function explore() {
      if (state.view !== "intro") return;
      state.view = "work";
      state.button = null;
      transition && transition.kill();
      ctx.add(() => {
        transition = gsap.timeline();
        if (reduced) {
          transition
            .to(el.intro, { autoAlpha: 0, duration: 0.35, ease: "power1.out" })
            .add(() => showWork());
          return;
        }
        const lift = state.geo.vh * 0.55 + el.stage.offsetHeight;
        transition
          .to(state, { engage: 0, duration: 0.6, ease: "power2.out" }, 0)
          .to(el.reveal, { autoAlpha: 0, y: -8, duration: 0.4, ease: "power2.in", stagger: { each: 0.05, from: "end" } }, 0)
          // eyes glance up first, then the head rises out of frame
          .to(el.headEnter, { y: -lift, duration: 1.05, ease: "power3.in" }, 0.12)
          .to(el.headEnter, { autoAlpha: 0, duration: 0.45, ease: "power1.in" }, 0.72)
          .set(el.intro, { autoAlpha: 0 })
          .add(() => showWork(), "-=0.15");
      });
    }

    function backToIntro() {
      if (state.view !== "work") return;
      state.view = "intro";
      transition && transition.kill();
      ctx.add(() => {
        transition = gsap.timeline({
          onComplete: () => {
            el.work.hidden = true;
            el.intro.inert = false;
            el.intro.removeAttribute("aria-hidden");
            el.explore.focus({ preventScroll: true });
          },
        });
        transition.to(el.workItems, {
          opacity: 0,
          y: reduced ? 0 : -8,
          duration: reduced ? 0.3 : 0.4,
          ease: "power2.in",
          stagger: reduced ? 0 : 0.03,
        });
        if (reduced) {
          transition.set(el.headEnter, { y: 0, scale: 1, autoAlpha: 1 }).set(el.reveal, { autoAlpha: 1, y: 0 }).to(el.intro, { autoAlpha: 1, duration: 0.35 });
          return;
        }
        transition
          .set(el.intro, { autoAlpha: 1 })
          .fromTo(
            el.headEnter,
            { y: -state.geo.vh * 0.3, autoAlpha: 0 },
            { y: 0, duration: 1.1, ease: `back.out(${MOTION.entrance.overshoot})` }
          )
          .to(el.headEnter, { autoAlpha: 1, duration: 0.6, ease: "power1.out" }, "<")
          .fromTo(el.reveal, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.1 }, "<0.55")
          .to(state, { engage: 1, duration: 1, ease: "power2.inOut" }, "<");
      });
    }

    function entrance() {
      const en = MOTION.entrance;
      ctx.add(() => {
        if (reduced) {
          gsap.set(el.headEnter, { autoAlpha: 1, y: 0, scale: 1 });
          gsap.set(el.reveal, { autoAlpha: 1, y: 0 });
          el.body.classList.remove("is-loading");
          state.engage = 0;
          return;
        }
        gsap.set(el.headEnter, { autoAlpha: 0, y: en.rise, scale: en.fromScale, transformOrigin: "50% 60%" });
        gsap.set(el.reveal, { autoAlpha: 0, y: 14 });
        el.body.classList.remove("is-loading");
        const tl = gsap.timeline({ delay: 0.25 });
        tl.to(el.headEnter, { y: 0, scale: 1, duration: en.duration, ease: `back.out(${en.overshoot})` }, 0)
          .to(el.headEnter, { autoAlpha: 1, duration: en.duration * 0.6, ease: "power1.out" }, 0)
          .to(el.reveal, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }, en.duration * 0.55)
          // hand over to live tracking without snapping: the pointer is already being tracked,
          // its influence simply fades in as the head settles
          .to(state, { engage: 1, duration: 1.1, ease: "power2.inOut" }, en.duration * 0.45)
          .add(startFloat, en.duration * 0.8)
          .add(() => (trail.ready = true), en.duration * 0.8);
      });
    }

    // ---------- wire up ----------
    measure();
    renderClouds(0);

    on(window, "resize", onResize);
    if (WORK_ENABLED) on(el.explore, "click", explore);
    on(el.back, "click", backToIntro);
    on(document, "keydown", (e) => {
      if (e.key === "Escape" && state.view === "work") backToIntro();
    });
    el.workItems.forEach((n) => {
      const a = n.querySelector("a");
      if (a) on(a, "click", (e) => e.preventDefault());
    });

    if (!reduced) {
      on(window, "pointermove", onPointerMove, { passive: true });
      on(window, "pointerdown", onTouch, { passive: true });
      on(window, "pointermove", onTouch, { passive: true });
      on(window, "pointerup", onTouchEnd, { passive: true });
      on(window, "pointercancel", onTouchEnd, { passive: true });
      on(document, "mouseout", onLeave);
      on(window, "blur", onBlur);
      on(el.explore, "pointerenter", onButtonEnter);
      on(el.explore, "pointerleave", onButtonLeave);
      on(el.explore, "focus", onButtonFocus);
      on(el.explore, "blur", onButtonBlur);
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
      transition && transition.kill();
      ctx.revert();
      gsap.set([el.headFollow, el.headTilt, el.headFloat, ...el.irises, ...el.catches], { clearProps: "transform" });
      el.work.hidden = true;
      el.intro.inert = false;
      el.intro.removeAttribute("aria-hidden");
      gsap.set([el.intro, el.headEnter, ...el.reveal, ...el.workItems], { clearProps: "all" });
      gsap.globalTimeline.resume();
    };
  }

  let destroy = init();
  // Re-initialise if the user flips reduced motion while the page is open
  const onReducedChange = () => {
    destroy();
    destroy = init();
  };
  reducedQuery.addEventListener ? reducedQuery.addEventListener("change", onReducedChange) : reducedQuery.addListener(onReducedChange);

  // Exposed for tuning in the console, e.g. binzOpener.motion.gaze.maxX = 10
  window.binzOpener = { motion: MOTION, destroy: () => destroy() };
})();

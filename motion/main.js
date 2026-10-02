/**
 * Builds the single GSAP master timeline from config.sequence and wires the dev controls.
 */
(function () {
  const cfg = window.MOTION_CONFIG;
  const stage = document.getElementById('stage');
  const root = document.documentElement.style;
  root.setProperty('--ink', cfg.colors.ink);
  root.setProperty('--paper', cfg.colors.paper);
  root.setProperty('--font', cfg.font);

  let master = null;

  // Seeded PRNG so the "imperfect" timing is identical on every loop and every rebuild.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build(time, paused) {
    if (master) master.kill();
    stage.innerHTML = '';

    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const rand = mulberry32(cfg.seed);
    const j = (d, amt = cfg.jitter) => d * (1 + (rand() * 2 - 1) * amt);
    const hero = Math.min(cfg.heroImage, cfg.images.length - 1);

    master = gsap.timeline({ repeat: -1, paused: true, onUpdate: dev.update });

    cfg.sequence.forEach((id) => {
      const factory = window.SCENES[id];
      if (!factory) { console.warn('Unknown scene:', id); return; }
      const scene = document.createElement('section');
      scene.className = 'scene scene--' + id;
      stage.appendChild(scene);

      const inner = factory({ scene, cfg, W, H, rand, j, hero });
      const wrap = gsap.timeline()
        .set(scene, { autoAlpha: 1, immediateRender: false }, 0) // cut in
        .add(inner, 0)
        .set(scene, { autoAlpha: 0, immediateRender: false }, inner.duration()); // cut out

      if (!master.labels[id]) master.addLabel(id);
      master.add(wrap);
    });

    dev.populate();
    master.time(time || 0);
    if (!paused) master.play();
    dev.update();
  }

  // ---- dev controls ---------------------------------------------------------
  const dev = (function () {
    const q = new URLSearchParams(location.search).get('dev');
    const on = q === '1' || (cfg.dev && q !== '0');
    const box = document.getElementById('dev');
    const btn = document.getElementById('dev-play');
    const scrub = document.getElementById('dev-scrub');
    const time = document.getElementById('dev-time');
    const sel = document.getElementById('dev-scene');
    box.hidden = !on;
    let dragging = false;

    function update() {
      if (!on || !master) return;
      if (!dragging) scrub.value = Math.round(master.progress() * 1000);
      time.textContent = master.time().toFixed(2) + 's';
      btn.textContent = master.paused() ? 'Play' : 'Pause';
      const cur = master.currentLabel();
      if (cur && sel.value !== cur) sel.value = cur;
    }

    function populate() {
      if (!on) return;
      sel.innerHTML = '';
      Object.entries(master.labels)
        .sort((a, b) => a[1] - b[1])
        .forEach(([name, t]) => {
          const o = document.createElement('option');
          o.value = name;
          o.textContent = name + ' @' + t.toFixed(2);
          sel.appendChild(o);
        });
    }

    function toggle() { master.paused(!master.paused()); update(); }
    function seek(t) { master.pause(); master.time(Math.max(0, Math.min(master.duration(), t))); update(); }
    function jumpLabel(dir) {
      const ts = Object.values(master.labels).sort((a, b) => a - b);
      const now = master.time();
      const next = dir > 0 ? ts.find((t) => t > now + 1e-3) : [...ts].reverse().find((t) => t < now - 1e-3);
      seek(next != null ? next : dir > 0 ? 0 : ts[ts.length - 1]);
    }

    if (on) {
      btn.addEventListener('click', toggle);
      scrub.addEventListener('pointerdown', () => { dragging = true; master.pause(); });
      scrub.addEventListener('pointerup', () => { dragging = false; });
      scrub.addEventListener('input', () => { master.pause(); master.progress(scrub.value / 1000); update(); });
      sel.addEventListener('change', () => seek(master.labels[sel.value]));
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') { e.preventDefault(); toggle(); }
        else if (e.key === 'ArrowRight') seek(master.time() + (e.shiftKey ? 0.1 : 1 / 60));
        else if (e.key === 'ArrowLeft') seek(master.time() - (e.shiftKey ? 0.1 : 1 / 60));
        else if (e.key === ']') jumpLabel(1);
        else if (e.key === '[') jumpLabel(-1);
      });
    }
    return { update, populate };
  })();

  // ---- boot: wait for fonts + images so measurements and first frames are right
  function preload(src) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = im.onerror = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(res);
      im.src = src;
    });
  }

  Promise.all([document.fonts.ready, ...cfg.images.map((a) => preload(a.src))]).then(() => {
    build(0, false);
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => build(master.time(), master.paused()), 150);
    });
  });

  // expose for console debugging
  window.motion = { get master() { return master; }, rebuild: () => build(master.time(), master.paused()) };
})();

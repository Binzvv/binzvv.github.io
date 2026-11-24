// ─────────────────────────────────────────────────────────────────────────────
// NRC · ENERGY IN MOTION: one interaction.
//
//   home ─(tap Start Run)→ light wells up from the button → forms the Swoosh →
//   the Swoosh travels to the edges → the frame catches the light →
//   3 · 2 · 1 · GO → payoff (richest light) → afterglow ─(Reset)→ home
//
// Restraint: the interface is quiet; the most spectacular light is held back
// until GO.
// ─────────────────────────────────────────────────────────────────────────────

const gsap = window.gsap;
const $ = (s) => document.querySelector(s);
const haptic = (ms) => { try { navigator.vibrate?.(ms); } catch { /* unsupported on iOS */ } };

export function createApp({ energy, reducedMotion = false }) {
  const { E, toP, rectToP, len, measure } = energy;
  const appEl = $('#app');
  const screens = Object.fromEntries([...document.querySelectorAll('[data-screen]')].map((el) => [el.dataset.screen, el]));
  const startBtn = $('#startBtn');
  const countEl = $('#countNum');
  const timerEl = $('#timer');
  let state = 'boot';
  let runStart = 0;
  let tl = null;

  const setState = (s) => { state = s; appEl.dataset.state = s; };
  const activate = (...names) => { for (const [k, el] of Object.entries(screens)) el.classList.toggle('is-active', names.includes(k)); };

  function cta() {
    measure();
    const r = startBtn.getBoundingClientRect();
    const s = gsap.getProperty(startBtn, 'scale') || 1;
    const c = rectToP(r);
    return { x: c.x, y: c.y, r: len(r.width / 2 / s) };
  }

  // ── anticipation ────────────────────────────────────────────────────────
  function enterHome(first = false) {
    setState('home');
    activate('home');
    gsap.set(startBtn, { clearProps: 'all' });
    const c = cta();
    Object.assign(E, { ctaX: c.x, ctaY: c.y, ctaR: c.r, touchX: c.x, touchY: c.y, charge: 0 });
    gsap.fromTo('.home .fade', { opacity: 0, y: 12, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: first ? 0.3 : 0.1, clearProps: 'filter,transform' });
    gsap.fromTo(startBtn, { scale: 0.86, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1, ease: 'expo.out', delay: first ? 0.5 : 0.3, clearProps: 'transform' });
    gsap.to(E, { glow: 1, duration: 2, delay: 0.4, ease: 'power2.out' });
  }

  // ── touch ───────────────────────────────────────────────────────────────
  let pressing = false;
  function touchAt(e) { const [x, y] = toP(e.clientX, e.clientY); E.touchX = x; E.touchY = y; }
  startBtn.addEventListener('pointerdown', (e) => {
    if (state !== 'home') return;
    e.preventDefault();
    pressing = true;
    startBtn.setPointerCapture?.(e.pointerId);
    touchAt(e);
    gsap.to(startBtn, { scale: 0.93, duration: 0.18, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(E, { charge: 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    haptic(10);
  });
  startBtn.addEventListener('pointermove', (e) => { if (pressing) touchAt(e); });
  startBtn.addEventListener('pointerup', () => { if (pressing) { pressing = false; play(); } });
  startBtn.addEventListener('pointercancel', () => {
    if (!pressing) return;
    pressing = false;
    gsap.to(startBtn, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    gsap.to(E, { charge: 0, duration: 0.4 });
  });
  startBtn.addEventListener('click', (e) => { if (e.detail === 0 && state === 'home') play(); }); // keyboard

  // ── the sequence ────────────────────────────────────────────────────────
  function play() {
    if (state !== 'home') return;
    setState('play');
    haptic(30);
    const c = cta();
    const W = energy.view.aspect;
    const swW = W * 0.76;
    const swY = 0.52;
    tl?.kill();
    tl = gsap.timeline();

    // the interface steps back; the button gives its energy away
    tl.to(startBtn, { scale: 1.05, duration: 0.16, ease: 'power2.out' }, 0)
      .to(startBtn, { scale: 0.55, opacity: 0, filter: 'blur(12px)', duration: 0.5, ease: 'power3.in' }, 0.14)
      .to('.home .fade', { opacity: 0, y: -8, filter: 'blur(6px)', duration: 0.45, ease: 'power2.in', stagger: 0.03 }, 0.02)
      .to(E, { glow: 0, charge: 0, duration: 0.5, ease: 'power2.out' }, 0.05)

    // light wells up from the button: aggressive onset, long controlled settle
      .set(E, { originX: c.x, originY: c.y, shockX: c.x, shockY: c.y, shockR: 0 }, 0)
      .fromTo(E, { shockA: 0.8 }, { shockA: 0, duration: 1.3, ease: 'power2.out', immediateRender: false }, 0)
      .to(E, { shockR: 1.2, duration: 1.3, ease: 'expo.out' }, 0)
      .to(E, { energy: 0.78, duration: 0.55, ease: 'power2.out' }, 0.05)
      .fromTo(E, { rise: 0 }, { rise: 0.6, duration: 1.7, ease: 'expo.out', immediateRender: false }, 0.05)
      .to(E, { flow: 2.4, duration: 0.18 }, 0)
      .to(E, { flow: 1.0, duration: 1.6, ease: 'power2.out' }, 0.2)

    // the Swoosh condenses inside the light, energy pouring along its contour
      .set(E, { swX: 0, swY: swY, swScale: swW, swForm: 0, sw: 0 }, 0.3)
      .to(E, { sw: 1, duration: 0.6, ease: 'power2.out' }, 0.35)
      .to(E, { swForm: 1, duration: 1.15, ease: 'power2.inOut' }, 0.35)
      .to(E, { swY: swY + 0.025, duration: 0.9, ease: 'sine.inOut' }, 1.05)

    // …then travels outward to the edges of the display
      .to(E, { decay: 0.62, driftY: 0, duration: 0.2 }, 1.8)
      .to(E, { swScale: swW * 3.6, duration: 0.85, ease: 'power3.in' }, 1.9)
      .to(E, { sw: 0, duration: 0.85, ease: 'power2.in' }, 1.9)
      .to(E, { energy: 0, duration: 0.9, ease: 'power2.inOut' }, 2.0)
      .to(E, { rise: 1, duration: 0.9, ease: 'power2.in' }, 2.0)
      .set(E, { ringX: 0, ringY: swY + 0.025, ringR: 0.04 }, 2.3)
      .fromTo(E, { ringA: 0 }, { ringA: 1, duration: 0.25, immediateRender: false }, 2.3)
      .to(E, { ringR: 0.95, duration: 1.5, ease: 'power2.out' }, 2.3)
      .to(E, { ringA: 0, duration: 0.9, ease: 'power2.in' }, 2.85)
      .to(E, { decay: 0.74, driftY: -0.001, duration: 0.6 }, 2.8)

    // the frame catches the light
      .to(E, { perim: 0.5, duration: 1.1, ease: 'expo.out' }, 2.55)
      .fromTo(E, { perimDrive: 1.7 }, { perimDrive: 0.85, duration: 1.5, ease: 'expo.out', immediateRender: false }, 2.55)
      .call(() => { activate('count'); setState('count'); }, null, 3.2);

    // 3 · 2 · 1: each beat breathes through the frame, the centre stays dark
    const C0 = 3.3, STEP = 0.9;
    ['3', '2', '1'].forEach((n, i) => {
      const at = C0 + i * STEP;
      tl.call(() => { countEl.textContent = n; haptic(20); }, null, at)
        .fromTo(countEl, { opacity: 0, scale: 1.14, filter: 'blur(18px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out', immediateRender: false }, at)
        .fromTo(E, { perim: 0.78, perimDrive: 1.35 }, { perim: 0.5, perimDrive: 0.85, duration: 0.8, ease: 'power2.out', immediateRender: false }, at)
        .to(countEl, { opacity: 0, scale: 0.94, filter: 'blur(10px)', duration: 0.26, ease: 'power2.in' }, at + 0.6);
    });

    // GO: the payoff. The richest light of the whole experience
    const GO = C0 + 3 * STEP;
    tl.call(() => { countEl.textContent = 'GO'; haptic(60); runStart = performance.now(); }, null, GO)
      .fromTo(countEl, { opacity: 0, scale: 1.25, filter: 'blur(24px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'expo.out', immediateRender: false }, GO)
      .set(E, { ringX: 0, ringY: 0.5, ringR: 0.03, decay: 0.45 }, GO)
      .fromTo(E, { ringA: 0.7 }, { ringA: 0, duration: 1.5, ease: 'power2.in', immediateRender: false }, GO)
      .to(E, { ringR: 1.15, duration: 1.5, ease: 'expo.out' }, GO)
      .to(E, { perim: 1.2, perimDrive: 1.9, decay: 0.45, duration: 0.5, ease: 'power3.out' }, GO + 0.12)
      .to(E, { perimRich: 1, bloom: 0.9, flow: 2.4, duration: 0.8, ease: 'power2.out' }, GO + 0.12)
      .to(E, { perim: 1.05, perimDrive: 1.35, flow: 1.0, bloom: 0.75, decay: 0.74, duration: 2.8, ease: 'power2.inOut' }, GO + 0.7)
      .to(countEl, { opacity: 0, scale: 1.06, filter: 'blur(16px)', duration: 0.5, ease: 'power2.in' }, GO + 1.25)
      .call(showLive, null, GO + 1.7)
      // afterglow: the light keeps moving, quietly
      .to(E, { perim: 0.62, perimDrive: 1.0, perimRich: 0.45, duration: 3.2, ease: 'power2.inOut' }, GO + 3.6);
  }

  function showLive() {
    setState('live');
    activate('live');
    renderTimer(true);
    gsap.fromTo('.live .in', { opacity: 0, y: 14, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.1, clearProps: 'filter' });
  }

  // ── reset ───────────────────────────────────────────────────────────────
  $('#resetBtn').addEventListener('click', () => {
    if (state !== 'live' && state !== 'count') return;
    setState('resetting');
    haptic(15);
    tl?.kill();
    gsap.timeline()
      .to('.live .in', { opacity: 0, y: -8, filter: 'blur(8px)', duration: 0.4, ease: 'power2.in', stagger: 0.04 }, 0)
      .to(E, { perim: 0, perimRich: 0, perimDrive: 0.8, ringA: 0, energy: 0, sw: 0, bloom: 0.7, duration: 1.1, ease: 'power2.inOut' }, 0)
      .call(() => enterHome(false), null, 0.7);
  });

  // ── timer ───────────────────────────────────────────────────────────────
  let lastTimer = '';
  function renderTimer(force) {
    const s = Math.max(0, Math.floor((performance.now() - runStart) / 1000));
    const m = Math.floor(s / 60);
    const txt = m >= 60
      ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    if (txt === lastTimer && !force) return;
    lastTimer = txt;
    timerEl.innerHTML = [...txt].map((ch) => (/\d/.test(ch) ? `<span class="d">${ch}</span>` : `<span class="p">${ch}</span>`)).join('');
  }

  function update() {
    if (state === 'live') renderTimer(false);
  }

  addEventListener('resize', () => setTimeout(() => {
    if (state !== 'home') return;
    const c = cta();
    Object.assign(E, { ctaX: c.x, ctaY: c.y, ctaR: c.r });
  }, 150));

  enterHome(true);
  return { update, get state() { return state; }, debug: { play } };
}

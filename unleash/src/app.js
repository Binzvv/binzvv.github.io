// ─────────────────────────────────────────────────────────────────────────────
// NRC · ENERGY IN MOTION: one continuous interaction, choreographed after the
// reference film.
//
//   touch     the Start Run circle tightens under the thumb, light gathers
//   release   the interface melts into the light it was holding back
//   rise      a soft, saturated body of light wells up from the button
//   form      energy pours along the supplied Swoosh's contour until it burns white
//   disperse  the Swoosh breaks outward; an iridescent ring carries the energy
//             to the edges of the display (chromatic split at the moment of release)
//   payoff    the frame catches the light: the richest moment, then a living afterglow
//   confirm   LET'S RUN. resolves out of the split, then Reset
// ─────────────────────────────────────────────────────────────────────────────

const gsap = window.gsap;
const $ = (s) => document.querySelector(s);
const haptic = (ms) => { try { navigator.vibrate?.(ms); } catch { /* not on iOS */ } };

const SPLIT_ON = '-9px 0 0 rgba(130, 200, 255, 0.85), 9px 0 0 rgba(206, 255, 0, 0.85)';
const SPLIT_OFF = '0px 0 0 rgba(130, 200, 255, 0), 0px 0 0 rgba(206, 255, 0, 0)';

export function createApp({ energy }) {
  const { E, toP, rectToP, len, measure } = energy;
  const appEl = $('#app');
  const screens = Object.fromEntries([...document.querySelectorAll('[data-screen]')].map((el) => [el.dataset.screen, el]));
  const startBtn = $('#startBtn');
  const letsEl = $('#lets');
  const resetBtn = $('#resetBtn');
  const brand = $('#brand');
  let state = 'boot';
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
    const d = first ? 0.3 : 0.15;
    gsap.to(brand, { opacity: 1, duration: 1.0, ease: 'power2.out', delay: d });
    gsap.fromTo('.home .fade', { opacity: 0, y: 14, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: 0.08, delay: d, clearProps: 'filter,transform' });
    gsap.fromTo(startBtn, { scale: 0.82, opacity: 0, filter: 'blur(12px)' },
      { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', delay: d + 0.2, clearProps: 'transform,filter' });
    gsap.to(E, { glow: 1, duration: 2.2, delay: d + 0.3, ease: 'power2.out' });
  }

  // ── touch ───────────────────────────────────────────────────────────────
  let pressing = false;
  const touchAt = (e) => { const [x, y] = toP(e.clientX, e.clientY); E.touchX = x; E.touchY = y; };
  startBtn.addEventListener('pointerdown', (e) => {
    if (state !== 'home') return;
    e.preventDefault();
    pressing = true;
    startBtn.setPointerCapture?.(e.pointerId);
    touchAt(e);
    gsap.to(startBtn, { scale: 0.93, duration: 0.18, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(E, { charge: 1, glow: 1.3, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
    haptic(10);
  });
  startBtn.addEventListener('pointermove', (e) => { if (pressing) touchAt(e); });
  startBtn.addEventListener('pointerup', () => { if (pressing) { pressing = false; play(); } });
  startBtn.addEventListener('pointercancel', () => {
    if (!pressing) return;
    pressing = false;
    gsap.to(startBtn, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
    gsap.to(E, { charge: 0, glow: 1, duration: 0.4 });
  });
  startBtn.addEventListener('click', (e) => { if (e.detail === 0 && state === 'home') play(); }); // keyboard

  // ── the interaction ─────────────────────────────────────────────────────
  function play() {
    if (state !== 'home') return;
    setState('play');
    haptic(30);
    const c = cta();
    const W = energy.view.aspect;
    const swW = W * 0.74;
    const swY = 0.5;
    tl?.kill();
    tl = gsap.timeline();

    // release: the interface melts into the light it was holding
    tl.to(startBtn, { scale: 1.06, duration: 0.14, ease: 'power2.out' }, 0)
      .to(startBtn, { scale: 1.5, opacity: 0, filter: 'blur(22px)', duration: 0.7, ease: 'power2.in' }, 0.1)
      .to('.home .fade', { opacity: 0, y: -22, filter: 'blur(14px)', duration: 0.8, ease: 'power2.in', stagger: 0.05 }, 0.04)
      .to(brand, { opacity: 0.3, duration: 0.8, ease: 'power2.out' }, 0.1)
      .to(E, { glow: 0, charge: 0, duration: 0.6, ease: 'power2.out' }, 0.1)

    // rise: soft saturated light wells up from where the button was
      .set(E, { originX: c.x, originY: c.y, shockX: c.x, shockY: c.y, shockR: 0 }, 0)
      .fromTo(E, { shockA: 0.7 }, { shockA: 0, duration: 1.4, ease: 'power2.out', immediateRender: false }, 0)
      .to(E, { shockR: 1.2, duration: 1.4, ease: 'expo.out' }, 0)
      .to(E, { energy: 0.8, duration: 0.6, ease: 'power2.out' }, 0.05)
      .fromTo(E, { rise: 0 }, { rise: 0.62, duration: 1.9, ease: 'expo.out', immediateRender: false }, 0.05)
      .to(E, { flow: 2.4, duration: 0.18 }, 0)
      .to(E, { flow: 1.0, duration: 1.7, ease: 'power2.out' }, 0.2)

    // form: energy pours along the Swoosh's contour until it burns white
      .set(E, { swX: 0, swY: swY, swScale: swW, swForm: 0, sw: 0 }, 0.32)
      .to(E, { sw: 1, duration: 0.6, ease: 'power2.out' }, 0.38)
      .to(E, { swForm: 1, duration: 1.2, ease: 'power2.inOut' }, 0.38)
      .to(E, { swY: swY + 0.03, duration: 1.3, ease: 'sine.inOut' }, 0.9)

    // disperse: the Swoosh breaks outward, the ring carries its energy to the edges
      .to(E, { decay: 0.62, driftY: 0, duration: 0.2 }, 1.95)
      .to(E, { swScale: swW * 3.6, duration: 0.85, ease: 'power3.in' }, 2.0)
      .to(E, { sw: 0, duration: 0.85, ease: 'power2.in' }, 2.0)
      .to(E, { energy: 0, duration: 1.0, ease: 'power2.inOut' }, 2.05)
      .to(E, { rise: 1, duration: 1.0, ease: 'power2.in' }, 2.05)
      .fromTo(E, { ca: 0.07 }, { ca: 0.012, duration: 0.9, ease: 'power2.out', immediateRender: false }, 2.3)
      .set(E, { ringX: 0, ringY: swY + 0.03, ringR: 0.04 }, 2.3)
      .fromTo(E, { ringA: 0 }, { ringA: 1, duration: 0.25, immediateRender: false }, 2.3)
      .to(E, { ringR: 1.0, duration: 1.7, ease: 'power2.out' }, 2.3)
      .to(E, { ringA: 0, duration: 1.0, ease: 'power2.in' }, 2.95)
      .to(E, { decay: 0.74, driftY: -0.001, duration: 0.6 }, 2.9)

    // payoff: the frame catches the light. The richest moment of the piece
      .to(E, { perim: 1.05, perimDrive: 1.6, duration: 1.0, ease: 'expo.out' }, 2.55)
      .to(E, { perimRich: 1, bloom: 0.8, flow: 1.8, duration: 1.2, ease: 'power2.out' }, 2.6)
      .to(E, { perim: 0.8, perimDrive: 1.1, perimRich: 0.65, bloom: 0.72, flow: 1.0, duration: 2.8, ease: 'power2.inOut' }, 4.0)
      .to(E, { perim: 0.62, perimDrive: 1.0, perimRich: 0.45, duration: 3.5, ease: 'sine.inOut' }, 7.0)

    // confirm: LET'S RUN. resolves out of the chromatic split, inside the ring
      .call(() => { activate('done'); haptic(50); }, null, 2.35)
      .fromTo(letsEl, { opacity: 0, scale: 1.08, filter: 'blur(16px)', textShadow: SPLIT_ON },
        { opacity: 1, scale: 1, filter: 'blur(0px)', textShadow: SPLIT_OFF, duration: 1.2, ease: 'expo.out', immediateRender: false }, 2.45)
      .to(brand, { opacity: 1, duration: 1.2, ease: 'power2.out' }, 2.8)
      .fromTo(resetBtn, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', immediateRender: false }, 3.7)
      .call(() => setState('done'), null, 3.7);
  }

  // ── reset ───────────────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    if (state !== 'done') return;
    setState('resetting');
    haptic(15);
    tl?.kill();
    gsap.timeline()
      .to([letsEl, resetBtn], { opacity: 0, filter: 'blur(12px)', y: -6, duration: 0.5, ease: 'power2.in', stagger: 0.05 }, 0)
      .to(E, { perim: 0, perimRich: 0, perimDrive: 0.8, ringA: 0, energy: 0, sw: 0, bloom: 0.7, duration: 1.2, ease: 'power2.inOut' }, 0)
      .call(() => { gsap.set([letsEl, resetBtn], { clearProps: 'all' }); gsap.set([letsEl, resetBtn], { opacity: 0 }); enterHome(false); }, null, 0.75);
  });

  addEventListener('resize', () => setTimeout(() => {
    if (state !== 'home') return;
    const c = cta();
    Object.assign(E, { ctaX: c.x, ctaY: c.y, ctaR: c.r });
  }, 150));

  gsap.set([letsEl, resetBtn], { opacity: 0 });
  gsap.set(brand, { opacity: 0 });
  enterHome(true);
  return { update() {}, get state() { return state; }, debug: { play } };
}

import { RunSim, fmt } from './run.js';

// ─────────────────────────────────────────────────────────────────────────────
// NRC · ENERGY IN MOTION: product flow and choreography.
//
//   home ─(hold Start Run)→ charge ─(release)→ launch ─→ countdown ─→ run
//     ↑                                                               │
//     └──── done ←── summary ←── complete ←──(hold End Run)───────────┘
//                      └── run again → launch
// ─────────────────────────────────────────────────────────────────────────────

const gsap = window.gsap;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const haptic = (ms) => { try { navigator.vibrate?.(ms); } catch { /* unsupported */ } };
const SWOOSH_ASPECT = 1023 / 2929; // height / width of the supplied artwork

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};

function splitText(el) {
  const lines = el.dataset.text.split('|');
  el.setAttribute('aria-label', lines.join(' '));
  el.textContent = '';
  for (const line of lines) {
    const ls = document.createElement('span');
    ls.className = 'line';
    ls.setAttribute('aria-hidden', 'true');
    line.split(' ').forEach((word, i, arr) => {
      const ws = document.createElement('span');
      ws.className = 'word';
      for (const ch of word) {
        const c = document.createElement('span');
        c.className = 'ch';
        c.textContent = ch;
        c.style.setProperty('--r', (0.35 + Math.random() * 0.65).toFixed(3));
        c.style.setProperty('--dx', (Math.random() * 2 - 1).toFixed(3));
        ws.appendChild(c);
      }
      ls.appendChild(ws);
      if (i < arr.length - 1) ls.appendChild(document.createTextNode(' '));
    });
    el.appendChild(ls);
  }
}

export function createApp({ energy, reducedMotion = false }) {
  const { E, toP, rectToP, len, measure } = energy;
  const appEl = $('#app');
  const screens = Object.fromEntries($$('[data-screen]').map((el) => [el.dataset.screen, el]));
  const sim = new RunSim();
  let state = 'boot';
  const setState = (s) => { state = s; appEl.dataset.state = s; };
  const activate = (...names) => {
    for (const [k, el] of Object.entries(screens)) el.classList.toggle('is-active', names.includes(k));
  };

  $$('.split').forEach(splitText);

  // NRC logo: used automatically if the official asset is dropped into /assets
  const nrcLogo = $('.nrc-logo');
  nrcLogo.addEventListener('load', () => { nrcLogo.hidden = false; nrcLogo.nextElementSibling.hidden = true; });

  // ── layout → energy coordinates ─────────────────────────────────────────
  const home = { sw: { x: 0, y: 0.45, scale: 0.36 }, cta: { x: 0, y: 0.1, hw: 0.2, hh: 0.04 } };
  const startBtn = $('#startBtn');
  function swooshFit(rect, wFrac, hFrac) {
    const c = rectToP(rect);
    const byW = len(rect.width * wFrac);
    const byH = len(rect.height * hFrac) / SWOOSH_ASPECT;
    return { x: c.x, y: c.y, scale: Math.max(0.12, Math.min(byW, byH)) };
  }
  function layoutHome() {
    measure();
    home.sw = swooshFit($('#stage').getBoundingClientRect(), 0.86, 0.66);
    // getBoundingClientRect includes GSAP's press scale; undo it for the resting rect
    const r = startBtn.getBoundingClientRect();
    const s = gsap.getProperty(startBtn, 'scale') || 1;
    const w = r.width / s, h = r.height / s;
    home.cta = rectToP({ left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h });
  }
  function aimCta(c) { Object.assign(E, { ctaX: c.x, ctaY: c.y, ctaHW: c.hw, ctaHH: c.hh, touchX: c.x, touchY: c.y }); }

  // ── 01 ANTICIPATION ────────────────────────────────────────────────────
  function enterHome(first = false) {
    setState('home');
    activate('home');
    layoutHome();
    aimCta(home.cta);
    gsap.set(startBtn, { scale: 1 });
    gsap.set('.home .intro', { opacity: 1 });
    gsap.fromTo('.home .intro', { '--dc': 1.6 }, { '--dc': 0, duration: 1.6, ease: 'expo.out', delay: first ? 0.35 : 0.1 });
    gsap.fromTo(['.home [data-reveal]', '.concept-note'], { opacity: 0, y: 18, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: first ? 0.6 : 0.3, clearProps: 'filter' });
    updateGoalUI();

    gsap.to(E, {
      energy: 0.4, rise: 0.27, flow: 0.8, originX: home.cta.x, originY: home.cta.y,
      perim: 0, perimDrive: 1, ringA: 0, flash: 0, shake: 0, ca: 0.02, decay: 0.84, driftY: -0.0012,
      duration: first ? 2.4 : 1.4, ease: 'power2.inOut', overwrite: 'auto',
    });
    if (first) {
      Object.assign(E, { swX: home.sw.x, swY: home.sw.y, swScale: home.sw.scale, swForm: 0, sw: 0, swBreath: 1 });
      gsap.to(E, { sw: 0.85, duration: 1.2, ease: 'power2.out', delay: 0.4 });
      gsap.to(E, { swForm: 1, duration: 2.2, ease: 'power2.inOut', delay: 0.4 });
    } else {
      E.swForm = 1;
      gsap.to(E, { swX: home.sw.x, swY: home.sw.y, swScale: home.sw.scale, sw: 0.85, swBreath: 1, duration: 1.4, ease: 'expo.inOut', overwrite: 'auto' });
    }
  }

  // ── 02 ACTIVATION: press and hold builds charge ─────────────────────────
  let pressing = false;
  let charge = 0;
  function setTouch(e) {
    const [x, y] = toP(e.clientX, e.clientY);
    E.touchX = x; E.touchY = y;
    const r = startBtn.getBoundingClientRect();
    startBtn.style.setProperty('--tx', `${((e.clientX - r.left) / r.width) * 100}%`);
  }
  startBtn.addEventListener('pointerdown', (e) => {
    if (state !== 'home' || sheetOpen) return;
    e.preventDefault();
    pressing = true;
    charge = Math.max(charge, 0.04);
    startBtn.setPointerCapture?.(e.pointerId);
    layoutHome();
    aimCta(home.cta);
    setTouch(e);
    gsap.killTweensOf(E, 'charge');
    gsap.to(startBtn, { scale: 0.955, duration: 0.22, ease: 'power3.out', overwrite: 'auto' });
    haptic(12);
  });
  startBtn.addEventListener('pointermove', (e) => { if (pressing) setTouch(e); });
  startBtn.addEventListener('pointerup', () => { if (pressing) { pressing = false; release(); } });
  startBtn.addEventListener('pointercancel', () => { if (pressing) { pressing = false; relax(); } });
  startBtn.addEventListener('click', (e) => { if (e.detail === 0 && state === 'home') { charge = 0.5; release(); } });

  function relax() {
    gsap.to(E, { charge: 0, duration: 0.6, ease: 'power2.out' });
    gsap.to('.home .intro', { '--dc': 0, duration: 0.8, ease: 'expo.out' });
    gsap.to(startBtn, { scale: 1, '--charge': 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    charge = 0;
  }

  function release() {
    if (state !== 'home') return;
    const c = Math.max(charge, 0.35);
    charge = 0;
    haptic(40);
    launch(c, home.cta);
  }

  // ── 03 ERUPTION ───────────────────────────────────────────────────────
  function launch(c, from) {
    setState('launch');
    const W = energy.view.aspect;
    const tl = gsap.timeline();
    tl.to(startBtn, { scale: 1.035, '--charge': 0, duration: 0.14, ease: 'power2.out' }, 0)
      .to(['.home [data-reveal]', '.concept-note'], { opacity: 0, y: 14, filter: 'blur(8px)', duration: 0.34, ease: 'power2.in' }, 0.05)
      .to('.home .intro', { '--dc': 1.8, duration: 0.6, ease: 'power3.in' }, 0)
      .to('.home .intro', { opacity: 0, duration: 0.3 }, 0.36)

      // the charge collapses into a shock that pushes the environment away
      .to(E, { charge: 0, duration: 0.25, ease: 'power2.out' }, 0)
      .set(E, { shockX: from.x, shockY: from.y, shockR: 0, ringX: from.x, ringY: from.y, ringR: 0.02, originX: from.x, originY: from.y }, 0)
      .fromTo(E, { shockA: 0.6 + 0.6 * c }, { shockA: 0, duration: 1.3, ease: 'power2.in', immediateRender: false }, 0)
      .to(E, { shockR: 1.5, duration: 1.3, ease: 'expo.out' }, 0)
      .fromTo(E, { ringA: 0.45 + 0.3 * c }, { ringA: 0, duration: 1.1, ease: 'power2.in', immediateRender: false }, 0)
      .to(E, { ringR: 0.85, duration: 1.1, ease: 'expo.out' }, 0)

      // eruption: aggressive acceleration, controlled deceleration
      .to(E, { energy: 0.78 + 0.22 * c, duration: 0.22, ease: 'power3.out' }, 0)
      .to(E, { rise: 1, duration: 1.25, ease: 'expo.out' }, 0)
      .to(E, { flow: 2.8, duration: 0.12, ease: 'power2.out' }, 0)
      .to(E, { flow: 1.3, duration: 1.35, ease: 'power2.out' }, 0.12)
      .fromTo(E, { ca: 0.055 }, { ca: 0.022, duration: 1.2, ease: 'power2.out', immediateRender: false }, 0)
      .fromTo(E, { shake: 0.2 + 0.5 * c }, { shake: 0, duration: 0.7, ease: 'power2.out', immediateRender: false }, 0)

      // the Swoosh condenses out of the plasma, energy pouring along its contour
      .to(E, { sw: 0, duration: 0.22, ease: 'power2.in' }, 0)
      .set(E, { swForm: 0, swX: 0, swY: 0.42, swScale: W * 0.84, swBreath: 0.3 }, 0.24)
      .to(E, { sw: 1.15, duration: 0.3, ease: 'power2.out' }, 0.26)
      .to(E, { swForm: 1, duration: 0.85, ease: 'power2.inOut' }, 0.26)
      .to(E, { swY: 0.5, duration: 0.6, ease: 'sine.inOut' }, 0.9)

      // …and tears up through the viewport
      .to(E, { decay: 0.9, driftY: -0.006, duration: 0.2 }, 1.3)
      .to(E, { swY: 1.8, duration: 0.62, ease: 'power4.in' }, 1.48)
      .to(E, { swScale: W * 1.18, duration: 0.62, ease: 'power3.in' }, 1.48)
      .to(E, { flow: 2.8, duration: 0.4, ease: 'power2.in' }, 1.6)
      .set(E, { flashX: 0, flashY: 1.02 }, 1.9)
      .fromTo(E, { flash: 1.5 }, { flash: 0, duration: 0.9, ease: 'power2.out', immediateRender: false }, 1.98)
      .fromTo(E, { shake: 0.45 }, { shake: 0, duration: 0.55, ease: 'power2.out', immediateRender: false }, 1.98)

      // the field clears and the perimeter ignites
      .to(E, { energy: 0, duration: 0.6, ease: 'power2.inOut' }, 1.95)
      .to(E, { flow: 1, duration: 1.0 }, 2.0)
      .set(E, { sw: 0 }, 2.2)
      .set(E, { swY: 0.5 }, 2.25)
      .to(E, { decay: 0.84, driftY: -0.0012, duration: 0.6 }, 2.2)
      .fromTo(E, { perimDrive: 2.6 }, { perimDrive: 1.15, duration: 1.1, ease: 'expo.out', immediateRender: false }, 2.0)
      .to(E, { perim: 1, duration: 0.9, ease: 'expo.out' }, 2.0)
      .call(countdown, null, 2.45);
  }

  // ── 04 COUNTDOWN ──────────────────────────────────────────────────────
  function countdown() {
    setState('countdown');
    activate('countdown');
    const el = $('#count');
    const cap = $('#countCaption');
    gsap.fromTo(cap, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out' });
    const STEP = 0.92;
    const tl = gsap.timeline();
    ['3', '2', '1', 'GO.'].forEach((n, i) => {
      const at = i * STEP;
      const go = n === 'GO.';
      tl.call(() => { el.textContent = n; el.classList.toggle('is-go', go); haptic(go ? 70 : 25); }, null, at)
        .fromTo(el, { scale: go ? 1.9 : 1.6, opacity: 0, filter: 'blur(30px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.42, ease: 'expo.out', immediateRender: false }, at)
        .set(E, { ringX: 0, ringY: 0.5, ringR: 0.04, flashX: 0, flashY: 0.5 }, at)
        .to(E, { ringR: go ? 1.7 : 0.95, duration: go ? 1.25 : 0.9, ease: 'expo.out' }, at)
        .fromTo(E, { ringA: go ? 1.2 : 0.75 }, { ringA: 0, duration: go ? 1.25 : 0.9, ease: 'power2.in', immediateRender: false }, at)
        .fromTo(E, { flash: go ? 1.8 : 1.0 }, { flash: go ? 0 : 0.08, duration: go ? 1.0 : 0.7, ease: 'power3.out', immediateRender: false }, at)
        .fromTo(E, { perimDrive: go ? 3.0 : 1.9 }, { perimDrive: 1.1, duration: 0.8, ease: 'expo.out', immediateRender: false }, at)
        .fromTo(E, { shake: go ? 0.6 : 0.28 }, { shake: 0, duration: 0.35, ease: 'power2.out', immediateRender: false }, at)
        .fromTo(E, { ca: go ? 0.08 : 0.05 }, { ca: 0.02, duration: 0.6, immediateRender: false }, at);
      if (!go) tl.to(el, { scale: 0.84, opacity: 0, filter: 'blur(14px)', duration: 0.26, ease: 'power2.in' }, at + STEP - 0.3);
    });
    const goAt = 3 * STEP;
    tl.to(cap, { opacity: 0, duration: 0.2 }, goAt)
      .set(E, { originX: 0, originY: 0 }, goAt)
      .fromTo(E, { energy: 0, rise: 0.2 }, { energy: 0.7, rise: 1, duration: 0.9, ease: 'expo.out', immediateRender: false }, goAt)
      .to(E, { energy: 0, duration: 0.9, ease: 'power2.inOut' }, goAt + 0.5)
      .to(el, { scale: 1.3, opacity: 0, filter: 'blur(22px)', duration: 0.5, ease: 'power2.in' }, goAt + 0.6)
      .call(startRun, null, goAt + 0.85);
  }

  // ── 05 ACTIVE RUN ─────────────────────────────────────────────────────
  const runEl = screens.run;
  const ui = {
    heroValue: $('#heroValue'), heroLabel: $('#heroLabel'),
    m1v: $('#m1v'), m1l: $('#m1l'), m2v: $('#m2v'), m2l: $('#m2l'), m3v: $('#m3v'), m3l: $('#m3l'),
    status: $('#runStatusText'), progress: $('#goalProgress'), progLabel: $('#goalProgressLabel'),
    progValue: $('#goalProgressValue'), fill: $('#goalFill'),
  };
  const last = {};
  const put = (key, el, v, html = false) => {
    if (last[key] === v) return;
    last[key] = v;
    if (html) el.innerHTML = v; else el.textContent = v;
  };
  const digits = (s) => [...s].map((ch) => (/\d/.test(ch) ? `<span class="d">${ch}</span>` : `<span class="p">${ch}</span>`)).join('');
  let runLive = false;
  let paused = false;
  let goalHit = false;
  let heroMode = 'distance';

  function startRun() {
    setState('run');
    activate('run');
    sim.reset();
    sim.start();
    paused = false;
    goalHit = false;
    runLive = false;
    runEl.classList.remove('is-paused');
    ui.status.textContent = 'Running';
    $('#pauseBtn').setAttribute('aria-label', 'Pause run');
    for (const k in last) delete last[k];
    heroMode = goal?.type === 'time' ? 'time' : 'distance';
    ui.heroLabel.textContent = heroMode === 'time' ? 'Time' : 'Kilometres';
    ui.m2l.textContent = heroMode === 'time' ? 'Km' : 'Time';
    ui.progress.hidden = !goal;
    if (goal) ui.progLabel.textContent = `Goal · ${goalText(goal)}`;
    renderRun();
    gsap.fromTo('.run [data-in]', { opacity: 0, y: 26, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'filter' });
    gsap.to(E, { perim: 0.55, perimDrive: 0.95, flow: 0.8, duration: 1.2, ease: 'power2.out', onComplete: () => { runLive = true; } });
  }

  function renderRun() {
    const dist = fmt.km(sim.distance);
    const time = fmt.time(sim.elapsed);
    if (heroMode === 'time') {
      put('hero', ui.heroValue, digits(time), true);
      put('m2', ui.m2v, dist);
    } else {
      put('hero', ui.heroValue, digits(dist), true);
      put('m2', ui.m2v, time);
    }
    put('m1', ui.m1v, sim.showPace ? fmt.pace(sim.pace) : `-'--"`);
    put('m3', ui.m3v, sim.elapsed > 3 ? String(Math.round(sim.bpm)) : '--');
    if (goal) {
      const p = goal.type === 'time' ? sim.elapsed / (goal.value * 60) : sim.distance / goal.value;
      ui.fill.style.transform = `scaleX(${Math.min(1, p).toFixed(4)})`;
      put('pv', ui.progValue, goal.type === 'time' ? `${Math.floor(sim.elapsed / 60)} / ${goal.value} min` : `${dist} / ${goal.value.toFixed(2)} km`);
      if (p >= 1 && !goalHit) celebrateGoal();
    }
  }

  function celebrateGoal() {
    goalHit = true;
    haptic([30, 60, 30]);
    ui.progLabel.textContent = 'Goal reached';
    gsap.set(E, { ringX: 0, ringY: 0.5, ringR: 0.05 });
    gsap.fromTo(E, { ringA: 1.0 }, { ringA: 0, duration: 1.4, ease: 'power2.in' });
    gsap.to(E, { ringR: 1.4, duration: 1.4, ease: 'expo.out' });
    gsap.fromTo(E, { perimDrive: 2.6 }, { perimDrive: 1, duration: 1.2, ease: 'expo.out' });
  }

  const pauseBtn = $('#pauseBtn');
  pauseBtn.addEventListener('click', () => {
    if (state !== 'run') return;
    paused = !paused;
    sim.setPaused(paused);
    runEl.classList.toggle('is-paused', paused);
    ui.status.textContent = paused ? 'Paused' : 'Running';
    pauseBtn.setAttribute('aria-label', paused ? 'Resume run' : 'Pause run');
    haptic(18);
    gsap.fromTo(pauseBtn, { scale: 0.88 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
    if (!paused) {
      const c = rectToP(pauseBtn.getBoundingClientRect());
      gsap.set(E, { ringX: c.x, ringY: c.y, ringR: 0.02 });
      gsap.fromTo(E, { ringA: 0.7 }, { ringA: 0, duration: 0.9, ease: 'power2.in' });
      gsap.to(E, { ringR: 0.6, duration: 0.9, ease: 'expo.out' });
    }
  });

  // End Run is hold-to-confirm, like the real product: no accidental finishes
  const endBtn = $('#endBtn');
  const hint = $('#endHint');
  let holdTl = null;
  let hintT;
  function showHint(text) {
    hint.textContent = text;
    hint.classList.add('is-on');
    clearTimeout(hintT);
    hintT = setTimeout(() => hint.classList.remove('is-on'), 1800);
  }
  endBtn.addEventListener('pointerdown', (e) => {
    if (state !== 'run') return;
    e.preventDefault();
    endBtn.setPointerCapture?.(e.pointerId);
    endBtn.classList.add('is-holding');
    haptic(10);
    holdTl = gsap.timeline({ onComplete: () => { holdTl = null; endRun(); } })
      .fromTo(endBtn, { '--hold': 0 }, { '--hold': 1, duration: 0.8, ease: 'none' }, 0)
      .to(E, { perimDrive: 1.9, duration: 0.8, ease: 'power2.in' }, 0);
  });
  const cancelHold = () => {
    if (!holdTl) return;
    holdTl.kill();
    holdTl = null;
    endBtn.classList.remove('is-holding');
    gsap.to(endBtn, { '--hold': 0, duration: 0.25, ease: 'power2.out' });
    gsap.to(E, { perimDrive: 1, duration: 0.5 });
    showHint('Hold to end your run');
  };
  endBtn.addEventListener('pointerup', cancelHold);
  endBtn.addEventListener('pointercancel', cancelHold);
  endBtn.addEventListener('click', (e) => { if (e.detail === 0 && state === 'run') endRun(); });

  // ── 06 COMPLETION ─────────────────────────────────────────────────────
  function endRun() {
    if (state !== 'run') return;
    setState('complete');
    sim.stop();
    runLive = false;
    haptic([20, 40, 80]);
    endBtn.classList.remove('is-holding');
    gsap.set(endBtn, { '--hold': 0 });

    $('#runName').textContent = fmt.runName();
    $('#sDist').textContent = fmt.km(sim.distance);
    $('#sPace').textContent = fmt.pace(sim.avgPace);
    $('#sTime').textContent = fmt.time(sim.elapsed);

    // place the Swoosh in the summary's open space (measured with the screen live but invisible)
    screens.summary.classList.add('is-active');
    gsap.set('.summary [data-in], .summary-title', { opacity: 0 });
    measure();
    const sw = swooshFit($('.summary-space').getBoundingClientRect(), 0.8, 0.62);

    const tl = gsap.timeline();
    tl.to('.run [data-in]', { opacity: 0, y: -12, filter: 'blur(10px)', duration: 0.4, ease: 'power2.in', stagger: 0.03 }, 0)
      // energy builds around the screen
      .to(E, { perim: 1.7, perimDrive: 2.9, duration: 1.3, ease: 'power2.in' }, 0)
      .to(E, { shake: 0.4, ca: 0.06, flow: 2.6, duration: 1.3, ease: 'power2.in' }, 0)
      // release
      .set(E, { flashX: 0, flashY: sw.y, ringX: 0, ringY: sw.y, ringR: 0.04, shockX: 0, shockY: sw.y, shockR: 0, originX: 0, originY: 0 }, 1.3)
      .fromTo(E, { flash: 2.2 }, { flash: 0, duration: 1.5, ease: 'power3.out', immediateRender: false }, 1.3)
      .fromTo(E, { ringA: 1.4 }, { ringA: 0, duration: 1.5, ease: 'power2.in', immediateRender: false }, 1.3)
      .to(E, { ringR: 1.6, duration: 1.5, ease: 'expo.out' }, 1.3)
      .fromTo(E, { shockA: 1 }, { shockA: 0, duration: 1.2, immediateRender: false }, 1.3)
      .to(E, { shockR: 1.5, duration: 1.2, ease: 'expo.out' }, 1.3)
      .to(E, { perimDrive: 1.05, perim: 0.7, duration: 1.1, ease: 'expo.out' }, 1.3)
      .to(E, { shake: 0, ca: 0.022, flow: 1, duration: 0.6, ease: 'power2.out' }, 1.3)
      .fromTo(E, { energy: 0, rise: 0.1 }, { energy: 0.7, rise: 0.8, duration: 1.0, ease: 'expo.out', immediateRender: false }, 1.3)
      .to(E, { energy: 0.26, rise: 0.36, duration: 2.4, ease: 'power2.inOut' }, 2.3)
      // the Swoosh emerges from the light
      .set(E, { swX: sw.x, swY: sw.y, swScale: sw.scale, swForm: 0, sw: 0, swBreath: 1 }, 1.3)
      .to(E, { sw: 1, duration: 0.6, ease: 'power2.out' }, 1.35)
      .to(E, { swForm: 1, duration: 1.5, ease: 'power3.out' }, 1.35)
      .call(() => activate('summary'), null, 1.55)
      .fromTo('.summary-title', { '--dc': 1.6, opacity: 1 }, { '--dc': 0, duration: 1.4, ease: 'expo.out', immediateRender: false }, 1.6)
      .fromTo('.summary [data-in]', { opacity: 0, y: 20, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: 0.08, clearProps: 'filter' }, 1.75)
      .call(() => setState('summary'), null, 2.1);
  }

  function leaveSummary(then) {
    gsap.timeline()
      .to(['.summary [data-in]', '.summary-title'], { opacity: 0, y: 10, filter: 'blur(8px)', duration: 0.35, ease: 'power2.in', stagger: 0.03 })
      .call(then);
  }
  $('#doneBtn').addEventListener('click', () => {
    if (state !== 'summary') return;
    setState('leaving');
    leaveSummary(() => enterHome(false));
  });
  $('#againBtn').addEventListener('click', () => {
    if (state !== 'summary') return;
    setState('leaving');
    measure();
    const from = rectToP($('#againBtn').getBoundingClientRect());
    haptic(40);
    leaveSummary(() => { activate(); launch(0.7, from); });
  });

  // ── GOAL SHEET ────────────────────────────────────────────────────────
  let goal = store.get('nrc.goal');
  let draft = null;
  let sheetOpen = false;
  const sheet = $('#goalSheet');
  const backdrop = $('#sheetBackdrop');
  const SPEC = {
    distance: { step: 0.5, min: 0.5, max: 42.2, def: 5, unit: 'Kilometres', presets: [[3, '3K'], [5, '5K'], [10, '10K'], [21.1, 'Half']] },
    time: { step: 5, min: 5, max: 240, def: 30, unit: 'Minutes', presets: [[20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '60 min']] },
  };
  const goalText = (g) => (g.type === 'time' ? `${g.value} min` : `${g.value.toFixed(2)} km`);

  function updateGoalUI() {
    $('#goalChip').hidden = !goal;
    if (goal) $('#goalChipValue').textContent = goalText(goal);
    $('#goalBtn').textContent = goal ? 'Edit goal' : 'Set a goal';
  }

  function renderSheet(dir = 0) {
    const spec = SPEC[draft.type];
    $('#segDistance').setAttribute('aria-selected', String(draft.type === 'distance'));
    $('#segTime').setAttribute('aria-selected', String(draft.type === 'time'));
    $('#goalValue').textContent = draft.type === 'time' ? String(draft.value) : draft.value.toFixed(2);
    $('#goalUnit').textContent = spec.unit;
    const pres = $('#presets');
    pres.textContent = '';
    for (const [v, label] of spec.presets) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.setAttribute('aria-pressed', String(Math.abs(draft.value - v) < 1e-6));
      b.addEventListener('click', () => { const d = Math.sign(v - draft.value); draft.value = v; renderSheet(d); haptic(8); });
      pres.appendChild(b);
    }
    $('#clearGoalBtn').hidden = !goal;
    if (dir) gsap.fromTo('#goalValue', { y: dir * -14, opacity: 0.35 }, { y: 0, opacity: 1, duration: 0.4, ease: 'expo.out' });
  }

  function stepGoal(dir) {
    const spec = SPEC[draft.type];
    let v = draft.value + dir * spec.step;
    if (draft.type === 'distance') v = Math.round(v * 10) / 10;
    v = Math.min(spec.max, Math.max(spec.min, v));
    if (v === draft.value) return;
    draft.value = v;
    haptic(6);
    renderSheet(dir);
  }

  function openSheet() {
    if (state !== 'home' || sheetOpen) return;
    sheetOpen = true;
    draft = goal ? { ...goal } : { type: 'distance', value: SPEC.distance.def };
    renderSheet();
    sheet.hidden = false;
    backdrop.hidden = false;
    gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out' });
    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    gsap.to(E, { energy: 0.18, sw: 0.45, duration: 0.6, overwrite: 'auto' });
    $('#setGoalBtn').focus({ preventScroll: true });
  }
  function closeSheet(pulse = false) {
    if (!sheetOpen) return;
    sheetOpen = false;
    gsap.to(sheet, { yPercent: 100, duration: 0.38, ease: 'power3.in', onComplete: () => { sheet.hidden = true; gsap.set(sheet, { y: 0 }); } });
    gsap.to(backdrop, { opacity: 0, duration: 0.3, onComplete: () => { backdrop.hidden = true; } });
    gsap.to(E, { energy: 0.34, sw: 0.85, duration: 0.8, overwrite: 'auto' });
    if (pulse) {
      gsap.set(E, { ringX: home.sw.x, ringY: home.sw.y, ringR: 0.03 });
      gsap.fromTo(E, { ringA: 0.8 }, { ringA: 0, duration: 1.1, ease: 'power2.in', delay: 0.2 });
      gsap.to(E, { ringR: 0.7, duration: 1.1, ease: 'expo.out', delay: 0.2 });
    }
  }
  $('#goalBtn').addEventListener('click', openSheet);
  $('#goalChip').addEventListener('click', openSheet);
  $('#sheetClose').addEventListener('click', () => closeSheet());
  backdrop.addEventListener('click', () => closeSheet());
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  $('#segDistance').addEventListener('click', () => { if (draft.type !== 'distance') { draft = { type: 'distance', value: SPEC.distance.def }; renderSheet(); } });
  $('#segTime').addEventListener('click', () => { if (draft.type !== 'time') { draft = { type: 'time', value: SPEC.time.def }; renderSheet(); } });
  $('#stepUp').addEventListener('click', () => stepGoal(1));
  $('#stepDown').addEventListener('click', () => stepGoal(-1));
  $('#setGoalBtn').addEventListener('click', () => {
    goal = { ...draft };
    store.set('nrc.goal', goal);
    updateGoalUI();
    haptic(20);
    closeSheet(true);
  });
  $('#clearGoalBtn').addEventListener('click', () => {
    goal = null;
    store.set('nrc.goal', null);
    updateGoalUI();
    closeSheet();
  });

  // scrub the value horizontally, like a dial
  const readout = $('#goalReadout');
  let scrub = null;
  readout.addEventListener('pointerdown', (e) => { scrub = { x: e.clientX, acc: 0 }; readout.setPointerCapture?.(e.pointerId); });
  readout.addEventListener('pointermove', (e) => {
    if (!scrub) return;
    scrub.acc += e.clientX - scrub.x;
    scrub.x = e.clientX;
    while (Math.abs(scrub.acc) > 22) { const d = Math.sign(scrub.acc); stepGoal(d); scrub.acc -= d * 22; }
  });
  readout.addEventListener('pointerup', () => { scrub = null; });
  readout.addEventListener('pointercancel', () => { scrub = null; });

  // swipe the sheet down to dismiss
  let drag = null;
  $('.sheet-head').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; drag = { y: e.clientY }; e.currentTarget.setPointerCapture?.(e.pointerId); });
  $('.sheet-head').addEventListener('pointermove', (e) => { if (drag) gsap.set(sheet, { y: Math.max(0, e.clientY - drag.y) }); });
  $('.sheet-head').addEventListener('pointerup', (e) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    drag = null;
    if (dy > 90) closeSheet(); else gsap.to(sheet, { y: 0, duration: 0.4, ease: 'expo.out' });
  });

  // ── frame update ──────────────────────────────────────────────────────
  function update(dt, dtReal) {
    if (pressing) {
      // charge approaches 1 with a long, physical ease-out (≈90% after 2 s)
      charge += (1 - charge) * Math.min(1, dt * 1.15);
      E.charge = charge;
      gsap.set('.home .intro', { '--dc': charge * 0.55 });
      gsap.set(startBtn, { scale: 0.955 - charge * 0.02, '--charge': charge * 0.55 });
      if (charge > 0.5 && !update.h1) { update.h1 = true; haptic(10); }
      if (charge > 0.9 && !update.h2) { update.h2 = true; haptic(16); }
    } else {
      update.h1 = update.h2 = false;
    }

    if (state === 'run') {
      sim.update(dtReal);
      renderRun();
      if (runLive) {
        const k = Math.min(1, dt * 1.4);
        const tp = paused ? 0.22 : 0.38 + 0.4 * sim.intensity;
        const td = paused ? 0.7 : 0.8 + 0.5 * sim.intensity;
        const tf = paused ? 0.2 : 0.6 + 1.4 * sim.intensity;
        E.perim += (tp - E.perim) * k;
        if (!holdTl) E.perimDrive += (td - E.perimDrive) * k;
        E.flow += (tf - E.flow) * k;
      }
    }
  }

  function onResize() {
    if (state === 'home') {
      layoutHome();
      aimCta(home.cta);
      Object.assign(E, { swX: home.sw.x, swY: home.sw.y, swScale: home.sw.scale, originX: home.cta.x, originY: home.cta.y });
    }
  }
  window.addEventListener('resize', () => setTimeout(onResize, 140));

  // keep the timer honest when the tab is hidden and returns
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') gsap.ticker.lagSmoothing(500, 33);
  });

  enterHome(true);

  return { update, get state() { return state; }, sim, debug: { launch, countdown, startRun, endRun, enterHome, openSheet } };
}

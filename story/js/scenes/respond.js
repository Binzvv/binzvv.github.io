// 04 — RESPOND · Personality
// Say something. The entity answers with its whole body, and its voice takes a typographic shape.

import gsap from 'gsap';
import { state, motion, reduced, cssVar } from '../state.js';
import { fitText, splitChars } from '../fit.js';
import { MOODS, respond, poke } from '../personality.js';
import { drawEntity, makeParams, lerpParams, EXPRESSIONS } from '../entity.js';

const el = document.querySelector('.s4');
const canvas = el.querySelector('.s4-canvas');
const ctx = canvas.getContext('2d');
const voiceBox = el.querySelector('.s4-voice');
const voice = el.querySelector('.s4-voice-text');
const moodOut = el.querySelector('.s4-mood-val');
const form = el.querySelector('.s4-form');
const input = el.querySelector('.s4-input');
const INTRO = 'What if brand had a personality?';

const p = makeParams('neutral');
let mood = 'neutral', expr = 'neutral';
let active = false, t = 0, blink = { v: 1 }, nextBlink = 2;
let typingTimer = 0, idle = 0, kick = { v: 0 };
const ptr = { x: 0, y: 0 }, look = { x: 0, y: 0 };
let W = 0, H = 0, dpr = 1, geo = { cx: 0, cy: 0, R: 100 };

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = el.clientWidth || window.innerWidth; H = el.clientHeight || window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const portrait = H > W;
  geo = portrait
    ? { cx: W * 0.5, cy: H * 0.29, R: Math.min(W * 0.27, H * 0.13) }
    : { cx: W * 0.25, cy: H * 0.5, R: Math.min(W * 0.15, H * 0.24) };
  fitVoice();
}

function fitVoice() {
  const r = voiceBox.getBoundingClientRect();
  if (!r.width) return;
  voice.style.fontSize = `${fitText(voice, r.width, r.height, { max: Math.min(220, r.height) }) * 0.94}px`;
}

function colors() {
  return { body: MOODS[mood].color || cssVar('--accent') || '#ff2e1f', eye: '#f4f1ea', ink: '#0a0a0a' };
}

function setExpression(name) { expr = name; }

function tick(_time, dtMs) {
  const dt = Math.min(dtMs / 1000, 0.05);
  t += dt * (reduced ? 0.25 : 1);
  idle += dt;
  if (typingTimer > 0) { typingTimer -= dt; if (typingTimer <= 0) setExpression(mood); }

  // Where is it looking? At you, at what you're typing, or around the room when bored.
  let tx = ptr.x, ty = ptr.y;
  if (document.activeElement === input) {
    const r = input.getBoundingClientRect();
    tx = gsap.utils.clamp(-1, 1, (r.left + Math.min(r.width, input.value.length * 18) - geo.cx) / (geo.R * 3));
    ty = gsap.utils.clamp(-1, 1, (r.top - geo.cy) / (geo.R * 3));
  } else if (idle > 7) {
    tx = Math.sin(t * 0.7) * 0.9; ty = Math.cos(t * 0.45) * 0.4;
  }
  look.x += (tx - look.x) * 0.12; look.y += (ty - look.y) * 0.12;

  nextBlink -= dt;
  if (nextBlink < 0 && !reduced) {
    nextBlink = 1.8 + Math.random() * 3.5;
    gsap.fromTo(blink, { v: 1 }, { v: 0.05, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.in' });
  }

  lerpParams(p, EXPRESSIONS[expr], reduced ? 0.3 : (state.world === 'silence' ? 0.05 : state.world === 'noise' ? 0.22 : 0.1));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawEntity(ctx, p, t, geo.cx, geo.cy - kick.v * geo.R * 0.15, geo.R * (1 + kick.v * 0.06), look, colors(), blink.v);
}

function speak(text, m) {
  const chars = splitChars(voice, text);
  fitVoice();
  const accent = MOODS[m]?.color;
  gsap.set(voice, { color: accent || (m === 'joy' || m === 'surprised' ? cssVar('--accent') : cssVar('--fg')), x: 0, rotation: 0 });
  if (reduced) { gsap.fromTo(chars, { opacity: 0 }, { opacity: 1, duration: 0.25 }); return; }
  const slow = state.world === 'silence' ? 1.6 : state.world === 'noise' ? 0.7 : 1;
  const R = gsap.utils.random;
  switch (m) {
    case 'joy':
      gsap.fromTo(chars, { yPercent: 130, rotation: () => R(-25, 25), opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, duration: 0.7 * slow, ease: 'back.out(2.4)', stagger: 0.025 * slow });
      break;
    case 'angry':
      gsap.fromTo(chars, { scale: 2.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'steps(3)', stagger: 0.018 });
      gsap.fromTo(voice, { x: -16 }, { x: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.12)', delay: 0.3 });
      break;
    case 'sad':
      gsap.fromTo(chars, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 1.2 * slow, ease: 'power2.out', stagger: 0.03 * slow });
      gsap.to(chars, { y: () => R(4, 18), rotation: () => R(-7, 7), duration: 2.6, ease: 'sine.inOut', delay: 1.1 * slow, stagger: 0.02 });
      break;
    case 'love':
      gsap.fromTo(chars, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.1 * slow, ease: 'elastic.out(1, 0.45)', stagger: 0.035 });
      gsap.fromTo(voice, { scale: 1 }, { scale: 1.04, duration: 0.18, yoyo: true, repeat: 5, ease: 'power1.inOut', transformOrigin: '0% 100%', delay: 0.7 });
      break;
    case 'surprised':
      gsap.fromTo(chars, { scale: 0, rotation: () => R(-70, 70) }, { scale: 1, rotation: 0, duration: 0.55 * slow, ease: 'back.out(3)', stagger: { each: 0.02, from: 'random' } });
      break;
    case 'confused': {
      const glyphs = '?*#%&@/\\<>';
      chars.forEach((c, i) => {
        const real = c.textContent;
        const o = { n: 0 };
        gsap.to(o, { n: 1, duration: 0.5 + i * 0.03, ease: 'none', onUpdate: () => { c.textContent = o.n < 1 && real.trim() ? glyphs[(Math.random() * glyphs.length) | 0] : real; } });
      });
      gsap.fromTo(voice, { rotation: -3 }, { rotation: 0, duration: 1.4, ease: 'elastic.out(1, 0.3)', transformOrigin: '0% 100%' });
      break;
    }
    default:
      gsap.fromTo(chars, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 * slow, ease: 'power3.out', stagger: 0.018 * slow });
  }
}

function react(m, reply, impulse = 1) {
  mood = m;
  setExpression(m);
  moodOut.textContent = `Mood · ${MOODS[m].label}`;
  idle = 0;
  if (!reduced) {
    gsap.fromTo(kick, { v: impulse }, { v: 0, duration: m === 'angry' ? 0.4 : 1, ease: m === 'sad' ? 'power2.out' : 'elastic.out(1, 0.35)' });
  }
  speak(reply, m);
}

function submit(text) {
  const msg = text.trim();
  if (!msg) { gsap.fromTo(input, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }); return; }
  const r = respond(msg, state.world);
  Object.assign(state.respond, { message: msg, mood: r.mood, reply: r.reply });
  state.respond.history.push({ message: msg, mood: r.mood });
  react(r.mood, r.reply);
  input.value = '';
}

export default {
  el,
  cue: 'Say something',
  cursor: 'Poke it',
  init() {
    resize();
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(input.value); });
    el.querySelectorAll('[data-say]').forEach((b) => b.addEventListener('click', () => submit(b.dataset.say)));
    input.addEventListener('input', () => {
      idle = 0; typingTimer = 1.2; setExpression('listening');
      if (!reduced) gsap.fromTo(kick, { v: 0.35 }, { v: 0, duration: 0.35, ease: 'power2.out', overwrite: true });
    });
    window.addEventListener('pointermove', (e) => {
      if (!active) return;
      idle = 0;
      ptr.x = gsap.utils.clamp(-1, 1, (e.clientX - geo.cx) / (geo.R * 3));
      ptr.y = gsap.utils.clamp(-1, 1, (e.clientY - geo.cy) / (geo.R * 3));
    }, { passive: true });
    canvas.addEventListener('pointerdown', (e) => {
      if (Math.hypot(e.clientX - geo.cx, e.clientY - geo.cy) > geo.R * 1.25) return;
      state.respond.pokes++;
      const r = poke(state.respond.pokes - 1, state.world);
      react(r.mood, r.reply, 1.4);
    });
  },
  enter() {
    active = true;
    resize();
    gsap.ticker.add(tick);
    const tl = gsap.timeline();
    if (!state.respond.reply) speak(INTRO, 'neutral');
    else speak(state.respond.reply, state.respond.mood);
    if (!reduced) tl.fromTo(p, { scale: 0.001 }, { scale: EXPRESSIONS[expr].scale, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, 0.1)
      .fromTo(form, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.5);
    return tl;
  },
  leave() {
    input.blur();
    const tl = gsap.timeline({ onComplete: () => { active = false; gsap.ticker.remove(tick); } });
    if (!reduced) tl.to(p, { scale: 0.001, duration: 0.5, ease: 'back.in(2)' }, 0).to(voice, { opacity: 0, duration: 0.4 }, 0).set(voice, { opacity: 1 });
    return tl;
  },
  resize,
  getMood: () => mood,
};

/* ==========================================================================
   NC-OS interface
   Renders engine state and sends actions back to the engine. It holds no
   rules: what is possible comes from NCOS_ENGINE.optionsFor(), what is said
   comes from NCOS_OPERATOR.speak(). Each background gets its own interaction
   pattern: chat for the street, a contract for corpo, a terminal for runners.
   ========================================================================== */
(function (global) {
  'use strict';
  const E = global.NCOS_ENGINE; const OP = global.NCOS_OPERATOR;
  const $ = (s, c = document) => c.querySelector(s);
  const KEY = 'ncos:v1';
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = (n) => '€$' + Math.round(Math.abs(n)).toLocaleString();

  const OPERATORS = {
    none: { name: 'NC-OS', role: 'Identity unverified', img: null },
    street: { name: 'Auntie Rust', role: 'Backroom ripper, cash only', img: 'img/char-rust.jpg' },
    corpo: { name: 'Domino Reck', role: 'Hakuren liaison', img: 'img/char-domino.jpg' },
    netrunner: { name: 'Ghostline', role: 'Node operator, Vesna Koi', img: 'img/char-vesna.jpg' },
  };
  const TRUST_LABEL = { street: 'Rust’s trust', corpo: 'Trust rating', netrunner: 'Node trust' };
  const APPLY_LABEL = { street: 'Ask about it', corpo: 'Apply', netrunner: 'Target' };

  /* how the visitor's own choice reads in the transcript */
  const SAY = {
    street: { pay: 'here. cash.', haggle: 'that’s steep. do better.', favour: 'put it on my tab.', used: 'got a used one?', walk: 'forget it.', 'vouch-kid': 'kid halcyon sent me.', 'vouch-rat': 'rail rat sent me.', ack: 'i’m sure.', 'do-job': 'fine. i’ll do it.', 'refuse-job': 'no.', continue: '' },
    corpo: { sign: 'Signed.', 'strike-telemetry': 'I would like the telemetry clause removed.', 'strike-exclusivity': 'I would like the exclusivity clause removed.', challenge: 'These terms are unfair.', outright: 'I will pay in full.', walk: 'I decline.', loyalty: 'I accept the loyalty clause.', ack: 'I understand. Proceed.', continue: '' },
    netrunner: { probe: '> probe', 'exploit:spoof': '> exploit --spoof', 'exploit:overload': '> exploit --overload', 'exploit:backdoor': '> exploit --backdoor', brute: '> bruteforce', walk: '> disconnect', ack: '> override', burn: '> burn identity', keep: '> keep running', continue: '' },
  };

  let state = E.initialState(); let feed = []; const subs = [];
  const signals = { keyboard: false, skippedBootByKey: false, touch: matchMedia('(pointer: coarse)').matches, hour: new Date().getHours() };
  addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key.startsWith('Arrow')) signals.keyboard = true; });

  try { const saved = JSON.parse(sessionStorage.getItem(KEY)); if (saved && saved.state && saved.state.v === 1) { state = saved.state; feed = saved.feed || []; } } catch (e) { /* storage unavailable: start fresh */ }
  const persist = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ state, feed: feed.slice(-80) })); } catch (e) { /* ignore */ } };

  const el = {};
  function dispatch(action, userLine) {
    if (userLine) feed.push({ who: 'you', text: userLine });
    const prev = state;
    const r = E.reduce(state, action); state = r.state;
    const speaker = ev => ev.type === 'scan' ? 'NC-OS' : OPERATORS[state.background || 'none'].name;
    for (const ev of r.events) for (const t of OP.speak(ev, Object.freeze(JSON.parse(JSON.stringify(state))))) feed.push({ who: 'op', name: speaker(ev), text: t });
    if (r.events.some((e) => e.type === 'invalid')) feed.push({ who: 'sys', text: 'That option is not available right now.' });
    const hadFocus = el.root.contains(document.activeElement);
    persist(); render(prev, hadFocus);
    const g = global.SL && global.SL.glitch;
    if (g && r.events.some((e) => ['installed', 'frozen', 'blacklisted', 'trace', 'locked', 'miss', 'noncompliant', 'haggle-fail'].includes(e.type))) g(0.6, 220);
    subs.forEach((fn) => fn(state));
  }

  /* ---------- effect chips: the cost of a choice, before you make it ---------- */
  function chips(fx) {
    const out = [];
    if (fx.unknown) return '<span class="fx-chip is-unknown">Outcome unknown</span>';
    const c = (cls, t) => out.push(`<span class="fx-chip ${cls}">${t}</span>`);
    if (fx.credits) c(fx.credits < 0 ? 'is-cost' : 'is-gain', `${fx.credits < 0 ? '−' : '+'}${eur(fx.credits)}`);
    if (fx.debt) c('is-cost', `Debt +${eur(fx.debt)}`);
    if (fx.humanity) c('is-human', `Humanity ${fx.humanity > 0 ? '+' : '−'}${Math.abs(fx.humanity)}`);
    if (fx.trust) c(fx.trust > 0 ? 'is-gain' : 'is-cost', `Trust ${fx.trust > 0 ? '+' : '−'}${Math.abs(fx.trust)}`);
    if (fx.exposure) c(fx.exposure > 0 ? 'is-cost' : 'is-gain', `Exposure ${fx.exposure > 0 ? '+' : '−'}${Math.abs(fx.exposure)}`);
    if (fx.price) c(fx.price > 0 ? 'is-cost' : 'is-gain', `Price ${fx.price > 0 ? '+' : '−'}${eur(fx.price)}`);
    if (fx.interest) c('is-cost', `Interest ${fx.interest}%`);
    return out.join('');
  }
  function optButton(o, extraCls) {
    const say = (SAY[state.background] || {})[o.id];
    return `<button type="button" class="ncos-opt ${extraCls || ''}${o.danger ? ' is-danger' : ''}" data-opt="${esc(o.id)}" data-say="${esc(say !== undefined ? say : o.label)}" ${o.enabled ? '' : 'disabled'}>
      <span class="ncos-opt__label">${esc(o.label)}</span>
      <span class="ncos-opt__fx">${o.enabled ? chips(o.effects) : `<span class="fx-chip is-off">${esc(o.reason || 'Unavailable')}</span>`}</span>
      ${o.note ? `<span class="ncos-opt__note">${esc(o.note)}</span>` : ''}
      ${o.rule ? `<span class="ncos-opt__rule">${o.rule}</span>` : ''}
    </button>`;
  }

  /* ---------- prompt: what the visitor can do now ---------- */
  function promptHTML() {
    const s = state; const opts = E.optionsFor(s); const bg = s.background;
    if (s.phase === 'unscanned') {
      return `<div class="ncos-scan"><p>NC-OS reads how you arrived before it decides what you can become. It uses your input method and your local time, nothing else.</p>
        <button type="button" class="ncos-big" data-act="scan">Scan my identity</button></div>`;
    }
    if (s.phase === 'scanned') {
      return `<div class="ncos-paths" role="group" aria-label="Choose your background">${opts.map((o) => {
        const b = E.BACKGROUNDS[o.arg];
        return `<button type="button" class="ncos-path ncos-path--${b.id}" data-opt="${o.id}" data-say="${esc(b.name)}">
          <span class="ncos-path__name">${b.name}</span>
          ${o.suggested ? '<span class="ncos-path__tag">Inferred</span>' : ''}
          <span class="ncos-path__pitch">${esc(b.pitch)}</span>
          <span class="ncos-path__stats">${eur(b.start.credits)} &nbsp; Humanity ${b.start.humanity} &nbsp; Trust ${b.start.trust} &nbsp; Exposure ${b.start.exposure}</span>
        </button>`;
      }).join('')}</div><p class="ncos-fine">Your background is permanent for this session.</p>`;
    }
    if (s.phase === 'catalog') {
      const cat = E.catalog(s);
      return `<ul class="ncos-cat">${cat.map((c) => `<li class="ncos-item is-${c.status}">
          <span class="ncos-item__slot">${c.slot}</span>
          <span class="ncos-item__name">${esc(c.name)}</span>
          <span class="ncos-item__note">${esc(c.note)}</span>
          <span class="ncos-item__meta">${bg === 'netrunner' ? `ICE ${c.ice || 'unknown'}` : eur(c.price)}${c.restricted ? ' &nbsp; Restricted' : ''}${c.hot ? ' &nbsp; Hot' : ''} &nbsp; Humanity −${c.humanity}</span>
          ${c.status === 'available' ? `<button type="button" class="ncos-item__go" data-act="apply" data-ware="${c.id}" data-say="${esc(bg === 'netrunner' ? '> target ' + c.id : bg === 'corpo' ? 'I would like to apply for the ' + c.name + '.' : 'what about the ' + c.name.toLowerCase() + '?')}">${APPLY_LABEL[bg]}</button>` : `<span class="ncos-item__status">${esc(c.reason)}</span>`}
        </li>`).join('')}</ul>`;
    }
    if (s.phase === 'receipt') {
      const r = s.receipt; const rows = [['humanity', 'Humanity', (v) => v + '%'], ['credits', 'Credits', eur], ['debt', 'Debt', eur], ['trust', TRUST_LABEL[bg], (v) => v], ['exposure', 'Exposure', (v) => v + '%']];
      return `<div class="ncos-receipt"><p class="ncos-receipt__title">The cost of ${esc(r.name)}</p>
        <table><tbody>${rows.map(([k, label, f]) => { const d = r.after[k] - r.before[k]; return `<tr class="${d ? 'is-changed' : ''}"><th scope="row">${label}</th><td>${f(r.before[k])}</td><td aria-hidden="true">to</td><td>${f(r.after[k])}</td></tr>`; }).join('')}</tbody></table>
        ${r.obligations.length ? `<p class="ncos-receipt__owe">You now owe: ${r.obligations.map(esc).join(' ')}</p>` : ''}
        ${optButton(opts[0], 'ncos-opt--continue')}</div>`;
    }
    if (s.phase === 'settle') return `<div class="ncos-opts ncos-opts--settle">${opts.map((o) => optButton(o)).join('')}</div>`;
    if (s.phase === 'trace') return `<div class="ncos-opts ncos-opts--trace">${opts.map((o) => optButton(o)).join('')}</div>`;
    if (s.phase !== 'offer') return '';

    const o = s.offer; const w = E.WARE[o.ware];
    if (bg === 'corpo' && o.stage === 'contract') {
      const by = (id) => opts.find((x) => x.id === id);
      const CLAUSE = {
        telemetry: ['Telemetry', `The ${w.name} reports usage and location to Hakuren.`, 'strike-telemetry'],
        exclusivity: ['Exclusivity', 'Maintenance, repair and removal only at Hakuren clinics.', 'strike-exclusivity'],
        repossession: ['Recovery', `If payments lapse, Hakuren recovers the ${w.name}.`, null],
      };
      return `<form class="ncos-contract" data-form="sign">
        <p class="ncos-contract__head">Hakuren Wellness <span>Upgrade agreement, ${esc(w.name)}</span></p>
        <dl class="ncos-contract__sum"><dt>Financed amount</dt><dd>${eur(o.price)}</dd><dt>Interest</dt><dd>${Math.round(o.interest * 100)}%</dd><dt>Total owed</dt><dd>${eur(o.price * (1 + o.interest))}</dd><dt>Current balance</dt><dd>${eur(s.debt)}</dd></dl>
        <ol class="ncos-contract__clauses">${o.clauses.map((c) => { const [t, d, strike] = CLAUSE[c]; const so = strike && by(strike); return `<li><b>${t}.</b> ${esc(d)}${so ? ` <button type="button" class="ncos-strike" data-opt="${so.id}" data-say="${esc(SAY.corpo[so.id])}" ${so.enabled ? '' : 'disabled'}>Request removal</button> <span class="ncos-opt__fx">${so.enabled ? chips(so.effects) : `<span class="fx-chip is-off">${esc(so.reason)}</span>`}</span>` : ''}</li>`; }).join('')}</ol>
        <label class="ncos-sign"><span>Sign with your full name</span><input id="ncosSignName" name="name" autocomplete="name" required minlength="2" placeholder="Full name" value="${esc(s.signature || '')}" /></label>
        <div class="ncos-contract__actions">${optButton(by('sign'), 'ncos-opt--primary')}${optButton(by('outright'))}${optButton(by('challenge'))}${optButton(by('walk'))}</div>
      </form>`;
    }
    if (bg === 'netrunner' && o.stage === 'breach') {
      const ice = s.iceKnown[o.ware] ? s.ice[o.ware] : null;
      return `<div class="ncos-term">
        <p class="ncos-term__target">target <b>${esc(w.name.toLowerCase())}</b> &nbsp; ice <b>${ice || '????'}</b> &nbsp; misses <b>${o.misses}/2</b> &nbsp; exposure <b>${s.exposure}%</b></p>
        <div class="ncos-opts ncos-opts--term">${opts.map((x) => optButton(x, 'ncos-opt--cmd')).join('')}</div></div>`;
    }
    return `<div class="ncos-opts">${opts.map((x) => optButton(x)).join('')}</div>`;
  }

  /* ---------- ledger: the persistent record ---------- */
  function ledgerHTML() {
    const s = state; const bg = s.background;
    if (!bg) return `<p class="ncos-ledger__empty">No record yet. The system needs to know who you are.</p>`;
    const bar = (v, cls) => `<span class="ncos-bar ${cls || ''}"><i style="--v:${v / 100}"></i></span>`;
    const open = s.obligations.filter((o) => o.status === 'open');
    const flags = [];
    if (s.flags.blacklisted) flags.push('Blacklisted by Rust'); if (s.flags.nonCompliant) flags.push('Non-compliant'); if (s.flags.frozen) flags.push('Account frozen');
    if (s.flags.traced) flags.push('Traced'); if (s.flags.burned) flags.push('Identity burned');
    return `<p class="ncos-ledger__bg">${E.BACKGROUNDS[bg].name}</p>
      <div class="ncos-stat ncos-stat--hum" data-k="humanity"><span>Humanity</span><b>${s.humanity}%</b>${bar(s.humanity)}</div>
      <div class="ncos-stat" data-k="credits"><span>Credits</span><b>${eur(s.credits)}</b></div>
      <div class="ncos-stat" data-k="debt"><span>Corporate debt</span><b>${eur(s.debt)}</b></div>
      <div class="ncos-stat" data-k="trust"><span>${TRUST_LABEL[bg]}</span><b>${s.trust}</b>${bar(s.trust, 'is-trust')}</div>
      <div class="ncos-stat" data-k="exposure"><span>Security exposure</span><b>${s.exposure}%</b>${bar(s.exposure, 'is-exp')}</div>
      ${flags.length ? `<p class="ncos-flags">${flags.map((f) => `<span>${f}</span>`).join('')}</p>` : ''}
      <h3>Installed</h3><ul class="ncos-list">${s.cyberware.length ? s.cyberware.map((c) => `<li>${esc(c.name)} <span>${c.how}, −${c.humanity}</span></li>`).join('') : '<li class="is-none">Nothing yet</li>'}</ul>
      <h3>You owe</h3><ul class="ncos-list">${open.length ? open.map((o) => `<li><b>${esc(o.from)}</b> ${esc(o.text)}</li>`).join('') : '<li class="is-none">Nobody, yet</li>'}</ul>
      <details class="ncos-rules"><summary>Rules applied (${s.log.length})</summary><ol>${s.log.slice().reverse().slice(0, 30).map((l) => `<li>${l.rule ? `<b>${l.rule}</b> ` : ''}${esc(l.text)}${l.delta ? ` <span>${Object.entries(l.delta).filter(([, v]) => v).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ')}</span>` : ''}</li>`).join('')}</ol></details>`;
  }

  function render(prev, keepFocus) {
    const s = state; const bg = s.background || 'none';
    el.root.dataset.path = bg; el.root.dataset.phase = s.phase;
    const op = OPERATORS[bg];
    el.opName.innerHTML = `<b>${op.name}</b><span>${op.role}</span>`;
    el.opImg.hidden = !op.img; if (op.img && el.opImg.getAttribute('src') !== op.img) el.opImg.src = op.img;
    el.feed.innerHTML = feed.map((m) => `<li class="ncos-msg ncos-msg--${m.who}">${m.who === 'op' ? `<span class="ncos-msg__who">${esc(m.name || op.name)}</span>` : ''}<span class="ncos-msg__text">${esc(m.text)}</span></li>`).join('');
    el.feed.scrollTop = el.feed.scrollHeight;
    el.prompt.innerHTML = promptHTML();
    el.ledger.innerHTML = ledgerHTML();
    if (prev && prev.background) {
      for (const k of ['humanity', 'credits', 'debt', 'trust', 'exposure']) {
        if (prev[k] !== s[k]) { const n = el.ledger.querySelector(`[data-k="${k}"]`); if (n) n.classList.add(s[k] > prev[k] === (k === 'humanity' || k === 'credits' || k === 'trust') ? 'is-up' : 'is-down'); }
      }
    }
    if (keepFocus) { const first = el.prompt.querySelector('input, button:not([disabled])'); if (first) first.focus({ preventScroll: true }); }
  }

  function bind() {
    el.root = $('#ncos'); if (!el.root) return false;
    el.feed = $('#ncosFeed'); el.prompt = $('#ncosPrompt'); el.ledger = $('#ncosLedger'); el.opImg = $('#ncosOpImg'); el.opName = $('#ncosOpName');
    el.prompt.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.act === 'scan') { feed.push({ who: 'you', text: 'Scan me.' }); dispatch({ type: 'SCAN', signals }); return; }
      if (b.dataset.act === 'apply') { dispatch({ type: 'APPLY', ware: b.dataset.ware }, b.dataset.say); return; }
      const opt = b.dataset.opt; if (!opt) return;
      if (opt.startsWith('choose:')) { dispatch({ type: 'CHOOSE', bg: opt.slice(7) }, `I am ${b.dataset.say}.`); return; }
      if (opt === 'sign') {
        e.preventDefault();
        const input = $('#ncosSignName'); const name = input ? input.value : '';
        if (name.trim().length < 2) { input.focus(); input.setAttribute('aria-invalid', 'true'); feed.push({ who: 'sys', text: 'Type your full name to sign.' }); render(null, true); return; }
        dispatch({ type: 'ACT', option: 'sign', name }, `Signed: ${name.trim()}`); return;
      }
      dispatch({ type: 'ACT', option: opt }, b.dataset.say || null);
    });
    el.prompt.addEventListener('submit', (e) => { e.preventDefault(); const b = el.prompt.querySelector('[data-opt="sign"]'); if (b && !b.disabled) b.click(); });
    render(null, false);
    return true;
  }

  global.NCOS = {
    get state() { return state; },
    signals,
    subscribe(fn) { subs.push(fn); fn(state); },
    reset() { state = E.initialState(); feed = []; try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ } render(null, false); subs.forEach((fn) => fn(state)); },
    dispatch: (a) => dispatch(a),
    rules: E.RULES,
  };
  if (!bind()) document.addEventListener('DOMContentLoaded', bind);
})(window);

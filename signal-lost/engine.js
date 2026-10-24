/* ==========================================================================
   NC-OS rules engine
   Deterministic, DOM-free and inspectable. Every state change in the
   cyberware application flow happens here, in reduce(). Every choice the
   visitor can make is generated here, by optionsFor().

   Operator contract (for a future AI operator):
   - The operator receives a frozen snapshot of state and the events that
     reduce() emitted, and returns text only (see operator.js).
   - It never mutates state and never invents options. Credits, humanity,
     debt, trust, exposure, obligations and installs are decided by the
     rules below and nowhere else.
   ========================================================================== */
(function (global) {
  'use strict';

  const BACKGROUNDS = {
    street: {
      id: 'street', name: 'Street Kid', operator: 'Auntie Rust', venue: 'Rust’s backroom',
      start: { credits: 1200, humanity: 92, debt: 0, trust: 20, exposure: 15 },
      pitch: 'Black market. Favours, connections and risk. Nobody signs anything.',
    },
    corpo: {
      id: 'corpo', name: 'Corpo', operator: 'Hakuren Wellness', venue: 'Hakuren upgrade programme',
      start: { credits: 5000, humanity: 86, debt: 0, trust: 70, exposure: 25 },
      pitch: 'Luxury upgrades on approved terms. Every contract is a relationship.',
    },
    netrunner: {
      id: 'netrunner', name: 'Netrunner', operator: 'Ghostline', venue: 'a compromised node',
      start: { credits: 700, humanity: 80, debt: 0, trust: 10, exposure: 40 },
      pitch: 'Nothing is for sale. Everything is behind ICE. Break it or leave.',
    },
  };

  const WARE = {
    optic: { name: 'Sentinel optic suite', slot: 'Eyes', power: 1, humanity: 6, price: 1500 },
    armour: { name: 'Subdermal mesh', slot: 'Skin', power: 2, humanity: 10, price: 2500 },
    reflex: { name: 'Kairos reflex booster', slot: 'Spine', power: 3, humanity: 18, price: 4000 },
    cortex: { name: 'Cortex Prime co-processor', slot: 'Brain', power: 2, humanity: 8, price: 7000 },
    deck: { name: 'Blackwire neural deck', slot: 'Brain', power: 3, humanity: 12, price: 3500 },
    cloak: { name: 'Ghostskin thermal cloak', slot: 'Skin', power: 2, humanity: 14, price: 5000 },
  };

  /* each path sees three items, on its own terms */
  const MENUS = {
    street: {
      optic: { mult: 0.8, hot: true, note: 'Lifted from a clinic. Serial filed off.' },
      armour: { mult: 0.8, note: 'Fits most frames. Rust has three.' },
      reflex: { mult: 0.8, note: 'Ex-military. The last owner flatlined.' },
    },
    corpo: {
      optic: { mult: 1.3, note: 'Hakuren certified. Telemetry enabled.' },
      cortex: { mult: 1.3, note: 'Executive tier. Thinks while you sleep.' },
      reflex: { mult: 1.3, restricted: true, note: 'Restricted to security staff.' },
    },
    netrunner: {
      optic: { ice: 'sentry', note: 'Jailbroken firmware behind a sentry program.' },
      deck: { ice: 'wall', note: 'Military deck in a locked vault.' },
      cloak: { ice: 'tracer', note: 'Prototype. Its ICE phones home.' },
    },
  };

  const ICE_ORDER = ['sentry', 'wall', 'tracer'];
  const WEAKNESS = { sentry: 'spoof', wall: 'overload', tracer: 'backdoor' };

  const RULES = {
    'SCAN-1': 'Keyboard use or skipping the boot by key suggests Netrunner.',
    'SCAN-2': 'A mouse during office hours (09:00 to 18:00) suggests Corpo.',
    'SCAN-3': 'Everything else suggests Street Kid.',
    'G-1': 'Installing cyberware subtracts its humanity cost.',
    'G-2': 'Below 60% humanity the operator must warn you before any deal.',
    'S-1': 'Rust refuses anyone who walked out on a job.',
    'S-2': 'An open job for Rust must be settled before a new deal.',
    'S-3': 'Trust under 25 means someone has to vouch for you.',
    'S-4': 'Haggling works at trust 40 or more. Below that the price rises 10% and trust drops 10.',
    'S-5': 'A used part costs half and adds 6 to the humanity cost.',
    'S-6': 'Rust will not chrome anyone under 45% humanity.',
    'S-7': 'Hot parts add 10 exposure.',
    'S-8': 'Paying cash earns 5 trust.',
    'S-9': 'Taking a favour earns 10 trust and opens a job for Rust.',
    'C-1': 'A frozen account cannot apply.',
    'C-2': 'Restricted ware needs trust 80. A loyalty clause adds 15 trust.',
    'C-3': 'Balances over €$8,000 make the repossession clause mandatory.',
    'C-4': 'Existing balances accrue 10% each time you apply.',
    'C-5': 'Striking telemetry adds 22% interest and the repossession clause.',
    'C-6': 'The first challenge marks you non-compliant: trust −15 and a 15% surcharge. A second challenge freezes the account and adds 15 exposure.',
    'C-7': 'Paying outright costs 5 trust, and telemetry stays on (+10 exposure).',
    'C-8': 'Certified installs cost 2 less humanity.',
    'C-9': 'Signing earns 10 trust. Each clause becomes an obligation.',
    'C-10': 'Exclusivity cannot be struck. Asking costs 5 trust.',
    'N-1': 'Each ICE type has one weakness: spoof beats sentry, overload beats wall, backdoor beats tracer.',
    'N-2': 'Probing reveals the ICE type for 5 exposure. At node trust 30 or more, Ghostline tells you for free.',
    'N-3': 'A wrong vector adds 20 exposure and costs 10 node trust. Two misses lock the target.',
    'N-4': 'Brute force always works: +35 exposure, 3 extra humanity cost, −10 node trust.',
    'N-5': 'A clean exploit earns 10 node trust. Unsigned firmware adds 4 humanity cost, and the node keeps a backdoor (+10 exposure).',
    'N-6': 'After every successful breach the remaining ICE rotates: sentry to wall to tracer to sentry.',
    'N-7': 'At 80 exposure a trace begins. Burn your identity (credits to 0, exposure to 30) or keep running and lose the node.',
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function initialState() {
    return {
      v: 1, phase: 'unscanned', background: null,
      credits: 0, humanity: 100, debt: 0, trust: 0, exposure: 0,
      cyberware: [], obligations: [], flags: {},
      ice: {}, iceKnown: {}, locked: {},
      scan: null, offer: null, receipt: null, pendingTrace: false,
      turn: 0, log: [],
    };
  }

  /* ---------- helpers that record why something changed ---------- */
  function log(s, rule, text, delta) { s.log.push({ turn: s.turn, rule, text: text || RULES[rule] || '', delta: delta || null }); }
  function change(s, delta, rule, text) {
    const d = {};
    for (const k of Object.keys(delta)) {
      const before = s[k];
      let after = before + delta[k];
      if (k === 'humanity' || k === 'trust' || k === 'exposure') after = clamp(after, 0, 100);
      if (k === 'credits' || k === 'debt') after = Math.max(0, Math.round(after));
      s[k] = after; d[k] = after - before;
    }
    log(s, rule, text, d);
    return d;
  }
  const owes = (s, from) => s.obligations.some((o) => o.from === from && o.status === 'open');
  const menuOf = (s) => MENUS[s.background] || {};
  const installed = (s, id) => s.cyberware.some((c) => c.id === id);

  /* ---------- the identity scan: real, observable signals only ---------- */
  function inferBackground(signals) {
    const reasons = [];
    if (signals.keyboard || signals.skippedBootByKey) {
      reasons.push(signals.skippedBootByKey ? 'You skipped the boot sequence with a key.' : 'You navigated with the keyboard.');
      return { suggest: 'netrunner', rule: 'SCAN-1', reasons };
    }
    if (!signals.touch && signals.hour >= 9 && signals.hour < 18) {
      reasons.push(`Mouse input at ${String(signals.hour).padStart(2, '0')}:00, inside office hours.`);
      return { suggest: 'corpo', rule: 'SCAN-2', reasons };
    }
    reasons.push(signals.touch ? 'You came in on a touchscreen.' : `Mouse input at ${String(signals.hour).padStart(2, '0')}:00, outside office hours.`);
    return { suggest: 'street', rule: 'SCAN-3', reasons };
  }

  /* ---------- what an item costs this person, right now ---------- */
  function priceOf(s, id) {
    const m = menuOf(s)[id]; if (!m) return 0;
    if (s.background === 'netrunner') return 0;
    let p = WARE[id].price * (m.mult || 1);
    if (s.background === 'corpo' && s.flags.nonCompliant) p *= 1.15;
    return Math.round(p / 10) * 10;
  }

  function catalog(s) {
    return Object.keys(menuOf(s)).map((id) => {
      const m = menuOf(s)[id];
      let status = 'available'; let reason = '';
      if (installed(s, id)) { status = 'installed'; reason = 'Installed'; }
      else if (s.locked[id]) { status = 'locked'; reason = s.locked[id]; }
      else if (s.background === 'street' && s.flags.blacklisted) { status = 'locked'; reason = 'Rust’s door is shut'; }
      else if (s.background === 'corpo' && s.flags.frozen) { status = 'locked'; reason = 'Account frozen'; }
      else if (s.background === 'netrunner' && s.flags.traced) { status = 'locked'; reason = 'Node lost'; }
      return {
        id, ...WARE[id], note: m.note, restricted: !!m.restricted, hot: !!m.hot,
        price: priceOf(s, id), ice: s.background === 'netrunner' ? (s.iceKnown[id] ? s.ice[id] : null) : undefined,
        status, reason,
      };
    });
  }

  /* ---------- options: the only choices the interface may offer ---------- */
  function optionsFor(s) {
    const o = s.offer; const opts = [];
    const add = (id, label, effects, extra) => opts.push({ id, label, effects: effects || {}, enabled: true, ...extra });
    if (s.phase === 'scanned') {
      for (const b of Object.values(BACKGROUNDS)) add('choose:' + b.id, b.name, b.start, { arg: b.id, suggested: s.scan && s.scan.suggest === b.id });
      return opts;
    }
    if (s.phase === 'catalog') {
      for (const c of catalog(s)) add('apply:' + c.id, c.name, {}, { arg: c.id, enabled: c.status === 'available', reason: c.reason });
      return opts;
    }
    if (s.phase === 'receipt') { add('continue', 'Continue'); return opts; }
    if (s.phase === 'settle') {
      add('do-job', 'Do the job', { humanity: -4, exposure: 15, trust: 15 }, { rule: 'S-2' });
      add('refuse-job', 'Refuse', { trust: -40, exposure: 10 }, { rule: 'S-1' });
      return opts;
    }
    if (s.phase === 'trace') {
      add('burn', 'Burn my identity', { credits: -s.credits, exposure: 30 - s.exposure }, { rule: 'N-7' });
      add('keep', 'Keep running', {}, { rule: 'N-7' });
      return opts;
    }
    if (s.phase !== 'offer' || !o) return opts;
    const w = WARE[o.ware];

    if (o.stage === 'warn') { add('ack', 'Proceed anyway', {}, { rule: 'G-2' }); add('walk', 'Walk away'); return opts; }

    if (s.background === 'street') {
      if (o.stage === 'vouch') {
        add('vouch-kid', 'Kid Halcyon vouches for me', { trust: 20 }, { rule: 'S-3', note: 'Kid will want a favour back.' });
        add('vouch-rat', 'Rail Rat vouches for me', { trust: 15, exposure: 10 }, { rule: 'S-3', note: 'Rail Rat talks to everyone.' });
        add('walk', 'Walk away');
        return opts;
      }
      const used = Math.round(o.price * 0.5);
      add('pay', `Pay €$${o.price.toLocaleString()} cash`, { credits: -o.price, humanity: -w.humanity, trust: 5, exposure: o.hot ? 10 : 0 },
        { enabled: s.credits >= o.price, reason: s.credits >= o.price ? '' : 'Not enough credits', rule: 'S-8' });
      add('haggle', 'Haggle', s.trust >= 40 ? { price: -Math.round(o.price * 0.2) } : { price: Math.round(o.price * 0.1), trust: -10 },
        { enabled: !o.haggled, reason: o.haggled ? 'Already haggled' : '', rule: 'S-4' });
      add('favour', 'Owe her a favour', { humanity: -w.humanity, trust: 10, exposure: o.hot ? 10 : 0 },
        { enabled: !owes(s, 'Auntie Rust'), reason: owes(s, 'Auntie Rust') ? 'You already owe her' : '', rule: 'S-9' });
      add('used', `Take a used one, €$${used.toLocaleString()}`, { credits: -used, humanity: -(w.humanity + 6), exposure: o.hot ? 10 : 0 },
        { enabled: s.credits >= used, reason: s.credits >= used ? '' : 'Not enough credits', rule: 'S-5' });
      add('walk', 'Walk away');
      return opts;
    }

    if (s.background === 'corpo') {
      if (o.stage === 'sponsor') {
        add('loyalty', 'Accept the loyalty clause', { trust: 15 }, { rule: 'C-2', note: 'Five years of service to Hakuren.' });
        add('walk', 'Decline');
        return opts;
      }
      const total = Math.round(o.price * (1 + o.interest));
      const sign = { debt: total, humanity: -(w.humanity - 2), trust: 10, exposure: o.clauses.includes('telemetry') ? 20 : 0 };
      add('sign', 'Sign the contract', sign, { rule: 'C-9', needsName: true });
      add('strike-telemetry', 'Strike the telemetry clause', { interest: 22 }, { enabled: !o.negotiated && o.clauses.includes('telemetry'), reason: o.negotiated ? 'Already negotiated' : '', rule: 'C-5' });
      add('strike-exclusivity', 'Strike the exclusivity clause', { trust: -5 }, { enabled: !o.askedExclusivity, reason: o.askedExclusivity ? 'Already refused' : '', rule: 'C-10' });
      add('challenge', 'Challenge these terms', s.flags.nonCompliant ? { exposure: 15 } : { trust: -15, price: Math.round(o.price * 0.15) }, { rule: 'C-6', danger: !!s.flags.nonCompliant });
      add('outright', `Pay €$${o.price.toLocaleString()} outright`, { credits: -o.price, humanity: -(w.humanity - 2), trust: -5, exposure: 10 },
        { enabled: !o.restricted && s.credits >= o.price, reason: o.restricted ? 'Restricted ware is finance only' : (s.credits >= o.price ? '' : 'Not enough credits'), rule: 'C-7' });
      add('walk', 'Decline');
      return opts;
    }

    if (s.background === 'netrunner') {
      const ice = s.iceKnown[o.ware] ? s.ice[o.ware] : null;
      add('probe', 'probe', { exposure: 5 }, { enabled: !ice, reason: ice ? 'ICE identified' : '', rule: 'N-2' });
      for (const v of ['spoof', 'overload', 'backdoor']) {
        const hit = ice ? WEAKNESS[ice] === v : null;
        add('exploit:' + v, 'exploit --' + v,
          hit === null ? { unknown: true } : hit ? { humanity: -(w.humanity + 4), exposure: 10, trust: 10 } : { exposure: 20, trust: -10 },
          { arg: v, rule: hit === null ? 'N-1' : hit ? 'N-5' : 'N-3' });
      }
      add('brute', 'bruteforce', { humanity: -(w.humanity + 3), exposure: 35, trust: -10 }, { rule: 'N-4', danger: true });
      add('walk', 'disconnect');
      return opts;
    }
    return opts;
  }

  /* ---------- installing: the moment the cost lands ---------- */
  function install(s, id, how, extraHumanity) {
    const w = WARE[id];
    const before = s._pre;
    const cost = w.humanity + (extraHumanity || 0);
    change(s, { humanity: -cost }, 'G-1', `${w.name} installed. Humanity cost ${cost}.`);
    s.cyberware.push({ id, name: w.name, slot: w.slot, power: w.power, humanity: cost, how });
    s.receipt = { ware: id, name: w.name, how, before, obligations: [] };
    s.offer = null; s.phase = 'receipt';
  }
  function closeReceipt(s) {
    if (!s.receipt) return;
    const r = s.receipt;
    r.after = { credits: s.credits, humanity: s.humanity, debt: s.debt, trust: s.trust, exposure: s.exposure };
    r.obligations = s.obligations.filter((o) => o.turn === s.turn).map((o) => o.text);
  }
  function oblige(s, from, text, rule) {
    if (s.obligations.some((o) => o.from === from && o.text === text && o.status === 'open')) { log(s, rule, `Existing obligation to ${from} still applies: ${text}`); return; }
    s.obligations.push({ id: `${from}-${s.obligations.length}`, from, text, status: 'open', turn: s.turn }); log(s, rule, `New obligation to ${from}: ${text}`); }

  function startOffer(s, id) {
    const m = menuOf(s)[id];
    const o = { ware: id, price: priceOf(s, id), hot: !!m.hot, restricted: !!m.restricted, haggled: false, negotiated: false, interest: 0, clauses: [], misses: 0, stage: 'deal' };
    if (s.background === 'street') {
      o.stage = s.trust < 25 && !s.flags.vouched ? 'vouch' : 'deal';
      if (o.stage === 'vouch') log(s, 'S-3', `Trust ${s.trust}: needs a vouch.`);
    }
    if (s.background === 'corpo') {
      o.clauses = ['telemetry', 'exclusivity'];
      if (s.debt + o.price > 8000) { o.clauses.push('repossession'); log(s, 'C-3', `Balance would reach €$${(s.debt + o.price).toLocaleString()}: repossession clause added.`); }
      o.stage = o.restricted && s.trust < 80 ? 'sponsor' : 'contract';
      if (o.stage === 'sponsor') log(s, 'C-2', `Trust ${s.trust}: restricted ware needs 80.`);
    }
    if (s.background === 'netrunner') {
      o.stage = 'breach';
      if (!s.iceKnown[id] && s.trust >= 30) { s.iceKnown[id] = true; log(s, 'N-2', `Node trust ${s.trust}: Ghostline shares the ICE type (${s.ice[id]}).`); o.freeIntel = true; }
    }
    o.next = o.stage;
    if (s.humanity < 60) { o.stage = 'warn'; log(s, 'G-2', `Humanity ${s.humanity}%: warning required.`); }
    s.offer = o; s.phase = 'offer';
    return o;
  }

  function rotateIce(s) {
    for (const id of Object.keys(menuOf(s))) {
      if (installed(s, id) || s.locked[id]) continue;
      s.ice[id] = ICE_ORDER[(ICE_ORDER.indexOf(s.ice[id]) + 1) % 3];
      s.iceKnown[id] = false;
    }
    log(s, 'N-6', 'Remaining ICE rotated. Earlier probes are stale.');
  }
  function checkTrace(s, events) {
    if (s.background !== 'netrunner' || s.flags.traced || s.exposure < 80) return;
    if (s.phase === 'receipt') { s.pendingTrace = true; return; }
    s.phase = 'trace'; s.offer = null; log(s, 'N-7', `Exposure ${s.exposure}: trace started.`); events.push({ type: 'trace' });
  }

  /* ---------- the reducer ---------- */
  function reduce(prev, action) {
    const s = clone(prev); const events = []; const ev = (type, data) => events.push({ type, ...(data || {}) });
    s.turn += 1;
    s._pre = { credits: s.credits, humanity: s.humanity, debt: s.debt, trust: s.trust, exposure: s.exposure };
    const o = s.offer; const w = o ? WARE[o.ware] : null;

    switch (action.type) {
      case 'RESET': return { state: initialState(), events: [{ type: 'reset' }] };

      case 'SCAN': {
        if (s.phase !== 'unscanned') break;
        s.scan = inferBackground(action.signals || {});
        log(s, s.scan.rule, s.scan.reasons.join(' '));
        s.phase = 'scanned'; ev('scan', { scan: s.scan });
        break;
      }
      case 'CHOOSE': {
        if (s.phase !== 'scanned' || !BACKGROUNDS[action.bg]) break;
        const b = BACKGROUNDS[action.bg];
        s.background = b.id; Object.assign(s, b.start);
        if (b.id === 'netrunner') for (const id of Object.keys(MENUS.netrunner)) s.ice[id] = MENUS.netrunner[id].ice;
        log(s, null, `Background written: ${b.name}. This cannot be changed.`);
        s.phase = 'catalog'; ev('chosen', { bg: b.id }); ev('catalog');
        break;
      }
      case 'APPLY': {
        if (s.phase !== 'catalog') break;
        const id = action.ware; const item = catalog(s).find((c) => c.id === id);
        if (!item || item.status !== 'available') { ev('denied', { reason: item ? item.reason : 'Unknown item' }); break; }
        if (s.background === 'street') {
          if (s.humanity < 45) { log(s, 'S-6', `Humanity ${s.humanity}%: refused.`); ev('denied', { rule: 'S-6' }); break; }
          if (owes(s, 'Auntie Rust')) { s.offer = { ware: id, pending: true }; s.phase = 'settle'; log(s, 'S-2'); ev('settle', { ware: id }); break; }
        }
        if (s.background === 'corpo' && s.debt > 0) {
          const d = change(s, { debt: Math.round(s.debt * 0.1) }, 'C-4', 'Interest accrued on existing balance.');
          ev('interest', { amount: d.debt });
        }
        const off = startOffer(s, id);
        ev('offer', { ware: id, stage: off.stage, freeIntel: !!off.freeIntel });
        break;
      }
      case 'ACT': {
        const a = action.option;
        if (s.phase === 'receipt' && a === 'continue') {
          s.receipt = null;
          if (s.pendingTrace) { s.pendingTrace = false; s.phase = 'trace'; log(s, 'N-7', `Exposure ${s.exposure}: trace started.`); ev('trace'); break; }
          s.phase = 'catalog'; ev('catalog'); break;
        }
        if (s.phase === 'settle') {
          const ob = s.obligations.find((x) => x.from === 'Auntie Rust' && x.status === 'open');
          if (a === 'do-job') {
            ob.status = 'settled'; change(s, { humanity: -4, exposure: 15, trust: 15 }, 'S-2', 'You did the job. Someone got hurt.');
            ev('job-done');
            const id = s.offer.ware; startOffer(s, id); ev('offer', { ware: id, stage: s.offer.stage });
          } else if (a === 'refuse-job') {
            ob.status = 'defaulted'; s.flags.blacklisted = true; change(s, { trust: -40, exposure: 10 }, 'S-1', 'You refused the job. Rust tells people.');
            s.offer = null; s.phase = 'catalog'; ev('blacklisted'); ev('catalog');
          }
          break;
        }
        if (s.phase === 'trace') {
          if (a !== 'burn' && a !== 'keep') { ev('invalid', { option: a }); break; }
          if (a === 'burn') { s.flags.burned = true; change(s, { credits: -s.credits, exposure: 30 - s.exposure }, 'N-7', 'Identity burned. New face, empty account.'); ev('burned'); }
          else if (a === 'keep') { s.flags.traced = true; log(s, 'N-7', 'You kept running. The node cut you off.'); ev('kept-running'); }
          s.phase = 'catalog'; ev('catalog'); break;
        }
        if (s.phase !== 'offer' || !o) break;
        const opt = optionsFor(s).find((x) => x.id === a);
        if (!opt || !opt.enabled) { ev('invalid', { option: a }); break; }

        if (a === 'walk') { log(s, null, `Walked away from ${w.name}.`); s.offer = null; s.phase = 'catalog'; ev('walk'); ev('catalog'); break; }
        if (a === 'ack') { o.stage = o.next; log(s, 'G-2', 'Warning acknowledged.'); ev('acknowledged'); ev('offer', { ware: o.ware, stage: o.stage }); break; }

        /* street */
        if (a === 'vouch-kid') { s.flags.vouched = true; change(s, { trust: 20 }, 'S-3', 'Kid Halcyon vouched for you.'); oblige(s, 'Kid Halcyon', 'Carry one package across the rail line. Do not open it.', 'S-3'); o.stage = 'deal'; ev('vouched', { by: 'kid' }); break; }
        if (a === 'vouch-rat') { s.flags.vouched = true; change(s, { trust: 15, exposure: 10 }, 'S-3', 'Rail Rat vouched for you, loudly.'); o.stage = 'deal'; ev('vouched', { by: 'rat' }); break; }
        if (a === 'haggle') {
          o.haggled = true;
          if (s.trust >= 40) { const old = o.price; o.price = Math.round(o.price * 0.8 / 10) * 10; log(s, 'S-4', `Trust ${s.trust}: price ${old} to ${o.price}.`); ev('haggle-ok'); }
          else { const old = o.price; o.price = Math.round(o.price * 1.1 / 10) * 10; change(s, { trust: -10 }, 'S-4', `Trust too low. Price ${old} to ${o.price}.`); ev('haggle-fail'); }
          break;
        }
        if (a === 'pay') { change(s, { credits: -o.price, trust: 5 }, 'S-8'); if (o.hot) change(s, { exposure: 10 }, 'S-7'); install(s, o.ware, 'cash'); ev('installed'); break; }
        if (a === 'favour') { change(s, { trust: 10 }, 'S-9'); oblige(s, 'Auntie Rust', 'One job, when she calls. No questions.', 'S-9'); if (o.hot) change(s, { exposure: 10 }, 'S-7'); install(s, o.ware, 'favour'); ev('installed'); break; }
        if (a === 'used') { change(s, { credits: -Math.round(o.price * 0.5) }, 'S-5'); if (o.hot) change(s, { exposure: 10 }, 'S-7'); install(s, o.ware, 'used part', 6); ev('installed'); break; }

        /* corpo */
        if (a === 'loyalty') {
          change(s, { trust: 15 }, 'C-2'); oblige(s, 'Hakuren', 'Five years of service. Early exit forfeits all implants.', 'C-2');
          if (s.trust >= 80) { o.stage = 'contract'; ev('sponsored'); }
          else { s.locked[o.ware] = 'Trust too low, even with sponsorship'; s.offer = null; s.phase = 'catalog'; ev('sponsor-failed'); ev('catalog'); }
          break;
        }
        if (a === 'strike-telemetry') {
          o.negotiated = true; o.clauses = o.clauses.filter((c) => c !== 'telemetry'); if (!o.clauses.includes('repossession')) o.clauses.push('repossession'); o.interest = 0.22;
          log(s, 'C-5', 'Telemetry struck. Interest 22% and repossession added.'); ev('countered'); break;
        }
        if (a === 'strike-exclusivity') { o.askedExclusivity = true; change(s, { trust: -5 }, 'C-10'); ev('refused-strike'); break; }
        if (a === 'challenge') {
          if (!s.flags.nonCompliant) {
            s.flags.nonCompliant = true; const old = o.price; o.price = Math.round(o.price * 1.15 / 10) * 10;
            change(s, { trust: -15 }, 'C-6', `Marked non-compliant. Price ${old} to ${o.price}.`); ev('noncompliant');
          } else {
            s.flags.frozen = true; change(s, { exposure: 15 }, 'C-6', 'Second challenge. Account frozen and referred to legal.');
            s.offer = null; s.phase = 'catalog'; ev('frozen'); ev('catalog');
          }
          break;
        }
        if (a === 'sign') {
          const name = String(action.name || '').trim();
          if (name.length < 2) { ev('needs-name'); break; }
          s.signature = name;
          const total = Math.round(o.price * (1 + o.interest));
          change(s, { debt: total, trust: 10 }, 'C-9', `Signed as ${name}. Financed €$${total.toLocaleString()}.`);
          if (o.clauses.includes('telemetry')) { change(s, { exposure: 20 }, 'C-9', 'Telemetry active.'); oblige(s, 'Hakuren', `Telemetry: the ${w.name} reports to Hakuren.`, 'C-9'); }
          if (o.clauses.includes('exclusivity')) oblige(s, 'Hakuren', 'Maintenance only at Hakuren clinics.', 'C-9');
          if (o.clauses.includes('repossession')) oblige(s, 'Hakuren', `If payments lapse, the ${w.name} is recovered.`, 'C-3');
          install(s, o.ware, 'financed', -2); log(s, 'C-8'); ev('installed'); break;
        }
        if (a === 'outright') {
          change(s, { credits: -o.price, trust: -5, exposure: 10 }, 'C-7');
          oblige(s, 'Hakuren', `Telemetry: the ${w.name} reports to Hakuren.`, 'C-7');
          install(s, o.ware, 'paid outright', -2); log(s, 'C-8'); ev('installed'); break;
        }

        /* netrunner */
        if (a === 'probe') { s.iceKnown[o.ware] = true; change(s, { exposure: 5 }, 'N-2', `ICE identified: ${s.ice[o.ware]}.`); ev('probed', { ice: s.ice[o.ware] }); checkTrace(s, events); break; }
        if (a.startsWith('exploit:')) {
          const v = opt.arg; const ice = s.ice[o.ware];
          if (WEAKNESS[ice] === v) {
            change(s, { trust: 10, exposure: 10 }, 'N-5', `--${v} beat ${ice}.`);
            oblige(s, 'Ghostline', `The node keeps a backdoor in your ${w.name}.`, 'N-5');
            install(s, o.ware, 'clean exploit', 4); rotateIce(s); ev('installed', { clean: true });
          } else {
            o.misses += 1; change(s, { exposure: 20, trust: -10 }, 'N-3', `--${v} bounced off ${ice}.`);
            if (o.misses >= 2) { s.locked[o.ware] = 'ICE hardened'; s.offer = null; s.phase = 'catalog'; ev('locked'); ev('catalog'); }
            else ev('miss', { vector: v });
          }
          checkTrace(s, events); break;
        }
        if (a === 'brute') { change(s, { exposure: 35, trust: -10 }, 'N-4'); install(s, o.ware, 'brute force', 3); rotateIce(s); ev('installed', { brute: true }); checkTrace(s, events); break; }
        break;
      }
      default: break;
    }
    if (s.phase === 'receipt') closeReceipt(s);
    delete s._pre;
    return { state: s, events };
  }

  /* what the city knows about you, as plain sentences */
  function summary(s) {
    if (!s.background) return null;
    const lines = [];
    const power = s.cyberware.reduce((n, c) => n + c.power, 0);
    const lost = BACKGROUNDS[s.background].start.humanity - s.humanity;
    lines.push(s.cyberware.length
      ? `You installed ${s.cyberware.length} upgrade${s.cyberware.length > 1 ? 's' : ''} for ${power} point${power === 1 ? '' : 's'} of power and gave up ${lost}% of your humanity.`
      : 'You walked out with nothing installed. The city noticed anyway.');
    if (s.debt) lines.push(`You owe Hakuren €$${s.debt.toLocaleString()}, and it grows every time you come back.`);
    const open = s.obligations.filter((o) => o.status === 'open');
    if (open.length) lines.push(`Open obligations: ${open.map((o) => `${o.from} (${o.text.replace(/\.$/, '')})`).join('; ')}.`);
    if (s.flags.blacklisted) lines.push('Rust’s door is shut, and she told people why.');
    if (s.flags.frozen) lines.push('Your Hakuren account is frozen and with legal.');
    if (s.flags.traced) lines.push('You kept running. Someone has your face now.');
    if (s.flags.burned) lines.push('You burned your identity. The person who walked in no longer exists.');
    lines.push(`Security exposure ${s.exposure}%. ${s.exposure >= 60 ? 'You are easy to find.' : 'You can still disappear, for now.'}`);
    return lines;
  }

  global.NCOS_ENGINE = Object.freeze({ BACKGROUNDS, WARE, MENUS, RULES, WEAKNESS, initialState, reduce, optionsFor, catalog, summary, inferBackground });
})(window);

/* ==========================================================================
   NC-OS operator voices
   speak(event, state) -> string[]. Reads a frozen snapshot, returns text.
   This is the seam for a future AI operator: swap speak() for a model call
   and keep its output to dialogue. It cannot change state or offer choices;
   engine.js owns both.
   ========================================================================== */
(function (global) {
  'use strict';
  const E = global.NCOS_ENGINE;
  const eur = (n) => '€$' + Math.round(n).toLocaleString();
  const ware = (s, id) => E.WARE[id || (s.offer && s.offer.ware)] || {};
  const owes = (s, from) => s.obligations.some((o) => o.from === from && o.status === 'open');

  const VOICES = {
    street: {
      chosen: () => ['you’re in rust’s backroom now. nobody here has a name, so don’t give me yours.'],
      catalog: (s) => {
        if (s.flags.blacklisted) return ['door’s shut, choom. you know why.'];
        const l = [];
        if (owes(s, 'Kid Halcyon')) l.push('kid’s been asking about that package, by the way.');
        if (owes(s, 'Auntie Rust')) l.push('remember: you owe me a job. i’ll collect before i sell you anything else.');
        l.push(s.cyberware.length ? 'want more? everything costs. pick.' : 'three things on the bench tonight. ask about one.');
        return l;
      },
      offer: (s, e) => {
        const o = s.offer; const w = ware(s);
        if (e.stage === 'vouch') return ['never seen you before. who sent you?'];
        if (e.stage === 'warn') return [`you’re at ${s.humanity}% and fraying. i’ve seen this before. sure you want more chrome?`];
        return [`${w.name.toLowerCase()}. ${E.MENUS.street[o.ware].note.toLowerCase()}`, `${eur(o.price)}. cash, a favour, or a used one if you’re desperate.`];
      },
      vouched: (s, e) => e.by === 'kid' ? ['kid halcyon. fine. kid’ll want something for that. kid always does.'] : ['rail rat? half the market heard him say your name. you’re louder now.'],
      'haggle-ok': (s) => [`you’ve been decent to me. ${eur(s.offer.price)}. don’t push it.`],
      'haggle-fail': (s) => [`haggling? with your rep? it’s ${eur(s.offer.price)} now.`],
      settle: () => ['before anything: you owe me a job. there’s a man in the ferry market who owes me more. go remind him.'],
      'job-done': () => ['done? good. don’t tell me how. we’re square.'],
      blacklisted: () => ['then we’re done. and everyone i talk to will know it.'],
      denied: (s, e) => e.rule === 'S-6' ? [`you’re at ${s.humanity}%. i don’t chrome psychos. go home.`] : ['not tonight.'],
      installed: (s) => [s.receipt.how === 'used part' ? 'used one’s in. it’ll ache. that’s normal. mostly.' : s.receipt.how === 'favour' ? 'it’s in. remember who put it there.' : 'it’s in. pleasure doing business.'],
      walk: () => ['your loss.'],
      acknowledged: () => ['your funeral. okay.'],
    },
    corpo: {
      chosen: () => ['Welcome to the Hakuren upgrade programme. Your profile has been pre-approved for excellence.'],
      catalog: (s) => {
        if (s.flags.frozen) return ['Your account is under review by Hakuren Legal. We will contact you.'];
        const l = [];
        if (s.debt) l.push(`Your balance of ${eur(s.debt)} reflects your commitment to growth.`);
        if (s.flags.nonCompliant) l.push('A compliance note is attached to your file. Pricing reflects this.');
        l.push(s.cyberware.length ? 'Shall we continue your journey?' : 'Please select the upgrade that fits the person you are becoming.');
        return l;
      },
      interest: (s, e) => [`A routine adjustment of ${eur(e.amount)} has been applied to your balance.`],
      offer: (s, e) => {
        const o = s.offer; const w = ware(s);
        if (e.stage === 'sponsor') return [`The ${w.name} is restricted to security staff. Your trust rating is ${s.trust}. Executive sponsorship is available.`];
        if (e.stage === 'warn') return [`Our records show ${s.humanity}% humanity. Hakuren does not decline customers on wellbeing grounds. Counsellors are available around the clock.`];
        return [`${w.name}. ${E.MENUS.corpo[o.ware].note}`, `Financed in full at ${eur(o.price)}${o.interest ? `, ${Math.round(o.interest * 100)}% interest` : ', 0% interest'}. Please review the terms.`];
      },
      sponsored: () => ['Congratulations. You are now sponsored. The contract has been prepared.'],
      'sponsor-failed': () => ['We regret that your rating remains below the threshold, even with sponsorship. The clause you signed remains in force.'],
      countered: () => ['Of course. Without telemetry we cannot guarantee your hardware, so a recovery clause and revised rate now apply.'],
      'refused-strike': () => ['Exclusivity protects your investment. It is not negotiable. This request has been noted.'],
      noncompliant: (s) => [`Your concerns have been logged. A compliance surcharge applies. Revised price: ${eur(s.offer.price)}.`],
      frozen: () => ['Your account has been frozen and referred to Hakuren Legal. Thank you for your patience.'],
      'needs-name': () => ['Please sign with your full name.'],
      installed: (s) => [s.receipt.how === 'paid outright' ? 'Payment received. We prefer relationships, but we respect independence. Telemetry remains active for your safety.' : 'Contract executed. Welcome to the Hakuren family.'],
      walk: () => ['We will keep your offer on file. Prices may change.'],
      acknowledged: () => ['Thank you for confirming. Proceeding.'],
      denied: () => ['This option is currently unavailable for your profile.'],
    },
    netrunner: {
      chosen: () => ['>> ghostline. you’re on a node that shouldn’t exist. don’t make it notice you.'],
      catalog: (s) => {
        if (s.flags.traced) return ['>> node dropped you. someone else is watching this line now.'];
        const l = [];
        if (s.flags.burned) l.push('>> new face. same habits. careful.');
        if (s.trust >= 30) l.push('>> you’re useful. i’ll start telling you what’s guarding things.');
        l.push(`>> three targets. exposure ${s.exposure}%. pick one.`);
        return l;
      },
      offer: (s, e) => {
        const w = ware(s); const ice = s.iceKnown[s.offer.ware] ? s.ice[s.offer.ware] : null;
        if (e.stage === 'warn') return [`>> warning: humanity ${s.humanity}%. the node doesn’t care. you should.`];
        const l = [`>> target: ${w.name.toLowerCase()}. ${E.MENUS.netrunner[s.offer.ware].note.toLowerCase()}`];
        l.push(e.freeIntel ? `>> ghostline: it’s ${ice}. you owe me nothing for that. yet.` : ice ? `>> ice: ${ice}.` : '>> ice: unknown. probe it or guess.');
        return l;
      },
      probed: (s, e) => [`>> ice identified: ${e.ice}. weakness on file.`],
      miss: (s, e) => [`>> --${e.vector} bounced. they felt that. exposure ${s.exposure}%.`],
      locked: () => ['>> ice hardened. that target is gone.'],
      installed: (s, e) => e.brute ? ['>> brute force worked. everyone heard it. the remaining ice is rotating.'] : ['>> clean. firmware unsigned. i kept a door open in it, for later.', '>> remaining ice is rotating. your old probes are stale.'],
      trace: (s) => [`>> TRACE. exposure ${s.exposure}%. burn this identity or keep running.`],
      burned: () => ['>> identity burned. account emptied. you’re nobody again.'],
      'kept-running': () => ['>> then you’re on your own. cutting the line.'],
      walk: () => ['>> disconnected.'],
      acknowledged: () => ['>> noted.'],
      denied: () => ['>> no route.'],
    },
  };

  function speak(event, state) {
    if (event.type === 'scan') {
      const sc = event.scan; const b = E.BACKGROUNDS[sc.suggest];
      return ['Biometric match: none on file. Inferring from behaviour.', ...sc.reasons, `Inferred background: ${b.name}. The choice is yours. It cannot be undone.`];
    }
    const v = VOICES[state.background]; if (!v) return [];
    const fn = v[event.type];
    return fn ? fn(state, event) : [];
  }

  global.NCOS_OPERATOR = Object.freeze({ speak });
})(window);

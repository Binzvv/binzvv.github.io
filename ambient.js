/* Binz Tamang — ambient soundtrack
 * An original generative score: warm detuned drones, slow minor-key pads, distant metallic
 * echoes, synthetic rain and the occasional lonely melody. Nothing is sampled and nothing
 * loops: harmony moves by weighted chance, events are scheduled at irregular intervals and
 * every slow modulation runs at a different, unrelated rate, so the piece never audibly
 * restarts.
 *
 * Silent until the visitor presses SOUND ON. Tone.js is only fetched at that moment.
 * Independent of the visuals: opening or closing a project gallery does not touch it.
 */
(() => {
  "use strict";

  const SOUND = {
    library: "assets/vendor/tone.min.js",
    level: -6,               // dB at the master fader: about -30 LUFS, beneath the work
    fadeIn: 6,               // s
    fadeOut: 2.6,            // s
    hiddenFade: 0.8,         // s, when the tab is hidden
    chordHold: [17, 31],     // s each harmony lasts
    bellGap: [8, 24],        // s between distant metallic echoes
    phraseGap: [16, 42],     // s between melodic phrases
    dropGap: [0.35, 2.6],    // s between rain droplets
  };

  // A minor with a Phrygian shadow (the Bb chord). Pad voicings, low to high.
  const CHORDS = {
    Am9:    { pad: ["A2", "E3", "C4", "G4", "B4"], bass: "A1", tones: ["A4", "C5", "E5", "G5", "B5"] },
    Fmaj7:  { pad: ["F2", "C3", "A3", "E4"],       bass: "F1", tones: ["A4", "C5", "E5", "F5"] },
    Dm9:    { pad: ["D2", "A2", "F3", "C4", "E4"], bass: "D2", tones: ["D5", "E5", "F5", "A5"] },
    Em7:    { pad: ["E2", "B2", "D3", "G3", "B3"], bass: "E1", tones: ["B4", "D5", "E5", "G5"] },
    Cmaj7G: { pad: ["G2", "C3", "E3", "B3"],       bass: "G1", tones: ["C5", "E5", "G5", "B5"] },
    Bbmaj7: { pad: ["Bb1", "F2", "D3", "A3", "E4"], bass: "Bb1", tones: ["A4", "D5", "F5", "A5"] },
    Gsus2:  { pad: ["G2", "D3", "A3", "D4"],       bass: "G1", tones: ["A4", "D5", "G5"] },
  };
  // Weighted next-chord table: drifts, rarely resolves, never cycles in a fixed order
  const NEXT = {
    Am9:    { Fmaj7: 3, Dm9: 2, Bbmaj7: 1.5, Gsus2: 1, Em7: 1 },
    Fmaj7:  { Am9: 3, Dm9: 1.5, Cmaj7G: 1.5, Bbmaj7: 1 },
    Dm9:    { Am9: 2.5, Em7: 1.5, Bbmaj7: 1.5, Fmaj7: 1 },
    Em7:    { Am9: 3, Fmaj7: 1.5, Dm9: 1 },
    Cmaj7G: { Am9: 2, Fmaj7: 2, Em7: 1 },
    Bbmaj7: { Am9: 3, Dm9: 1.5, Fmaj7: 1 },
    Gsus2:  { Am9: 2, Em7: 1.5, Cmaj7G: 1.5 },
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  function weighted(table) {
    const entries = Object.entries(table);
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of entries) if ((r -= w) <= 0) return k;
    return entries[0][0];
  }

  const button = document.getElementById("soundToggle");
  if (!button) return;
  const label = button.querySelector(".sound-label");

  let engine = null;         // built once, kept between toggles
  let building = null;
  let wanted = false;        // what the visitor asked for
  let suspendTimer = 0;

  function loadLibrary() {
    if (window.Tone) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SOUND.library;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Tone.js failed to load"));
      document.head.appendChild(s);
    });
  }

  async function build() {
    const T = window.Tone;
    const nodes = [];
    const keep = (n) => (nodes.push(n), n);

    // ---- master: fader → gentle top-end softening → glue → safety limiter ----
    const fader = keep(new T.Gain(0));
    const soften = keep(new T.Filter({ type: "lowpass", frequency: 5600, rolloff: -12 }));
    const lowCut = keep(new T.Filter({ type: "highpass", frequency: 40, rolloff: -24 }));
    const glue = keep(new T.Compressor({ threshold: -26, ratio: 2.2, attack: 0.4, release: 1 }));
    const limiter = keep(new T.Limiter(-8));
    fader.chain(soften, lowCut, glue, limiter, T.getDestination());

    // ---- shared spaces: a long dark hall, and a slow echo into it ----
    const hall = keep(new T.Reverb({ decay: 13, preDelay: 0.09, wet: 1 }));
    await hall.generate();
    const hallIn = keep(new T.Gain(1));
    const hallTone = keep(new T.Filter({ type: "lowpass", frequency: 3400 }));
    hallIn.chain(hall, hallTone, fader);

    const echo = keep(new T.FeedbackDelay({ delayTime: 0.92, feedback: 0.52, wet: 1 }));
    const echoTone = keep(new T.Filter({ type: "lowpass", frequency: 2300 }));
    const echoOut = keep(new T.Gain(0.5));
    echo.chain(echoTone, echoOut);
    echoOut.connect(hallIn);
    echoOut.connect(fader);

    const send = (src, dry, wet) => {
      const d = keep(new T.Gain(dry));
      const w = keep(new T.Gain(wet));
      src.connect(d);
      src.connect(w);
      d.connect(fader);
      w.connect(hallIn);
    };

    // ---- drone: detuned analogue saws on a low pedal, breathing through a dark filter ----
    const droneFilter = keep(new T.Filter({ type: "lowpass", frequency: 300, rolloff: -24, Q: 0.7 }));
    const drone = keep(new T.Gain(0.1));
    droneFilter.connect(drone);
    send(drone, 0.8, 0.35);
    const pedal = keep(new T.Oscillator({ frequency: "A1", type: "sawtooth" }));
    const shade = keep(new T.FatOscillator({ frequency: "E2", type: "sawtooth", count: 2, spread: 5, volume: -7 }));
    const sub = keep(new T.Oscillator({ frequency: "A2", type: "sine", volume: -20 }));
    pedal.connect(droneFilter);
    shade.connect(droneFilter);
    sub.connect(drone);
    keep(new T.LFO({ frequency: 1 / 47, min: 160, max: 460, type: "sine" })).connect(droneFilter.frequency).start();
    keep(new T.LFO({ frequency: 1 / 61, min: -7, max: 7 })).connect(shade.detune).start();

    // ---- pad: slow-blooming detuned chords through a drifting filter and chorus ----
    const pad = keep(new T.PolySynth(T.Synth, {
      maxPolyphony: 14,
      volume: -21,
      oscillator: { type: "fatsawtooth", count: 3, spread: 28 },
      envelope: { attack: 7, decay: 3, sustain: 0.75, release: 11, attackCurve: "sine", releaseCurve: "exponential" },
    }));
    const padFilter = keep(new T.Filter({ type: "lowpass", frequency: 900, rolloff: -24, Q: 0.4 }));
    const chorus = keep(new T.Chorus({ frequency: 0.07, delayTime: 4.5, depth: 0.5, wet: 0.6 }).start());
    const padOut = keep(new T.Gain(0.55));
    pad.chain(padFilter, chorus, padOut);
    send(padOut, 0.55, 0.7);
    keep(new T.LFO({ frequency: 1 / 37, min: 600, max: 1900 })).connect(padFilter.frequency).start();

    // ---- rain: pink noise shaped into a soft hiss, swelling slowly, plus sparse droplets ----
    const rain = keep(new T.Noise({ type: "pink", volume: 0 }));
    const rainHigh = keep(new T.Filter({ type: "highpass", frequency: 650 }));
    const rainLow = keep(new T.Filter({ type: "lowpass", frequency: 4200 }));
    const rainLevel = keep(new T.Gain(0.12));
    rain.chain(rainHigh, rainLow, rainLevel);
    send(rainLevel, 0.8, 0.25);
    keep(new T.LFO({ frequency: 1 / 23, min: 0.08, max: 0.17 })).connect(rainLevel.gain).start();
    keep(new T.LFO({ frequency: 1 / 53, min: 2800, max: 5200 })).connect(rainLow.frequency).start();

    const drop = keep(new T.NoiseSynth({ noise: { type: "white" }, volume: -20, envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.04 } }));
    const dropBand = keep(new T.Filter({ type: "bandpass", frequency: 2600, Q: 6 }));
    const dropPan = keep(new T.Panner(0));
    drop.chain(dropBand, dropPan);
    send(dropPan, 0.5, 0.5);

    // ---- distant metal: soft inharmonic FM bells, far away in the echo ----
    const bell = keep(new T.FMSynth({
      volume: -18,
      harmonicity: 3.01,
      modulationIndex: 5,
      oscillator: { type: "sine" },
      modulation: { type: "sine" },
      envelope: { attack: 0.006, decay: 3.2, sustain: 0, release: 3.5 },
      modulationEnvelope: { attack: 0.004, decay: 1.4, sustain: 0, release: 1 },
    }));
    const bellHigh = keep(new T.Filter({ type: "highpass", frequency: 420 }));
    const bellPan = keep(new T.Panner(0));
    bell.chain(bellHigh, bellPan);
    bellPan.connect(echo);
    send(bellPan, 0.15, 0.6);

    // ---- melody: a lone, slightly unsteady voice ----
    const voice = keep(new T.Synth({
      volume: -14,
      oscillator: { type: "fattriangle", count: 2, spread: 9 },
      envelope: { attack: 1.4, decay: 2.5, sustain: 0.45, release: 6.5, attackCurve: "sine" },
    }));
    const vibrato = keep(new T.Vibrato({ frequency: 4.6, depth: 0.06 }));
    const voiceTone = keep(new T.Filter({ type: "lowpass", frequency: 2100 }));
    voice.chain(vibrato, voiceTone);
    voiceTone.connect(echo);
    send(voiceTone, 0.45, 0.65);

    // ---- generative score ----
    const sources = [pedal, shade, sub, rain];
    const timers = new Set();
    const later = (sec, fn) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, sec * 1000);
      timers.add(id);
    };

    const score = { chord: "Am9", held: [] };

    function playChord(name, first) {
      const c = CHORDS[name];
      const now = T.now() + 0.05;
      // the old harmony releases slowly underneath the new one
      if (score.held.length) pad.triggerRelease(score.held, now + 2.5);
      // voices bloom slightly apart, not as a block
      c.pad.forEach((n, i) => pad.triggerAttack(n, now + i * rand(0.35, 1.1), rand(0.32, 0.5)));
      score.held = c.pad.slice();
      // the drone's upper voice glides towards the new root; the A pedal stays
      const glide = first ? 0.1 : rand(6, 11);
      shade.frequency.rampTo(T.Frequency(c.bass).transpose(12).toFrequency(), glide);
      score.chord = name;
    }

    function harmony() {
      playChord(weighted(NEXT[score.chord]));
      later(rand(...SOUND.chordHold), harmony);
    }

    function bells() {
      const tones = CHORDS[score.chord].tones;
      const note = T.Frequency(pick(tones)).transpose(pick([0, 12, 12, 24]));
      bellPan.pan.value = rand(-0.7, 0.7);
      bell.triggerAttackRelease(note.toFrequency(), rand(1.5, 3), T.now() + 0.05, rand(0.25, 0.5));
      later(rand(...SOUND.bellGap), bells);
    }

    function phrase() {
      // sometimes the voice stays quiet for a whole stretch
      if (Math.random() < 0.78) {
        const tones = CHORDS[score.chord].tones;
        const count = pick([1, 2, 2, 3, 3, 4]);
        let t = T.now() + 0.1;
        let last = pick(tones);
        for (let i = 0; i < count; i++) {
          // move by small steps within the harmony, as a voice would
          const idx = Math.max(0, Math.min(tones.length - 1, tones.indexOf(last) + pick([-1, -1, 0, 1, 1, 2])));
          last = tones[idx];
          const dur = rand(2.2, 5);
          voice.triggerAttackRelease(last, dur, t, rand(0.35, 0.55));
          t += dur + rand(0.6, 2.4);
        }
      }
      later(rand(...SOUND.phraseGap), phrase);
    }

    function droplets() {
      dropBand.frequency.value = rand(1700, 4200);
      dropPan.pan.value = rand(-0.9, 0.9);
      drop.triggerAttackRelease(rand(0.02, 0.05), T.now() + 0.02, rand(0.15, 0.6));
      // droplets come in small, irregular clusters
      later(Math.random() < 0.25 ? rand(0.08, 0.3) : rand(...SOUND.dropGap), droplets);
    }

    let started = false;
    let running = false;
    function startScore() {
      if (running) return; // idempotent: never two schedulers at once
      running = true;
      if (!started) {
        sources.forEach((s) => s.start());
        started = true;
        playChord(score.chord, true);
        later(rand(...SOUND.chordHold), harmony);
      } else {
        later(rand(4, 12), harmony);
      }
      later(rand(5, 12), bells);
      later(rand(12, 24), phrase);
      later(rand(0.5, 2), droplets);
    }
    function stopScore() {
      running = false;
      timers.forEach(clearTimeout);
      timers.clear();
    }

    return {
      T,
      fader,
      start: startScore,
      stop: stopScore,
      dispose() {
        stopScore();
        try {
          pad.releaseAll();
        } catch (_) {}
        nodes.forEach((n) => {
          try {
            n.dispose();
          } catch (_) {}
        });
      },
    };
  }

  function setLabel(playing, busy) {
    button.setAttribute("aria-pressed", String(playing));
    button.classList.toggle("is-playing", playing);
    button.toggleAttribute("aria-busy", !!busy);
    label.textContent = playing ? "Sound off" : "Sound on";
    button.setAttribute("aria-label", playing ? "Turn sound off" : "Turn sound on");
  }

  async function soundOn() {
    wanted = true;
    clearTimeout(suspendTimer);
    setLabel(true, !engine);
    try {
      await loadLibrary();
      const T = window.Tone;
      await T.start(); // must run inside the click's user gesture chain
      if (T.context.state !== "running") await T.context.resume();
      if (!engine) {
        building = building || build();
        engine = await building;
      }
      button.removeAttribute("aria-busy");
      if (!wanted) {
        // switched off while loading: stay silent and asleep
        T.context.rawContext.suspend && T.context.rawContext.suspend();
        return;
      }
      engine.start();
      engine.fader.gain.cancelScheduledValues(T.now());
      engine.fader.gain.rampTo(T.dbToGain(SOUND.level), SOUND.fadeIn);
    } catch (err) {
      building = null; // allow a later retry
      wanted = false;
      setLabel(false);
      console.warn("Ambient sound unavailable:", err);
    }
  }

  function soundOff() {
    wanted = false;
    setLabel(false);
    if (!engine) return;
    const T = engine.T;
    engine.fader.gain.cancelScheduledValues(T.now());
    engine.fader.gain.rampTo(0, SOUND.fadeOut);
    clearTimeout(suspendTimer);
    // once silent, stop scheduling and let the audio thread sleep
    suspendTimer = setTimeout(() => {
      if (wanted) return;
      engine.stop();
      T.context.rawContext.suspend && T.context.rawContext.suspend();
    }, (SOUND.fadeOut + 0.3) * 1000);
  }

  button.addEventListener("click", () => (wanted ? soundOff() : soundOn()));

  // a hidden tab goes quiet and sleeps; it fades back in on return
  document.addEventListener("visibilitychange", () => {
    if (!engine || !wanted) return;
    const T = engine.T;
    clearTimeout(suspendTimer);
    if (document.hidden) {
      engine.fader.gain.cancelScheduledValues(T.now());
      engine.fader.gain.rampTo(0, SOUND.hiddenFade);
      suspendTimer = setTimeout(() => {
        engine.stop();
        T.context.rawContext.suspend && T.context.rawContext.suspend();
      }, (SOUND.hiddenFade + 0.2) * 1000);
    } else {
      T.context.resume().then(() => {
        engine.start();
        engine.fader.gain.cancelScheduledValues(T.now());
        engine.fader.gain.rampTo(T.dbToGain(SOUND.level), SOUND.fadeIn * 0.5);
      });
    }
  });

  // release every node and the audio thread when the page goes away
  window.addEventListener("pagehide", () => {
    clearTimeout(suspendTimer);
    if (engine) {
      engine.dispose();
      engine = null;
      building = null;
    }
    wanted = false;
    setLabel(false);
    // let the audio thread sleep (not closed, so a page restored from cache can rebuild)
    if (window.Tone && window.Tone.context.rawContext.suspend) window.Tone.context.rawContext.suspend();
  });

  setLabel(false);
  // read-only hook for checking levels in tests: binzSound.state()
  window.binzSound = { config: SOUND, state: () => ({ wanted, built: !!engine, context: window.Tone ? window.Tone.context.state : "not loaded" }) };
})();

# TRASH — Experiment 001

A keyboard-first interaction prototype. One question, a floating keyboard, a reframe.

```bash
npm install
npm run dev   # → http://localhost:5173
```

- **Desktop** — type on your physical keyboard (the on-screen keys respond) or click the keys. Enter submits; Enter / Esc returns.
- **Touch devices** — the headline is a real text field and opens the native keyboard; the predictive strip floats above it.
- **Reduced motion** — honoured: animations become short opacity fades.

## Structure

```
src/
  App.jsx                    phase orchestration + GSAP transitions
  components/
    Prompt.jsx               headline ↔ textarea
    Keyboard.jsx             iOS-dark inspired keyboard (presentational)
    keyboardLayout.js        layouts + physical-key mapping
    SuggestionStrip.jsx      floating predictive strip
    Reframe.jsx              the two-beat reframe
    Atmosphere.jsx           light, horizon haze, grain
  engine/                    deterministic, no AI backend
    scenarios.js             Gen Z · loyalty · AI — signals, prompts, reframes
    predict.js               predictive strip logic
    reframe.js               scenario reframes + generic fallback
  hooks/                     pressed keys, touch detection, native keyboard inset
  lib/motion.js              reduced-motion helper
```

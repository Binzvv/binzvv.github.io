# The Site That Changes Its Mind

A behavioural design experiment. No homepage, no menu, no fixed journey — the
site asks *what do you need right now?* and then behaves like a different product.

| | Explore | Focus | Surprise me |
|---|---|---|---|
| Navigation | Spatial: drag / scroll / arrows across a world larger than the screen | Linear: one project at a time, ← → / swipe | None: the site directs scenes on its own clock |
| Order | None — projects wander off on their own; double-click scatters the room | Ranked by your attention (what you opened while exploring comes first) | Chosen by the site, never the same scene twice in a row |
| Content priority | Breadth + 7 hidden notes that only reward wandering | Depth: one line → body → one action | Remixes: giant crops, invented hybrids, stats, a scene about *you* |
| Your control | Full | Full, but quiet | Interrupt (tap) or pause (hold) only |

## Visual system

- **Ground**: flat concrete grey with five saturated cut-paper colours. No gradients, no grids.
- **Imagery**: each project is a die-cut sticker illustration drawn in SVG (`src/components/Sticker.jsx`), so there are no image files.
- **Type**: Anybody, a variable-width display face. Width carries behaviour: wide in Explore, condensed in Focus, stretching in Surprise. Hanken Grotesk for reading.
- **The mind**: a small character (bottom-left) that is the only persistent control. Its body and eyes change with the mode, it says out loud when it changes behaviour, and its nudges arrive as message bubbles.
- **Continuity**: five wobbling colour shapes on one persistent canvas. They peek in at the start, roam in Explore, leave the room in Focus and swell to take over in Surprise.

## Behaviour

- `src/machine.js` — explicit state machine (`intro → explore | focus | surprise`),
  each state accepting only its own events.
- Rules that let the site propose a change: circling one project in Explore →
  offers Focus; skipping 4 projects in Focus → offers Explore; interrupting
  Surprise 6 times → offers Focus.
- Memory (mode, last project, opens, reads, discoveries, scenes, changes of mind)
  is kept in `localStorage`. Returning visitors are offered to continue; "Forget me"
  clears it. Press **I** (or the dot bottom-left) to change intent at any time.

## Develop

```bash
npm install
npm run dev
```

`npm run build` outputs to `dist/`. `.github/workflows/deploy.yml` publishes it
to GitHub Pages on pushes to `main`/`master` (set *Settings → Pages → Source* to
*GitHub Actions*).

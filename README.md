# The Site That Changes Its Mind

A behavioural design experiment. No homepage, no menu, no fixed journey — the
site asks *what do you need right now?* and then behaves like a different product.

| | Explore | Focus | Surprise me |
|---|---|---|---|
| Navigation | Spatial: drag / scroll / arrows across a world larger than the screen | Linear: one project at a time, ← → / swipe | None: the site directs scenes on its own clock |
| Order | None — projects wander off on their own; double-click scatters the room | Ranked by your attention (what you opened while exploring comes first) | Chosen by the site, never the same scene twice in a row |
| Content priority | Breadth + 7 hidden notes that only reward wandering | Depth: one line → body → one action | Remixes: giant crops, invented hybrids, stats, a scene about *you* |
| Your control | Full | Full, but quiet | Interrupt (tap) or pause (hold) only |

One persistent canvas sits under all three and eases between behaviours, so
switching feels like the same space changing its mind, not a page load.

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

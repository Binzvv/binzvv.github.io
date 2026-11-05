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

One system, not three designs. Every state is built from the same parts:

- **Forms** (`src/components/Field.jsx`, `src/formation.js`): twelve dimensional forms on one persistent WebGL canvas, rendered as a single implicit surface so they merge, stretch, separate and dissolve. One form per project plus three connective forms. Each state publishes a *formation* and the forms travel to it, so a change of intent is visible as the interface reorganising itself.
  - Explore: forms spread across the field; hovering a project draws its shared themes and sends connective forms along the links.
  - Focus: all forms merge into one calm mass led by the current project; moving on re-sorts the mass.
  - Surprise: each scene is a curated formation (a sequence, a merge of two projects, a ring, data sized by what you opened).
- **Status line**: while forms reorganise, the header narrates the real operation ("Ranking by the 2 you opened"), then settles into a live readout.
- **Type**: Geist, light at display sizes, regular for reading. Neutral ground and ink; colour lives only in the forms (ultramarine, lime, coral).
- **Control**: one segmented intent switch. A suggested intent is marked inside it, and suggestions are one-line observations of what you did, with an offer you can decline.

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

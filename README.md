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

- `src/machine.js`: explicit state machine (`intro → explore | focus | surprise`), each state accepting only its own events. It also holds the behavioural engine's state, rules and log.
- `src/engine.js`: browser-side observers (input activity, active dwell time, tab visibility) and the thresholds.

### Behavioural engine

The site observes, suggests and responds. It never switches mode, changes content or interrupts on its own: every response needs a choice, every suggestion has "Not now", and a suggestion is offered at most once per visit (it quietly expires after 25s).

| Observed | Rule | Suggestion | Choices |
|---|---|---|---|
| Skipping | 3 skips in a row. Explore: a project closed < 4s after opening. Focus: next < 4s without reading. Surprise: a scene tapped away | "You've skipped a few. Want a different direction?" | Explore: show what you haven't opened / one at a time. Focus: browse in space / surprise me. Surprise: show one properly / explore instead |
| Dwelling | 15s of *active* time on one project (input in the last 5s, tab visible) | "Interested in this one? There's more to explore." | Show more (a deeper layer: how it works, what we learned) |
| Revisiting | Same project opened 3 times (across visits) | "You keep coming back to …" | Keep it close (pinned under the status line) / see related work |
| Returning | Reload with memory, or tab hidden ≥ 15s, with a remembered last interaction | "Welcome back. Continue where you left off?" | Continue with … (reopens it) / start fresh |
| Inactivity | 30s without pointer, key, scroll or touch input | none; motion is reduced and Surprise stops auto-advancing | any input restores motion |

The last meaningful interaction (opened, read, went deeper, kept) is stored in `localStorage`. "Forget me" clears everything.

**Debug mode:** press **D** (or triple-tap the site name on a phone) for an overlay with the current mode, live signals (skip streak, dwell timer, idle timer, last interaction, most opened), the triggered rule and the observation behind it, the suggested response, whether it was accepted, dismissed or expired, and a timestamped log. "Show rules" lists every rule.

## Develop

```bash
npm install
npm run dev
```

`npm run build` outputs to `dist/`. `.github/workflows/deploy.yml` publishes it
to GitHub Pages on pushes to `main`/`master` (set *Settings → Pages → Source* to
*GitHub Actions*).

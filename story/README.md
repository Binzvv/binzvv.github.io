# The Living Project Story — `/story/`

An experimental, interactive project-story teaser in five scenes. It lives on its own route and does not touch the existing portfolio at `/`.

**Don’t just watch the story. Change it.**

| # | Scene | Principle | Interaction | What the visitor changes |
|---|-------|-----------|-------------|-----------------------------|
| 01 | Interrupt | Presence | Move | A liquid 3D object (Three.js) is agitated by your movement. Type changes width and parallax around it. |
| 02 | Choose | Choice | Choose | *Noise* or *Silence*. This rewrites the whole identity: colour, typefaces, grid gutters, easing, cursor, transitions and the 3D material. |
| 03 | Disrupt | Adaptation | Break it | Drag the disc anywhere. The grid re-partitions around it and every element re-fits its new cell. |
| 04 | Respond | Personality | Say something | A canvas entity with a small, hand-written personality (no API) answers with body language and kinetic type. |
| 05 | Reveal | Memory | — | Your world, disrupted grid, drag path, presence waveform, words, the entity’s reply and mood become one poster. |

## Running

It’s static. Serve the repo root and open `/story/`:

```sh
python3 -m http.server 8000   # → http://localhost:8000/story/
```

Dependencies load from jsDelivr through the import map in `index.html`: GSAP 3.12.5 (Observer, Draggable) and Three 0.160.0. There’s no build step, so it deploys as-is on GitHub Pages.

For review there are deep links: `#3` starts at scene 03, and `?world=noise` or `?world=silence` pre-selects a world.

## Replacing placeholders

All imagery is generated art-directed placeholders (`js/placeholders.js`). To use a real asset, set `data-src` on any `.ph` element in `index.html`:

```html
<div class="s2-ph ph" data-ph="halftone" data-src="/assets/noise.jpg"></div>
<div class="ph" data-ph="crowd" data-src="/assets/reel.mp4"></div>   <!-- .mp4/.webm become looping muted video -->
```

## Structure

```
story/
  index.html          markup for all scenes, HUD, curtain, cursor
  story.css           world tokens (none / noise / silence) and scene art direction
  js/main.js          scene controller: Observer (wheel), swipe, keys, transitions per world
  js/state.js         shared visit memory and per-world motion profile
  js/fit.js           text fitting and char splitting
  js/personality.js   lexicon, intents and voice lines per world
  js/entity.js        the entity's expressions and canvas drawing
  js/scenes/*.js      one module per scene: init / enter / leave / resize
```

## Accessibility and motion

`prefers-reduced-motion` swaps transitions for short fades. It also removes jitter, grain and auto-motion, and slows the object right down. Every interaction also works from the keyboard: arrows or space to navigate, Enter on a side to choose, arrows on the disc to move it, and type in scene 04.

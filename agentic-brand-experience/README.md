# Agentic Brand Experience

*What happens to brand when the interface starts making decisions?*

An interactive web keynote in six scenes, built from
`agentic_brand_experience.pptx`. It has two modes that share one set of scenes
and one set of animation timelines:

- **Explore**: scroll-driven storytelling. Each scene pins while scroll moves
  its timeline.
- **Present**: a full-screen 16:9 keynote, controlled from the keyboard.

Live: <https://binzvv.github.io/agentic/>

## Controls

| | Explore | Present |
|---|---|---|
| Enter presentation | **Present ▸** button or `P` | — |
| Next beat / scene | scroll | `→` `↓` `Space` `Enter` `PageDown` (clickers) |
| Previous | scroll | `←` `↑` `PageUp` `Backspace` |
| First / last scene | — | `Home` / `End` |
| Switch policy (Scene 06) | click, `1` `2` `3` or `A` `B` `C`, arrow keys in the selector | the same keys; after the instrument appears, `→` steps A → B → C |
| Exit | — | `Esc` (you return to the same scene in Explore) |

A tip for presenting on a second display: open the page and press `P`. The
browser goes full screen and the frame letterboxes to 16:9 at any resolution.
Fonts are bundled, so the deck works offline once loaded.

## Develop

```bash
cd agentic-brand-experience
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks, then writes the static site to ../agentic
```

The built site in `/agentic` is committed, so GitHub Pages serves it with no
CI step.

## How it is built

React 19, TypeScript, Vite, and GSAP (ScrollTrigger). See
[`DESIGN.md`](./DESIGN.md) for the analysis, art direction, storyboard and
architecture.

The key idea is that each scene exports a `build()` that returns a paused GSAP
timeline with `beat:N` labels. Explore mode scrubs that timeline with scroll.
Present mode tweens the same timeline from beat to beat. Choreography is
therefore written once and behaves identically in both modes.

Reduced motion is respected. Scroll steps between still compositions instead
of scrubbing, the presenter cuts instead of animating, and ambient signal loops
stop.

The experiment outputs in Scene 06 are illustrative, conceptual examples,
not measured research findings. The page labels them that way.

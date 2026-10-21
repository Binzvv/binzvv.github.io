# Smart Home — design exploration

An independent, experimental redesign of a smart home product page, using
sky.com/smart-home as the content and journey reference. It is a local
prototype, not a production replacement, and is not affiliated with Sky.

Scope so far: **hero + first two feature sections** (Smart Doorbell;
Indoor Camera & sensors), each built in two switchable creative directions.

## Run locally

```bash
cd smart-home-redesign
npm install
npm run dev        # http://127.0.0.1:5173
```

Nothing is deployed. `npm run build && npm run preview` serves the production
build on 127.0.0.1 only.

## Comparing directions

- A floating dock at the bottom switches between **Cinematic** (Apple-inspired)
  and **Playful** (Monzo-inspired). Press **D** to flip.
- The choice is kept in the URL (`?d=apple` / `?d=monzo`) for side-by-side tabs.
- The dock's **Motion / Still** switch overrides the OS reduced-motion setting,
  so the static layouts can be reviewed without changing system settings.

## The two directions

| | Cinematic (A) | Playful (B) |
|---|---|---|
| Type | Inter Tight, tight tracking, one weight family | Archivo with a live width axis (`wdth` 62–125) |
| Colour | Black / near-white, one blue accent | Cream, navy, coral, sun, mint, sky |
| Motion | Long, decelerating curves; scrubbed and pinned scenes | Springs and overshoot; triggered, tactile, interruptible |
| Hero | Masked line reveal; doorbell rises to centre stage while plans resolve around it | Words pop in, “phone.” stretches; tappable notification pile with parallax and velocity lean |
| Doorbell | Pinned three-act story: keyhole → 1080p, page and feed fall to night, two-way talk | Press the doorbell: ripples, phone shake, notification, chat plays out; night-vision switch |
| Sensors | Floor plan draws itself; sensors report into an alert feed; Sensor Bridge slides out from behind the camera | Horizontal pinned track of cards with live demos (lens follows your pointer, door/motion, leak, bridge plug-in) |

## Cinematic design system

The Cinematic direction has its own design system:

- **Rules:** [`docs/cinematic-design-system.md`](docs/cinematic-design-system.md),
  covering principles, colour, type, space, shape, components, motion,
  accessibility and the don'ts
- **Tokens:** `src/directions/apple/tokens.css` (CSS, `--cn-*`) and
  `tokens.js` (GSAP curves and timings). `apple.css` reads from these.
- **Living style guide:** `system.html`. Open
  `http://127.0.0.1:5173/system.html` with `npm run dev`. Its swatches,
  contrast ratios and easing plots are read from the live CSS and GSAP,
  so they can't drift.

`npm run build:single` writes self-contained copies of both pages to
`dist-single/`.

## Accessibility and motion

- `prefers-reduced-motion` (or the dock switch) removes all pinning, scrubbing
  and loops, and swaps in static reading-order layouts. It doesn't just shorten
  the animations.
- Interactive demos are real buttons and switches (`role="switch"`,
  `aria-pressed` and an `aria-live` transcript for the doorbell).
- Content stays in the DOM in reading order; decorative art is `aria-hidden`.

## Structure

```
src/
  App.jsx                 direction state, curtain transition, motion override
  components/Dock.jsx     comparison control
  components/art/         original SVG placeholders (devices, doorstep, floor plan, phone)
  directions/apple/       Cinematic: Hero, Doorbell, Indoor + apple.css
  directions/monzo/       Playful:   Hero, Doorbell, Sensors + monzo.css
  lib/content.js          shared content model (one source for both directions)
  lib/gsap.js             GSAP + ScrollTrigger, SplitText, DrawSVG, custom eases
```

## Assets and content

All device and scene artwork is original SVG drawn for this prototype. No
third-party imagery or proprietary assets are used, and fonts are bundled
locally via Fontsource (OFL). Product facts and prices (Smart Home Plan £5/mo +
£15 upfront; Plan+ £8/mo + £20; Motion Pack £35; Leak Pack £40) come from public
pages as of October 2026. Treat them as illustrative.

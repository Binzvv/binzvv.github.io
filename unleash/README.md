# NRC · Energy in Motion

An unofficial, speculative Nike Run Club concept. It is not affiliated with Nike. A real-time WebGL energy engine drives a working run flow.

## Run it on your iPhone

```bash
node unleash/serve.mjs
```

Open the printed `iPhone http://…:5173` URL in Safari. The iPhone must be on the same Wi-Fi as the computer running the server. For the full-screen experience, use Share → Add to Home Screen.

Over plain-HTTP LAN the service worker doesn't register, because browsers only allow service workers on HTTPS or localhost. Offline and home-screen caching therefore needs the Netlify deployment.

## Deploy

`netlify.toml` (repo root) publishes `unleash/` as a static site. There's no build step:
- **Git deploy:** connect the repo in Netlify; the config is picked up automatically.
- **Manual deploy:** drag the `unleash/` folder onto app.netlify.com/drop.

## Flow

| State | Interaction | Energy |
|---|---|---|
| Anticipation | Home: Start Run, Set a goal | Swoosh breathes; plasma simmers under the CTA |
| Activation | Press and hold Start Run | Charge converges on the thumb; typography dissolves |
| Eruption | Release | Shock, plasma eruption; the Swoosh condenses, then tears up through the viewport |
| Countdown | 3 · 2 · 1 · GO. | Each beat is a ring, flash and perimeter pulse |
| Active run | Pause / Resume, hold End Run | Perimeter field tracks simulated intensity |
| Completion | Done, Run Again | Energy builds, releases; the Swoosh emerges |

## Engine (`src/gl`)

- `field.js` is the HDR energy field. It has the domain-warped plasma, touch charge, the Swoosh, the shock ring, the flash and the perimeter. Each layer sits behind a uniform branch, so idle layers cost nothing.
- `post.js` holds the post-processing passes:
  - temporal trails (drift-smeared persistence)
  - a 6-level mip-chain bloom
  - the composite (chromatic aberration, ACES tonemap, grain, dither)
- `pipeline.js` is the Three.js pass graph. The field renders at an adaptive resolution and the composite at native resolution.

## Swoosh geometry

The Swoosh is never redrawn:
- `assets/swoosh.png` is a 2× downsample of the supplied artwork, used in the UI.
- `assets/swoosh-sdf.png` is baked from the same artwork, with three channels:
  - R: fine signed distance
  - G: coarse signed distance
  - B: arc-length from the hook to the blade tip, which drives the energy travelling along the contour
- `assets/swoosh-sdf.json` maps between the two and keeps the exact proportions.

## Brand assets

Drop the official `nrc-logo.svg` into `assets/` and the header uses it automatically. Without it, the header falls back to a "Run Club" text wordmark.

## URL parameters

- `?scale=0.4` pins the field resolution, which turns off the adaptive resolution.

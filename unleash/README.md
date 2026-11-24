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

## The interaction

1. **Anticipation:** a restrained NRC surface with the Swoosh, one line of copy and a Volt Start Run circle within thumb reach.
2. **Tap Start Run:** light wells up from the button, and the Swoosh condenses inside it from the supplied geometry.
3. **Travel:** the Swoosh travels outward to the edges of the display, and the frame catches the light.
4. **Countdown:** 3 · 2 · 1 breathe through the frame while the centre stays dark.
5. **GO:** the payoff, the richest light in the experience, flowing around the perimeter.
6. **Afterglow:** a live elapsed timer, quiet moving light, and **Reset** to experience it again.

The previous full-app build is preserved in `backup/nrc-app-v2/` and git tag `backup-nrc-app-v2`.

## Engine (`src/gl`)

- `field.js` is the HDR energy field: the touch glow, the rising light cloud, the Swoosh, the iridescent ring and the perimeter frame. Each layer sits behind a uniform branch, so idle layers cost nothing.
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

## URL parameters

- `?scale=0.4` pins the field resolution, which turns off the adaptive resolution.

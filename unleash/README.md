# NRC · Energy in Motion

An unofficial, non-commercial creative exploration for private design review. It is not affiliated with Nike. One touch-driven interaction, rendered live in WebGL.

## Run it on your iPhone (private, on your Wi-Fi)

You need Node 18 or newer. Everything is bundled locally (Three.js, GSAP, fonts, Nike assets), so no internet connection or CDN is required.

```bash
cd unleash
npm start
```

The server prints:

```
  local   http://localhost:5173
  iPhone  http://192.168.x.x:5173
```

Open the `iPhone` address in Safari on an iPhone on the same Wi-Fi. If macOS asks whether to allow incoming connections for `node`, choose Allow. For full screen, use Share → Add to Home Screen.

## The interaction

1. **Anticipation:** a restrained Nike interface with the Swoosh and a Volt Start Run circle within thumb reach. A quiet halo breathes around the circle.
2. **Touch:** the circle tightens under your thumb and light gathers.
3. **Release:** the interface melts into the light, and a soft, saturated body of energy wells up from the button.
4. **Form:** energy pours along the supplied Swoosh's contour until it burns white.
5. **Disperse:** the Swoosh breaks outward, and an iridescent ring carries the energy to the edges of the display.
6. **Payoff:** the frame catches the light, and LET'S RUN. resolves out of a chromatic split. A living afterglow follows.
7. **Reset** returns to the start, so you can repeat it.

Previous builds are preserved in `../backup/nrc-app-v2/` and git tag `backup-nrc-app-v2`.

## Engine (`src/gl`)

- `field.js` is the HDR energy field: the touch glow, the rising light, the Swoosh, the iridescent ring and the perimeter frame. Each layer sits behind a uniform branch, so idle layers cost nothing.
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

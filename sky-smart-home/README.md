# Sky Smart Home — Awards presentation prototype

Three-slide interactive presentation built with React, Vite, Tailwind CSS and GSAP.

## Run locally

```bash
cd sky-smart-home
npm install
npm run dev        # http://localhost:5173
```

Production build: `npm run build`, then `npm run preview`.

## Controls

| Input | Action |
| --- | --- |
| → ↓ Space PageDown | Next slide |
| ← ↑ PageUp | Previous slide |
| Home / End | First / last slide |
| Mouse wheel / trackpad | Change slide (with cooldown) |
| Swipe (touch) | Change slide |
| Click a browser mockup (slide 3) | Expand to fullscreen |
| Esc or "Back to presentation" | Close expanded view |

Respects `prefers-reduced-motion`: motion is replaced with short fades.

## Structure

- `src/App.jsx` — slide state, transitions, keyboard / wheel / touch input
- `src/components/Stage.jsx` — 1920×1080 canvas scaled to the window
- `src/slides/` — Opening, Challenge, Experience
- `src/components/ExpandedView.jsx` — FLIP expansion of a mockup to fullscreen
- `src/sites/` — placeholder Discovery and Product websites
- `src/components/Placeholder.jsx` — tonal image placeholders

## Swapping in real assets

- Slide 1 product image: replace `DevicePlaceholder` in `src/slides/Opening.jsx`.
- Website imagery: replace `<Placeholder />` usages in `src/sites/` with `<img>` elements.
- Typeface: change `fontFamily.sans` in `tailwind.config.js`.

# Odd Hours — creative studio site

React + Vite + GSAP/ScrollTrigger. Black & white with one accent (`--accent` in `src/styles/global.css`).

```bash
npm install
npm run dev        # http://localhost:5173 (also exposed on your LAN)
npm run build      # production build to dist/
```

## Where things live

| Change…                        | Edit                                  |
| ------------------------------ | ------------------------------------- |
| Any copy, projects, services   | `src/data/content.js`                 |
| Project imagery                | set `image:` on a project in content.js |
| Colours, fonts, spacing        | `:root` tokens in `src/styles/global.css` |
| Global easing / motion presets | `src/lib/motion.js`                   |
| The mascot                     | `src/components/Blob.jsx`             |

## Motion notes
- Every component animates inside `useGSAP` (auto-reverted on unmount) and wraps
  its tweens in `gsap.matchMedia('(prefers-reduced-motion: no-preference)')`, so
  reduced-motion users get a fully static, readable page.
- Initial hidden states are set by GSAP, never CSS, so content is always visible without JS motion.
- Custom cursor and magnetic effects only run on fine pointers (`hover: hover`).
- Don't put CSS `transition: transform` on an element GSAP also animates — wrap it instead.

# Gaze — cursor-following character prototype

React + Vite. The head looks toward the pointer using nine pre-rendered gaze frames.

```bash
npm install
npm run dev        # local dev server
npm run build      # writes the static site to ../steve (served at /steve/ on GitHub Pages)
npm run frames     # re-slice source/gaze-sheet.webp into public/frames (needs Python, Pillow, numpy, scipy)
```

- `source/` — the supplied master portrait and nine-frame reference sheet.
- `scripts/prepare-frames.py` — slices the sheet, removes captions and grid lines, aligns each head on its silhouette centroid, feathers it onto the flat cream background and exports 880×880 WebP frames.
- `src/useGaze.js` — requestAnimationFrame loop: smoothed pointer → per-axis zones with hysteresis and a minimum hold time → frame index. Tuning constants are at the top of the file.
- Debug overlay: press `D`, click "debug" bottom-right, or open with `?debug`.

# Sky Smart Home walkthrough recorder

Records a cinematic walkthrough of the live https://www.sky.com/smart-home page
in Chromium with Playwright. The site is shown exactly as it is: nothing is
hidden, restyled or removed, and the cookie banner is answered through its own
buttons.

## Setup

Needs Node 18+ and ffmpeg (`brew install ffmpeg` on a Mac).

```bash
cd walkthrough
npm install
npx playwright install chromium
```

## Run

```bash
npm run inspect      # 1. measure the live page: output/inspect/report.json + screenshots
npm run sample       # 2. ~10 second test take: output/sample/sample.mp4
npm run record       # 3. full take: output/full/
```

The first run opens a browser window so you can answer the cookie banner
yourself; the choice is saved in `output/state.json` and reused. To have the
script press the banner's own button instead, add `-- --consent accept` or
`-- --consent reject`.

If the page's videos don't play (Chromium builds lack the H.264 codec), add
`-- --chrome` to use your installed Google Chrome instead.

## Output (`output/full/`)

- `walkthrough.mp4`: full film, 1920×1080, H.264 High, 60 fps, fades in and out
- `clip-discovery.mp4`, `clip-benefits.mp4`, `clip-product-experience.mp4`: one per slide, no fades
- `storyboard.json`: the timings of the actual take

All files open in Keynote.

## Tuning

The sequence is the `STORYBOARD` list at the top of `capture.mjs`: each beat
is a hold, a scroll to a heading, a push, or a carousel step. Headings are
matched by text, so a renamed section is skipped with a warning rather than
breaking the take. Run headed (`-- --headed`) on a machine with a GPU for the
smoothest frame rate.

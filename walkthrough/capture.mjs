// Step 2: record the walkthrough. Drives the real page with eased scrolls and
// holds, captures it with Chrome's screencast, and encodes H.264 MP4s.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ensureDir,
  handleConsent,
  launch,
  locateText,
  parseArgs,
  settle,
  smoothScrollTo,
} from './lib.mjs';

// Each beat is a hold, a scroll to a heading (placed `offset` px below the top
// of the frame), a relative push, or a carousel step. `mark` starts a clip.
// Timings are first estimates; tune them after `npm run inspect`.
const STORYBOARD = [
  { mark: 'discovery', label: 'Hero: Welcome to Smart Home', hold: 3500 },
  { label: 'Scroll into "Your home, but smarter"', scrollTo: 'your home,? but smarter', offset: 120, ms: 2800 },
  { mark: 'benefits', label: 'Benefit storytelling cards', hold: 3200 },
  { label: 'Scroll to "All under one roof"', scrollTo: 'all under one roof', offset: 110, ms: 2400 },
  { label: 'Product composition: Doorbell + Plan', hold: 3000 },
  { mark: 'product', label: 'Scroll to motion alerts "Heads-up"', scrollTo: '^heads-up$', offset: 300, ms: 2400 },
  { label: 'Settle on the heading', hold: 1000 },
  { label: 'Push into the Spectrum phone band', scrollBy: 560, ms: 2400 },
  { label: 'Hold on the phone', hold: 2600 },
  { label: 'Scroll to "In the spotlight"', scrollTo: 'in the spotlight', offset: 110, ms: 2400 },
  { label: 'Night watch / In the zone', hold: 3200 },
  { label: 'Scroll to "Inside job"', scrollTo: 'inside job', offset: 110, ms: 2400 },
  { label: 'Indoor Camera cards', hold: 1800 },
  { label: 'Carousel: next', carouselNext: 'inside job', hold: 1700 },
  { label: 'Carousel: next', carouselNext: 'inside job', hold: 2200 },
];
const SAMPLE_BEATS = 3; // hero hold, scroll, benefits hold: about 10 seconds

// Clips run from one mark to the next (the last runs to the end).
const CLIPS = { discovery: 'Discovery', benefits: 'Benefits', product: 'Product Experience' };

const FPS = 60;
const FADE_IN = 0.4;
const FADE_OUT = 0.8;

const opts = parseArgs(process.argv.slice(2));
const runDir = path.join(opts.out, opts.sample ? 'sample' : 'full');
const framesDir = path.join(runDir, 'frames');
await fs.rm(runDir, { recursive: true, force: true });
await ensureDir(framesDir);

const { browser, context, statePath, hasState } = await launch(opts);

// Pass 1 (not recorded): settle consent and fill the HTTP cache, so the
// recorded pass never waits on downloads and its reveal animations run fresh.
console.log('Warming up…');
const warm = await context.newPage();
await warm.goto(opts.url, { waitUntil: 'load', timeout: 60000 });
if (!hasState) {
  await handleConsent(warm, opts.consent);
  await context.storageState({ path: statePath });
}
const warmHeight = await warm.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < warmHeight; y += 800) {
  await smoothScrollTo(warm, y, 250);
  await settle(warm, 2500);
}
await warm.close();

// Pass 2: the take.
const page = await context.newPage();
await page.goto(opts.url, { waitUntil: 'load', timeout: 60000 });
await settle(page, 10000);
await page.waitForTimeout(1500); // let the hero's own entrance finish

const cdp = await context.newCDPSession(page);
const frames = [];
let writes = Promise.resolve();
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = `f${String(frames.length).padStart(6, '0')}.jpg`;
  frames.push({ file, t: metadata.timestamp });
  writes = writes.then(() => fs.writeFile(path.join(framesDir, file), Buffer.from(data, 'base64')));
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

const now = () => Date.now() / 1000;
const marks = [];
const log = [];
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: 1920, maxHeight: 1080 });
await page.waitForTimeout(300);
const t0 = now();

const beats = opts.sample ? STORYBOARD.slice(0, SAMPLE_BEATS) : STORYBOARD;
for (const beat of beats) {
  const at = now() - t0;
  if (beat.mark) marks.push({ name: beat.mark, t: now() });
  let note = '';

  if (beat.scrollTo) {
    const hit = await locateText(page, beat.scrollTo);
    if (!hit) {
      note = 'SKIPPED: text not found';
      console.warn(`  ! "${beat.scrollTo}" not found on the page; skipping this move.`);
    } else {
      await smoothScrollTo(page, hit.top - beat.offset, beat.ms);
    }
  } else if (beat.scrollBy) {
    const y = await page.evaluate(() => scrollY);
    await smoothScrollTo(page, y + beat.scrollBy, beat.ms);
  } else if (beat.carouselNext) {
    const clicked = await page.evaluate((source) => {
      const re = new RegExp(source, 'i');
      const heading = [...document.querySelectorAll('h1,h2,h3')].find((h) => re.test(h.textContent));
      for (let el = heading; el && el !== document.body; el = el.parentElement) {
        const next = [...el.querySelectorAll('button')].find(
          (b) => /next|forward/i.test(b.getAttribute('aria-label') || '') && !b.disabled,
        );
        // A real click on the site's own control; no cursor is drawn.
        if (next) return next.click(), true;
      }
      return false;
    }, beat.carouselNext);
    if (!clicked) note = 'SKIPPED: no next button';
  }

  if (beat.hold) {
    const started = Date.now();
    await settle(page, beat.hold);
    await page.waitForTimeout(Math.max(0, beat.hold - (Date.now() - started)));
  }
  log.push({ at: +at.toFixed(2), label: beat.label, note });
  console.log(`${at.toFixed(1).padStart(5)}s  ${beat.label}${note ? `  [${note}]` : ''}`);
}

await page.waitForTimeout(300);
const tEnd = now();
await cdp.send('Page.stopScreencast');
await writes;
await browser.close();

if (frames.length < 2) throw new Error('No frames captured.');
const span = frames.at(-1).t - frames[0].t;
console.log(`\nCaptured ${frames.length} frames over ${span.toFixed(1)}s (avg ${(frames.length / span).toFixed(1)} fps; static moments send no frames).`);

// Builds an ffconcat list covering [from, to] with each frame's real duration.
async function concatList(from, to, name) {
  let first = frames.findLastIndex((f) => f.t <= from);
  if (first < 0) first = 0;
  const lines = ['ffconcat version 1.0'];
  for (let i = first; i < frames.length && frames[i].t < to; i++) {
    const start = Math.max(frames[i].t, from);
    const end = Math.min(frames[i + 1]?.t ?? to, to);
    if (end <= start) continue;
    lines.push(`file 'frames/${frames[i].file}'`, `duration ${(end - start).toFixed(4)}`);
  }
  lines.push(lines.at(-2)); // concat demuxer needs the last file repeated
  const file = path.join(runDir, `${name}.txt`);
  await fs.writeFile(file, lines.join('\n'));
  return file;
}

function encode(list, out, duration, fades) {
  const vf = [`fps=${FPS}`, 'scale=1920:1080:flags=lanczos', 'format=yuv420p'];
  if (fades) vf.push(`fade=t=in:st=0:d=${FADE_IN}`, `fade=t=out:st=${(duration - FADE_OUT).toFixed(2)}:d=${FADE_OUT}`);
  const res = spawnSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', vf.join(','),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-profile:v', 'high', '-level', '4.2',
      '-movflags', '+faststart', '-t', duration.toFixed(3), out],
    { stdio: 'inherit' },
  );
  if (res.status !== 0) throw new Error(`ffmpeg failed for ${out}`);
  console.log(`  ${out}  (${duration.toFixed(1)}s)`);
}

console.log('\nEncoding…');
const total = tEnd - t0;
encode(await concatList(t0, tEnd, 'walkthrough'), path.join(runDir, opts.sample ? 'sample.mp4' : 'walkthrough.mp4'), total, true);

if (!opts.sample) {
  for (const [i, m] of marks.entries()) {
    const end = marks[i + 1]?.t ?? tEnd;
    const name = `clip-${CLIPS[m.name].toLowerCase().replace(/\s+/g, '-')}`;
    encode(await concatList(m.t, end, name), path.join(runDir, `${name}.mp4`), end - m.t, false);
  }
}

await fs.writeFile(
  path.join(runDir, 'storyboard.json'),
  JSON.stringify({ url: opts.url, total: +total.toFixed(2), beats: log, clips: marks.map((m) => ({ clip: CLIPS[m.name], start: +(m.t - t0).toFixed(2) })) }, null, 2),
);
if (!process.env.KEEP_FRAMES) await fs.rm(framesDir, { recursive: true, force: true });
console.log(`\nDone: ${runDir}`);

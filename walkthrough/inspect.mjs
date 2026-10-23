// Step 1: inspect the live page. Lists sections, media and carousels with
// their positions, and saves screenshots, so the storyboard can be tuned.
import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, handleConsent, launch, parseArgs, settle, smoothScrollTo } from './lib.mjs';

const opts = parseArgs(process.argv.slice(2));
const dir = path.join(opts.out, 'inspect');
await ensureDir(dir);

const { browser, context, statePath, hasState } = await launch(opts);
const page = await context.newPage();
const hosts = new Set();
page.on('request', (r) => hosts.add(new URL(r.url()).host));

await page.goto(opts.url, { waitUntil: 'load', timeout: 60000 });
if (!hasState) {
  await handleConsent(page, opts.consent);
  await context.storageState({ path: statePath });
}

// Walk the page once so lazy content loads, then measure.
const height = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < height; y += 700) {
  await smoothScrollTo(page, y, 300);
  await settle(page, 3000);
}
await smoothScrollTo(page, 0, 300);
await page.waitForTimeout(800);

const report = await page.evaluate(() => {
  const pos = (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), height: Math.round(r.height) };
  };
  const visible = (el) => el.getBoundingClientRect().height > 0;
  return {
    title: document.title,
    pageHeight: document.documentElement.scrollHeight,
    headings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map((h) => ({
      tag: h.tagName.toLowerCase(),
      text: h.textContent.replace(/\s+/g, ' ').trim(),
      ...pos(h),
    })),
    videos: [...document.querySelectorAll('video')].map((v) => ({
      src: v.currentSrc || v.src,
      autoplay: v.autoplay,
      loop: v.loop,
      muted: v.muted,
      duration: Number.isFinite(v.duration) ? +v.duration.toFixed(2) : null,
      playable: v.readyState >= 3 && !v.error,
      ...pos(v),
    })),
    carouselButtons: [...document.querySelectorAll('button[aria-label]')]
      .filter((b) => /next|previous|prev|forward|back/i.test(b.getAttribute('aria-label')))
      .filter(visible)
      .map((b) => ({ label: b.getAttribute('aria-label'), ...pos(b) })),
  };
});
report.hosts = [...hosts].sort();

await fs.writeFile(path.join(dir, 'report.json'), JSON.stringify(report, null, 2));
await page.screenshot({ path: path.join(dir, 'full-page.png'), fullPage: true });
for (const [i, h] of report.headings.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, h.top - 120));
  await settle(page, 3000);
  const name = `${String(i + 1).padStart(2, '0')}-${h.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`;
  await page.screenshot({ path: path.join(dir, name) });
}

console.log(`\n${report.title} — ${report.pageHeight}px tall\n`);
for (const h of report.headings) console.log(`${String(h.top).padStart(6)}px  ${h.tag}  ${h.text}`);
console.log(`\n${report.videos.length} video(s):`);
for (const v of report.videos) console.log(`${String(v.top).padStart(6)}px  playable=${v.playable}  ${v.duration ?? '?'}s  ${v.src}`);
if (report.videos.some((v) => !v.playable)) {
  console.log('\nSome videos are not playable in this browser. Re-run with --chrome (Google Chrome has the H.264 codec).');
}
console.log(`\nHosts contacted: ${report.hosts.join(', ')}`);
console.log(`\nReport and screenshots: ${dir}`);
await browser.close();

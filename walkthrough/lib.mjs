// Shared browser setup, consent handling and page helpers.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';

export const DEFAULT_URL = 'https://www.sky.com/smart-home';
export const VIEWPORT = { width: 1920, height: 1080 };

export function parseArgs(argv) {
  const opts = { url: DEFAULT_URL, out: 'output', consent: 'manual', chrome: false, headed: false, sample: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') opts.url = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--consent') opts.consent = argv[++i];
    else if (a === '--chrome') opts.chrome = true;
    else if (a === '--headed') opts.headed = true;
    else if (a === '--sample') opts.sample = true;
    else throw new Error(`Unknown option ${a}`);
  }
  if (!['manual', 'accept', 'reject', 'none'].includes(opts.consent)) {
    throw new Error('--consent must be manual, accept, reject or none');
  }
  // Choosing in the banner yourself needs a visible window.
  if (opts.consent === 'manual') opts.headed = true;
  return opts;
}

export async function launch(opts) {
  const browser = await chromium.launch({
    headless: !opts.headed,
    // Google Chrome ships the H.264/AAC codecs Chromium builds lack; use it
    // when the page's videos don't play.
    channel: opts.chrome ? 'chrome' : undefined,
    args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--force-device-scale-factor=1'],
  });
  const statePath = path.join(opts.out, 'state.json');
  const hasState = await fs.access(statePath).then(() => true, () => false);
  const context = await browser.newContext({
    viewport: VIEWPORT,
    screen: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    reducedMotion: 'no-preference',
    storageState: hasState ? statePath : undefined,
  });
  return { browser, context, statePath, hasState };
}

const CONSENT_LABELS = {
  accept: /^(accept( all)?( cookies)?|allow all|agree)$/i,
  reject: /^(reject( all)?|necessary (cookies )?only|only necessary|reject non-essential)$/i,
};

/**
 * Makes a consent choice through the site's own banner. Nothing is hidden or
 * removed: either you click it yourself (manual) or the matching button is
 * clicked, exactly as a visitor would.
 */
export async function handleConsent(page, mode) {
  if (mode === 'none') return;
  if (mode === 'manual') {
    console.log('\nChoose an option in the cookie banner in the browser window, then press Enter here.');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await rl.question('> ');
    rl.close();
    return;
  }
  const pattern = CONSENT_LABELS[mode];
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const btn = frame.getByRole('button', { name: pattern }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        console.log(`Consent: clicked "${(await btn.textContent().catch(() => '')).trim()}"`);
        await page.waitForTimeout(800);
        return;
      }
    }
    await page.waitForTimeout(400);
  }
  console.warn('Consent: no matching banner button found; continuing (the banner may not have appeared).');
}

/** Waits for web fonts, then for images and videos currently in view. */
export async function settle(page, timeout = 6000) {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page
    .waitForFunction(
      () => {
        const inView = (el) => {
          const r = el.getBoundingClientRect();
          return r.bottom > 0 && r.top < innerHeight && r.width > 0 && r.height > 0;
        };
        const imgsOk = [...document.images].filter(inView).every((i) => i.complete && i.naturalWidth > 0);
        const vidsOk = [...document.querySelectorAll('video')].filter(inView).every((v) => v.readyState >= 3 || v.error);
        return imgsOk && vidsOk;
      },
      null,
      { timeout, polling: 150 },
    )
    .catch(() => console.warn('  (media in view still loading after', timeout, 'ms; continuing)'));
}

/** Finds the first visible element whose own text matches, returning its page position. */
export async function locateText(page, source, flags = 'i') {
  return page.evaluate(
    ({ source, flags }) => {
      const re = new RegExp(source, flags);
      const candidates = document.querySelectorAll('h1,h2,h3,h4,h5,p,span,div,strong');
      for (const el of candidates) {
        if (el.children.length > 3) continue;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || text.length > 120 || !re.test(text)) continue;
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || style.visibility === 'hidden' || style.display === 'none') continue;
        return { top: r.top + scrollY, height: r.height, text };
      }
      return null;
    },
    { source, flags },
  );
}

/** Eased scroll driven by requestAnimationFrame, so the site's scroll effects run naturally. */
export async function smoothScrollTo(page, y, duration) {
  await page.evaluate(
    ({ y, duration }) =>
      new Promise((resolve) => {
        const max = document.documentElement.scrollHeight - innerHeight;
        const from = scrollY;
        const to = Math.max(0, Math.min(max, y));
        const start = performance.now();
        // easeInOutSine: gentle start and landing, like a camera move.
        const ease = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          window.scrollTo(0, from + (to - from) * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { y, duration },
  );
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

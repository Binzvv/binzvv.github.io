// Offline-first cache for the standalone (home-screen) experience.
const VERSION = 'nrc-energy-v3';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './styles/app.css',
  './src/main.js', './src/app.js', './src/energy.js',
  './src/gl/chunks.js', './src/gl/field.js', './src/gl/post.js', './src/gl/pipeline.js',
  './vendor/three.module.min.js', './vendor/gsap.min.js',
  './fonts/anton-latin.woff2', './fonts/barlow-cond-500.woff2', './fonts/barlow-cond-600.woff2', './fonts/barlow-cond-700.woff2',
  './assets/swoosh.png', './assets/swoosh-sdf.png', './assets/swoosh-sdf.json',
  './assets/icon-180.png', './assets/icon-192.png', './assets/icon-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network-first for the page (fresh deploys win), cache-first for everything else
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { caches.open(VERSION).then((c) => c.put('./index.html', res.clone())); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  })));
});

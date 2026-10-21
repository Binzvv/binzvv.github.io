import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Local-only prototype. `base: './'` keeps the build portable for
// opening from disk / any static folder without a server path.
// Two pages: the prototype (index.html) and the Cinematic style guide
// (system.html). `vite build --mode single` inlines one page (JS, CSS,
// fonts) into a self-contained file for offline previews; pick it with
// ENTRY=system (default: index).
const PAGES = {
  index: resolve(import.meta.dirname, 'index.html'),
  system: resolve(import.meta.dirname, 'system.html'),
};

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  const entry = process.env.ENTRY || 'index';
  return {
    base: './',
    plugins: [react(), single && viteSingleFile()].filter(Boolean),
    build: single
      ? { outDir: 'dist-single', emptyOutDir: false, assetsInlineLimit: 1e8, rollupOptions: { input: PAGES[entry] } }
      : { rollupOptions: { input: PAGES } },
    server: { host: '127.0.0.1', port: 5173 },
    preview: { host: '127.0.0.1', port: 4173 },
  };
});

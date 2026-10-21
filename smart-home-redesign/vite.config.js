import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Local-only prototype. `base: './'` keeps the build portable for
// opening from disk / any static folder without a server path.
// `vite build --mode single` inlines everything (JS, CSS, fonts) into one
// self-contained dist-single/index.html for offline previews.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), mode === 'single' && viteSingleFile()].filter(Boolean),
  build: mode === 'single' ? { outDir: 'dist-single', assetsInlineLimit: 1e8 } : {},
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
}));

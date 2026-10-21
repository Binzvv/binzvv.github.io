import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local-only prototype. `base: './'` keeps the build portable for
// opening from disk / any static folder without a server path.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
});

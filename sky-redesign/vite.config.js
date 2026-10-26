import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built output goes to /sky at the repo root so GitHub Pages can serve it.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '../sky', emptyOutDir: true },
});

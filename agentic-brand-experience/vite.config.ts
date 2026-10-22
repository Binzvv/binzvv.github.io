import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built output is committed to /agentic so GitHub Pages serves it at
// https://binzvv.github.io/agentic/ without a separate deploy step.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: '../agentic',
    emptyOutDir: true,
    target: 'es2020',
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built output is committed to /perspective so GitHub Pages serves it at /perspective/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../perspective',
    emptyOutDir: true,
  },
});

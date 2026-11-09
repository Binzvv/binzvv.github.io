import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Built output goes to /steve at the repo root, so GitHub Pages serves it at
// https://binzvv.github.io/steve/. Relative base keeps asset paths portable.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../steve',
    emptyOutDir: true,
  },
})

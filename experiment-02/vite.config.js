import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' so the built app works from any sub-path (e.g. GitHub Pages /experiment-02/dist/)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})

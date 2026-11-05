/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a09',
        bone: '#e8e4da',
        ash: '#8a867d',
        smoke: '#2a2925',
        signal: '#ff4a1c',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: { tightest: '-0.045em' },
    },
  },
  plugins: [],
}

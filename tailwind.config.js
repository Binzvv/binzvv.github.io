/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#F2F2F0',
        ink: '#0D0D10',
        quiet: '#6B6B72',
        hair: 'rgba(13,13,16,0.1)',
        ultra: '#3640FF',
        lime: '#CCF54A',
        coral: '#FF8466',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: { display: '-0.04em', snug: '-0.02em' },
    },
  },
  plugins: [],
}

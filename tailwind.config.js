/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#E4E4DF', // concrete, not paper
        ink: '#151515',
        mute: '#5E5E59',
        cobalt: '#2B4BFF',
        tomato: '#FF5A36',
        lime: '#C6F24A',
        pink: '#FFA3D7',
        sun: '#FFD23F',
      },
      fontFamily: {
        display: ['Anybody', 'Arial Black', 'Impact', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Sky's brand faces first: "Sky Text Web" are the bundled files in
      // public/fonts (when supplied), "Sky Text" an installed copy.
      fontFamily: {
        sans: [
          '"Sky Text Web"',
          '"Sky Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        headline: [
          '"Sky Text Headline Web"',
          '"Sky Text Headline"',
          '"Sky Text Web"',
          '"Sky Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        paper: '#F3EFE8',
        ink: '#0B0B0B',
      },
    },
  },
  plugins: [],
};

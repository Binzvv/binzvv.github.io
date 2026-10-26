/** Sky UI tokens mapped into Tailwind (values from the Sky UI foundations). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#000ff5', dark: '#000cc4' },
        ink: '#333333',
        'surface-blue': '#0c1b87',
        flat: '#fafafd',
        grey: { 2: '#fafafa', 5: '#f2f2f2', 10: '#e5e5e5', 20: '#cccccc', 40: '#999999', 70: '#4d4d4d', 80: '#333333' },
        focus: '#007ecc',
        night: '#05061a',
      },
      fontFamily: {
        sans: ['"Sky Text"', 'Figtree', 'Arial', 'Helvetica', 'sans-serif'],
        headline: ['"Sky Text Headline"', '"Sky Text"', 'Figtree', 'Arial', 'sans-serif'],
      },
      borderRadius: { lg: '16px', xl: '24px', '2xl': '32px' },
      transitionTimingFunction: {
        // One easing family across the whole page: a soft "physical" settle.
        sky: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'sky-in': 'cubic-bezier(0.64, 0, 0.78, 0)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // phones in landscape (e.g. 800x360 CSS px); desktop windows are never this short
        short: {raw: '(max-height: 520px) and (orientation: landscape)'},
      },
    },
  },
  plugins: [],
};

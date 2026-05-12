/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.front.html",
    "./index.back.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAFAF9',
          text: '#0C0A09',
          accent: '#CA8A04',
        }
      },
      fontFamily: {
        serif: ['Cormorant', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
      transitionTimingFunction: {
        'editorial': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}

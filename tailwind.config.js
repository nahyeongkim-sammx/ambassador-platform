/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#FF5A1F',
        'brand-dark': '#D94A14',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dibs-yellow': '#FDB913',
        'spotify-green': '#1DB954',
        'apple-red': '#FC3C44',
        'deezer-purple': '#A238FF',
      },
    },
  },
  plugins: [],
}



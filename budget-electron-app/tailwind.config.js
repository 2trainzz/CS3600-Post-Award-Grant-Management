/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        darkblue: "#0a192f", 
        black: "#000000",
        accent: "#64ffda",
        'dark-card': '#112240',
        'dark-input': '#0b1729',
      },
      // animation config
      animation: {
        glow: 'glow 1.5s ease-in-out infinite alternate'
      },
      keyframes: {
        glow: {
          'from': { 'box-shadow': '0 0 5px #64ffda, 0 0 10px #64ffda' },
          'to': { 'box-shadow': '0 0 20px #64ffda, 0 0 30px #64ffda' }
        }
      }
    },
  },
  plugins: [],
}
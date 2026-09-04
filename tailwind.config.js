/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07182e',
        graphite: '#102744',
        steel: '#8c969f',
        signal: '#3569ad',
        mist: '#f1f4f8',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 16px 60px rgba(53, 105, 173, 0.24)',
      },
    },
  },
  plugins: [],
}

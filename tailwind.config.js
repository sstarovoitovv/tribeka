/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries([
        'ink', 'graphite', 'steel', 'signal', 'signal-hover', 'signal-light',
        'mist', 'paper', 'subtle', 'navigation', 'white', 'whatsapp', 'telegram',
      ].map(name => [name, `rgb(var(--color-${name}) / <alpha-value>)`])),
      fontWeight: { black: '800' },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
    },
  },
  plugins: [],
}

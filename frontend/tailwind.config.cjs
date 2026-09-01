/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        violet: { DEFAULT: '#6C4FFF', dark: '#8A70FF', soft: '#EDE8FF', softdark: '#241B54', text: '#4A32C7', textdark: '#C6B8FF' },
        teal: { DEFAULT: '#14C9A6', dark: '#25E4BE', soft: '#DDF7F1', softdark: '#122E2C', text: '#0B8A70', textdark: '#7BF0D6' },
        sky: { DEFAULT: '#2F8FFF', dark: '#5DA6FF', soft: '#E4F0FF', softdark: '#122142', text: '#1A66C7', textdark: '#9CC7FF' },
        ink: { DEFAULT: '#18181B', dark: '#F4F4F5' }
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundColor: {
        page: '#F4F4F5',
        pagedark: '#17171A',
        surface: '#FFFFFF',
        surfacedark: '#222225'
      }
    }
  },
  plugins: []
};

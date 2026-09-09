/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#14C9A6', dark: '#25E4BE', soft: '#DDF7F1', softdark: '#122E2C', text: '#0B8A70', textdark: '#7BF0D6' },
        sky: { DEFAULT: '#2F8FFF', dark: '#5DA6FF', soft: '#E4F0FF', softdark: '#122142', text: '#1A66C7', textdark: '#9CC7FF' },
        amber: { DEFAULT: '#E08A2C', dark: '#F0A94E', soft: '#FBEFE0', softdark: '#3A2A14', text: '#9C5F16', textdark: '#F0C284' },
        ink: { DEFAULT: '#0A0A0B', dark: '#FAFAFA' }
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

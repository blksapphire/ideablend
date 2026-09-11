/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Two colours only. Blue is primary (actions, links, focus states).
        // Green is accent (success, joins, completions, positive signals).
        // Everything else is ink on a neutral surface.
        blue: {
          DEFAULT: '#2563EB',
          dark: '#3B82F6',
          soft: '#EFF6FF',
          softdark: '#1E3A5F',
          text: '#1D4ED8',
          textdark: '#93C5FD'
        },
        green: {
          DEFAULT: '#16A34A',
          dark: '#22C55E',
          soft: '#F0FDF4',
          softdark: '#14532D',
          text: '#15803D',
          textdark: '#86EFAC'
        },
        ink: { DEFAULT: '#09090B', dark: '#FAFAFA' }
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      backgroundColor: {
        page: '#FAFAFA',
        pagedark: '#09090B',
        surface: '#FFFFFF',
        surfacedark: '#18181B'
      }
    }
  },
  plugins: []
};

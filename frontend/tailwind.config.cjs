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
        ink: { DEFAULT: '#09090B', dark: '#FAFAFA' },
        // Semantic surface/text tokens backed by CSS variables in index.css.
        // Prefer these in new UI; they keep light and dark in one place.
        ui: {
          canvas: 'rgb(var(--ib-canvas) / <alpha-value>)',
          surface: 'rgb(var(--ib-surface) / <alpha-value>)',
          raised: 'rgb(var(--ib-raised) / <alpha-value>)',
          fg: 'rgb(var(--ib-fg) / <alpha-value>)',
          muted: 'rgb(var(--ib-muted) / <alpha-value>)',
          subtle: 'rgb(var(--ib-subtle) / <alpha-value>)',
          line: 'rgb(var(--ib-line) / <alpha-value>)',
          focus: 'rgb(var(--ib-focus) / <alpha-value>)'
        }
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
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.08', letterSpacing: '-0.035em' }],
        'display-md': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.02', letterSpacing: '-0.045em' }],
        'display-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.05em' }]
      },
      spacing: {
        4.5: '1.125rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        section: 'clamp(4rem, 9vw, 7rem)'
      },
      maxWidth: {
        shell: '72rem',
        prose: '44rem',
        form: '26rem'
      },
      borderRadius: {
        card: '1.25rem',
        panel: '1.75rem',
        field: '0.875rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 30px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 2px 4px rgba(15, 23, 42, 0.05), 0 16px 44px rgba(15, 23, 42, 0.09)',
        panel: '0 20px 60px rgba(15, 23, 42, 0.08)',
        'card-dark': '0 1px 2px rgba(0, 0, 0, 0.35), 0 14px 40px rgba(0, 0, 0, 0.28)'
      },
      transitionTimingFunction: {
        ib: 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      transitionDuration: {
        250: '250ms'
      },
      keyframes: {
        'ib-fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'none' }
        },
        'ib-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'ib-shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      },
      animation: {
        'ib-fade-up': 'ib-fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ib-fade-in': 'ib-fade-in 0.35s ease-out both',
        'ib-shimmer': 'ib-shimmer 1.6s linear infinite'
      },
      // the UI uses finer steps than Tailwind's default scale; without these
      // keys classes like text-ink/45 and bg-ink/8 silently generate nothing
      opacity: {
        8: '0.08',
        15: '0.15',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85'
      }
    }
  },
  plugins: []
};

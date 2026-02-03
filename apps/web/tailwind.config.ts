import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Sky Blue (Azul Océano)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // Principal
          600: '#0284c7',  // Hover
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49'
        },
        // Secondary - Teal (Progreso, métricas positivas)
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',  // Principal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e'
        },
        // Accent - Coral (Alertas, energía)
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Principal
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407'
        },
        // Semantic - Success (Emerald)
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        // Semantic - Error (Rose)
        error: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519'
        },
        // Semantic - Warning (Amber)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],      // 12px - Labels, badges
        'sm': ['0.875rem', { lineHeight: '1.5' }],    // 14px - Texto secundario
        'base': ['1rem', { lineHeight: '1.6' }],      // 16px - Body (mínimo móvil)
        'lg': ['1.125rem', { lineHeight: '1.5' }],    // 18px - Subtítulos
        'xl': ['1.25rem', { lineHeight: '1.4' }],     // 20px - H3
        '2xl': ['1.5rem', { lineHeight: '1.3' }],     // 24px - H2
        '3xl': ['1.75rem', { lineHeight: '1.2' }],    // 28px - H1
        'metric': ['2rem', { lineHeight: '1' }]       // 32px - Números/tiempos
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.16)',
        'xl': '0 16px 32px rgba(0, 0, 0, 0.20)',
        // Dark mode shadows (2x opacity)
        'dark-sm': '0 1px 2px rgba(0, 0, 0, 0.10)',
        'dark': '0 2px 4px rgba(0, 0, 0, 0.16)',
        'dark-md': '0 4px 8px rgba(0, 0, 0, 0.24)',
        'dark-lg': '0 8px 16px rgba(0, 0, 0, 0.32)',
        'dark-xl': '0 16px 32px rgba(0, 0, 0, 0.40)'
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'full': '9999px'
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'DEFAULT': '16px',
        'lg': '24px',
        'xl': '32px'
      }
    }
  },
  plugins: []
} satisfies Config

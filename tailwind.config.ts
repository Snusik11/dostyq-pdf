import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Every colour is `rgb(var(--color-*-rgb) / <alpha-value>)` (channels are
      // defined in src/styles/tokens.css) so opacity modifiers such as `bg-bg/70`
      // work. With a plain `var(--color-*)` Tailwind drops such classes silently.
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
          dark: 'rgb(var(--color-primary-dark-rgb) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light-rgb) / <alpha-value>)',
        },
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
          2: 'rgb(var(--color-surface-2-rgb) / <alpha-value>)',
          light: 'rgb(var(--color-surface-light-rgb) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--color-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted-rgb) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
        danger: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        overlay: 'var(--color-overlay)',
      },
      fontFamily: {
        sans: ['Golos Text', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['20px', { lineHeight: '1.5' }],
        xl: ['24px', { lineHeight: '1.5' }],
        '2xl': ['32px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
} satisfies Config;

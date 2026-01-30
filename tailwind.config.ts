// tailwind.config.ts
import type { Config } from 'tailwindcss';
import { colors, typography, spacing, radius, motion } from './docs/design/token';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // HYP Design System - Single source of truth from docs/design/token.ts
      colors,

      fontSize: {
        xl: [typography.size.xl, { lineHeight: '1.2' }],
        lg: [typography.size.lg, { lineHeight: '1.3' }],
        md: [typography.size.md, { lineHeight: '1.5' }],
        sm: [typography.size.sm, { lineHeight: '1.5' }],
        xs: [typography.size.xs, { lineHeight: '1.5' }],
      },

      fontWeight: {
        regular: typography.weight.regular.toString(),
        medium: typography.weight.medium.toString(),
        semibold: typography.weight.semibold.toString(),
      },

      spacing,

      borderRadius: radius,

      transitionDuration: motion,

      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

export const colors = {
  neutral: {
    900: '#1F2937',
    700: '#374151',
    500: '#6B7280',
    300: '#E5E7EB',
    200: '#F3F4F6',
    100: '#F8F9FB',
  },
  primary: {
    600: '#5A78FF',
    500: '#4C6CFF',
    100: '#E9EDFF',
  },
  success: {
    600: '#2FBF71',
    100: '#D1FAE5',
  },
  danger: {
    600: '#B91C1C',
    100: '#FEE2E2',
  },
} as const;

export const typography = {
  size: {
    xl: '32px',
    lg: '24px',
    md: '16px',
    sm: '14px',
    xs: '12px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
} as const;

export const motion = {
  fast: '120ms',
  base: '180ms',
  slow: '240ms',
} as const;

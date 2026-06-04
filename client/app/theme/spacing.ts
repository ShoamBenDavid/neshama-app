export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// Semantic aliases — prefer these in new screens for consistency.
export const layout = {
  screenH: spacing.base,
  screenV: spacing.lg,
  sectionV: spacing['2xl'],
  cardPad: spacing.base,
  cardGap: spacing.md,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  card: 20,
  hero: 28,
  pill: 999,
  full: 9999,
} as const;

export const shadows = {
  // Softer baseline shadows — wellness apps benefit from very gentle elevation.
  sm: {
    shadowColor: '#1F2235',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1F2235',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1F2235',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  xl: {
    shadowColor: '#1F2235',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 8,
  },
  // Soft purple glow for primary CTAs.
  glow: {
    shadowColor: '#5B66E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const hitSlop = {
  sm: { top: 8, bottom: 8, left: 8, right: 8 },
  md: { top: 12, bottom: 12, left: 12, right: 12 },
  lg: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

export default { spacing, layout, borderRadius, shadows, hitSlop };

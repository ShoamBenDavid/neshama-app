// Neshama design tokens — soft wellness palette.
// Existing keys are preserved for backward compatibility; values shift to the
// new warm-cream / indigo / lavender direction. New `brand.*`, `surface.*`,
// `gradients.*` entries are introduced for the redesign.

const brand = {
  indigo: '#5B66E5',
  indigoSoft: '#7C86EE',
  indigoDeep: '#3B45B8',
  lavender: '#B5A8E8',
  lavenderMist: '#E6DFF7',
  cream: '#FAF6EF',
  creamWarm: '#F3EBDD',
  warmCoral: '#E58A85',
  warmCoralSoft: '#F5C5BD',
};

const surface = {
  cream: '#FAF6EF',
  creamWarm: '#F3EBDD',
  card: '#FFFFFF',
  cardSoft: '#FBF8F2',
  cardMuted: '#F4EFE6',
  night: '#0E1B3D',
  nightDeep: '#050A22',
};

export const colors = {
  // --- Brand (mapped to the new indigo direction) ---
  primary: brand.indigo,
  primaryLight: brand.indigoSoft,
  primaryDark: brand.indigoDeep,

  secondary: brand.lavender,
  secondaryLight: brand.lavenderMist,
  secondaryDark: '#8B7CC9',

  accent: brand.lavender,
  accentLight: brand.lavenderMist,
  accentDark: '#8B7CC9',

  brand,
  surface: surface.card,
  surfaceElevated: surface.cardSoft,
  surfaces: surface,

  background: surface.card,

  text: {
    primary: '#1F2235',
    secondary: '#5B5F77',
    tertiary: '#9CA0B5',
    muted: '#7A7E94',
    inverse: '#FFFFFF',
    link: brand.indigo,
    onPhoto: '#FFFFFF',
  },

  status: {
    success: '#6FCFA3',
    successDark: '#3FA67A',
    warning: '#F2B968',
    warningDark: '#D08F3D',
    error: '#E58A85',
    errorDark: '#C26460',
    info: '#8FB6E5',
    infoDark: '#5B8CC2',
  },

  // Soft watercolor mood palette (less neon than before).
  mood: {
    1: '#E8A28C',
    2: '#F2C58A',
    3: '#8FB6E5',
    4: '#8FD3B6',
    5: '#B5A8E8',
  } as Record<number, string>,

  // English labels kept for legacy reads; screens should prefer `t('moods.*')`.
  moodLabel: {
    1: 'Struggling',
    2: 'Low',
    3: 'Okay',
    4: 'Good',
    5: 'Great',
  } as Record<number, string>,

  gradients: {
    // Legacy gradients (kept so existing screens render unchanged).
    primary: [brand.indigo, brand.lavender],
    secondary: ['#7BC8A4', brand.indigo],
    warm: ['#FDCB6E', '#E17055'],
    cool: ['#74B9FF', '#A29BFE'],
    calm: ['#DFE6E9', surface.cream],
    meditation: ['#667EEA', '#764BA2'],
    breathing: ['#34D399', '#22D3EE'],
    yoga: ['#FA709A', '#FEE140'],
    article: ['#A18CD1', '#FBC2EB'],
    sunset: ['#FD746C', '#FF9068'],
    background:'#FDFCF8',
    // New named gradients aligned to the redesign.
    dawn: ['#FCEFE1', brand.lavenderMist],
    morningSky: [brand.lavenderMist, surface.cream],
    lavenderWash: [brand.lavenderMist, surface.cream],
    indigoSoft: [brand.indigo, brand.indigoSoft],
    nightSky: [surface.night, '#1E2A52', surface.nightDeep],
    crisisSoft: [brand.warmCoralSoft, brand.warmCoral],
    journalSafe: ['#F0E6D2', brand.lavenderMist],
    moodCalm: ['#E6DFF7', '#F0E6D2'],
  },

  border: '#E8E2D6',
  borderLight: '#F0EAE0',
  divider: '#EFE8DC',

  overlay: 'rgba(14, 17, 35, 0.45)',
  overlaySoft: 'rgba(14, 17, 35, 0.25)',
  shadow: '#1F2235',

  tab: {
    active: brand.indigo,
    activeTint: brand.indigo,
    inactive: '#9CA0B5',
    inactiveTint: '#9CA0B5',
    background: 'rgba(255,255,255,0.96)',
    border: '#EFE8DC',
  },

  category: {
    anxiety: '#E58A85',
    depression: '#B5A8E8',
    relationships: '#F2A1C0',
    'work-stress': '#F2B968',
    success: '#6FCFA3',
    general: '#8FB6E5',
  } as Record<string, string>,
} as const;

export type Colors = typeof colors;
export default colors;

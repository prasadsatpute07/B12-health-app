// ─── Theme — Spatial Teal × Clinical Navy (dark) ────────────────────────────

export const colors = {
  // Backgrounds — deep navy spatial layers
  bg:         '#060F1A',
  bgDeep:     '#040C14',
  bgMid:      '#091520',
  bgSurface:  '#0D1E2E',
  bgCard:     '#0F2236',
  bgElevated: '#142D46',
  bgMuted:    '#0D1E2E',
  bgGlass:    'rgba(14, 33, 55, 0.72)',
  bgGlassLt:  'rgba(20, 45, 70, 0.55)',

  // Primary palette — teal / cyan
  primary:      '#00C9A7',
  primaryLight: '#2DDCBC',
  primaryDark:  '#00A98D',
  cyan:         '#22D3EE',
  sky:          '#38BDF8',

  // Accent palette
  accent:       '#06B6D4',
  accentSoft:   'rgba(0, 201, 167, 0.12)',
  accentWarm:   '#FBBF24',
  mint:         '#34D399',
  mintGlow:     'rgba(52, 211, 153, 0.15)',
  violet:       '#818CF8',
  violetGlow:   'rgba(129, 140, 248, 0.14)',
  amber:        '#FBBF24',
  amberGlow:    'rgba(251, 191, 36, 0.14)',
  rose:         '#FB7185',
  roseGlow:     'rgba(251, 113, 133, 0.14)',

  // Risk
  riskLow:     '#00C9A7',
  riskMedium:  '#FBBF24',
  riskHigh:    '#FB7185',

  riskBgLow:    'rgba(0, 201, 167, 0.14)',
  riskBgMedium: 'rgba(251, 191, 36, 0.14)',
  riskBgHigh:   'rgba(251, 113, 133, 0.14)',

  // Text — light on dark
  textPrimary:   '#EFF8FF',
  textSecondary: 'rgba(220, 240, 255, 0.58)',
  textMuted:     'rgba(180, 215, 240, 0.32)',

  // Borders — glass tinted
  border:      'rgba(56, 130, 180, 0.12)',
  borderLight: 'rgba(100, 180, 220, 0.10)',
  borderTeal:  'rgba(0, 201, 167, 0.18)',
  borderCyan:  'rgba(34, 211, 238, 0.15)',

  // Tints — glow overlays
  tintPrimary:       'rgba(0, 201, 167, 0.10)',
  tintPrimaryStrong: 'rgba(0, 201, 167, 0.18)',
  tintAccent:        'rgba(0, 201, 167, 0.12)',
  tintAccentBorder:  'rgba(0, 201, 167, 0.28)',
  tintWarning:       'rgba(251, 191, 36, 0.12)',
  tintWarningBorder: 'rgba(251, 191, 36, 0.24)',
  tintDanger:        'rgba(251, 113, 133, 0.10)',
  tintDangerBorder:  'rgba(251, 113, 133, 0.25)',
  tintStreak:        'rgba(251, 191, 36, 0.14)',
  tintViolet:        'rgba(129, 140, 248, 0.14)',
  tintVioletBorder:  'rgba(129, 140, 248, 0.24)',

  overlay: 'rgba(4, 12, 20, 0.75)',

  // Gradients (start/end for LinearGradient)
  gradientHeroStart: '#06B6D4',
  gradientHeroMid:   '#00C9A7',
  gradientHeroEnd:   '#34D399',
  gradientCardStart: 'rgba(0, 201, 167, 0.12)',
  gradientCardEnd:   'rgba(34, 211, 238, 0.06)',
};

export const fonts = {
  heading: 'System',
  body:    'System',
};

export const fontSizes = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,
  hero: 34,
};

export const fontWeights = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const radius = {
  sm:   10,
  md:   16,
  lg:   22,
  xl:   28,
  xxl:  36,
  full: 999,
};

export const shadow = {
  subtle: {
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  button: {
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },
  tabBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
};

export default { colors, fontSizes, fontWeights, spacing, radius, shadow };

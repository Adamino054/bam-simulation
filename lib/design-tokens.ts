/**
 * DESIGN TOKENS — Central Bank Simulator
 * ======================================
 * Système de design institutionnel BAM / CNCB-inspired
 * Tokens centralisés pour le thème dark/light + palette institutionnelle
 */

// ── Type Definitions ───────────────────────────────────────────
export interface ColorToken {
  DEFAULT: string
  light?: string
  dark?: string
}

export interface DesignTokens {
  colors: {
    bg: Record<string, string>
    text: Record<string, string>
    border: Record<string, string>
    accent: Record<string, string>
    data: Record<string, string>
    maroc: Record<string, string>
  }
  fonts: {
    editorial: string
    sans: string
    mono: string
  }
  spacing: Record<string, string>
  radius: Record<string, string>
  shadows: Record<string, string>
}

// ── Palette CNCB / Maroc-inspired ────────────────────────────────
export const MAROC_PALETTE = {
  // Rouge institutionnel BAM
  primary: {
    DEFAULT: '#B41923',
    light: '#D6454F',
    dark: '#8B131B',
    50: '#FEF2F2',
    100: '#FED7D7',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56565',
    500: '#B41923',
    600: '#8B131B',
    700: '#6B1017',
    800: '#4A0C11',
    900: '#2D070A',
  },
  // Or / Amber institutionnel
  gold: {
    DEFAULT: '#C9A86A',
    light: '#D9C090',
    dark: '#A68A4F',
    50: '#FDF9F0',
    100: '#F5ECD0',
    200: '#EBD9A8',
    300: '#DFC478',
    400: '#D4B05C',
    500: '#C9A86A',
    600: '#A68A4F',
    700: '#8A7240',
    800: '#6E5A34',
    900: '#523F28',
  },
  // Vert bourse / positif
  success: {
    DEFAULT: '#4A9D7C',
    light: '#6BB89A',
    dark: '#3A7D62',
  },
  // Bleu institutionnel
  cool: {
    DEFAULT: '#5C7E92',
    light: '#7BA3B8',
    dark: '#4A6574',
    50: '#F0F4F7',
    100: '#D9E3EA',
    200: '#B3C7D4',
    300: '#8DAABE',
    400: '#678EA8',
    500: '#5C7E92',
    600: '#4A6574',
    700: '#384D58',
    800: '#273640',
    900: '#151E24',
  },
  // Rouge alerte / négatif
  danger: {
    DEFAULT: '#C25450',
    light: '#D47A77',
    dark: '#A04340',
  },
  // Warning / amber
  warning: {
    DEFAULT: '#C9A86A',
    light: '#D9C090',
    dark: '#A68A4F',
  },
} as const

// ── Theme-aware CSS Variables ──────────────────────────────────
export const DARK_THEME = {
  bg: {
    base: '#0E0F12',
    panel: '#14161A',
    elevated: '#1C1F26',
    hover: '#242830',
    active: '#2C3038',
  },
  text: {
    primary: '#F0F0EA',
    secondary: '#9A9B9B',
    tertiary: '#5E6066',
    inverse: '#141418',
  },
  border: {
    subtle: 'rgba(240, 240, 234, 0.05)',
    default: 'rgba(240, 240, 234, 0.10)',
    strong: 'rgba(240, 240, 234, 0.18)',
    focus: 'rgba(180, 25, 35, 0.5)',
  },
  accent: {
    primary: '#B41923',
    warm: '#C9A86A',
    cool: '#5C7E92',
  },
  data: {
    positive: '#4A9D7C',
    negative: '#C25450',
    neutral: '#9A9B9B',
    warning: '#C9A86A',
    info: '#5C7E92',
  },
} as const

export const LIGHT_THEME = {
  bg: {
    base: '#F8F8F4',
    panel: '#FFFFFF',
    elevated: '#F0F0EC',
    hover: '#E6E6E0',
    active: '#DDDCD6',
  },
  text: {
    primary: '#141418',
    secondary: '#4E4E54',
    tertiary: '#888890',
    inverse: '#F0F0EA',
  },
  border: {
    subtle: 'rgba(20, 20, 24, 0.06)',
    default: 'rgba(20, 20, 24, 0.10)',
    strong: 'rgba(20, 20, 24, 0.18)',
    focus: 'rgba(180, 25, 35, 0.4)',
  },
  accent: {
    primary: '#B41923',
    warm: '#A68A4F',
    cool: '#4A6574',
  },
  data: {
    positive: '#3A8B6A',
    negative: '#B54540',
    neutral: '#6E6E74',
    warning: '#A68A4F',
    info: '#4A6574',
  },
} as const

// ── Semantic Color Mapping ──────────────────────────────────────
export const SEMANTIC_COLORS = {
  // Economic indicators
  inflation: MAROC_PALETTE.primary.DEFAULT,
  growth: MAROC_PALETTE.success.DEFAULT,
  unemployment: MAROC_PALETTE.danger.DEFAULT,
  outputGap: MAROC_PALETTE.cool.DEFAULT,
  
  // Interest rates
  policyRate: MAROC_PALETTE.primary.DEFAULT,
  interbankRate: MAROC_PALETTE.cool.DEFAULT,
  lendingRate: MAROC_PALETTE.gold.DEFAULT,
  
  // Scenarios
  scenarioStandard: '#4A9D7C',
  scenarioHard: '#C9A86A',
  scenarioCrisis: '#C25450',
  
  // Severity
  critical: '#C25450',
  high: '#C9A86A',
  medium: '#5C7E92',
  low: '#4A9D7C',
} as const

// ── Typography Scale ───────────────────────────────────────────
export const TYPOGRAPHY = {
  display: 'clamp(3rem, 7vw, 5.5rem)',
  h1: 'clamp(2rem, 4vw, 3rem)',
  h2: 'clamp(1.5rem, 3vw, 2.25rem)',
  h3: '1.25rem',
  body: '0.9375rem', // 15px
  sm: '0.8125rem',   // 13px
  xs: '0.75rem',     // 12px
  '2xs': '0.6875rem', // 11px
} as const

// ── Spacing Scale ───────────────────────────────────────────────
export const SPACING = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const

// ── Border Radius ───────────────────────────────────────────────
export const RADIUS = {
  none: '0',
  sm: '3px',
  DEFAULT: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const

// ── Shadows ────────────────────────────────────────────────────
export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  glow: '0 0 20px rgba(180, 25, 35, 0.15)',
} as const

// ── Z-Index Scale ─────────────────────────────────────────────
export const Z_INDEX = {
  behind: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  drawer: 40,
  overlay: 30,
  header: 50,
} as const

// ── Animation Timing ────────────────────────────────────────────
export const TRANSITIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '500ms cubic-bezier(0.16, 1, 0.3, 1)',
  spring: '700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// ── Breakpoints ─────────────────────────────────────────────────
export const BREAKPOINTS = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
} as const

// ── Metrics reference ───────────────────────────────────────────
export const METRICS_CONFIG = {
  inflation: {
    target: 2.0,
    tolerance: 0.5,
    unit: '%',
    precision: 1,
    label: 'Inflation',
    labelShort: 'π',
    description: 'Variation annuelle de l\'indice des prix à la consommation',
    formula: '\\pi_t = \\beta\\pi^e + \\kappa\\tilde{y} + \\alpha\\Delta p^{imp}',
  },
  gdpGrowth: {
    potential: 3.0,
    unit: '%',
    precision: 1,
    label: 'Croissance PIB',
    labelShort: 'g',
    description: 'Croissance annuelle du Produit Intérieur Brut réel',
  },
  unemployment: {
    nairu: 9.5,
    unit: '%',
    precision: 1,
    label: 'Chômage',
    labelShort: 'u',
    description: 'Taux de chômage selon la définition du BIT',
    formula: 'u_t = u^* - \\delta_{okun}\\cdot\\tilde{y}_t',
  },
  outputGap: {
    unit: '%',
    precision: 1,
    label: 'Output gap',
    labelShort: 'ỹ',
    description: 'Écart entre production observée et potentielle',
    formula: '\\tilde{y}_t = \\rho\\tilde{y}_{t-1} - \\sigma(i^D - \\pi^e) + \\delta\\tilde{y}^*',
  },
  policyRate: {
    neutral: 2.5,
    unit: '%',
    precision: 2,
    label: 'Taux directeur',
    labelShort: 'i^*',
    description: 'Taux d\'intérêt directeur fixé par Bank Al-Maghrib',
  },
  interbankRate: {
    unit: '%',
    precision: 2,
    label: 'TMP',
    labelShort: 'i^{TMP}',
    description: 'Taux moyen pondéré sur le marché interbancaire',
  },
  lendingRate: {
    unit: '%',
    precision: 2,
    label: 'Taux débiteur',
    labelShort: 'i^D',
    description: 'Taux moyen des crédits bancaires au secteur privé',
  },
} as const
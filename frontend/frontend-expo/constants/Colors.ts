/**
 * Juno App — Color Theme
 * 
 * Warm beige + sage green palette inspired by the app redesign.
 * 
 * ─── HOW TO EDIT ───
 * • Change `brand` values to update the primary green and beige tones globally.
 * • Change `semantic` values to adjust how colors are applied (backgrounds, text, etc.).
 * • The `palette` section provides raw color ramps if you need granular control.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. BRAND TOKENS  — edit these to change the overall feel
// ═══════════════════════════════════════════════════════════════════════════════

const brand = {
  /** Sage green — primary action color */
  green:       '#7C8B6B',
  greenDark:   '#6A7A5A',
  greenLight:  '#A8B89A',
  greenMuted:  '#E8EDE3',

  /** Warm beige — background family */
  beige:       '#F5F1EB',
  beigeDark:   '#E8E4DE',
  beigeLight:  '#FAFAF7',
  beigeCard:   '#F0EDE7',

  /** Dark text */
  ink:         '#2D2D2D',
  inkLight:    '#5A5A5A',
  inkMuted:    '#8A8A8A',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FULL PALETTE  — raw color ramps for detailed use
// ═══════════════════════════════════════════════════════════════════════════════

const palette = {
  green: {
    50:  '#F2F5EF',
    100: '#E8EDE3',
    200: '#D1DBCA',
    300: '#A8B89A',
    400: '#8FA07E',
    500: '#7C8B6B',
    600: '#6A7A5A',
    700: '#586849',
    800: '#465538',
    900: '#344327',
  },
  gray: {
    50:  '#FAFAF8',
    100: '#F5F3F0',
    200: '#E8E6E2',
    300: '#D4D2CE',
    400: '#9CA3AF',
    500: '#8A8A8A',
    600: '#6B7280',
    700: '#5A5A5A',
    800: '#3D3D3D',
    900: '#2D2D2D',
  },
  red: {
    50:  '#FDF5F3',
    100: '#FAE8E4',
    300: '#E5A99E',
    500: '#C4655A',
    600: '#B5564A',
    700: '#96433A',
    900: '#5C2A24',
  },
  blue: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    300: '#93C5FD',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    900: '#1E3A8A',
  },
  amber: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    300: '#FCD34D',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  teal: {
    50:  '#F0FDFA',
    100: '#CCFBF1',
    300: '#5EEAD4',
    500: '#14B8A6',
    600: '#0D9488',
    700: '#0F766E',
  },
  purple: {
    50:  '#F8F7FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    500: '#6B5FD8',
    600: '#5A4FC7',
    700: '#4C3FB6',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SEMANTIC TOKENS — how colors are applied across the app
// ═══════════════════════════════════════════════════════════════════════════════

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  background:       '#FFFFFF',
  lightBackground:  brand.beige,
  surfaceBackground: brand.beigeLight,
  darkBackground:   '#1A1A1A',
  carePlanBackground: brand.beigeCard,

  // ── Foreground / Text ────────────────────────────────────────────────────
  foreground:         brand.ink,
  mutedForeground:    brand.inkMuted,
  secondaryForeground: brand.inkLight,

  // ── Primary (sage green) ─────────────────────────────────────────────────
  primary:            brand.green,
  primaryHover:       brand.greenDark,
  primaryLight:       brand.greenLight,
  primaryMuted:       brand.greenMuted,
  primaryForeground:  '#FFFFFF',

  // ── Secondary ────────────────────────────────────────────────────────────
  secondary:           brand.beige,
  secondaryHover:      brand.beigeDark,

  // ── Borders ──────────────────────────────────────────────────────────────
  border:     brand.beigeDark,
  darkBorder: '#CBD5C1',
  input:      'transparent',
  inputBackground: brand.beigeLight,
  inputBorder: '#D4D2CE',

  // ── Accents ──────────────────────────────────────────────────────────────
  accent:  palette.teal[500],
  accent2: '#C9B48C',           // warm sand/wheat — secondary warm tone
  accent3: palette.amber[500],
  accent4: palette.blue[500],
  accentForeground: '#FFFFFF',

  // ── Warm secondary (sand/wheat) ──────────────────────────────────────────
  warm:           '#C9B48C',
  warmLight:      '#E8DCC8',
  warmDark:       '#B09A6F',
  warmMuted:      '#F0E8D8',

  // ── Destructive ──────────────────────────────────────────────────────────
  destructive:           palette.red[600],
  destructiveForeground: '#FFFFFF',

  // ── Status colors ────────────────────────────────────────────────────────
  statusReady:      brand.green,
  statusReadyBg:    brand.greenMuted,
  statusProgress:   palette.blue[600],
  statusProgressBg: palette.blue[50],
  statusError:      palette.red[600],
  statusErrorBg:    palette.red[50],

  // ── Palette ramps (for granular use) ─────────────────────────────────────
  green:  palette.green,
  gray:   palette.gray,
  red:    palette.red,
  blue:   palette.blue,
  amber:  palette.amber,
  teal:   palette.teal,
  purple: palette.purple,

  // ── Legacy aliases (so existing code doesn't break) ──────────────────────
  muted: brand.beige,
  mediumBackground: brand.beige,
  orange: { 500: palette.amber[500] },
  pink:   { 500: '#E85D75' },
};

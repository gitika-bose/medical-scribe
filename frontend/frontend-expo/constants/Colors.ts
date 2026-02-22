/**
 * Shared color scheme for Juno app
 * Based on frontend/shared-theme.css
 */

export const Colors = {
  // Base colors
  background: '#ffffff',
  foreground: '#252525',
  
  // Primary brand colors (dark blue/black)
  primary: '#030213',
  primaryForeground: '#ffffff',
  
  // Secondary colors
  secondary: '#f3f3f5',
  secondaryForeground: '#030213',
  
  // Muted colors
  muted: '#ececf0',
  mutedForeground: '#717182',
  
  // Accent colors
  accent: '#e9ebef',
  accentForeground: '#030213',
  
  // Destructive/Error colors (red)
  destructive: '#d4183d',
  destructiveForeground: '#ffffff',
  
  // Border and input
  border: '#E5E7EB',
  input: 'transparent',
  inputBackground: '#f3f3f5',
  
  // Brand colors - Red (primary brand color)
  red: {
    50: '#fbf0ed',
    300: '#e2c1c6',
    500: '#db7f67',
    600: '#db7f67',
    700: '#a12808',
    900: '#8d2307',
  },
  
  // Brand colors - Blue (secondary brand color)
  blue: {
    50: '#e3eef5',
    300: '#77b6d7',
    500: '#63a2ca',
    600: '#3d86b4',
    700: '#326e94',
    900: '#1d1e2c',
  },
  
  // Additional brand colors
  purple: {
    500: '#d8a4d4',
  },
  orange: {
    500: '#dbbea1',
  },
  green: {
    500: '#a37b73',
  },
  
  // Neutral grays (for consistency)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// Legacy color mappings for backward compatibility
// These should be gradually replaced with the brand colors above
export const LegacyColors = {
  // Old blue (should be replaced with brand blue)
  oldBlue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Old red (should be replaced with brand red)
  oldRed: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Other colors
  yellow: {
    50: '#FEF3C7',
    100: '#FDE68A',
    400: '#FBBF24',
    500: '#F59E0B',
    700: '#92400E',
  },
  
  green: {
    500: '#10b981',
    600: '#15803D',
    700: '#DCFCE7',
  },
  
  purple: {
    500: '#A855F7',
  },
  
  orange: {
    500: '#F97316',
  },
  
  pink: {
    400: '#f472b6',
  },
};

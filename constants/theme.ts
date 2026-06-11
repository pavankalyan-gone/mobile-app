import { Appearance } from 'react-native';

const lightColors = {
  background: '#f9f9f7',
  surface: '#ffffff', // For card backgrounds and inputs
  surfaceDim: '#dadad8',
  surfaceContainer: '#eeeeec',
  surfaceContainerLow: '#f4f4f2',
  surfaceContainerHigh: '#e8e8e6',
  surfaceContainerHighest: '#e2e3e1',
  onSurface: '#1a1c1b',
  onSurfaceVariant: '#44483f',
  inverseSurface: '#2f3130',
  inverseOnSurface: '#f1f1ef',
  outline: '#74796e',
  outlineVariant: '#c4c8bc',
  borderSubtle: '#E5E7EB',
  primary: '#1b300f', // Forest Green
  onPrimary: '#ffffff',
  primaryContainer: '#1b300f',
  onPrimaryContainer: '#809a6e',
  secondary: '#446900',
  onSecondary: '#ffffff',
  secondaryContainer: '#b2f746', // Lime Green accent
  onSecondaryContainer: '#496f00',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorRed: '#EF4444',
  textMuted: '#6B7280',
};

// Material-style dark mapping of the same forest-green identity
const darkColors: typeof lightColors = {
  background: '#111411',
  surface: '#1a1d1a',
  surfaceDim: '#111411',
  surfaceContainer: '#1e221e',
  surfaceContainerLow: '#191c19',
  surfaceContainerHigh: '#282c27',
  surfaceContainerHighest: '#333733',
  onSurface: '#e2e3df',
  onSurfaceVariant: '#c4c8bc',
  inverseSurface: '#e2e3df',
  inverseOnSurface: '#2f3130',
  outline: '#8e948a',
  outlineVariant: '#44483f',
  borderSubtle: '#2e3330',
  primary: '#a4c98c', // lighter forest green for contrast on dark surfaces
  onPrimary: '#0d1f04',
  primaryContainer: '#324b24',
  onPrimaryContainer: '#bfe0a6',
  secondary: '#9fd945',
  onSecondary: '#1f3700',
  secondaryContainer: '#334d00',
  onSecondaryContainer: '#b2f746',
  error: '#ffb4ab',
  onError: '#690005',
  errorRed: '#f87171',
  textMuted: '#9CA3AF',
};

// Resolved ONCE at launch: every screen freezes its StyleSheet at module load,
// so a mid-session scheme change can't restyle them — the app picks up the
// system preference on the next start (userInterfaceStyle is "automatic").
export const isDarkMode = Appearance.getColorScheme() === 'dark';

export const theme = {
  colors: isDarkMode ? darkColors : lightColors,
  spacing: {
    margin: 24,
    gapLg: 32,
    gapMd: 16,
    gapSm: 8,
    paddingX: 16,
    paddingY: 14,
  },
  roundness: {
    sm: 4,
    default: 8,
    md: 12,
    lg: 16,
    xl: 24, // Major interactive components like buttons & input fields
    full: 9999,
  },
  typography: {
    headlineXl: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.64,
    },
    headlineXlMobile: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    headlineLg: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.24,
    },
    headlineMd: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    bodyLg: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyMd: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    labelLg: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    labelMd: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    labelSm: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
  },
};

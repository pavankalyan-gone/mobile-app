export const theme = {
  colors: {
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
  },
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

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

/**
 * Apple iOS Human Interface Guidelines (HIG) Design Tokens
 * Fluid physical typography, translucent materials, system colors & continuous corners.
 */
export const colors = {
  // Apple System Tint Colors
  primary: '#10B981', // Kirana Retail Emerald
  primaryDark: '#059669',
  primaryForest: '#047857',
  primaryLight: 'rgba(16, 185, 129, 0.12)',
  primaryBorder: 'rgba(16, 185, 129, 0.28)',

  systemBlue: '#007AFF', // iOS System Blue
  systemGreen: '#34C759',
  systemOrange: '#FF9500',
  systemRed: '#FF3B30',
  systemIndigo: '#5856D6',

  secondary: '#007AFF',
  accent: '#FF9500',
  danger: '#FF3B30',

  // iOS System Background Hierarchy
  background: '#F2F2F7', // iOS Grouped Table Background
  surface: '#FFFFFF', // Inset Group Card Surface
  card: '#FFFFFF',

  // iOS Dynamic Label Typography Hierarchy
  text: '#1C1C1E', // Primary Label
  textSecondary: '#636366', // Secondary Label
  textMuted: '#8E8E93', // Tertiary / Placeholder
  border: 'rgba(60, 60, 67, 0.12)', // iOS Hairline Separator
  divider: 'rgba(60, 60, 67, 0.08)',

  // Segmented Pill & Sheet Controls
  pillActiveBg: '#10B981',
  pillActiveText: '#FFFFFF',
  pillInactiveBg: 'rgba(118, 118, 128, 0.12)',
  pillInactiveText: '#1C1C1E',

  // Translucent Frosted Glass Overlay
  glassOverlay: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
};

/**
 * Apple Typography Specs (SF Pro Optical Scaling)
 */
export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  },
  tabularNums: {
    fontVariant: ['tabular-nums' as const],
    letterSpacing: -0.3,
  },
};

export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.primaryDark,
    background: colors.background,
    surface: colors.surface,
    error: colors.danger,
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F2F2F7',
      level3: '#E5E5EA',
      level4: '#D1D1D6',
      level5: '#C7C7CC',
    },
  },
  roundness: 16, // Apple Continuous Squircle Standard
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    background: '#000000', // iOS Pure Black True OLED
    surface: '#1C1C1E', // iOS Dark Inset Surface
    elevation: {
      level0: 'transparent',
      level1: '#1C1C1E',
      level2: '#2C2C2E',
      level3: '#3A3A3C',
      level4: '#48484A',
      level5: '#636366',
    },
  },
  roundness: 16,
};

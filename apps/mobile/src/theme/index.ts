import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';

/**
 * MasterX Design System & Human Interface Guidelines Tokens
 * Fluid physical typography, translucent materials, and MasterX signature Royal Purple CTA.
 */
export const colors = {
  // MasterX Primary CTA & Brand Accent
  primary: '#7367F0', // MasterX Royal Purple
  primaryDark: '#5E50EE',
  primaryForest: '#4839EB',
  primaryLight: '#EDEBFD', // MasterX Soft Purple Tint
  primaryBorder: 'rgba(115, 103, 240, 0.35)',

  // Semantic Colors (MasterX UI Kit)
  systemBlue: '#00CFE8', // MasterX Info Cyan
  systemGreen: '#28C76F', // MasterX Success Green
  systemOrange: '#FF9F43', // MasterX Warning Orange
  systemRed: '#EA5455', // MasterX Danger Red
  systemIndigo: '#7367F0', // MasterX Violet

  secondary: '#7367F0',
  accent: '#FF9F43',
  danger: '#EA5455',
  success: '#28C76F',

  // MasterX Neutral Canvas Hierarchy
  background: '#F8F7FA', // MasterX Light Neutral Canvas
  surface: '#FFFFFF', // Card Surface
  card: '#FFFFFF',

  // MasterX Typography Hierarchy
  text: '#2F2B3D', // Primary Charcoal Text
  textSecondary: '#6F6B7D', // Secondary Muted Slate
  textMuted: '#A8AAAE', // Tertiary / Placeholder
  border: '#DBDADE', // MasterX Hairline Separator
  divider: '#DBDADE',

  // Segmented Pill & Sheet Controls
  pillActiveBg: '#7367F0',
  pillActiveText: '#FFFFFF',
  pillInactiveBg: '#EDEBFD',
  pillInactiveText: '#7367F0',

  // Translucent Frosted Glass Overlay
  glassOverlay: 'rgba(248, 247, 250, 0.85)',
  glassBorder: 'rgba(219, 218, 222, 0.6)',
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

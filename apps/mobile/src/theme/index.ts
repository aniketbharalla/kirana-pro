import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const colors = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryForest: '#065F46',
  primaryLight: '#ECFDF5',
  primaryBorder: '#A7F3D0',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  danger: '#EF4444',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  pillActiveBg: '#10B981',
  pillActiveText: '#FFFFFF',
  pillInactiveBg: '#F1F5F9',
  pillInactiveText: '#475569',
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
      level2: '#F8FAFC',
      level3: '#F1F5F9',
      level4: '#E2E8F0',
      level5: '#CBD5E1',
    },
  },
  roundness: 14,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    background: '#0B1320',
    surface: '#151F30',
  },
  roundness: 14,
};

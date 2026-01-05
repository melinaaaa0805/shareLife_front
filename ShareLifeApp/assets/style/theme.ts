// src/theme/theme.ts
import { DarkTheme } from '@react-navigation/native';

export const colors = {
  /* ===== Brand / Pastel ===== */
  pink: '#EAB1CF',
  yellow: '#FFE27A',
  purple: '#9B7BEA',
  mint: '#A6D8C0',

  /* ===== UI Neutrals ===== */
  background: '#0E0E0E',
  surface: '#1A1A1A',
  card: '#1F1F1F',

  textPrimary: '#F5F5F5',
  textSecondary: '#B5B5B5',
  border: '#2A2A2A',

  /* ===== States ===== */
  success: '#A6D8C0',
  warning: '#FFE27A',
  danger: '#EAB1CF',
  info: '#9B7BEA',

  disabled: '#555555',
};
export const typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
};
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  round: 999,
};
export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.purple,
  },
};

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
};

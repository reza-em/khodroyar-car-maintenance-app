/**
 * Theme Configuration for KhodroYar Application
 * 
 * This module provides the theme configuration for the application
 * including colors, typography, and spacing.
 */

import { MD3LightTheme as DefaultLightTheme, MD3DarkTheme as DefaultDarkTheme } from 'react-native-paper';

// Brand colors
const colors = {
  // Primary colors (Navy/Graphite)
  primary: '#1e3a8a',
  primaryLight: '#3b82f6',
  primaryDark: '#0f172a',
  
  // Secondary colors (Blue/Turquoise)
  secondary: '#06b6d4',
  secondaryLight: '#22d3ee',
  secondaryDark: '#0891b2',
  
  // Status colors
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  
  info: '#3b82f6',
  infoLight: '#60a5fa',
  infoDark: '#2563eb',
  
  // Neutral colors
  background: '#f8fafc',
  backgroundDark: '#0f172a',
  surface: '#ffffff',
  surfaceDark: '#1e293b',
  text: '#1e293b',
  textDark: '#f8fafc',
  textSecondary: '#64748b',
  textSecondaryDark: '#94a3b8',
  textDisabled: '#94a3b8',
  textDisabledDark: '#64748b',
  border: '#e2e8f0',
  borderDark: '#334155',
  divider: '#cbd5e1',
  dividerDark: '#475569',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
};

// Typography
const typography = {
  fontFamily: 'System', // Will be replaced with Persian font
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    h1: 32,
    h2: 28,
    h3: 24,
  },
  fontWeights: {
    light: '300',
    normal: '400',
    medium: '500',
    bold: '700',
    extraBold: '900',
  },
  lineHeights: {
    normal: 1.5,
    tight: 1.25,
  },
};

// Spacing
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
};

// Create Paper theme for light mode
export const lightTheme = {
  ...DefaultLightTheme,
  colors: {
    ...DefaultLightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.info,
    surface: colors.surface,
    background: colors.background,
    error: colors.error,
    errorContainer: colors.errorLight,
    warning: colors.warning,
    success: colors.success,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: colors.text,
    onBackground: colors.text,
    onError: '#ffffff',
    elevation: {
      level0: 'transparent',
      level1: shadows.sm,
      level2: shadows.md,
      level3: shadows.lg,
      level4: shadows.lg,
      level5: shadows.lg,
    },
  },
  typography,
  spacing,
  borderRadius,
  isDark: false,
};

// Create Paper theme for dark mode
export const darkTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondaryLight,
    secondaryContainer: colors.secondaryDark,
    tertiary: colors.infoLight,
    surface: colors.surfaceDark,
    background: colors.backgroundDark,
    error: colors.errorLight,
    errorContainer: colors.errorDark,
    warning: colors.warningLight,
    success: colors.successLight,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: colors.textDark,
    onBackground: colors.textDark,
    onError: '#ffffff',
    elevation: {
      level0: 'transparent',
      level1: shadows.sm,
      level2: shadows.md,
      level3: shadows.lg,
      level4: shadows.lg,
      level5: shadows.lg,
    },
  },
  typography,
  spacing,
  borderRadius,
  isDark: true,
};

// Export theme based on mode
export function getTheme(mode: 'light' | 'dark' | 'system' = 'light') {
  // For now, use light theme as default
  // In production, detect system preference
  return mode === 'dark' ? darkTheme : lightTheme;
}

// Default theme
export const theme = lightTheme;

// Export colors for direct use
export { colors, typography, spacing, borderRadius, shadows };

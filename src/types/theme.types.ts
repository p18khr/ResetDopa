// Theme and color system types

/**
 * Color palette for light/dark modes
 */
export interface ColorPalette {
  background: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

/**
 * Theme color collections
 */
export interface ThemeColors {
  light: ColorPalette;
  dark: ColorPalette;
}

/**
 * Theme preference setting
 */
export type ThemePreference = 'light' | 'dark' | null;

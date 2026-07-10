/**
 * Vitalis color system. Calming + trustworthy palette from the product blueprint,
 * expressed as light/dark themes so every screen can pull semantic tokens.
 */

const palette = {
  skyBlue: '#2D9CDB', // primary — trust, calm
  emerald: '#27AE60', // secondary — growth, health
  gold: '#F2C94C', // accent — streaks, highlights
  offWhite: '#F8FAFC',
  ink: '#1A202C',
  slate: '#64748B',
  cloud: '#E2E8F0',
  white: '#FFFFFF',
  black: '#0B0F19',
  danger: '#EB5757',
};

export type Theme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
};

export const lightTheme: Theme = {
  primary: palette.skyBlue,
  secondary: palette.emerald,
  accent: palette.gold,
  background: palette.offWhite,
  card: palette.white,
  text: palette.ink,
  textMuted: palette.slate,
  border: palette.cloud,
  danger: palette.danger,
};

export const darkTheme: Theme = {
  primary: palette.skyBlue,
  secondary: palette.emerald,
  accent: palette.gold,
  background: palette.black,
  card: '#151A26',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#1E2635',
  danger: palette.danger,
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
  md: 12,
  lg: 20,
  pill: 999,
};

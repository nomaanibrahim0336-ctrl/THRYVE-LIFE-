import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from './colors';

/** Returns the active theme tokens based on the OS light/dark setting. */
export function useTheme(): { theme: Theme; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { theme: isDark ? darkTheme : lightTheme, isDark };
}

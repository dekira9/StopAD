/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

/** App is light-only; palette never follows system dark mode. */
export function useTheme() {
  return Colors.light;
}

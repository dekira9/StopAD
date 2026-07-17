import { useMemo } from 'react';

import {
  buildAppChromeTheme,
  getModalSurfaceTheme,
  type AppChromeTheme,
  type AppColorTheme,
  type ModalSurfaceTheme,
} from '@/constants/app-chrome-theme';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppChromeThemeValue = {
  theme: AppColorTheme;
  isDark: boolean;
  chrome: AppChromeTheme;
  modal: ModalSurfaceTheme;
};

/** Shared color chrome for diary UI + modals (one place instead of ad-hoc theme props). */
export function useAppChromeTheme(): AppChromeThemeValue {
  const theme = useTheme();
  const isDark = theme.background === Colors.dark.background;

  return useMemo(() => {
    const chrome = buildAppChromeTheme(theme, isDark);
    return {
      theme,
      isDark,
      chrome,
      modal: getModalSurfaceTheme(theme, chrome),
    };
  }, [isDark, theme]);
}

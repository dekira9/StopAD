import { NavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

import { Colors } from '@/constants/theme';

// expo-navigation-bar "dark" = dark icons on a light bar; "light" = light icons on a dark bar.
function navigationBarStyleForTheme(isDark: boolean): 'light' | 'dark' {
  return isDark ? 'light' : 'dark';
}

export function applyAppSystemChrome(background: string, isDark: boolean) {
  void SystemUI.setBackgroundColorAsync(background);

  if (Platform.OS !== 'android') return;

  RNStatusBar.setTranslucent(false);
  RNStatusBar.setBackgroundColor(background);
  RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  NavigationBar.setHidden(false);
  NavigationBar.setStyle(navigationBarStyleForTheme(isDark));
}

export function useAppSystemChrome() {
  const background = Colors.light.background;

  useEffect(() => {
    applyAppSystemChrome(background, false);
  }, [background]);
}

export function useAppSystemChromeRestore() {
  const background = Colors.light.background;

  return useCallback(() => {
    applyAppSystemChrome(background, false);
  }, [background]);
}

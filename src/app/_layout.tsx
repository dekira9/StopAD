import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts as useNunitoFonts,
} from '@expo-google-fonts/nunito';
import {
  RobotoCondensed_500Medium,
  useFonts as useRobotoCondensedFonts,
} from '@expo-google-fonts/roboto-condensed';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, TextInput, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Fonts } from '@/constants/theme';
import { useAppSystemChrome } from '@/hooks/use-system-chrome';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [condensedLoaded] = useRobotoCondensedFonts({
    RobotoCondensed_500Medium,
  });
  const fontsLoaded = nunitoLoaded && condensedLoaded;

  useAppSystemChrome();

  useEffect(() => {
    if (!fontsLoaded) return;

    const defaultFontStyle = { fontFamily: Fonts.sans };
    Text.defaultProps = { ...(Text.defaultProps ?? {}), style: defaultFontStyle };
    TextInput.defaultProps = { ...(TextInput.defaultProps ?? {}), style: defaultFontStyle };
    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const appBackground = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: appBackground },
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


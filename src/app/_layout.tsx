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
  RobotoCondensed_400Regular,
  RobotoCondensed_500Medium,
  useFonts as useRobotoCondensedFonts,
} from '@expo-google-fonts/roboto-condensed';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors, Fonts } from '@/constants/theme';
import { useAppSystemChrome } from '@/hooks/use-system-chrome';

type ComponentWithDefaultProps = {
  defaultProps?: Record<string, unknown>;
};

const TextWithDefaultProps = Text as typeof Text & ComponentWithDefaultProps;
const TextInputWithDefaultProps = TextInput as typeof TextInput & ComponentWithDefaultProps;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [condensedLoaded] = useRobotoCondensedFonts({
    RobotoCondensed_400Regular,
    RobotoCondensed_500Medium,
  });
  const fontsLoaded = nunitoLoaded && condensedLoaded;

  useAppSystemChrome();

  useEffect(() => {
    if (!fontsLoaded) return;

    const defaultFontStyle = { fontFamily: Fonts.sans };
    TextWithDefaultProps.defaultProps = {
      ...(TextWithDefaultProps.defaultProps ?? {}),
      style: defaultFontStyle,
    };
    TextInputWithDefaultProps.defaultProps = {
      ...(TextInputWithDefaultProps.defaultProps ?? {}),
      style: defaultFontStyle,
    };
    SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.light.background },
          }}
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

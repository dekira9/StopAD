/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#2C3654',
    background: '#F5F6FA',
    backgroundSelected: '#EEF0F8',
    textSecondary: '#727A91',
    accent: '#8A9BD2',
    accentText: '#FFFFFF',
    todayMarker: '#8A9BD2',
    cardSurface: '#FFFFFF',
    medicationCompleted: '#8A96B0',
    weekdayName: '#68788f',
    chromeBorder: 'rgba(138,155,210,0.22)',
    reminderOnBg: 'rgba(138,155,210,0.22)',
  },
  dark: {
    text: '#E8EAF2',
    background: '#161A26',
    backgroundSelected: '#161A26',
    textSecondary: '#9AA0B0',
    accent: '#9AA8D4',
    accentText: '#FFFFFF',
    todayMarker: '#A8B6DE',
    cardSurface: '#161A26',
    medicationCompleted: '#9AA6BE',
    weekdayName: '#A8B4C4',
    chromeBorder: 'rgba(154,168,212,0.26)',
    reminderOnBg: 'rgba(154,168,212,0.26)',
  },
} as const;

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const channel = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function blendColors(foreground: string, background: string, backgroundWeight: number): string {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  const w = backgroundWeight;
  return toHex({
    r: fg.r * (1 - w) + bg.r * w,
    g: fg.g * (1 - w) + bg.g * w,
    b: fg.b * (1 - w) + bg.b * w,
  });
}

const DAY_WEEK_LIGHT: Record<WeekdayIndex, string> = {
  0: '#D3D7E9',
  1: '#D3D7E9',
  2: '#D3D7E9',
  3: '#D3D7E9',
  4: '#D3D7E9',
  5: '#D3D7E9',
  6: '#D3D7E9',
};

const DAY_WEEK_DARK = (Object.keys(DAY_WEEK_LIGHT) as unknown as WeekdayIndex[]).reduce(
  (acc, day) => {
    acc[day] = blendColors(DAY_WEEK_LIGHT[day], Colors.dark.background, 0.7);
    return acc;
  },
  {} as Record<WeekdayIndex, string>,
);

export const DayWeekBackgrounds = {
  light: DAY_WEEK_LIGHT,
  dark: DAY_WEEK_DARK,
} as const;

export function getDayWeekBackground(isDark: boolean, dayOfWeek: WeekdayIndex): string {
  return isDark ? DayWeekBackgrounds.dark[dayOfWeek] : DayWeekBackgrounds.light[dayOfWeek];
}

export type { WeekdayIndex };

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

const nativeFonts = {
  sans: 'Nunito_400Regular',
  sansLight: 'Nunito_300Light',
  sansMedium: 'Nunito_500Medium',
  sansSemiBold: 'Nunito_600SemiBold',
  sansBold: 'Nunito_700Bold',
  sansExtraBold: 'Nunito_800ExtraBold',
  serif: Platform.OS === 'ios' ? 'ui-serif' : 'serif',
  rounded: 'Nunito_400Regular',
  mono: Platform.OS === 'ios' ? 'ui-monospace' : 'monospace',
  condensed: 'RobotoCondensed_500Medium',
  condensedRegular: 'RobotoCondensed_400Regular',
} as const;

export const Fonts = Platform.select({
  ios: nativeFonts,
  default: nativeFonts,
  web: {
    sans: 'var(--font-sans)',
    sansLight: 'var(--font-sans)',
    sansMedium: 'var(--font-sans)',
    sansSemiBold: 'var(--font-sans)',
    sansBold: 'var(--font-sans)',
    sansExtraBold: 'var(--font-sans)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    condensed: 'var(--font-condensed)',
    condensedRegular: 'var(--font-condensed)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

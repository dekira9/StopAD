/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#141414',
    background: '#F8FAF8',
    backgroundElement: '#E5EDE8',
    backgroundSelected: '#F0F4F1',
    textSecondary: '#6B6B6B',
    accent: '#6B9080',
    accentText: '#FFFFFF',
    todayMarker: '#6B8FA3',
    panicRow: '#F2EBE8',
    cardSurface: '#FCFDFC',
    medicationCompleted: '#7A8F86',
  },
  dark: {
    text: '#F2F2F2',
    background: '#0F1411',
    backgroundElement: '#1A2420',
    backgroundSelected: '#151C18',
    textSecondary: '#A0A0A0',
    accent: '#7DA892',
    accentText: '#FFFFFF',
    todayMarker: '#A3C9B5',
    panicRow: '#241C1A',
    cardSurface: '#151C18',
    medicationCompleted: '#8FA89A',
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
  0: '#E8E6F0', // Sunday — lavender
  1: '#E3EBE2', // Monday — sage
  2: '#E0E9EE', // Tuesday — blue mist
  3: '#EEE9E2', // Wednesday — warm sand
  4: '#E2EEE9', // Thursday — sea foam
  5: '#E5EDDF', // Friday — moss
  6: '#EEE3E8', // Saturday — dusty rose
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

export function getDayWeekHeaderBackground(isDark: boolean, dayOfWeek: WeekdayIndex): string {
  const base = getDayWeekBackground(isDark, dayOfWeek);
  return isDark ? blendColors(base, '#FFFFFF', 0.06) : blendColors(base, '#000000', 0.08);
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

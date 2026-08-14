import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

type SizeProps = {
  width?: number;
  height?: number;
};

/** Soft clouds + crescent for night sleep card corner. */
export function SleepNightDecor({ width = 124, height = 80 }: SizeProps) {
  return (
    <Image
      source={require('@/assets/images/sleep-night-decor.png')}
      style={{ width, height }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Soft hills + sun for day sleep card corner. */
export function SleepDayDecor({ width = 124, height = 76 }: SizeProps) {
  return (
    <Image
      source={require('@/assets/images/sleep-day-decor.png')}
      style={{ width, height }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/** Cute sleeping crescent for the night-observation hint card. */
export function SleepHintMoon({ width = 48, height = 48 }: SizeProps) {
  return (
    <Image
      source={require('@/assets/images/sleep-hint-moon.png')}
      style={[styles.hintMoon, { width, height }]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  hintMoon: {
    marginTop: 2,
  },
});

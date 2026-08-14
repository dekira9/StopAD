import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';

type Props = {
  title: string;
  summary?: string;
  icon: ReactNode;
  backgroundColor: string;
  accentColor: string;
  open: boolean;
  onPress: () => void;
};

export function DayNoteTile({
  title,
  summary,
  icon,
  backgroundColor,
  accentColor,
  open,
  onPress,
}: Props) {
  const summaryText = summary?.trim() || '—';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor,
          borderColor: open ? accentColor : 'transparent',
        },
        open && styles.tileOpen,
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.summary, { color: accentColor }]} numberOfLines={2}>
        {summaryText}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    minHeight: 108,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileOpen: {
    opacity: 1,
  },
  iconWrap: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    lineHeight: 15,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  summary: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Fonts.sansMedium,
    textAlign: 'center',
    opacity: 0.85,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daySectionLabelStyle, weekBodyTextStyle } from '@/constants/typography';

type ThemeSlice = {
  textSecondary: string;
  rowBorder: string;
  iconMuted: string;
  sectionLabelBg: string;
};

type Props = {
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  theme: ThemeSlice;
  children: ReactNode;
};

export function DaySectionCollapsible({ title, summary, open, onToggle, theme, children }: Props) {
  return (
    <View style={[styles.wrap, { borderColor: theme.rowBorder }]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.header,
          { backgroundColor: theme.sectionLabelBg },
          pressed && styles.pressed,
        ]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {!open && summary ? (
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={1}>
            {summary}
          </Text>
        ) : (
          <View style={styles.summarySpacer} />
        )}
        <Ionicons
          name={open ? 'caret-up' : 'caret-down'}
          size={16}
          color={theme.iconMuted}
        />
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...daySectionLabelStyle,
    flexShrink: 0,
    maxWidth: '38%',
  },
  summary: {
    ...weekBodyTextStyle,
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
  },
  summarySpacer: {
    flex: 1,
  },
  body: {
    paddingBottom: 4,
  },
  pressed: {
    opacity: 0.72,
  },
});

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { daySectionLabelStyle, weekBodyTextStyle } from '@/constants/typography';

type ThemeSlice = {
  textSecondary: string;
  rowBorder: string;
  iconMuted: string;
  sectionLabelBg: string;
  bodyBg?: string;
};

type Props = {
  title: string;
  summary?: string;
  emptyHint?: string;
  open: boolean;
  onToggle: () => void;
  theme: ThemeSlice;
  children: ReactNode;
  variant?: 'card' | 'pill';
  shadowOpacity?: number;
};

export function DaySectionCollapsible({
  title,
  summary,
  emptyHint,
  open,
  onToggle,
  theme,
  children,
  variant = 'card',
  shadowOpacity,
}: Props) {
  const collapsedLabel = summary?.trim() || emptyHint?.trim() || '';
  const isHintOnly = !summary?.trim() && !!emptyHint?.trim();
  const isPill = variant === 'pill';

  const header = (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        isPill ? styles.pillHeader : styles.header,
        { backgroundColor: theme.sectionLabelBg },
        pressed && styles.pressed,
      ]}>
      {isPill ? (
        <Ionicons name="ellipsis-horizontal" size={16} color={theme.iconMuted} />
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {!open && collapsedLabel ? (
        <Text
          style={[styles.summary, { color: theme.textSecondary, opacity: isHintOnly ? 0.75 : 1 }]}
          numberOfLines={1}>
          {collapsedLabel}
        </Text>
      ) : (
        <View style={styles.summarySpacer} />
      )}
      <Ionicons
        name={open ? (isPill ? 'chevron-up' : 'caret-up') : isPill ? 'chevron-down' : 'caret-down'}
        size={isPill ? 14 : 16}
        color={theme.iconMuted}
      />
    </Pressable>
  );

  const body = open ? <View style={styles.body}>{children}</View> : null;

  if (isPill) {
    return (
      <View style={styles.pillWrap}>
        {header}
        {body}
      </View>
    );
  }

  const card = (
    <View style={[styles.wrap, { borderColor: theme.rowBorder, backgroundColor: theme.bodyBg }]}>
      {header}
      {body}
    </View>
  );

  if (shadowOpacity == null) {
    return card;
  }

  return (
    <View style={[styles.shadowWrap, { shadowOpacity }]}>
      {card}
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  wrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  pillWrap: {
    gap: 8,
  },
  header: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillHeader: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 999,
  },
  title: {
    ...daySectionLabelStyle,
    flexShrink: 0,
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

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getPanicAttackDayInfoLines } from '@/constants/panic-attack-day-info';
import type { AppLabels, Language } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  rowBorder: string;
  sectionLabelBg: string;
  panicRowBg: string;
  iconMuted: string;
};

type Props = {
  label: string;
  count: number;
  language: Language;
  labels: AppLabels;
  theme: ThemeSlice;
  onChange: (count: number) => void;
};

export function PanicAttackCountInput({ label, count, language, labels, theme, onChange }: Props) {
  const [infoExpanded, setInfoExpanded] = useState(false);
  const infoLines = useMemo(() => getPanicAttackDayInfoLines(language), [language]);

  const decrement = () => onChange(Math.max(0, count - 1));
  const increment = () => onChange(count + 1);

  return (
    <View style={[styles.sectionBlock, { borderColor: theme.rowBorder, backgroundColor: theme.panicRowBg }]}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, backgroundColor: theme.sectionLabelBg }]}>
        {label}
      </Text>

      <View style={styles.content}>
        <View style={styles.counterRow}>
          <Pressable
            onPress={decrement}
            disabled={count <= 0}
            style={({ pressed }) => [
              styles.counterButton,
              { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
              count <= 0 && styles.counterButtonDisabled,
              pressed && count > 0 && styles.pressed,
            ]}>
            <Ionicons name="remove" size={18} color={count > 0 ? theme.text : theme.iconMuted} />
          </Pressable>

          <View style={[styles.countBox, { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg }]}>
            <Text style={[styles.countValue, { color: theme.text }]}>{count}</Text>
          </View>

          <Pressable
            onPress={increment}
            style={({ pressed }) => [
              styles.counterButton,
              styles.addButton,
              { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="add" size={18} color={theme.activeText} />
          </Pressable>
        </View>

        <Text style={[styles.counterHint, { color: theme.textSecondary }]}>{labels.panicAttackAddHint}</Text>

        <Pressable
          onPress={() => setInfoExpanded((v) => !v)}
          style={({ pressed }) => [
            styles.infoToggle,
            { borderTopColor: theme.rowBorder },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.infoToggleTitle, { color: theme.textSecondary }]}>{labels.panicAttackWhatToMark}</Text>
          <Ionicons name={infoExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.iconMuted} />
        </Pressable>

        {infoExpanded ? (
          <View style={styles.infoBody}>
            {infoLines.map((line, index) => (
              <Text
                key={`${index}-${line.text.slice(0, 10)}`}
                style={[
                  line.type === 'lead'
                    ? styles.leadText
                    : line.type === 'symptom'
                      ? styles.symptomText
                      : styles.bodyText,
                  { color: line.type === 'lead' ? theme.textSecondary : theme.text },
                ]}>
                {line.type === 'symptom' ? `• ${line.text}` : line.text}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { borderBottomWidth: 1 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 6,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  leadText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  symptomText: {
    fontSize: 12,
    lineHeight: 18,
    paddingLeft: 4,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.45,
  },
  addButton: {},
  countBox: {
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  countValue: {
    fontSize: 20,
    fontFamily: Fonts.mono,
    fontWeight: '800',
  },
  counterHint: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 2,
  },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoToggleTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  infoBody: {
    gap: 6,
    paddingBottom: 2,
  },
  pressed: { opacity: 0.7 },
});

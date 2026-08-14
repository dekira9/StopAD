import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getPanicAttackDayInfoLines } from '@/constants/panic-attack-day-info';
import type { AppLabels, Language } from '@/constants/i18n';
import { formatSectionTitle, daySectionLabelStyle, weekBodyTextStyle, weekServiceTextStyle } from '@/constants/typography';

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
  iconMuted: string;
};

type Props = {
  label: string;
  count: number;
  language: Language;
  labels: AppLabels;
  theme: ThemeSlice;
  onChange: (count: number) => void;
  onOpenHelp?: () => void;
  hideLabel?: boolean;
};

export function PanicAttackCountInput({
  label,
  count,
  language,
  labels,
  theme,
  onChange,
  onOpenHelp,
  hideLabel,
}: Props) {
  const [infoExpanded, setInfoExpanded] = useState(false);
  const infoLines = useMemo(() => getPanicAttackDayInfoLines(language), [language]);

  const decrement = () => onChange(Math.max(0, count - 1));
  const increment = () => onChange(count + 1);

  return (
    <View style={styles.sectionBlock}>
      {hideLabel ? null : (
        <Text style={[styles.sectionLabel, { backgroundColor: theme.sectionLabelBg }]}>
          {formatSectionTitle(label)}
        </Text>
      )}

      <View style={styles.content}>
        <View style={[styles.counterCard, { borderColor: theme.inactiveBorder }]}>
          <View pointerEvents="none" style={styles.cardDecor}>
            <Image
              source={require('@/assets/images/anxiety-episode-decor.png')}
              style={styles.counterDecor}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
          </View>

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
        </View>

        {onOpenHelp ? (
          <Pressable
            onPress={onOpenHelp}
            accessibilityLabel={labels.panicAttackHowToHelp}
            style={({ pressed }) => [styles.helpRow, pressed && styles.pressed]}>
            <View style={[styles.helpButton, { backgroundColor: theme.activeBg, borderColor: theme.activeBg }]}>
              <Ionicons name="pulse" size={20} color={theme.activeText} />
            </View>
            <Text style={[styles.helpLabel, { color: theme.text }]}>{labels.panicAttackHowToHelp}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => setInfoExpanded((v) => !v)}
          style={({ pressed }) => [
            styles.infoToggle,
            { borderTopColor: theme.rowBorder },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.infoToggleTitle, { color: theme.textSecondary }]}>{labels.panicAttackWhatToMark}</Text>
          <Ionicons name={infoExpanded ? 'caret-up' : 'caret-down'} size={18} color={theme.iconMuted} />
        </Pressable>

        {infoExpanded ? (
          <View style={styles.infoBody}>
            {infoLines.map((line, index) => {
              if (line.type === 'point') {
                return (
                  <View key={`${index}-${line.text.slice(0, 10)}`} style={styles.pointRow}>
                    <View style={styles.pointIconWrap}>
                      <Ionicons name="ellipse-outline" size={22} color="#8A9BD2" style={styles.pointIconRing} />
                      <Ionicons name="pulse" size={11} color="#8A9BD2" />
                    </View>
                    <Text style={[styles.bodyText, styles.pointText, { color: theme.text }]}>{line.text}</Text>
                  </View>
                );
              }

              return (
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
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {},
  sectionLabel: {
    ...daySectionLabelStyle,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
  },
  bodyText: {
    ...weekBodyTextStyle,
    lineHeight: 22,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  pointIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointIconRing: {
    position: 'absolute',
  },
  pointText: {
    flex: 1,
    minWidth: 0,
  },
  leadText: {
    ...weekServiceTextStyle,
    marginTop: 4,
  },
  symptomText: {
    ...weekBodyTextStyle,
    lineHeight: 22,
    paddingLeft: 4,
  },
  counterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#5A4F7A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 0,
  },
  counterDecor: {
    width: 124,
    height: 112,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    zIndex: 1,
    marginRight: 100,
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
    fontSize: 17,
    fontWeight: '400',
  },
  counterHint: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 16,
    marginTop: 2,
    zIndex: 1,
    marginRight: 100,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  helpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    elevation: 2,
  },
  helpLabel: {
    ...weekBodyTextStyle,
    flex: 1,
    fontWeight: '600',
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
    ...weekServiceTextStyle,
  },
  infoBody: {
    gap: 6,
    paddingBottom: 2,
  },
  pressed: { opacity: 0.7 },
});

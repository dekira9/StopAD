import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import { SleepDayDecor, SleepHintMoon, SleepNightDecor } from '@/components/sleep-decorations';
import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import { dayMedicationsHeaderStyle, daySectionLabelStyle, formatSectionTitle, weekBodyTextStyle, weekButtonTextStyle, weekServiceTextStyle } from '@/constants/typography';
import {
  calculateSleepTotalMinutes,
  createExtraSleep,
  createSleepAwakening,
  formatSleepDuration,
  parseSleepLog,
  serializeSleepLog,
  type SleepAwakening,
  type SleepLog,
  type SleepSegment,
} from '@/utils/sleep-log';

const NIGHT = {
  accent: '#6F63C4',
  accentSoft: '#E9E5F8',
  iconBg: '#E4DFF6',
  buttonBorder: '#C4B8E8',
  buttonBg: '#F4F1FB',
  cardBorder: '#C4B8E8',
} as const;

const DAY = {
  accent: '#E08A3A',
  accentSoft: '#FCE9D6',
  iconBg: '#FBE0C8',
  buttonBorder: '#F0B87A',
  buttonBg: '#FFF6ED',
  cardBorder: '#F0B87A',
} as const;

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  modalOverlay: string;
  modalBg: string;
  subtlePanelBorder: string;
  sectionLabelBg: string;
  rowBorder: string;
  iconMuted: string;
};

type PickerTarget =
  | { scope: 'main'; field: 'from' | 'to' }
  | { scope: 'awakening'; id: string; field: 'from' | 'to' }
  | { scope: 'extraSleep'; id: string; field: 'from' | 'to' };

type Props = {
  label: string;
  value: string;
  labels: AppLabels;
  theme: ThemeSlice;
  onChange: (value: string) => void;
  onOpenNightObservation?: () => void;
  hideLabel?: boolean;
};

function formatDisplayTime(time: string): string {
  if (!time.trim()) return '--:--';
  return formatTimeValue(parseTimeValue(time));
}

function CardHeader({
  title,
  icon,
  iconBg,
  iconColor,
  titleColor,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  titleColor: string;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.cardTitle, { color: titleColor }]}>{title}</Text>
    </View>
  );
}

function DecorCard({
  children,
  borderColor,
  decor,
}: {
  children: ReactNode;
  borderColor: string;
  decor: ReactNode;
}) {
  return (
    <View style={[styles.card, { borderColor }]}>
      <View pointerEvents="none" style={styles.cardDecor}>
        {decor}
      </View>
      {children}
    </View>
  );
}

export function SleepInput({ label, value, labels, theme, onChange, onOpenNightObservation, hideLabel }: Props) {
  const log = useMemo(() => parseSleepLog(value), [value]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const totalMinutes = useMemo(() => calculateSleepTotalMinutes(log), [log]);
  const totalLabel =
    totalMinutes !== null
      ? formatSleepDuration(totalMinutes, labels)
      : null;

  const updateLog = (nextLog: SleepLog) => {
    onChange(serializeSleepLog(nextLog));
  };

  const setMainTime = (field: 'from' | 'to', time: string) => {
    updateLog({ ...log, [field]: time });
  };

  const setAwakeningTime = (id: string, field: 'from' | 'to', time: string) => {
    updateLog({
      ...log,
      awakenings: log.awakenings.map((item) => (item.id === id ? { ...item, [field]: time } : item)),
    });
  };

  const setExtraSleepTime = (id: string, field: 'from' | 'to', time: string) => {
    updateLog({
      ...log,
      extraSleeps: log.extraSleeps.map((item) => (item.id === id ? { ...item, [field]: time } : item)),
    });
  };

  const addAwakening = () => {
    updateLog({
      ...log,
      awakenings: [...log.awakenings, createSleepAwakening(log.awakenings.length)],
    });
  };

  const removeAwakening = (id: string) => {
    updateLog({
      ...log,
      awakenings: log.awakenings.filter((item) => item.id !== id),
    });
  };

  const addExtraSleep = () => {
    updateLog({
      ...log,
      extraSleeps: [...log.extraSleeps, createExtraSleep(log.extraSleeps.length)],
    });
  };

  const removeExtraSleep = (id: string) => {
    updateLog({
      ...log,
      extraSleeps: log.extraSleeps.filter((item) => item.id !== id),
    });
  };

  const pickerInitialTime = (() => {
    if (!pickerTarget) return formatTimeValue(new Date());
    if (pickerTarget.scope === 'main') {
      return log[pickerTarget.field]?.trim() || formatTimeValue(new Date());
    }
    if (pickerTarget.scope === 'awakening') {
      const awakening = log.awakenings.find((item) => item.id === pickerTarget.id);
      if (!awakening) return formatTimeValue(new Date());
      return awakening[pickerTarget.field]?.trim() || formatTimeValue(new Date());
    }
    const segment = log.extraSleeps.find((item) => item.id === pickerTarget.id);
    if (!segment) return formatTimeValue(new Date());
    return segment[pickerTarget.field]?.trim() || formatTimeValue(new Date());
  })();

  const renderTimeButton = (time: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeButton,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.timeButtonText, { color: time.trim() ? theme.text : theme.textSecondary }]}>
        {formatDisplayTime(time)}
      </Text>
    </Pressable>
  );

  const renderIntervalRow = (
    from: string,
    to: string,
    onFromPress: () => void,
    onToPress: () => void,
    onRemove?: () => void,
  ) => (
    <View style={styles.intervalRow}>
      <Text style={[styles.intervalLabel, { color: theme.textSecondary }]}>{labels.sleepFrom}</Text>
      {renderTimeButton(from, onFromPress)}
      <Text style={[styles.intervalLabel, { color: theme.textSecondary }]}>{labels.sleepTo}</Text>
      {renderTimeButton(to, onToPress)}
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={6} style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
          <Ionicons name="remove-circle-outline" size={16} color={theme.textSecondary} />
        </Pressable>
      ) : (
        <View style={styles.removeSpacer} />
      )}
    </View>
  );

  return (
    <>
      <View style={styles.sectionBlock}>
        {hideLabel ? null : (
          <Text style={[styles.sectionLabel, { backgroundColor: theme.sectionLabelBg }]}>
            {formatSectionTitle(label)}
          </Text>
        )}

        <View style={styles.content}>
          <DecorCard borderColor={NIGHT.cardBorder} decor={<SleepNightDecor />}>
            <CardHeader
              title={labels.sleepNightSleep}
              icon="moon"
              iconBg={NIGHT.iconBg}
              iconColor={NIGHT.accent}
              titleColor="#000000"
            />

            {renderIntervalRow(
              log.from,
              log.to,
              () => setPickerTarget({ scope: 'main', field: 'from' }),
              () => setPickerTarget({ scope: 'main', field: 'to' }),
            )}

            <Text style={[styles.subheading, { color: theme.textSecondary }]}>{labels.sleepAwakenings}</Text>

            {log.awakenings.map((awakening: SleepAwakening) => (
              <View key={awakening.id}>
                {renderIntervalRow(
                  awakening.from,
                  awakening.to,
                  () => setPickerTarget({ scope: 'awakening', id: awakening.id, field: 'from' }),
                  () => setPickerTarget({ scope: 'awakening', id: awakening.id, field: 'to' }),
                  () => removeAwakening(awakening.id),
                )}
              </View>
            ))}

            <Pressable
              onPress={addAwakening}
              style={({ pressed }) => [
                styles.addButton,
                { borderColor: NIGHT.buttonBorder },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.addIconCircle, { backgroundColor: NIGHT.buttonBg, borderColor: NIGHT.buttonBorder }]}>
                <Ionicons name="add" size={16} color={NIGHT.accent} />
              </View>
              <Text style={[styles.addButtonText, { color: NIGHT.accent }]}>
                {labels.sleepAddAwakening}
              </Text>
            </Pressable>
          </DecorCard>

          <DecorCard borderColor={DAY.cardBorder} decor={<SleepDayDecor />}>
            <CardHeader
              title={labels.sleepDaySleep}
              icon="sunny"
              iconBg={DAY.iconBg}
              iconColor={DAY.accent}
              titleColor="#000000"
            />

            {log.extraSleeps.map((segment: SleepSegment) => (
              <View key={segment.id}>
                {renderIntervalRow(
                  segment.from,
                  segment.to,
                  () => setPickerTarget({ scope: 'extraSleep', id: segment.id, field: 'from' }),
                  () => setPickerTarget({ scope: 'extraSleep', id: segment.id, field: 'to' }),
                  () => removeExtraSleep(segment.id),
                )}
              </View>
            ))}

            <Pressable
              onPress={addExtraSleep}
              style={({ pressed }) => [
                styles.addButton,
                { borderColor: DAY.buttonBorder },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.addIconCircle, { backgroundColor: DAY.buttonBg, borderColor: DAY.buttonBorder }]}>
                <Ionicons name="add" size={16} color={DAY.accent} />
              </View>
              <Text style={[styles.addButtonText, { color: DAY.accent }]}>
                {labels.sleepAddSleep}
              </Text>
            </Pressable>
          </DecorCard>

          {totalLabel ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{labels.sleepTotal}</Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>{totalLabel}</Text>
            </View>
          ) : null}

          <Text style={[styles.nightObservationIntro, { color: theme.textSecondary }]}>
            {labels.sleepNightObservationIntro}
          </Text>

          <Pressable
            onPress={() => onOpenNightObservation?.()}
            style={({ pressed }) => [
              styles.nightObservationButton,
              { borderColor: NIGHT.buttonBorder, backgroundColor: NIGHT.accentSoft },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="moon" size={16} color={NIGHT.accent} />
            <Text style={[styles.nightObservationButtonText, { color: NIGHT.accent }]}>
              {labels.sleepNightObservationButton}
            </Text>
          </Pressable>

          <View style={styles.hintCard}>
            <SleepHintMoon />
            <View style={styles.hintTextCol}>
              {labels.sleepNightObservationHint
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, index) =>
                  line === '⋆' ? (
                    <Text
                      key={`star-${index}`}
                      style={[styles.hintStar, { color: theme.textSecondary }]}>
                      ⋆
                    </Text>
                  ) : (
                    <Text
                      key={`line-${index}`}
                      style={[styles.hintText, { color: theme.textSecondary }]}>
                      {line}
                    </Text>
                  ),
                )}
            </View>
          </View>
        </View>
      </View>

      <MedicationTimePickerModal
        visible={pickerTarget !== null}
        title={labels.selectTime}
        labels={labels}
        initialTime={pickerInitialTime}
        onClose={() => setPickerTarget(null)}
        onSelect={(time) => {
          const normalized = formatTimeValue(parseTimeValue(time));
          if (!pickerTarget) return;
          if (pickerTarget.scope === 'main') {
            setMainTime(pickerTarget.field, normalized);
          } else if (pickerTarget.scope === 'awakening') {
            setAwakeningTime(pickerTarget.id, pickerTarget.field, normalized);
          } else {
            setExtraSleepTime(pickerTarget.id, pickerTarget.field, normalized);
          }
        }}
      />
    </>
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
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
    marginRight: 72,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...dayMedicationsHeaderStyle,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  intervalLabel: {
    ...weekServiceTextStyle,
    letterSpacing: 0,
    minWidth: 18,
  },
  timeButton: {
    minWidth: 58,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E2E2E8',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  timeButtonText: {
    ...weekBodyTextStyle,
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  removeSpacer: {
    width: 26,
  },
  subheading: {
    marginTop: 2,
    ...weekServiceTextStyle,
    zIndex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
    zIndex: 1,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    ...weekButtonTextStyle,
  },
  totalRow: {
    backgroundColor: '#F8F9FC',
    marginHorizontal: -12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    ...dayMedicationsHeaderStyle,
    fontFamily: Fonts.condensedRegular,
    fontWeight: '400',
    color: '#000000',
  },
  totalValue: {
    ...weekBodyTextStyle,
    fontSize: 20,
  },
  nightObservationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#5A4F7A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  nightObservationIntro: {
    ...weekBodyTextStyle,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    marginTop: 2,
  },
  nightObservationButtonText: {
    ...weekButtonTextStyle,
    textAlign: 'center',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8F9FC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hintTextCol: {
    flex: 1,
    gap: 2,
  },
  hintText: {
    ...weekBodyTextStyle,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0,
  },
  hintStar: {
    ...weekBodyTextStyle,
    fontSize: 14,
    lineHeight: 6,
    letterSpacing: 0,
    textAlign: 'center',
    opacity: 0.7,
  },
  pressed: { opacity: 0.72 },
});

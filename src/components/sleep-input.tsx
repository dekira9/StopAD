import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import type { AppLabels } from '@/constants/i18n';
import { daySectionLabelStyle, formatSectionTitle, weekBodyTextStyle, weekServiceTextStyle } from '@/constants/typography';
import {
  calculateSleepTotalMinutes,
  createSleepAwakening,
  formatSleepDuration,
  parseSleepLog,
  serializeSleepLog,
  type SleepAwakening,
  type SleepLog,
} from '@/utils/sleep-log';

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
  | { scope: 'awakening'; id: string; field: 'from' | 'to' };

type Props = {
  label: string;
  value: string;
  labels: AppLabels;
  theme: ThemeSlice;
  onChange: (value: string) => void;
  onOpenNightObservation?: () => void;
};

function formatDisplayTime(time: string): string {
  if (!time.trim()) return '--:--';
  return formatTimeValue(parseTimeValue(time));
}

export function SleepInput({ label, value, labels, theme, onChange, onOpenNightObservation }: Props) {
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

  const pickerInitialTime = (() => {
    if (!pickerTarget) return formatTimeValue(new Date());
    if (pickerTarget.scope === 'main') {
      return log[pickerTarget.field]?.trim() || formatTimeValue(new Date());
    }
    const awakening = log.awakenings.find((item) => item.id === pickerTarget.id);
    if (!awakening) return formatTimeValue(new Date());
    return awakening[pickerTarget.field]?.trim() || formatTimeValue(new Date());
  })();

  const renderTimeButton = (time: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeButton,
        { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
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
        <Text style={[styles.sectionLabel, { backgroundColor: theme.sectionLabelBg }]}>
          {formatSectionTitle(label)}
        </Text>

        <View style={styles.content}>
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
              { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="add-circle-outline" size={16} color={theme.activeBg} />
            <Text style={[styles.addButtonText, { color: theme.activeBg }]}>
              {labels.sleepAddAwakening.toLocaleLowerCase()}
            </Text>
          </Pressable>

          {totalLabel ? (
            <View style={[styles.totalRow, { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg }]}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{labels.sleepTotal}</Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>{totalLabel}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => onOpenNightObservation?.()}
            style={({ pressed }) => [
              styles.nightObservationButton,
              { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="moon-outline" size={16} color={theme.activeBg} />
            <Text style={[styles.nightObservationButtonText, { color: theme.activeBg }]}>
              {labels.sleepNightObservationButton}
            </Text>
          </Pressable>
        </View>
      </View>

      <MedicationTimePickerModal
        visible={pickerTarget !== null}
        title={labels.selectTime}
        labels={labels}
        theme={{
          text: theme.text,
          textSecondary: theme.textSecondary,
          activeBg: theme.activeBg,
          activeText: theme.activeText,
          inactiveBg: theme.inactiveBg,
          inactiveBorder: theme.inactiveBorder,
          inactiveText: theme.inactiveText,
          modalOverlay: theme.modalOverlay,
          modalBg: theme.modalBg,
          subtlePanelBorder: theme.subtlePanelBorder,
        }}
        initialTime={pickerInitialTime}
        onClose={() => setPickerTarget(null)}
        onSelect={(time) => {
          const normalized = formatTimeValue(parseTimeValue(time));
          if (!pickerTarget) return;
          if (pickerTarget.scope === 'main') {
            setMainTime(pickerTarget.field, normalized);
          } else {
            setAwakeningTime(pickerTarget.id, pickerTarget.field, normalized);
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  intervalLabel: {
    ...weekServiceTextStyle,
    letterSpacing: 0,
    minWidth: 18,
  },
  timeButton: {
    minWidth: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
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
    marginTop: 4,
    ...weekServiceTextStyle,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  addButtonText: {
    ...weekBodyTextStyle,
  },
  totalRow: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    ...weekServiceTextStyle,
  },
  totalValue: {
    ...weekBodyTextStyle,
  },
  nightObservationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  nightObservationButtonText: {
    ...weekBodyTextStyle,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
});

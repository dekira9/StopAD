import { Ionicons } from '@expo/vector-icons';
import type { Locale } from 'date-fns';
import { addMonths, format, parse } from 'date-fns';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MedicationDatePickerModal } from '@/components/medication-date-picker-modal';
import { MedicationIntakeDaysModal } from '@/components/medication-intake-days-modal';
import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import type { AppLabels } from '@/constants/i18n';
import { weekBodyTextStyle, weekButtonTextStyle, weekCardTitleStyle, weekDayTitleStyle, weekFieldLabelStyle, weekServiceTextStyle } from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import type { MedicationRepeatConfig } from '@/stores/wellness-store';
import { formatDayMonth } from '@/utils/date-format';
import { formatIntakeDaysSummary } from '@/utils/medication-intake';

type Props = {
  visible: boolean;
  labels: AppLabels;
  medication: string;
  times: string[];
  intakeDaysSummary: string;
  repeat: MedicationRepeatConfig;
  weekdayLabels: string[];
  durationStartKey: string;
  locale: Locale;
  onClose: () => void;
  onDelete: () => void;
  onUpdateRepeat: (repeat: MedicationRepeatConfig) => void;
  onUpdateTimes: (times: string[]) => void;
  onUpdateDuration: (updates: { startDateKey?: string; endDateKey?: string | null }) => void;
};

type DatePickerTarget = 'start' | 'end';

function normalizeTimeLabel(time: string): string {
  return formatTimeValue(parseTimeValue(time));
}

function getInitialLocalTimes(times: string[]): string[] {
  return times.length > 0 ? times.map((time) => (time.trim() ? normalizeTimeLabel(time) : '')) : [''];
}

export function MedicationScheduleModal({
  visible,
  labels,
  medication,
  times,
  intakeDaysSummary,
  repeat,
  weekdayLabels,
  durationStartKey,
  locale,
  onClose,
  onDelete,
  onUpdateRepeat,
  onUpdateTimes,
  onUpdateDuration,
}: Props) {
  const { modal: theme } = useAppChromeTheme();
  const [showIntakeDaysPicker, setShowIntakeDaysPicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [timePickerIndex, setTimePickerIndex] = useState<number | null>(null);
  const [localTimes, setLocalTimes] = useState<string[]>(() => getInitialLocalTimes(times));
  const [localRepeat, setLocalRepeat] = useState(repeat);
  const [localIntakeSummary, setLocalIntakeSummary] = useState(intakeDaysSummary);
  const [localStartKey, setLocalStartKey] = useState(() => repeat.startDateKey ?? durationStartKey);
  const [localEndKey, setLocalEndKey] = useState<string | null | undefined>(() => {
    const initialStartKey = repeat.startDateKey ?? durationStartKey;
    return repeat.endDateKey === undefined ? initialStartKey : repeat.endDateKey;
  });

  const durationDates = useMemo(() => {
    const start = parse(localStartKey, 'yyyy-MM-dd', new Date());
    const endLabel =
      localEndKey === null
        ? labels.medicationScheduleNoEnd
        : localEndKey
          ? formatDayMonth(parse(localEndKey, 'yyyy-MM-dd', new Date()), locale)
          : formatDayMonth(addMonths(start, localRepeat.months), locale);

    return {
      startLabel: formatDayMonth(start, locale),
      endLabel,
      endIsNone: localEndKey === null,
    };
  }, [localStartKey, localEndKey, localRepeat.months, locale, labels.medicationScheduleNoEnd]);

  const handleUpdateRepeat = (nextRepeat: MedicationRepeatConfig) => {
    setLocalRepeat(nextRepeat);
    setLocalIntakeSummary(formatIntakeDaysSummary(nextRepeat, labels, weekdayLabels));
    onUpdateRepeat(nextRepeat);
  };

  const updateTimeAt = (index: number, value: string) => {
    const nextTimes = [...localTimes];
    nextTimes[index] = normalizeTimeLabel(value);
    setLocalTimes(nextTimes);
    onUpdateTimes(nextTimes);
  };

  const addTime = () => {
    const nextTimes = [...localTimes, ''];
    setLocalTimes(nextTimes);
    onUpdateTimes(nextTimes);
  };

  const removeTime = (index: number) => {
    if (localTimes.length <= 1) return;
    const nextTimes = localTimes.filter((_, itemIndex) => itemIndex !== index);
    setLocalTimes(nextTimes);
    onUpdateTimes(nextTimes);
  };

  const handleDone = () => {
    const updates: { startDateKey?: string; endDateKey?: string | null } = {
      startDateKey: localStartKey,
    };
    if (localEndKey !== undefined) {
      updates.endDateKey = localEndKey;
    }
    onUpdateDuration(updates);
    onClose();
  };

  return (
    <>
      <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerBtn} />
              <Text style={[styles.title, { color: theme.text }]}>{labels.medicationScheduleTitle}</Text>
              <View style={styles.headerBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              {medication.trim() ? (
                <Text style={[styles.medName, { color: theme.textSecondary }]} numberOfLines={2}>
                  {medication.trim()}
                </Text>
              ) : null}

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{labels.medicationScheduleDays}</Text>
              <View style={styles.actionList}>
                <Pressable
                  onPress={() => setShowIntakeDaysPicker(true)}
                  style={({ pressed }) => [
                    styles.actionRow,
                    {
                      backgroundColor: theme.inactiveBg,
                      borderColor: theme.inactiveBorder,
                      shadowOpacity: theme.buttonShadow,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.actionRowText, { color: theme.inactiveText }]}>{localIntakeSummary}</Text>
                  <Text style={[styles.actionRowMeta, { color: theme.textSecondary }]}>
                    {labels.medicationScheduleChange}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{labels.medicationScheduleTime}</Text>
              <View style={styles.actionList}>
                {localTimes.map((entryTime, index) => (
                  <View
                    key={`${entryTime}-${index}`}
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: theme.inactiveBg,
                        borderColor: theme.inactiveBorder,
                        shadowOpacity: theme.buttonShadow,
                      },
                    ]}>
                    <Pressable
                      onPress={() => removeTime(index)}
                      disabled={localTimes.length <= 1}
                      hitSlop={6}
                      style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                      <Ionicons
                        name="remove-circle-outline"
                        size={16}
                        color={localTimes.length <= 1 ? theme.inactiveBorder : theme.textSecondary}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => setTimePickerIndex(index)}
                      style={({ pressed }) => [styles.timeBtn, pressed && styles.pressed]}>
                      {entryTime.trim() ? (
                        <Text style={[styles.timeText, { color: theme.text }]}>{entryTime}</Text>
                      ) : (
                        <Ionicons name="time-outline" size={28} color={theme.textSecondary} />
                      )}
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={addTime}
                  style={({ pressed }) => [
                    styles.actionRow,
                    {
                      backgroundColor: theme.inactiveBg,
                      borderColor: theme.inactiveBorder,
                      shadowOpacity: theme.buttonShadow,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.iconBtn}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.activeBg} />
                  </View>
                  <Text style={[styles.actionRowText, styles.addTimeText, { color: theme.activeBg }]}>
                    {labels.medicationScheduleAddTime}
                  </Text>
                </Pressable>
              </View>

              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{labels.medicationScheduleDuration}</Text>
              <View style={styles.actionList}>
                <Pressable
                  onPress={() => setDatePickerTarget('start')}
                  style={({ pressed }) => [
                    styles.actionRow,
                    {
                      backgroundColor: theme.inactiveBg,
                      borderColor: theme.inactiveBorder,
                      shadowOpacity: theme.buttonShadow,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.actionRowText, { color: theme.inactiveText }]}>{durationDates.startLabel}</Text>
                  <Text style={[styles.actionRowMeta, { color: theme.textSecondary }]}>
                    {labels.medicationScheduleStart}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setDatePickerTarget('end')}
                  style={({ pressed }) => [
                    styles.actionRow,
                    {
                      backgroundColor: theme.inactiveBg,
                      borderColor: theme.inactiveBorder,
                      shadowOpacity: theme.buttonShadow,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.actionRowText,
                      { color: durationDates.endIsNone ? theme.textSecondary : theme.inactiveText },
                    ]}>
                    {durationDates.endLabel}
                  </Text>
                  <Text style={[styles.actionRowMeta, { color: theme.textSecondary }]}>
                    {labels.medicationScheduleEnd}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={onDelete}
                style={({ pressed }) => [
                  styles.deleteButton,
                  {
                    backgroundColor: theme.inactiveBg,
                    borderColor: theme.inactiveBorder,
                    shadowOpacity: theme.buttonShadow,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.deleteButtonText, { color: theme.textSecondary }]}>
                  {labels.medicationScheduleDelete}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDone}
                style={({ pressed }) => [
                  styles.doneButton,
                  {
                    backgroundColor: theme.activeBg,
                    borderColor: theme.activeBg,
                    shadowOpacity: theme.buttonShadow,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
              </Pressable>
            </View>

            <MedicationIntakeDaysModal
              embedded
              visible={showIntakeDaysPicker}
              labels={labels}
              weekdayLabels={weekdayLabels}
              initialRepeat={localRepeat}
              onClose={() => setShowIntakeDaysPicker(false)}
              onApply={handleUpdateRepeat}
            />
          </View>
        </View>
      </Modal>

      <MedicationTimePickerModal
        visible={timePickerIndex !== null}
        title={labels.medicationScheduleTime}
        labels={labels}
        initialTime={timePickerIndex !== null ? localTimes[timePickerIndex] : formatTimeValue(new Date())}
        onClose={() => setTimePickerIndex(null)}
        onSelect={(time) => {
          if (timePickerIndex === null) return;
          updateTimeAt(timePickerIndex, time);
        }}
      />

      <MedicationDatePickerModal
        visible={datePickerTarget === 'start'}
        title={labels.medicationScheduleStart}
        labels={labels}
        locale={locale}
        selectedDateKey={localStartKey}
        onClose={() => setDatePickerTarget(null)}
        onSelect={(dateKey) => {
          const nextEndKey =
            localEndKey === undefined || (typeof localEndKey === 'string' && localEndKey < dateKey)
              ? dateKey
              : localEndKey;
          setLocalStartKey(dateKey);
          setLocalEndKey(nextEndKey);
          onUpdateDuration({ startDateKey: dateKey, endDateKey: nextEndKey });
        }}
      />

      <MedicationDatePickerModal
        visible={datePickerTarget === 'end'}
        title={labels.medicationScheduleEnd}
        labels={labels}
        locale={locale}
        selectedDateKey={
          localEndKey && typeof localEndKey === 'string'
            ? localEndKey
            : format(addMonths(parse(localStartKey, 'yyyy-MM-dd', new Date()), localRepeat.months), 'yyyy-MM-dd')
        }
        minimumDateKey={localStartKey}
        allowNone
        onClose={() => setDatePickerTarget(null)}
        onSelect={(dateKey) => {
          setLocalEndKey(dateKey);
          onUpdateDuration({ endDateKey: dateKey });
        }}
        onSelectNone={() => {
          setLocalEndKey(null);
          onUpdateDuration({ endDateKey: null });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: { minWidth: 72 },
  title: { ...weekCardTitleStyle },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  deleteButtonText: {
    ...weekButtonTextStyle,
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  doneButtonText: {
    ...weekButtonTextStyle,
  },
  medName: {
    ...weekDayTitleStyle,
    marginBottom: 8,
  },
  sectionLabel: {
    ...weekFieldLabelStyle,
    marginTop: 10,
    marginBottom: 6,
  },
  actionList: { gap: 8 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionRowText: { ...weekBodyTextStyle, flex: 1 },
  addTimeText: { ...weekButtonTextStyle },
  actionRowMeta: {
    ...weekServiceTextStyle,
  },
  iconBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBtn: {
    flex: 1,
    paddingVertical: 2,
  },
  timeText: {
    ...weekBodyTextStyle,
  },
  pressed: { opacity: 0.7 },
});

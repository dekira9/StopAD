import { Ionicons } from '@expo/vector-icons';
import type { Locale } from 'date-fns';
import { addMonths, format, parse } from 'date-fns';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { MedicationDatePickerModal } from '@/components/medication-date-picker-modal';
import { MedicationIntakeDaysModal } from '@/components/medication-intake-days-modal';
import { BellOffIcon, BellOnIcon } from '@/components/medical-ui-icons';
import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
  dayMedicationsHeaderStyle,
  formatSectionTitle,
  weekBodyTextStyle,
  weekCardTitleStyle,
  weekServiceTextStyle,
} from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import { formatMedicationLabel, parseMedicationLabel, type MedicationRepeatConfig } from '@/stores/wellness-store';
import { formatDayMonth } from '@/utils/date-format';
import { formatIntakeDaysSummary } from '@/utils/medication-intake';

export type MedicationScheduleCreatePayload = {
  medication: string;
  times: string[];
  repeat: MedicationRepeatConfig;
  startDateKey: string;
  endDateKey?: string | null;
  reminderEnabled: boolean;
};

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
  mode?: 'edit' | 'create';
  reminderEnabled?: boolean;
  onClose: () => void;
  onDelete: () => void;
  onUpdateRepeat: (repeat: MedicationRepeatConfig) => void;
  onUpdateTimes: (times: string[]) => void;
  onUpdateDuration: (updates: { startDateKey?: string; endDateKey?: string | null }) => void;
  onUpdateMedication?: (medication: string) => void;
  onUpdateReminder?: (enabled: boolean) => void;
  onCreate?: (payload: MedicationScheduleCreatePayload) => void;
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
  mode = 'edit',
  reminderEnabled = true,
  onClose,
  onDelete,
  onUpdateRepeat,
  onUpdateTimes,
  onUpdateDuration,
  onUpdateMedication,
  onUpdateReminder,
  onCreate,
}: Props) {
  const { modal: theme, chrome } = useAppChromeTheme();
  const isCreate = mode === 'create';
  const initialParts = parseMedicationLabel(medication);
  const [localName, setLocalName] = useState(initialParts.name);
  const [localDose, setLocalDose] = useState(initialParts.dose);
  const [showIntakeDaysPicker, setShowIntakeDaysPicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [timePickerIndex, setTimePickerIndex] = useState<number | null>(null);
  const [localTimes, setLocalTimes] = useState<string[]>(() => getInitialLocalTimes(times));
  const [localRepeat, setLocalRepeat] = useState(repeat);
  const [localIntakeSummary, setLocalIntakeSummary] = useState(intakeDaysSummary);
  const [localReminderEnabled, setLocalReminderEnabled] = useState(reminderEnabled);
  const [localStartKey, setLocalStartKey] = useState(() => repeat.startDateKey ?? durationStartKey);
  const [localEndKey, setLocalEndKey] = useState<string | null | undefined>(() => {
    const initialStartKey = repeat.startDateKey ?? durationStartKey;
    return repeat.endDateKey === undefined ? initialStartKey : repeat.endDateKey;
  });

  const medicationLabel = formatMedicationLabel(localName, localDose);
  const canSave = medicationLabel.trim().length > 0 && localTimes.some((time) => time.trim());
  const hasReminderTime = localTimes.some((time) => time.trim());

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

  const syncMedicationLabel = (name: string, dose: string) => {
    const nextLabel = formatMedicationLabel(name, dose).trim();
    // Skip empty labels so mid-edit clears do not orphan the existing schedule under the old name.
    if (!isCreate && nextLabel) {
      onUpdateMedication?.(nextLabel);
    }
  };

  const handleUpdateRepeat = (nextRepeat: MedicationRepeatConfig) => {
    setLocalRepeat(nextRepeat);
    setLocalIntakeSummary(formatIntakeDaysSummary(nextRepeat, labels, weekdayLabels));
    if (!isCreate) {
      onUpdateRepeat(nextRepeat);
    }
  };

  const updateTimeAt = (index: number, value: string) => {
    const nextTimes = [...localTimes];
    nextTimes[index] = normalizeTimeLabel(value);
    setLocalTimes(nextTimes);
    if (!isCreate) {
      onUpdateTimes(nextTimes);
    }
  };

  const addTime = () => {
    const nextTimes = [...localTimes, ''];
    setLocalTimes(nextTimes);
    if (!isCreate) {
      onUpdateTimes(nextTimes);
    }
  };

  const removeTime = (index: number) => {
    if (localTimes.length <= 1) return;
    const nextTimes = localTimes.filter((_, itemIndex) => itemIndex !== index);
    setLocalTimes(nextTimes);
    if (!isCreate) {
      onUpdateTimes(nextTimes);
    }
  };

  const handleUpdateReminder = (enabled: boolean) => {
    if (!hasReminderTime) return;
    setLocalReminderEnabled(enabled);
    if (!isCreate) {
      onUpdateReminder?.(enabled);
    }
  };

  const handleDone = () => {
    if (isCreate) {
      if (!canSave || !onCreate) return;
      onCreate({
        medication: medicationLabel.trim(),
        times: localTimes,
        repeat: localRepeat,
        startDateKey: localStartKey,
        endDateKey: localEndKey,
        reminderEnabled: localReminderEnabled,
      });
      return;
    }

    const nextLabel = medicationLabel.trim();
    if (nextLabel) {
      onUpdateMedication?.(nextLabel);
    }

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
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: theme.subtlePanelBorder }]} />
            </View>

            <View style={styles.headerRow}>
              <View style={styles.headerSide} />
              <Text style={[styles.title, { color: theme.text }]}>
                {formatSectionTitle(labels.medicationScheduleTitle)}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [styles.headerSide, styles.headerSideEnd, pressed && styles.pressed]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View
                style={[
                  styles.panel,
                  { backgroundColor: chrome.notesBlockBg, borderColor: chrome.dayBorder },
                ]}>
                <View
                  style={[
                    styles.panelHeader,
                    { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
                  ]}>
                  <Text style={styles.panelHeaderText}>{formatSectionTitle(labels.medicationName)}</Text>
                </View>
                <View style={[styles.panelBody, { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder }]}>
                  <TextInput
                    value={localName}
                    onChangeText={(name) => {
                      setLocalName(name);
                      syncMedicationLabel(name, localDose);
                    }}
                    placeholder={`... ${labels.medicationName}`}
                    placeholderTextColor={theme.iconMuted}
                    style={[styles.panelInput, { color: chrome.medicationFieldText }]}
                  />
                </View>
                <View
                  style={[
                    styles.panelHeader,
                    { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
                  ]}>
                  <Text style={styles.panelHeaderText}>
                    {formatSectionTitle(labels.medicationScheduleDose)}
                  </Text>
                </View>
                <View style={[styles.panelBodyLast, { backgroundColor: theme.inactiveBg }]}>
                  <TextInput
                    value={localDose}
                    onChangeText={(dose) => {
                      setLocalDose(dose);
                      syncMedicationLabel(localName, dose);
                    }}
                    placeholder={labels.medicationDose}
                    placeholderTextColor={theme.iconMuted}
                    style={[styles.panelInput, { color: chrome.medicationFieldText }]}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.panel,
                  { backgroundColor: chrome.notesBlockBg, borderColor: chrome.dayBorder },
                ]}>
                <View
                  style={[
                    styles.panelHeader,
                    { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
                  ]}>
                  <Text style={styles.panelHeaderText}>
                    {formatSectionTitle(labels.medicationScheduleDays)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowIntakeDaysPicker(true)}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.sheetRowValue, { color: theme.inactiveText }]}>{localIntakeSummary}</Text>
                  <View style={styles.sheetRowTrailing}>
                    <Text style={[styles.sheetRowMeta, { color: theme.activeBg }]}>
                      {labels.medicationScheduleChange}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                  </View>
                </Pressable>

                <View
                  style={[
                    styles.panelHeader,
                    { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
                  ]}>
                  <Text style={styles.panelHeaderText}>
                    {formatSectionTitle(labels.medicationScheduleTime)}
                  </Text>
                </View>
                {localTimes.map((entryTime, index) => (
                  <View
                    key={`${entryTime}-${index}`}
                    style={[styles.sheetRow, { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder }]}>
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
                        <Text style={[styles.timeText, { color: chrome.medicationFieldText }]}>{entryTime}</Text>
                      ) : (
                        <Ionicons name="time-outline" size={22} color={theme.iconMuted} />
                      )}
                      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                ))}
                <Pressable
                  onPress={addTime}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.iconBtn}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.activeBg} />
                  </View>
                  <Text style={[styles.addTimeText, { color: theme.activeBg }]}>
                    {labels.medicationScheduleAddTime}
                  </Text>
                </Pressable>

                <View
                  style={[
                    styles.panelHeader,
                    { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
                  ]}>
                  <Text style={styles.panelHeaderText}>
                    {formatSectionTitle(labels.medicationScheduleReminder)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.reminderRow,
                    {
                      backgroundColor: theme.inactiveBg,
                      borderColor: theme.rowBorder,
                      opacity: hasReminderTime ? 1 : 0.45,
                    },
                  ]}>
                  <View style={styles.reminderIconWrap}>
                    {localReminderEnabled && hasReminderTime ? (
                      <BellOnIcon size={24} color={theme.text} />
                    ) : (
                      <BellOffIcon size={24} color={theme.text} />
                    )}
                  </View>
                  <View style={styles.reminderTextWrap}>
                    <Text
                      style={[
                        styles.reminderStatus,
                        {
                          color:
                            hasReminderTime && localReminderEnabled
                              ? theme.activeBg
                              : theme.textSecondary,
                        },
                      ]}>
                      {hasReminderTime
                        ? localReminderEnabled
                          ? labels.medicationScheduleReminderOn
                          : labels.medicationScheduleReminderOff
                        : labels.reminderHint}
                    </Text>
                  </View>
                  <Switch
                    value={localReminderEnabled && hasReminderTime}
                    onValueChange={handleUpdateReminder}
                    disabled={!hasReminderTime}
                    trackColor={{ false: theme.inactiveBorder, true: theme.activeBg }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={theme.inactiveBorder}
                  />
                </View>

                <View
                  style={[
                    styles.panelHeader,
                    { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
                  ]}>
                  <Text style={styles.panelHeaderText}>
                    {formatSectionTitle(labels.medicationScheduleDuration)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setDatePickerTarget('start')}
                  style={({ pressed }) => [
                    styles.sheetRow,
                    { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.sheetRowValue, { color: theme.inactiveText }]}>{durationDates.startLabel}</Text>
                  <View style={styles.sheetRowTrailing}>
                    <Text style={[styles.sheetRowMeta, { color: theme.activeBg }]}>
                      {labels.medicationScheduleStart}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => setDatePickerTarget('end')}
                  style={({ pressed }) => [
                    styles.sheetRowLast,
                    { backgroundColor: theme.inactiveBg },
                    pressed && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.sheetRowValue,
                      { color: durationDates.endIsNone ? theme.textSecondary : theme.inactiveText },
                    ]}>
                    {durationDates.endLabel}
                  </Text>
                  <View style={styles.sheetRowTrailing}>
                    <Text style={[styles.sheetRowMeta, { color: theme.activeBg }]}>
                      {labels.medicationScheduleEnd}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                  </View>
                </Pressable>
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.subtlePanelBorder, backgroundColor: theme.modalBg }]}>
              <Pressable
                onPress={handleDone}
                disabled={isCreate && !canSave}
                style={({ pressed }) => [
                  styles.doneButton,
                  {
                    backgroundColor: theme.activeBg,
                    borderColor: theme.activeBg,
                    opacity: isCreate && !canSave ? 0.45 : 1,
                  },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
              </Pressable>
              {isCreate ? null : (
                <Pressable
                  onPress={onDelete}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
                  <Text style={[styles.deleteButtonText, { color: theme.textSecondary }]}>
                    {labels.medicationScheduleDelete}
                  </Text>
                </Pressable>
              )}
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
          if (!isCreate) {
            onUpdateDuration({ startDateKey: dateKey, endDateKey: nextEndKey });
          }
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
          if (!isCreate) {
            onUpdateDuration({ endDateKey: dateKey });
          }
        }}
        onSelectNone={() => {
          setLocalEndKey(null);
          if (!isCreate) {
            onUpdateDuration({ endDateKey: null });
          }
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
    paddingTop: 4,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerSide: { minWidth: 36 },
  headerSideEnd: { alignItems: 'flex-end' },
  title: {
    ...weekCardTitleStyle,
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelHeaderText: {
    ...dayMedicationsHeaderStyle,
  },
  panelBody: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  panelBodyLast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  panelInput: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetRowValue: {
    ...weekBodyTextStyle,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  sheetRowMeta: {
    ...weekServiceTextStyle,
  },
  sheetRowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addTimeText: {
    ...weekBodyTextStyle,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reminderIconWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTextWrap: {
    flex: 1,
  },
  reminderStatus: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeText: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  doneButtonText: {
    fontSize: 12,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontSize: 12,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.7 },
});

import { Ionicons } from '@expo/vector-icons';
import type { Locale } from 'date-fns';
import { addMonths, format, parse } from 'date-fns';
import { Image } from 'expo-image';
import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { MedicationDatePickerModal } from '@/components/medication-date-picker-modal';
import { MedicationIntakeDaysModal } from '@/components/medication-intake-days-modal';
import { BellOffIcon, BellOnIcon } from '@/components/medical-ui-icons';
import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
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

const DECOR = {
  name: require('@/assets/images/schedule-name-decor.png'),
  dose: require('@/assets/images/schedule-dose-decor.png'),
  day: require('@/assets/images/schedule-day-decor.png'),
  time: require('@/assets/images/schedule-time-decor.png'),
  reminder: require('@/assets/images/schedule-reminder-decor.png'),
  duration: require('@/assets/images/schedule-duration-decor.png'),
} as const;

const ACCENT = {
  name: { label: '#9B8EC4', blockBg: '#F7F4FC' },
  dose: { label: '#9B8EC4' },
  day: { label: '#5FA88A', blockBg: '#F3FAF6' },
  time: { label: '#6A9BC4', blockBg: '#F3F8FC' },
  reminder: { label: '#D08A6A', blockBg: '#FCF6F2' },
  duration: { label: '#7A92C4', blockBg: '#F4F7FC' },
} as const;

const WHITE_BOX = {
  borderColor: '#FFFFFF',
  backgroundColor: '#FFFFFF',
} as const;

function normalizeTimeLabel(time: string): string {
  return formatTimeValue(parseTimeValue(time));
}

function getInitialLocalTimes(times: string[]): string[] {
  return times.length > 0 ? times.map((time) => (time.trim() ? normalizeTimeLabel(time) : '')) : [''];
}

function ScheduleRow({
  source,
  label,
  labelColor,
  children,
  last,
  flushBottom,
  flushRight,
}: {
  source: number;
  label: string;
  labelColor: string;
  children: ReactNode;
  last?: boolean;
  flushBottom?: boolean;
  flushRight?: boolean;
}) {
  return (
    <View
      style={[
        styles.fieldRow,
        flushBottom && styles.fieldRowFlushBottom,
        flushRight && styles.fieldRowFlushRight,
        !last && styles.fieldRowBorder,
      ]}>
      <Image source={source} style={styles.decorImage} contentFit="contain" accessibilityIgnoresInvertColors />
      <View style={styles.fieldContent}>
        <Text style={[styles.fieldLabel, { color: labelColor }]}>{label}</Text>
        {children}
      </View>
    </View>
  );
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

  const handleDeletePress = () => {
    Alert.alert(
      labels.medicationScheduleDeleteConfirmTitle,
      labels.medicationScheduleDeleteConfirmMessage,
      [
        { text: labels.repeatCancel, style: 'cancel' },
        {
          text: labels.medicationScheduleDelete,
          style: 'destructive',
          onPress: onDelete,
        },
      ],
    );
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
              <View style={styles.headerSide} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View
                style={[
                  styles.fieldsCard,
                  styles.fieldsCardFlushBottom,
                  { backgroundColor: ACCENT.name.blockBg, borderColor: chrome.dayBorder },
                ]}>
                <ScheduleRow
                  source={DECOR.name}
                  label={formatSectionTitle(labels.medicationName)}
                  labelColor={ACCENT.name.label}
                  flushRight>
                  <TextInput
                    value={localName}
                    onChangeText={(name) => {
                      setLocalName(name);
                      syncMedicationLabel(name, localDose);
                    }}
                    placeholder={`... ${labels.medicationName}`}
                    placeholderTextColor={theme.iconMuted}
                    multiline
                    scrollEnabled={false}
                    style={[
                      styles.fieldInput,
                      styles.fieldInputBoxed,
                      WHITE_BOX,
                      { color: chrome.medicationFieldText },
                    ]}
                  />
                </ScheduleRow>

                <ScheduleRow
                  source={DECOR.dose}
                  label={formatSectionTitle(labels.medicationScheduleDose)}
                  labelColor={ACCENT.dose.label}
                  last
                  flushBottom
                  flushRight>
                  <TextInput
                    value={localDose}
                    onChangeText={(dose) => {
                      setLocalDose(dose);
                      syncMedicationLabel(localName, dose);
                    }}
                    placeholder={labels.medicationDose}
                    placeholderTextColor={theme.iconMuted}
                    multiline
                    scrollEnabled={false}
                    style={[
                      styles.fieldInput,
                      styles.fieldInputBoxed,
                      WHITE_BOX,
                      { color: chrome.medicationFieldText },
                    ]}
                  />
                </ScheduleRow>
              </View>

              <View
                style={[
                  styles.fieldsCard,
                  styles.fieldsCardFlushBottom,
                  { backgroundColor: ACCENT.day.blockBg, borderColor: chrome.dayBorder },
                ]}>
                <ScheduleRow
                  source={DECOR.day}
                  label={formatSectionTitle(labels.medicationScheduleDays)}
                  labelColor={ACCENT.day.label}
                  last
                  flushBottom
                  flushRight>
                  <Pressable
                    onPress={() => setShowIntakeDaysPicker(true)}
                    style={({ pressed }) => [
                      styles.inlineActionRow,
                      styles.fieldInputBoxed,
                      WHITE_BOX,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.fieldValue, { color: theme.inactiveText }]} numberOfLines={2}>
                      {localIntakeSummary}
                    </Text>
                    <View style={styles.sheetRowTrailing}>
                      <Text style={[styles.changeLink, { color: theme.textSecondary }]}>
                        {labels.medicationScheduleChange}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                    </View>
                  </Pressable>
                </ScheduleRow>
              </View>

              <View
                style={[
                  styles.fieldsCard,
                  styles.fieldsCardFlushBottom,
                  { backgroundColor: ACCENT.time.blockBg, borderColor: chrome.dayBorder },
                ]}>
                <ScheduleRow
                  source={DECOR.time}
                  label={formatSectionTitle(labels.medicationScheduleTime)}
                  labelColor={ACCENT.time.label}
                  last
                  flushBottom
                  flushRight>
                  <View style={styles.timesBlock}>
                    {localTimes.map((entryTime, index) => (
                      <View key={`${entryTime}-${index}`} style={styles.timeRow}>
                        {localTimes.length > 1 ? (
                          <Pressable
                            onPress={() => removeTime(index)}
                            hitSlop={6}
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
                            <Ionicons name="remove-circle-outline" size={16} color={theme.textSecondary} />
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => setTimePickerIndex(index)}
                          style={({ pressed }) => [
                            styles.timeChip,
                            WHITE_BOX,
                            pressed && styles.pressed,
                          ]}>
                          {entryTime.trim() ? (
                            <Text style={[styles.timeText, { color: chrome.medicationFieldText }]}>{entryTime}</Text>
                          ) : (
                            <Ionicons name="time-outline" size={20} color={theme.iconMuted} />
                          )}
                          <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                        </Pressable>
                      </View>
                    ))}
                    <Pressable
                      onPress={addTime}
                      style={({ pressed }) => [styles.addTimeBtn, pressed && styles.pressed]}>
                      <Ionicons name="add" size={14} color={ACCENT.time.label} />
                      <Text style={[styles.addTimeText, { color: ACCENT.time.label }]}>
                        {labels.medicationScheduleAddTime}
                      </Text>
                    </Pressable>
                  </View>
                </ScheduleRow>
              </View>

              <View
                style={[
                  styles.fieldsCard,
                  styles.fieldsCardFlushBottom,
                  { backgroundColor: ACCENT.duration.blockBg, borderColor: chrome.dayBorder },
                ]}>
                <ScheduleRow
                  source={DECOR.duration}
                  label={formatSectionTitle(labels.medicationScheduleDuration)}
                  labelColor={ACCENT.duration.label}
                  last
                  flushBottom
                  flushRight>
                  <View style={styles.durationBlock}>
                    <Pressable
                      onPress={() => setDatePickerTarget('start')}
                      style={({ pressed }) => [
                        styles.durationRow,
                        styles.fieldInputBoxed,
                        WHITE_BOX,
                        pressed && styles.pressed,
                      ]}>
                      <Text style={[styles.fieldValue, { color: theme.inactiveText }]}>
                        {durationDates.startLabel}
                      </Text>
                      <View style={styles.sheetRowTrailing}>
                        <Text style={[styles.changeLink, { color: theme.textSecondary }]}>
                          {labels.medicationScheduleStart}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => setDatePickerTarget('end')}
                      style={({ pressed }) => [
                        styles.durationRow,
                        styles.fieldInputBoxed,
                        WHITE_BOX,
                        pressed && styles.pressed,
                      ]}>
                      <Text
                        style={[
                          styles.fieldValue,
                          {
                            color: durationDates.endIsNone ? theme.textSecondary : theme.inactiveText,
                          },
                        ]}>
                        {durationDates.endLabel}
                      </Text>
                      <View style={styles.sheetRowTrailing}>
                        <Text style={[styles.changeLink, { color: theme.textSecondary }]}>
                          {labels.medicationScheduleEnd}
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                  </View>
                </ScheduleRow>
              </View>

              <View
                style={[
                  styles.fieldsCard,
                  styles.fieldsCardFlushBottom,
                  { backgroundColor: ACCENT.reminder.blockBg, borderColor: chrome.dayBorder },
                ]}>
                <ScheduleRow
                  source={DECOR.reminder}
                  label={formatSectionTitle(labels.medicationScheduleReminder)}
                  labelColor={ACCENT.reminder.label}
                  last
                  flushBottom
                  flushRight>
                  <View
                    style={[
                      styles.reminderRow,
                      styles.fieldInputBoxed,
                      WHITE_BOX,
                      { opacity: hasReminderTime ? 1 : 0.45 },
                    ]}>
                    <View style={styles.reminderIconWrap}>
                      {localReminderEnabled && hasReminderTime ? (
                        <BellOnIcon size={22} color={theme.text} />
                      ) : (
                        <BellOffIcon size={22} color={theme.text} />
                      )}
                    </View>
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
                    <Switch
                      value={localReminderEnabled && hasReminderTime}
                      onValueChange={handleUpdateReminder}
                      disabled={!hasReminderTime}
                      trackColor={{ false: theme.inactiveBorder, true: theme.activeBg }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor={theme.inactiveBorder}
                    />
                  </View>
                </ScheduleRow>
              </View>

              {isCreate ? null : (
                <View style={styles.deleteRow}>
                  <Image
                    source={require('@/assets/images/ic-delete.png')}
                    style={styles.deleteIcon}
                    contentFit="contain"
                    accessibilityIgnoresInvertColors
                  />
                  <Pressable
                    onPress={handleDeletePress}
                    style={({ pressed }) => [
                      styles.deleteButton,
                      { borderColor: '#C46B6B' },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.deleteButtonText, { color: '#C46B6B' }]}>
                      {labels.medicationScheduleDelete}
                    </Text>
                  </Pressable>
                </View>
              )}
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
                <Ionicons name="checkmark-circle" size={20} color={theme.activeText} />
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
  fieldsCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  fieldsCardFlushBottom: {
    paddingBottom: 2,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 2,
    paddingRight: 12,
    paddingVertical: 12,
    minHeight: 88,
  },
  fieldRowFlushBottom: {
    paddingBottom: 2,
  },
  fieldRowFlushRight: {
    paddingRight: 2,
  },
  fieldRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(138,155,210,0.22)',
  },
  decorImage: {
    width: 76,
    height: 76,
  },
  fieldContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  fieldInput: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    lineHeight: 22,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  fieldInputBoxed: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    textAlignVertical: 'top',
  },
  fieldValue: {
    ...weekBodyTextStyle,
    flex: 1,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  inlineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetRowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  changeLink: {
    ...weekServiceTextStyle,
    letterSpacing: 0.4,
    textTransform: 'none',
    fontSize: 12,
  },
  timesBlock: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
  },
  timeText: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  addTimeText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderIconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderStatus: {
    ...weekServiceTextStyle,
    flex: 1,
    letterSpacing: 0.6,
  },
  durationBlock: {
    gap: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
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
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIcon: {
    width: 46,
    height: 46,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
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

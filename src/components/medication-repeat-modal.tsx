import { Ionicons } from '@expo/vector-icons';
import { addDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
  MEDICATION_REPEAT_MONTH_OPTIONS,
  type MedicationRepeatConfig,
} from '@/stores/wellness-store';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const MONDAY_REF = new Date(2025, 0, 6);

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
};

type Props = {
  visible: boolean;
  labels: AppLabels;
  theme: ThemeSlice;
  weekdayLabels: string[];
  initialDayOfWeek: number;
  initialRepeat?: MedicationRepeatConfig;
  onClose: () => void;
  onApply: (config: MedicationRepeatConfig) => void;
};

type ContentProps = Omit<Props, 'visible'>;

function getInitialRepeatState(initialRepeat: MedicationRepeatConfig | undefined, initialDayOfWeek: number) {
  if (initialRepeat) {
    return {
      months: initialRepeat.months,
      everyDay: initialRepeat.everyDay,
      daysOfWeek: initialRepeat.everyDay ? [initialDayOfWeek] : [...initialRepeat.daysOfWeek],
    };
  }

  return {
    months: 1,
    everyDay: true,
    daysOfWeek: [initialDayOfWeek],
  };
}

function MedicationRepeatModalContent({
  labels,
  theme,
  weekdayLabels,
  initialDayOfWeek,
  initialRepeat,
  onClose,
  onApply,
}: ContentProps) {
  const initialState = getInitialRepeatState(initialRepeat, initialDayOfWeek);
  const [months, setMonths] = useState<number>(initialState.months);
  const [everyDay, setEveryDay] = useState(initialState.everyDay);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialState.daysOfWeek);

  const canApply = everyDay || daysOfWeek.length > 0;

  const monthOptions = useMemo(() => [...MEDICATION_REPEAT_MONTH_OPTIONS], []);

  const toggleDay = (dow: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(dow)) {
        const next = prev.filter((d) => d !== dow);
        return next.length === 0 ? prev : next;
      }
      return [...prev, dow].sort((a, b) => WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) - WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number]));
    });
  };

  return (
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]} onPress={() => {}}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.repeatMedication}</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{labels.repeatMedicationHint}</Text>

          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{labels.repeatDuration}</Text>
          <View style={styles.monthRow}>
            {monthOptions.map((option) => {
              const active = months === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setMonths(option)}
                  style={[
                    styles.chip,
                    active
                      ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                      : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
                  ]}>
                  <Text style={[styles.chipText, { color: active ? theme.activeText : theme.inactiveText }]}>
                    {option} {labels.repeatMonthsUnit}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setEveryDay(true)}
              style={[
                styles.modeButton,
                everyDay
                  ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                  : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
              ]}>
              <Text style={[styles.modeText, { color: everyDay ? theme.activeText : theme.inactiveText }]}>
                {labels.repeatEveryDay}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setEveryDay(false);
                if (daysOfWeek.length === 0) setDaysOfWeek([initialDayOfWeek]);
              }}
              style={[
                styles.modeButton,
                !everyDay
                  ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                  : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
              ]}>
              <Text style={[styles.modeText, { color: !everyDay ? theme.activeText : theme.inactiveText }]}>
                {labels.repeatSelectedDays}
              </Text>
            </Pressable>
          </View>

          {!everyDay ? (
            <View style={styles.weekdayRow}>
              {WEEKDAY_ORDER.map((dow, index) => {
                const active = daysOfWeek.includes(dow);
                return (
                  <Pressable
                    key={dow}
                    onPress={() => toggleDay(dow)}
                    style={[
                      styles.weekdayChip,
                      active
                        ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                        : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
                    ]}>
                    <Text style={[styles.weekdayText, { color: active ? theme.activeText : theme.inactiveText }]}>
                      {weekdayLabels[index]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.actionButton, { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder }]}>
              <Text style={[styles.actionText, { color: theme.inactiveText }]}>{labels.repeatCancel}</Text>
            </Pressable>
            <Pressable
              disabled={!canApply}
              onPress={() => {
                onApply({
                  months,
                  everyDay,
                  daysOfWeek: everyDay ? [...WEEKDAY_ORDER] : daysOfWeek,
                });
                onClose();
              }}
              style={[
                styles.actionButton,
                styles.applyButton,
                { backgroundColor: theme.activeBg, borderColor: theme.activeBg, opacity: canApply ? 1 : 0.45 },
              ]}>
              <Ionicons name="repeat" size={14} color={theme.activeText} />
              <Text style={[styles.actionText, { color: theme.activeText }]}>{labels.repeatApply}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
  );
}

export function MedicationRepeatModal({ visible, ...contentProps }: Props) {
  const repeat = contentProps.initialRepeat;
  const key = `${contentProps.initialDayOfWeek}-${repeat?.months ?? 1}-${repeat?.everyDay ?? true}-${repeat?.daysOfWeek.join(',') ?? ''}`;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={contentProps.onClose}>
      {visible ? <MedicationRepeatModalContent key={key} {...contentProps} /> : null}
    </Modal>
  );
}

export function buildWeekdayLabels(formatDay: (date: Date) => string): string[] {
  return WEEKDAY_ORDER.map((dow) => {
    const offset = dow === 0 ? 6 : dow - 1;
    return formatDay(addDays(MONDAY_REF, offset));
  });
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 18 },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  hint: { marginTop: 6, fontSize: 10, lineHeight: 14 },
  sectionLabel: { marginTop: 16, marginBottom: 8, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 10, fontWeight: '700', fontFamily: Fonts.mono },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modeButton: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  modeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  weekdayChip: { minWidth: 36, borderRadius: 10, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center' },
  weekdayText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  applyButton: {},
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
});

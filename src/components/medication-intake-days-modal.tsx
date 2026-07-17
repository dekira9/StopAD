import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import type { MedicationRepeatConfig } from '@/stores/wellness-store';
import { buildRepeatFromIntakeMode, getIntakeMode, type IntakeMode } from '@/utils/medication-intake';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const INTERVAL_OPTIONS = [2, 3, 4, 5, 7] as const;

type Props = {
  visible: boolean;
  embedded?: boolean;
  labels: AppLabels;
  weekdayLabels: string[];
  initialRepeat: MedicationRepeatConfig;
  onClose: () => void;
  onApply: (repeat: MedicationRepeatConfig) => void;
};

type ContentProps = Omit<Props, 'visible' | 'embedded'>;

function getInitialDaysOfWeek(initialRepeat: MedicationRepeatConfig): number[] {
  return initialRepeat.everyDay ? [1] : initialRepeat.daysOfWeek.length > 0 ? [...initialRepeat.daysOfWeek] : [1];
}

function getInitialIntervalDays(initialRepeat: MedicationRepeatConfig): number {
  return initialRepeat.intervalDays && initialRepeat.intervalDays >= 2 ? initialRepeat.intervalDays : 2;
}

function MedicationIntakeDaysModalContent({
  labels,
  weekdayLabels,
  initialRepeat,
  onClose,
  onApply,
}: ContentProps) {
  const { modal: theme } = useAppChromeTheme();
  const [mode, setMode] = useState<IntakeMode>(() => getIntakeMode(initialRepeat));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(() => getInitialDaysOfWeek(initialRepeat));
  const [intervalDays, setIntervalDays] = useState<number>(() => getInitialIntervalDays(initialRepeat));

  const toggleDay = (dow: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(dow)) {
        const next = prev.filter((day) => day !== dow);
        return next.length === 0 ? prev : next;
      }
      return [...prev, dow].sort(
        (a, b) =>
          WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) -
          WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number]),
      );
    });
  };

  const canApply = mode === 'everyDay' || mode === 'interval' || mode === 'monthly' || daysOfWeek.length > 0;

  const renderModeOption = (option: IntakeMode, label: string) => {
    const active = mode === option;
    return (
      <Pressable
        key={option}
        onPress={() => setMode(option)}
        style={({ pressed }) => [
          styles.optionRow,
          active
            ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
            : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.optionText, { color: active ? theme.activeText : theme.inactiveText }]}>{label}</Text>
        {active ? <Ionicons name="checkmark" size={16} color={theme.activeText} /> : null}
      </Pressable>
    );
  };

  return (
    <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
      <Pressable
        style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
        onPress={() => {}}>
        <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.medicationIntakeDaysTitle}</Text>

        {renderModeOption('everyDay', labels.repeatEveryDay)}
        {renderModeOption('weekdays', labels.medicationIntakeWeekdays)}
        {renderModeOption('interval', labels.medicationIntakeInterval)}

        {mode === 'weekdays' ? (
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

        {mode === 'interval' ? (
          <View style={styles.intervalRow}>
            {INTERVAL_OPTIONS.map((option) => {
              const active = intervalDays === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setIntervalDays(option)}
                  style={[
                    styles.intervalChip,
                    active
                      ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                      : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
                  ]}>
                  <Text style={[styles.intervalText, { color: active ? theme.activeText : theme.inactiveText }]}>
                    {labels.medicationIntakeIntervalEvery.replace('{n}', String(option))}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {renderModeOption('monthly', labels.medicationIntakeMonthly)}

        <View style={styles.actions}>
          <Pressable
            onPress={onClose}
            style={[styles.actionButton, { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder }]}>
            <Text style={[styles.actionText, { color: theme.inactiveText }]}>{labels.repeatCancel}</Text>
          </Pressable>
          <Pressable
            disabled={!canApply}
            onPress={() => {
              onApply(buildRepeatFromIntakeMode(initialRepeat, mode, daysOfWeek, intervalDays));
              onClose();
            }}
            style={[
              styles.actionButton,
              { backgroundColor: theme.activeBg, borderColor: theme.activeBg, opacity: canApply ? 1 : 0.45 },
            ]}>
            <Text style={[styles.actionText, { color: theme.activeText }]}>{labels.repeatApply}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

export function MedicationIntakeDaysModal({
  visible,
  embedded = false,
  labels,
  weekdayLabels,
  initialRepeat,
  onClose,
  onApply,
}: Props) {
  const key = `${getIntakeMode(initialRepeat)}-${initialRepeat.everyDay}-${initialRepeat.daysOfWeek.join(',')}-${initialRepeat.intervalDays ?? ''}-${initialRepeat.intervalMonths ?? ''}`;

  if (embedded) {
    if (!visible) return null;
    return (
      <View style={styles.embeddedRoot}>
        <MedicationIntakeDaysModalContent
          key={key}
          labels={labels}
          weekdayLabels={weekdayLabels}
          initialRepeat={initialRepeat}
          onClose={onClose}
          onApply={onApply}
        />
      </View>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      {visible ? (
        <MedicationIntakeDaysModalContent
          key={key}
          labels={labels}
          weekdayLabels={weekdayLabels}
          initialRepeat={initialRepeat}
          onClose={onClose}
          onApply={onApply}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 18 },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionText: { flex: 1, fontSize: 12, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  weekdayChip: {
    minWidth: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weekdayText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  intervalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  intervalChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  intervalText: { fontSize: 10, fontWeight: '700', fontFamily: Fonts.mono },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  pressed: { opacity: 0.85 },
});

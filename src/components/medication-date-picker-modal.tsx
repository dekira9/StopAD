import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';

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
  buttonShadow: number;
};

type Props = {
  visible: boolean;
  title: string;
  labels: AppLabels;
  theme: ThemeSlice;
  locale: Locale;
  selectedDateKey?: string;
  minimumDateKey?: string;
  allowNone?: boolean;
  onClose: () => void;
  onSelect: (dateKey: string) => void;
  onSelectNone?: () => void;
};

const WEEK_STARTS_ON = 1 as const;

export function MedicationDatePickerModal({
  visible,
  title,
  labels,
  theme,
  locale,
  selectedDateKey,
  minimumDateKey,
  allowNone,
  onClose,
  onSelect,
  onSelectNone,
}: Props) {
  const initialMonth = selectedDateKey
    ? parse(selectedDateKey, 'yyyy-MM-dd', new Date())
    : new Date();
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);

  useEffect(() => {
    if (!visible) return;
    setVisibleMonth(selectedDateKey ? parse(selectedDateKey, 'yyyy-MM-dd', new Date()) : new Date());
  }, [visible, selectedDateKey]);

  const minimumDate = minimumDateKey ? parse(minimumDateKey, 'yyyy-MM-dd', new Date()) : undefined;
  const selectedDate = selectedDateKey ? parse(selectedDateKey, 'yyyy-MM-dd', new Date()) : undefined;
  const today = new Date();

  const weekdayHeaders = useMemo(() => {
    const ref = startOfWeek(new Date(2025, 0, 6), { weekStartsOn: WEEK_STARTS_ON });
    return Array.from({ length: 7 }).map((_, index) =>
      format(addDays(ref, index), 'EEEEE', { locale }).toUpperCase(),
    );
  }, [locale]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const isDisabled = (day: Date) => {
    if (!minimumDate) return false;
    return isBefore(startOfDay(day), startOfDay(minimumDate));
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
          onPress={() => {}}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.monthNavRow}>
            <Pressable
              onPress={() => setVisibleMonth((prev) => subMonths(prev, 1))}
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: theme.inactiveBg,
                  borderColor: theme.inactiveBorder,
                  shadowOpacity: theme.buttonShadow,
                },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {format(visibleMonth, 'LLLL yyyy', { locale })}
            </Text>
            <Pressable
              onPress={() => setVisibleMonth((prev) => addMonths(prev, 1))}
              style={({ pressed }) => [
                styles.navBtn,
                {
                  backgroundColor: theme.inactiveBg,
                  borderColor: theme.inactiveBorder,
                  shadowOpacity: theme.buttonShadow,
                },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayHeaders.map((label, index) => (
              <Text key={`weekday-${index}`} style={[styles.weekdayLabel, { color: theme.textSecondary }]}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {calendarDays.map((day) => {
              const inMonth = isSameMonth(day, visibleMonth);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, today);
              const disabled = isDisabled(day);

              return (
                <Pressable
                  key={format(day, 'yyyy-MM-dd')}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(format(day, 'yyyy-MM-dd'));
                    onClose();
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    selected
                      ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                      : {
                          backgroundColor: theme.inactiveBg,
                          borderColor: isToday ? theme.textSecondary : theme.inactiveBorder,
                          borderWidth: isToday && !selected ? 1.5 : 1,
                          opacity: inMonth ? 1 : 0.35,
                        },
                    disabled && styles.dayCellDisabled,
                    pressed && !disabled && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: selected ? theme.activeText : disabled ? theme.textSecondary : theme.text,
                        fontWeight: selected || isToday ? '700' : '500',
                      },
                    ]}>
                    {format(day, 'd')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {allowNone ? (
            <Pressable
              onPress={() => {
                onSelectNone?.();
                onClose();
              }}
              style={({ pressed }) => [
                styles.noneBtn,
                { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.noneBtnText, { color: theme.inactiveText }]}>{labels.medicationScheduleNoEnd}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', flex: 1 },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    padding: 2,
  },
  dayCellDisabled: { opacity: 0.25 },
  dayText: { fontSize: 13, fontFamily: Fonts.mono },
  noneBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  noneBtnText: { fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});

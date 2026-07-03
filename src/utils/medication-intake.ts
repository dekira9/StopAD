import type { AppLabels } from '@/constants/i18n';
import type { MedicationRepeatConfig } from '@/stores/wellness-store';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function formatIntakeDaysSummary(
  repeat: MedicationRepeatConfig,
  labels: AppLabels,
  weekdayLabels: string[],
): string {
  if (repeat.intervalDays && repeat.intervalDays >= 2) {
    return labels.medicationIntakeIntervalEvery.replace('{n}', String(repeat.intervalDays));
  }
  if (repeat.everyDay) return labels.repeatEveryDay;
  const days = repeat.daysOfWeek
    .slice()
    .sort(
      (a, b) =>
        WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) -
        WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number]),
    )
    .map((dow) => weekdayLabels[WEEKDAY_ORDER.indexOf(dow as (typeof WEEKDAY_ORDER)[number])])
    .join(', ');
  return days || labels.repeatSelectedDays;
}

export function getIntakeMode(repeat: MedicationRepeatConfig): 'everyDay' | 'weekdays' | 'interval' {
  if (repeat.intervalDays && repeat.intervalDays >= 2) return 'interval';
  if (repeat.everyDay) return 'everyDay';
  return 'weekdays';
}

export function buildRepeatFromIntakeMode(
  base: MedicationRepeatConfig,
  mode: 'everyDay' | 'weekdays' | 'interval',
  daysOfWeek: number[],
  intervalDays: number,
): MedicationRepeatConfig {
  const durationFields = {
    startDateKey: base.startDateKey,
    endDateKey: base.endDateKey,
  };

  if (mode === 'everyDay') {
    return {
      months: base.months,
      everyDay: true,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      intervalDays: undefined,
      ...durationFields,
    };
  }
  if (mode === 'interval') {
    return {
      months: base.months,
      everyDay: false,
      daysOfWeek: [],
      intervalDays: intervalDays,
      ...durationFields,
    };
  }
  return {
    months: base.months,
    everyDay: false,
    daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [1],
    intervalDays: undefined,
    ...durationFields,
  };
}

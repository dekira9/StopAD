import { format } from 'date-fns';
import type { Locale } from 'date-fns';

import type { Language } from '@/constants/i18n';
import { getTriggerLabel } from '@/constants/trigger-labels';
import type { DayLog } from '@/stores/wellness-store';
import { parseMedicationLabel } from '@/stores/wellness-store';
import { resolvePanicAttackCount } from '@/utils/panic-attack-log';
import { calculateSleepTotalMinutes, formatSleepClock, parseSleepLog } from '@/utils/sleep-log';
import { calculateSportDayTotals, parseSportLog } from '@/utils/sport-log';
import { parseTriggerLog } from '@/utils/trigger-log';

export type MedicationSummary = {
  name: string;
  dose: string;
};

export type WeeklySummaryDayEntry = {
  dateKey: string;
  dayLabel: string;
  panicCount: number;
  sleepMinutes: number | null;
  sportMinutes: number;
  sportSteps: number;
  medications: MedicationSummary[];
  triggers: string[];
};

export function formatWeeklyDayLabel(day: Date, locale: Locale): string {
  return format(day, 'EEE', { locale }).replace(/\./g, '').slice(0, 2).toUpperCase();
}

function buildMedicationSummaries(storedDay: DayLog | undefined): MedicationSummary[] {
  if (!storedDay?.medications?.length) return [];

  return storedDay.medications
    .map((row) => parseMedicationLabel(row.medication))
    .filter((item) => item.name.length > 0);
}

export function buildWeeklySummaryEntries(
  weekDays: Date[],
  days: Record<string, DayLog>,
  locale: Locale,
  language: Language,
): WeeklySummaryDayEntry[] {
  return weekDays.map((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const storedDay = days[dateKey];
    const sleepMinutes = calculateSleepTotalMinutes(parseSleepLog(storedDay?.sleep ?? ''));
    const sportTotals = calculateSportDayTotals(parseSportLog(storedDay?.sport ?? ''));
    const triggerLog = parseTriggerLog(storedDay?.triggers ?? '');
    const triggerNames = [
      ...triggerLog.catalogIds.map((id) => getTriggerLabel(language, id)),
      ...triggerLog.custom,
    ];

    return {
      dateKey,
      dayLabel: formatWeeklyDayLabel(day, locale),
      panicCount: resolvePanicAttackCount(storedDay),
      sleepMinutes,
      sportMinutes: sportTotals.totalMinutes,
      sportSteps: sportTotals.totalSteps,
      medications: buildMedicationSummaries(storedDay),
      triggers: triggerNames,
    };
  });
}

export function getWeeklySummaryMaxPanic(entries: WeeklySummaryDayEntry[]): number {
  return Math.max(1, ...entries.map((entry) => entry.panicCount));
}

export type WeeklyTriggerCount = {
  name: string;
  count: number;
};

export function buildWeeklyTriggerCounts(entries: WeeklySummaryDayEntry[]): WeeklyTriggerCount[] {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const trigger of entry.triggers) {
      const name = trigger.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'));
}

function getRussianTriggerTimesWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'раз';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'раза';
  return 'раз';
}

export function formatWeeklyTriggerLine(name: string, count: number, language: Language): string {
  switch (language) {
    case 'ru':
      return `${name} — ${count} ${getRussianTriggerTimesWord(count)}`;
    case 'en':
      return `${name} — ${count} ${count === 1 ? 'time' : 'times'}`;
    case 'es':
      return `${name} — ${count} ${count === 1 ? 'vez' : 'veces'}`;
    case 'fr':
      return `${name} — ${count} fois`;
    case 'de':
      return `${name} — ${count} Mal`;
    case 'zh':
      return `${name} — ${count} 次`;
    case 'pt':
      return `${name} — ${count} ${count === 1 ? 'vez' : 'vezes'}`;
    case 'it':
      return `${name} — ${count} ${count === 1 ? 'volta' : 'volte'}`;
    default:
      return `${name} — ${count}`;
  }
}

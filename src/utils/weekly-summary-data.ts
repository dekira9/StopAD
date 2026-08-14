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
  hasData: boolean;
  panicCount: number;
  sleepMinutes: number | null;
  sportMinutes: number;
  sportSteps: number;
  medications: MedicationSummary[];
  triggers: string[];
};

export type WeekFacts = {
  daysWithData: number;
  panicTotal: number;
  panicFreeDays: number;
  sleepAvgMinutes: number | null;
  sleepDaysLogged: number;
  medDaysTaken: number;
};

export type WeekCompareResult = {
  current: WeekFacts;
  previous: WeekFacts | null;
  canCompare: boolean;
  panicDelta: number | null;
};

const MIN_DAYS_FOR_COMPARE = 3;
const PANIC_DELTA_THRESHOLD = 1;

function dayLogHasData(storedDay: DayLog | undefined): boolean {
  if (!storedDay) return false;
  if (storedDay.medications.some((row) => row.taken || Boolean(row.medication?.trim()))) return true;
  if (storedDay.sleep.trim()) return true;
  if (storedDay.triggers.trim()) return true;
  if (storedDay.sport.trim()) return true;
  if (storedDay.events.trim()) return true;
  if (typeof storedDay.panicAttackCount === 'number') return true;
  if (storedDay.growthRings) {
    const rings = storedDay.growthRings;
    const hasActions = Object.values(rings.actionsByRing ?? {}).some((items) => (items?.length ?? 0) > 0);
    const hasEmotions = Object.values(rings.emotionsByRing ?? {}).some((items) => (items?.length ?? 0) > 0);
    if (hasActions || hasEmotions) return true;
  }
  return false;
}

export function formatWeeklyDayLabel(day: Date, locale: Locale): string {
  return format(day, 'EEE', { locale }).replace(/\./g, '').slice(0, 2).toUpperCase();
}

function getMedicationSortMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function buildMedicationSummaries(storedDay: DayLog | undefined): MedicationSummary[] {
  if (!storedDay?.medications?.length) return [];

  return storedDay.medications
    .filter((row) => row.taken)
    .map((row, index) => ({
      row,
      index,
      sortMinutes: getMedicationSortMinutes(row.time ?? ''),
    }))
    .sort((a, b) => {
      if (a.sortMinutes !== null && b.sortMinutes !== null && a.sortMinutes !== b.sortMinutes) {
        return a.sortMinutes - b.sortMinutes;
      }
      if (a.sortMinutes !== null && b.sortMinutes === null) return -1;
      if (a.sortMinutes === null && b.sortMinutes !== null) return 1;
      return a.index - b.index;
    })
    .map(({ row }) => row)
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
      hasData: dayLogHasData(storedDay),
      panicCount: resolvePanicAttackCount(storedDay),
      sleepMinutes,
      sportMinutes: sportTotals.totalMinutes,
      sportSteps: sportTotals.totalSteps,
      medications: buildMedicationSummaries(storedDay),
      triggers: triggerNames,
    };
  });
}

export function sliceWeeklyEntriesThroughDate(
  entries: WeeklySummaryDayEntry[],
  throughDateKey: string | null,
): WeeklySummaryDayEntry[] {
  if (!throughDateKey) return entries;
  const index = entries.findIndex((entry) => entry.dateKey === throughDateKey);
  if (index < 0) return entries;
  return entries.slice(0, index + 1);
}

/** Keep the same weekday range for previous week when current week is incomplete. */
export function sliceWeeklyEntriesByCount(
  entries: WeeklySummaryDayEntry[],
  count: number | null,
): WeeklySummaryDayEntry[] {
  if (count === null || count >= entries.length) return entries;
  return entries.slice(0, Math.max(0, count));
}

export function buildWeekFacts(entries: WeeklySummaryDayEntry[]): WeekFacts {
  let daysWithData = 0;
  let panicTotal = 0;
  let panicFreeDays = 0;
  let sleepSum = 0;
  let sleepDaysLogged = 0;
  let medDaysTaken = 0;

  for (const entry of entries) {
    panicTotal += entry.panicCount;
    if (entry.hasData) {
      daysWithData += 1;
      if (entry.panicCount === 0) panicFreeDays += 1;
    }
    if (entry.sleepMinutes !== null) {
      sleepSum += entry.sleepMinutes;
      sleepDaysLogged += 1;
    }
    if (entry.medications.length > 0) medDaysTaken += 1;
  }

  return {
    daysWithData,
    panicTotal,
    panicFreeDays,
    sleepAvgMinutes: sleepDaysLogged > 0 ? Math.round(sleepSum / sleepDaysLogged) : null,
    sleepDaysLogged,
    medDaysTaken,
  };
}

export function compareWeekFacts(current: WeekFacts, previous: WeekFacts | null): WeekCompareResult {
  const canCompare =
    previous !== null &&
    current.daysWithData >= MIN_DAYS_FOR_COMPARE &&
    previous.daysWithData >= MIN_DAYS_FOR_COMPARE;

  const panicDelta = canCompare ? current.panicTotal - previous.panicTotal : null;
  const meaningfulPanicDelta =
    panicDelta !== null && Math.abs(panicDelta) >= PANIC_DELTA_THRESHOLD ? panicDelta : canCompare ? 0 : null;

  return {
    current,
    previous,
    canCompare,
    panicDelta: meaningfulPanicDelta,
  };
}

export type WeekFactLabels = {
  weeklyFactsEpisodes: string;
  weeklyFactsEpisodesLess: string;
  weeklyFactsEpisodesMore: string;
  weeklyFactsEpisodesSame: string;
  weeklyFactsPanicFreeDays: string;
  weeklyFactsMedDays: string;
  weeklyFactsSleepAvg: string;
  weeklyNoData: string;
};

function fillTemplate(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function buildWeekFactLines(compare: WeekCompareResult, labels: WeekFactLabels): string[] {
  const { current, canCompare, panicDelta } = compare;
  const lines: string[] = [];

  if (current.daysWithData === 0 && current.panicTotal === 0 && current.medDaysTaken === 0) {
    return [labels.weeklyNoData];
  }

  let episodesLine = fillTemplate(labels.weeklyFactsEpisodes, { n: current.panicTotal });
  if (canCompare && panicDelta !== null) {
    if (panicDelta < 0) {
      episodesLine = `${episodesLine} · ${fillTemplate(labels.weeklyFactsEpisodesLess, { n: Math.abs(panicDelta) })}`;
    } else if (panicDelta > 0) {
      episodesLine = `${episodesLine} · ${fillTemplate(labels.weeklyFactsEpisodesMore, { n: panicDelta })}`;
    } else {
      episodesLine = `${episodesLine} · ${labels.weeklyFactsEpisodesSame}`;
    }
  }
  lines.push(episodesLine);

  if (current.daysWithData > 0) {
    lines.push(fillTemplate(labels.weeklyFactsPanicFreeDays, { n: current.panicFreeDays }));
  }

  if (current.medDaysTaken > 0) {
    lines.push(fillTemplate(labels.weeklyFactsMedDays, { n: current.medDaysTaken }));
  }

  if (lines.length < 3 && current.sleepAvgMinutes !== null && current.sleepDaysLogged > 0) {
    lines.push(
      fillTemplate(labels.weeklyFactsSleepAvg, {
        time: formatSleepClock(current.sleepAvgMinutes),
        n: current.sleepDaysLogged,
      }),
    );
  }

  return lines.slice(0, 3);
}

export function getWeeklySummaryMaxPanic(entries: WeeklySummaryDayEntry[]): number {
  return Math.max(1, ...entries.map((entry) => entry.panicCount));
}

export type WeeklyTriggerCount = {
  name: string;
  count: number;
};

export function buildWeeklyTriggerCounts(
  entries: WeeklySummaryDayEntry[],
  language: Language,
): WeeklyTriggerCount[] {
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
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, language));
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
    case 'ja':
      return `${name} — ${count} 回`;
    case 'ko':
      return `${name} — ${count}회`;
    default:
      return `${name} — ${count}`;
  }
}

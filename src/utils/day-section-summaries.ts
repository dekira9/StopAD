import type { AppLabels, Language } from '@/constants/i18n';
import { getTriggerLabel } from '@/constants/trigger-labels';
import {
  calculateSleepTotalMinutes,
  formatSleepDuration,
  parseSleepLog,
} from '@/utils/sleep-log';
import {
  calculateSportDayTotals,
  formatSportDuration,
  parseSportLog,
  SPORT_ACTIVITY_LABEL_KEYS,
  type SportActivityType,
} from '@/utils/sport-log';
import { parseTriggerLog } from '@/utils/trigger-log';

function joinSummaryParts(parts: string[], limit = 3): string {
  const cleaned = parts.map((part) => part.trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= limit) return cleaned.join(' · ');
  return `${cleaned.slice(0, limit).join(' · ')} · +${cleaned.length - limit}`;
}

export function summarizeSleep(value: string, labels: AppLabels): string {
  const log = parseSleepLog(value);
  const total = calculateSleepTotalMinutes(log);
  const parts: string[] = [];

  if (total !== null) {
    parts.push(formatSleepDuration(total, labels));
  }

  const filledAwakenings = log.awakenings.filter((item) => item.from.trim() || item.to.trim());
  if (filledAwakenings.length > 0) {
    parts.push(labels.sleepAwakeningsSummary.replace('{n}', String(filledAwakenings.length)));
  }

  return parts.join(' · ');
}

export function summarizeTriggers(value: string, language: Language): string {
  const log = parseTriggerLog(value);
  const names = [
    ...log.catalogIds.map((id) => getTriggerLabel(language, id)),
    ...log.custom,
  ];
  return joinSummaryParts(names);
}

export function summarizeSport(value: string, labels: AppLabels): string {
  const log = parseSportLog(value);
  const totals = calculateSportDayTotals(log);
  const parts: string[] = [];

  const primary = log.activities.find(
    (activity) => activity.hours > 0 || activity.minutes > 0 || (activity.steps ?? 0) > 0 || activity.otherNote?.trim(),
  );
  if (primary) {
    const labelKey = SPORT_ACTIVITY_LABEL_KEYS[primary.type as SportActivityType];
    const typeLabel = labels[labelKey as keyof AppLabels];
    if (typeof typeLabel === 'string') parts.push(typeLabel);
  }

  if (totals.totalMinutes > 0) {
    const hours = Math.floor(totals.totalMinutes / 60);
    const minutes = totals.totalMinutes % 60;
    const duration = formatSportDuration(hours, minutes, labels);
    if (duration) parts.push(duration);
  } else if (totals.totalSteps > 0) {
    parts.push(String(totals.totalSteps));
  }

  return joinSummaryParts(parts, 2);
}

export function summarizeEvents(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  if (trimmed.length <= 42) return trimmed;
  return `${trimmed.slice(0, 41)}…`;
}

export function summarizePanicAttacks(count: number, labels: AppLabels): string {
  if (count <= 0) return '';
  return labels.dayPanicPill.replace('{n}', String(count));
}

export function formatMedicationsProgress(taken: number, total: number, labels: AppLabels): string {
  return labels.dayMedicationsProgress
    .replace('{taken}', String(taken))
    .replace('{total}', String(total));
}

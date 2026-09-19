import { addMonths, format, parse } from 'date-fns';
import type { Locale } from 'date-fns';

import type { AppLabels } from '@/constants/i18n';
import type { MedicationRepeatConfig } from '@/stores/wellness-store';
import { formatIntakeDaysSummary } from '@/utils/medication-intake';

export function resolveMedicationEndDateKey(repeat: MedicationRepeatConfig): string | null {
  if (repeat.endDateKey) return repeat.endDateKey;
  if (repeat.startDateKey) {
    const start = parse(repeat.startDateKey, 'yyyy-MM-dd', new Date());
    return format(addMonths(start, repeat.months), 'yyyy-MM-dd');
  }
  return null;
}

function formatDateKey(dateKey: string, locale: Locale): string {
  return format(parse(dateKey, 'yyyy-MM-dd', new Date()), 'd.MM.yyyy', { locale });
}

export function formatCatalogMedicationPeriod(
  repeat: MedicationRepeatConfig,
  locale: Locale,
  labels: Pick<AppLabels, 'medicationScheduleStart' | 'medicationScheduleEnd'>,
): string {
  const startKey = repeat.startDateKey;
  const endKey = resolveMedicationEndDateKey(repeat);

  if (startKey && endKey) {
    return `${formatDateKey(startKey, locale)} – ${formatDateKey(endKey, locale)}`;
  }
  if (startKey) {
    return `${labels.medicationScheduleStart}: ${formatDateKey(startKey, locale)}`;
  }
  if (endKey) {
    return `${labels.medicationScheduleEnd}: ${formatDateKey(endKey, locale)}`;
  }
  return '—';
}

export function formatCatalogMedicationScheduleDetail(
  repeat: MedicationRepeatConfig,
  times: string[],
  labels: AppLabels,
  weekdayLabels: string[],
): string {
  const intakeSummary = formatIntakeDaysSummary(repeat, labels, weekdayLabels);
  const timeSummary = times.filter(Boolean).join(', ');
  if (timeSummary && intakeSummary) return `${timeSummary} · ${intakeSummary}`;
  return timeSummary || intakeSummary || '—';
}

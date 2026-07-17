import { format, getMonth, getYear } from 'date-fns';
import type { Locale } from 'date-fns';

export function formatMonthName(date: Date, locale: Locale): string {
  return format(date, 'LLLL', { locale }).toLocaleLowerCase();
}

export function formatMonthYear(date: Date, locale: Locale): string {
  return `${formatMonthName(date, locale)} ${format(date, 'yyyy', { locale })}`;
}

export function formatDayMonth(date: Date, locale: Locale): string {
  const day = format(date, 'd', { locale });
  const month = format(date, 'MMMM', { locale }).toLocaleLowerCase();
  return `${day} ${month}`;
}

/** Week span under the month header, e.g. "13–19 · 2026" or "28 июня – 4 июля · 2026". */
export function formatWeekDayRange(weekStart: Date, weekEnd: Date, locale: Locale): string {
  const startDay = format(weekStart, 'd', { locale });
  const endDay = format(weekEnd, 'd', { locale });
  const startYear = format(weekStart, 'yyyy', { locale });
  const endYear = format(weekEnd, 'yyyy', { locale });
  const sameMonth = getMonth(weekStart) === getMonth(weekEnd) && getYear(weekStart) === getYear(weekEnd);
  const sameYear = startYear === endYear;

  if (sameMonth) {
    return `${startDay}–${endDay} · ${startYear}`;
  }

  if (sameYear) {
    return `${formatDayMonth(weekStart, locale)} – ${formatDayMonth(weekEnd, locale)} · ${startYear}`;
  }

  return `${formatDayMonth(weekStart, locale)} ${startYear} – ${formatDayMonth(weekEnd, locale)} ${endYear}`;
}

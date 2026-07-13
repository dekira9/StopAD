import { format } from 'date-fns';
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

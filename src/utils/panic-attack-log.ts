import type { DayLog } from '@/stores/wellness-store';

type LegacyDayLog = DayLog & { panicAttack?: 'yes' | 'no' };

export function resolvePanicAttackCount(day: LegacyDayLog | undefined): number {
  if (!day) return 0;
  if (typeof day.panicAttackCount === 'number') {
    return Math.max(0, Math.floor(day.panicAttackCount));
  }
  if (day.panicAttack === 'yes') return 1;
  return 0;
}

export function normalizeDayLogPanicAttack(day: Record<string, unknown>): void {
  const legacy = day.panicAttack as 'yes' | 'no' | undefined;
  if (typeof day.panicAttackCount !== 'number') {
    day.panicAttackCount = legacy === 'yes' ? 1 : 0;
  } else {
    day.panicAttackCount = Math.max(0, Math.floor(day.panicAttackCount as number));
  }
  delete day.panicAttack;
}

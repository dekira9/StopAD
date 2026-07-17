import { getGrowthRingLevel, type GrowthRingsLog } from '@/utils/growth-ring-log';
import { resolvePanicAttackCount } from '@/utils/panic-attack-log';
import { parseSleepLog, calculateSleepTotalMinutes } from '@/utils/sleep-log';
import { parseSportLog, calculateSportDayTotals } from '@/utils/sport-log';
import { parseTriggerLog } from '@/utils/trigger-log';

type DayLike = {
  sleep?: string;
  triggers?: string;
  sport?: string;
  events?: string;
  panicAttackCount?: number;
  growthRings?: GrowthRingsLog;
  medications?: { medication: string; taken?: boolean }[];
};

export type DayCelebrationKind = 'meds' | 'noted' | 'complete';

export type DayProgress = {
  filledMeds: number;
  takenMeds: number;
  notesFilled: number;
  hasGrowthRing: boolean;
  celebration: DayCelebrationKind | null;
};

function sleepHasData(value: string | undefined): boolean {
  const log = parseSleepLog(value ?? '');
  return calculateSleepTotalMinutes(log) !== null || log.awakenings.some((item) => item.from.trim() || item.to.trim());
}

function triggersHasData(value: string | undefined): boolean {
  const log = parseTriggerLog(value ?? '');
  return log.catalogIds.length > 0 || log.custom.length > 0;
}

function sportHasData(value: string | undefined): boolean {
  const totals = calculateSportDayTotals(parseSportLog(value ?? ''));
  return totals.totalMinutes > 0 || totals.totalSteps > 0;
}

function countNotesFilled(day: DayLike | undefined): number {
  if (!day) return 0;
  let count = 0;
  if (sleepHasData(day.sleep)) count += 1;
  if (triggersHasData(day.triggers)) count += 1;
  if (sportHasData(day.sport)) count += 1;
  if ((day.events ?? '').trim()) count += 1;
  if (resolvePanicAttackCount(day) > 0) count += 1;
  return count;
}

export function getDayProgress(day: DayLike | undefined): DayProgress {
  const medications = day?.medications ?? [];
  const filledMeds = medications.filter((row) => row.medication.trim()).length;
  const takenMeds = medications.filter((row) => row.medication.trim() && row.taken).length;
  const notesFilled = countNotesFilled(day);
  const hasGrowthRing = day?.growthRings ? getGrowthRingLevel(day.growthRings) !== null : false;

  const medsDone = filledMeds > 0 && takenMeds === filledMeds;
  const hasLifeNotes = notesFilled > 0 || hasGrowthRing;

  let celebration: DayCelebrationKind | null = null;
  if (medsDone && hasLifeNotes) celebration = 'complete';
  else if (medsDone) celebration = 'meds';
  else if (notesFilled >= 2 || (notesFilled >= 1 && hasGrowthRing)) celebration = 'noted';

  return { filledMeds, takenMeds, notesFilled, hasGrowthRing, celebration };
}

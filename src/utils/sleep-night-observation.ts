import type { SleepAwakening, SleepLog } from '@/utils/sleep-log';

export type NightObservationEventType = 'awake' | 'asleep';

export type NightObservationEvent = {
  type: NightObservationEventType;
  time: string;
};

const ASSUMED_AWAKENING_MINUTES = 3;

/** Collapse repeated «сплю» only. Repeated «не сплю» are separate awakening starts. */
function normalizeEvents(events: NightObservationEvent[]): NightObservationEvent[] {
  const normalized: NightObservationEvent[] = [];
  for (const event of events) {
    const previous = normalized[normalized.length - 1];
    if (previous && previous.type === 'asleep' && event.type === 'asleep') continue;
    normalized.push(event);
  }
  return normalized;
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;

  const total = (Number(match[1]) * 60 + Number(match[2]) + minutesToAdd) % (24 * 60);
  const normalized = total < 0 ? total + 24 * 60 : total;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Night observation rules:
 * - Sleep start/end may already be set manually; empty fields leave them untouched on merge.
 * - First event «сплю» = sleep start. «Сплю» after «не сплю» closes an awakening.
 * - Each «не сплю» is an awakening start. With a following «сплю» — pair as-is.
 * - «Не сплю» followed by another «не сплю» (no «сплю») — awakening ends at +3 minutes.
 * - Last «не сплю» with no following «сплю» when finishing = sleep end (not an awakening).
 */
export function buildSleepLogFromNightEvents(events: NightObservationEvent[]): SleepLog | null {
  const normalized = normalizeEvents(events);
  if (normalized.length === 0) return null;

  const sleepStart = normalized[0]?.type === 'asleep' ? normalized[0].time : '';
  const awakenings: SleepAwakening[] = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    if (current.type !== 'awake') continue;

    const next = normalized[index + 1];

    if (next?.type === 'asleep') {
      awakenings.push({
        id: `aw-${Date.now()}-${index}`,
        from: current.time,
        to: next.time,
      });
      continue;
    }

    if (next?.type === 'awake') {
      // Only an awakening start was tapped; assume the person fell asleep ~3 minutes later.
      awakenings.push({
        id: `aw-${Date.now()}-${index}`,
        from: current.time,
        to: addMinutesToTime(current.time, ASSUMED_AWAKENING_MINUTES),
      });
      continue;
    }

    // No next event: final «не сплю» before finish = sleep end, not an awakening.
  }

  let sleepEnd = '';
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    if (normalized[index].type !== 'awake') continue;
    const followedByAsleep = normalized.slice(index + 1).some((event) => event.type === 'asleep');
    if (!followedByAsleep) {
      sleepEnd = normalized[index].time;
      break;
    }
  }

  if (!sleepStart && !sleepEnd && awakenings.length === 0) return null;

  return {
    from: sleepStart,
    to: sleepEnd,
    awakenings,
  };
}

export function mergeNightObservationIntoSleepLog(existing: SleepLog, night: SleepLog): SleepLog {
  return {
    from: night.from || existing.from,
    to: night.to || existing.to,
    awakenings: [...existing.awakenings, ...night.awakenings],
  };
}

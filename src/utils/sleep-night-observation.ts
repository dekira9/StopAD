import type { SleepAwakening, SleepLog } from '@/utils/sleep-log';

export type NightObservationEventType = 'awake' | 'asleep';

export type NightObservationEvent = {
  type: NightObservationEventType;
  time: string;
};

function collectAwakeningPairs(
  events: NightObservationEvent[],
  options: { excludeFinalAwake: boolean },
): SleepAwakening[] {
  const lastAwake = options.excludeFinalAwake
    ? [...events].reverse().find((event) => event.type === 'awake')
    : undefined;
  const lastAwakeTime = lastAwake?.time;

  const awakenings: SleepAwakening[] = [];
  for (let index = 0; index < events.length - 1; index += 1) {
    const current = events[index];
    const next = events[index + 1];
    if (current.type !== 'awake' || next.type !== 'asleep') continue;
    if (options.excludeFinalAwake && current.time === lastAwakeTime) continue;

    awakenings.push({
      id: `aw-${Date.now()}-${index}`,
      from: current.time,
      to: next.time,
    });
  }

  return awakenings;
}

export function buildSleepLogFromNightEvents(events: NightObservationEvent[]): SleepLog | null {
  if (events.length === 0) return null;

  const firstAsleepIndex = events.findIndex((event) => event.type === 'asleep');
  if (firstAsleepIndex === -1) return null;

  const firstAsleep = events[firstAsleepIndex];
  const eventsAfterFirstAsleep = events.slice(firstAsleepIndex + 1);
  const lastAwake = [...eventsAfterFirstAsleep].reverse().find((event) => event.type === 'awake');
  const sleepEvents = events.slice(firstAsleepIndex);
  const awakenings = collectAwakeningPairs(sleepEvents, { excludeFinalAwake: true });

  return {
    from: firstAsleep.time,
    to: lastAwake?.time ?? '',
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

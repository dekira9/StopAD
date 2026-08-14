export type SleepAwakening = {
  id: string;
  from: string;
  to: string;
};

export type SleepSegment = {
  id: string;
  from: string;
  to: string;
};

export type SleepLog = {
  from: string;
  to: string;
  awakenings: SleepAwakening[];
  /** Additional sleep intervals beyond the main from–to range. */
  extraSleeps: SleepSegment[];
};

export const EMPTY_SLEEP_LOG: SleepLog = {
  from: '',
  to: '',
  awakenings: [],
  extraSleeps: [],
};

const SLEEP_LOG_PREFIX = '{"from":';

function parseSegments(items: unknown, idPrefix: string): SleepSegment[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is SleepSegment => !!item && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `${idPrefix}-${index}`,
      from: typeof item.from === 'string' ? item.from : '',
      to: typeof item.to === 'string' ? item.to : '',
    }));
}

export function parseSleepLog(value: string): SleepLog {
  const trimmed = value.trim();
  if (!trimmed) return { ...EMPTY_SLEEP_LOG, awakenings: [], extraSleeps: [] };
  if (!trimmed.startsWith(SLEEP_LOG_PREFIX)) {
    return { ...EMPTY_SLEEP_LOG, awakenings: [], extraSleeps: [] };
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<SleepLog>;
    return {
      from: typeof parsed.from === 'string' ? parsed.from : '',
      to: typeof parsed.to === 'string' ? parsed.to : '',
      awakenings: parseSegments(parsed.awakenings, 'aw'),
      extraSleeps: parseSegments(parsed.extraSleeps, 'sl'),
    };
  } catch {
    return { ...EMPTY_SLEEP_LOG, awakenings: [], extraSleeps: [] };
  }
}

export function serializeSleepLog(log: SleepLog): string {
  if (
    !log.from.trim() &&
    !log.to.trim() &&
    log.awakenings.length === 0 &&
    log.extraSleeps.length === 0
  ) {
    return '';
  }
  return JSON.stringify(log);
}

export function hasSleepLogContent(log: SleepLog): boolean {
  if (log.from.trim() || log.to.trim()) return true;
  if (log.awakenings.length > 0) return true;
  return log.extraSleeps.length > 0;
}

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function durationMinutes(from: string, to: string): number | null {
  const fromMinutes = timeToMinutes(from);
  const toMinutes = timeToMinutes(to);
  if (fromMinutes === null || toMinutes === null) return null;

  let diff = toMinutes - fromMinutes;
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function calculateSleepTotalMinutes(log: SleepLog): number | null {
  const hasMain = !!log.from.trim() && !!log.to.trim();
  const completeExtras = log.extraSleeps.filter((item) => item.from.trim() && item.to.trim());

  if (!hasMain && completeExtras.length === 0) return null;

  let total = 0;

  if (hasMain) {
    const mainDuration = durationMinutes(log.from, log.to);
    if (mainDuration === null) return null;

    const awakeMinutes = log.awakenings.reduce((sum, awakening) => {
      if (!awakening.from.trim() || !awakening.to.trim()) return sum;
      const awakeningDuration = durationMinutes(awakening.from, awakening.to);
      if (awakeningDuration === null) return sum;
      return sum + awakeningDuration;
    }, 0);

    total += Math.max(0, mainDuration - awakeMinutes);
  }

  for (const segment of completeExtras) {
    const duration = durationMinutes(segment.from, segment.to);
    if (duration !== null) total += duration;
  }

  return total > 0 ? total : null;
}

export function formatSleepClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export function formatSleepDuration(
  totalMinutes: number,
  labels: { sleepHoursShort: string; sleepMinutesShort: string },
): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ${labels.sleepHoursShort}`;
  }

  return `${hours} ${labels.sleepHoursShort} ${minutes} ${labels.sleepMinutesShort}`;
}

export function createSleepAwakening(index: number): SleepAwakening {
  return {
    id: `aw-${Date.now()}-${index}`,
    from: '',
    to: '',
  };
}

export function createExtraSleep(index: number): SleepSegment {
  return {
    id: `sl-${Date.now()}-${index}`,
    from: '',
    to: '',
  };
}

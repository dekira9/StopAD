export const SPORT_ACTIVITY_TYPES = [
  'walking',
  'running',
  'strength',
  'gymnastics',
  'stretching',
  'other',
] as const;

export type SportActivityType = (typeof SPORT_ACTIVITY_TYPES)[number];

export type SportActivity = {
  id: string;
  type: SportActivityType;
  hours: number;
  minutes: number;
  steps?: number;
  otherNote?: string;
};

export type SportLog = {
  activities: SportActivity[];
};

export const EMPTY_SPORT_LOG: SportLog = {
  activities: [],
};

const SPORT_LOG_PREFIX = '{"activities":';

export function parseSportLog(value: string): SportLog {
  const trimmed = value.trim();
  if (!trimmed) return { activities: [] };
  if (!trimmed.startsWith(SPORT_LOG_PREFIX)) {
    return { activities: [] };
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<SportLog>;
    if (!Array.isArray(parsed.activities)) return { activities: [] };

    return {
      activities: parsed.activities
        .filter((item): item is SportActivity => !!item && typeof item === 'object')
        .map((item, index) => ({
          id: typeof item.id === 'string' ? item.id : `sport-${index}`,
          type: SPORT_ACTIVITY_TYPES.includes(item.type as SportActivityType)
            ? (item.type as SportActivityType)
            : 'walking',
          hours: clampDurationPart(item.hours),
          minutes: clampDurationPart(item.minutes, 59),
          steps: typeof item.steps === 'number' && item.steps > 0 ? Math.floor(item.steps) : undefined,
          otherNote: typeof item.otherNote === 'string' ? item.otherNote : '',
        })),
    };
  } catch {
    return { activities: [] };
  }
}

function clampDurationPart(value: unknown, max = 23): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

export function serializeSportLog(log: SportLog): string {
  if (log.activities.length === 0) return '';
  return JSON.stringify(log);
}

export function hasSportLogContent(log: SportLog): boolean {
  if (log.activities.length > 0) return true;
  return log.activities.some((activity) => isSportActivityFilled(activity));
}

export function isSportActivityFilled(activity: SportActivity): boolean {
  if (activity.hours > 0 || activity.minutes > 0) return true;
  if (activity.type === 'walking' && activity.steps && activity.steps > 0) return true;
  if (activity.type === 'other' && activity.otherNote?.trim()) return true;
  return false;
}

export function createSportActivity(index: number): SportActivity {
  return {
    id: `sport-${Date.now()}-${index}`,
    type: 'walking',
    hours: 0,
    minutes: 0,
    steps: undefined,
    otherNote: '',
  };
}

export type SportDayTotals = {
  totalMinutes: number;
  totalSteps: number;
};

export function calculateSportDayTotals(log: SportLog): SportDayTotals {
  return log.activities.reduce(
    (acc, activity) => ({
      totalMinutes: acc.totalMinutes + activity.hours * 60 + activity.minutes,
      totalSteps: acc.totalSteps + (activity.steps ?? 0),
    }),
    { totalMinutes: 0, totalSteps: 0 },
  );
}

export function formatSportDuration(hours: number, minutes: number, labels: { sleepHoursShort: string; sleepMinutesShort: string }): string {
  if (hours <= 0 && minutes <= 0) return '';
  if (minutes <= 0) return `${hours} ${labels.sleepHoursShort}`;
  if (hours <= 0) return `${minutes} ${labels.sleepMinutesShort}`;
  return `${hours} ${labels.sleepHoursShort} ${minutes} ${labels.sleepMinutesShort}`;
}

export const SPORT_ACTIVITY_LABEL_KEYS: Record<SportActivityType, string> = {
  walking: 'sportActivityWalking',
  running: 'sportActivityRunning',
  strength: 'sportActivityStrength',
  gymnastics: 'sportActivityGymnastics',
  stretching: 'sportActivityStretching',
  other: 'sportActivityOther',
};

import { ALL_TRIGGER_IDS } from '@/constants/trigger-catalog';

export type TriggerLog = {
  catalogIds: string[];
  custom: string[];
};

export const EMPTY_TRIGGER_LOG: TriggerLog = {
  catalogIds: [],
  custom: [],
};

const TRIGGER_LOG_PREFIX = '{"catalogIds":';

export function parseTriggerLog(value: string): TriggerLog {
  const trimmed = value.trim();
  if (!trimmed) return { catalogIds: [], custom: [] };

  if (!trimmed.startsWith(TRIGGER_LOG_PREFIX)) {
    return { catalogIds: [], custom: [trimmed] };
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<TriggerLog>;
    return {
      catalogIds: Array.isArray(parsed.catalogIds)
        ? parsed.catalogIds.filter((id): id is string => typeof id === 'string' && ALL_TRIGGER_IDS.has(id))
        : [],
      custom: Array.isArray(parsed.custom)
        ? parsed.custom.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [],
    };
  } catch {
    return { catalogIds: [], custom: trimmed ? [trimmed] : [] };
  }
}

export function serializeTriggerLog(log: TriggerLog): string {
  const catalogIds = [...new Set(log.catalogIds.filter((id) => ALL_TRIGGER_IDS.has(id)))];
  const custom = log.custom.map((item) => item.trim()).filter(Boolean);
  if (catalogIds.length === 0 && custom.length === 0) return '';
  return JSON.stringify({ catalogIds, custom });
}

export function hasTriggerLogContent(log: TriggerLog): boolean {
  return log.catalogIds.length > 0 || log.custom.some((item) => item.trim().length > 0);
}

export function toggleCatalogTrigger(log: TriggerLog, triggerId: string): TriggerLog {
  if (!ALL_TRIGGER_IDS.has(triggerId)) return log;
  const selected = log.catalogIds.includes(triggerId);
  return {
    ...log,
    catalogIds: selected
      ? log.catalogIds.filter((id) => id !== triggerId)
      : [...log.catalogIds, triggerId],
  };
}

export function addCustomTrigger(log: TriggerLog, text: string): TriggerLog {
  const trimmed = text.trim();
  if (!trimmed) return log;
  const normalized = trimmed.toLowerCase();
  if (log.custom.some((item) => item.trim().toLowerCase() === normalized)) return log;
  return { ...log, custom: [...log.custom, trimmed] };
}

export function removeCustomTrigger(log: TriggerLog, text: string): TriggerLog {
  return { ...log, custom: log.custom.filter((item) => item !== text) };
}

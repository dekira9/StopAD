import type { GrowthRingId } from '@/constants/growth-rings';
import { GROWTH_RING_IDS } from '@/constants/growth-rings';

export type GrowthRingsLog = {
  actionsByRing: Partial<Record<GrowthRingId, string[]>>;
  emotionsByRing: Partial<Record<GrowthRingId, string[]>>;
};

export function emptyGrowthRingsLog(): GrowthRingsLog {
  return { actionsByRing: {}, emotionsByRing: {} };
}

export function normalizeGrowthRingsLog(value: unknown): GrowthRingsLog {
  if (!value || typeof value !== 'object') return emptyGrowthRingsLog();
  const raw = value as Partial<GrowthRingsLog>;
  const actionsByRing: GrowthRingsLog['actionsByRing'] = {};
  const emotionsByRing: GrowthRingsLog['emotionsByRing'] = {};

  for (const id of GROWTH_RING_IDS) {
    const actions = raw.actionsByRing?.[id];
    const emotions = raw.emotionsByRing?.[id];
    if (Array.isArray(actions)) {
      actionsByRing[id] = actions.filter((item): item is string => typeof item === 'string');
    }
    if (Array.isArray(emotions)) {
      emotionsByRing[id] = emotions.filter((item): item is string => typeof item === 'string');
    }
  }

  return { actionsByRing, emotionsByRing };
}

/** Active day level = outermost ring that has at least one action. */
export function getGrowthRingLevel(log: GrowthRingsLog): GrowthRingId | null {
  let level: GrowthRingId | null = null;
  for (const id of GROWTH_RING_IDS) {
    if ((log.actionsByRing[id]?.length ?? 0) > 0) {
      level = id;
    }
  }
  return level;
}

export function toggleRingItem(
  list: string[] | undefined,
  itemId: string,
): string[] {
  const current = list ?? [];
  if (current.includes(itemId)) {
    return current.filter((id) => id !== itemId);
  }
  return [...current, itemId];
}

export function countRingSelections(log: GrowthRingsLog, ringId: GrowthRingId): number {
  return (log.actionsByRing[ringId]?.length ?? 0) + (log.emotionsByRing[ringId]?.length ?? 0);
}

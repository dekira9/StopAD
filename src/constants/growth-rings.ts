export type GrowthRingId = 1 | 2 | 3 | 4;

export type GrowthRingDefinition = {
  id: GrowthRingId;
  /** Translation key suffix, e.g. survival → growthRingSurvival */
  nameKey: 'survival' | 'baseline' | 'world' | 'life';
  actionIds: readonly string[];
  emotionIds: readonly string[];
};

export const GROWTH_RINGS: readonly GrowthRingDefinition[] = [
  {
    id: 1,
    nameKey: 'survival',
    actionIds: ['take-meds', 'eat', 'drink-water', 'go-to-bed', 'check-pulse', 'message-someone'],
    emotionIds: ['fear', 'tension', 'vulnerability', 'need-safety'],
  },
  {
    id: 2,
    nameKey: 'baseline',
    actionIds: [
      'shower',
      'cook',
      'tidy-room',
      'reply-message',
      'diary-entry',
      'short-walk',
      'outing-near-home',
      'talk-close-only',
      'work-from-home',
      'trip-with-companion',
      'home-workout',
    ],
    emotionIds: [
      'caution',
      'fatigue',
      'small-relief',
      'hope',
      'anxiety',
      'uncertainty',
      'fear-of-symptoms',
      'constant-vigilance',
      'relief-after-home',
    ],
  },
  {
    id: 3,
    nameKey: 'world',
    actionIds: ['go-shopping', 'meet-friend', 'public-transport', 'exercise', 'work-hours', 'visit-cafe'],
    emotionIds: ['interest', 'uncertainty', 'excitement', 'pride'],
  },
  {
    id: 4,
    nameKey: 'life',
    actionIds: ['travel', 'learn-new', 'plan-future', 'hobby', 'speak-public', 'change-plans', 'new-acquaintances'],
    emotionIds: ['joy', 'curiosity', 'enthusiasm', 'freedom', 'satisfaction', 'confidence'],
  },
] as const;

export const GROWTH_RING_IDS: readonly GrowthRingId[] = [1, 2, 3, 4];

export function getGrowthRingDefinition(id: GrowthRingId): GrowthRingDefinition {
  return GROWTH_RINGS[id - 1];
}

export type TriggerCategoryId =
  | 'sleep-fatigue'
  | 'stress'
  | 'health'
  | 'food-substances'
  | 'medications'
  | 'physical-load'
  | 'public-places'
  | 'emotional-events'
  | 'sensory'
  | 'hormonal'
  | 'internal';

export type TriggerCategory = {
  id: TriggerCategoryId;
  triggerIds: readonly string[];
};

export const TRIGGER_CATEGORIES: readonly TriggerCategory[] = [
  {
    id: 'sleep-fatigue',
    triggerIds: ['lack-of-sleep', 'poor-sleep-quality', 'nightmare', 'overfatigue'],
  },
  {
    id: 'stress',
    triggerIds: [
      'work-stress',
      'exams',
      'financial-worry',
      'conflict',
      'family-problems',
      'overload',
      'uncertainty',
      'bad-news',
    ],
  },
  {
    id: 'health',
    triggerIds: [
      'cold-illness',
      'fever',
      'dental-treatment',
      'doctor-visit',
      'waiting-test-results',
      'pain',
      'new-body-sensations',
    ],
  },
  {
    id: 'food-substances',
    triggerIds: [
      'coffee',
      'energy-drink',
      'strong-tea',
      'alcohol',
      'smoking-nicotine',
      'hunger',
      'overeating',
      'dehydration',
    ],
  },
  {
    id: 'medications',
    triggerIds: ['missed-medication', 'new-medication', 'dose-change', 'side-effects'],
  },
  {
    id: 'physical-load',
    triggerIds: ['intense-workout', 'long-walk', 'overheating', 'sauna-bath'],
  },
  {
    id: 'public-places',
    triggerIds: [
      'crowd',
      'shop',
      'queue',
      'mall',
      'metro',
      'bus',
      'airplane',
      'elevator',
      'bridge',
      'traffic-jam',
    ],
  },
  {
    id: 'emotional-events',
    triggerIds: [
      'argument',
      'public-speaking',
      'important-meeting',
      'phone-call',
      'waiting',
      'joyful-event',
      'strong-excitement',
    ],
  },
  {
    id: 'sensory',
    triggerIds: ['heat', 'stuffiness', 'loud-noise', 'bright-light', 'strong-smell'],
  },
  {
    id: 'hormonal',
    triggerIds: ['menstruation', 'pms', 'ovulation', 'pregnancy', 'postpartum'],
  },
  {
    id: 'internal',
    triggerIds: [
      'racing-heart',
      'dizziness',
      'shortness-of-breath',
      'stomach-discomfort',
      'chest-pain',
      'tingling',
      'muscle-tension',
    ],
  },
] as const;

export const ALL_TRIGGER_IDS = new Set(
  TRIGGER_CATEGORIES.flatMap((category) => category.triggerIds),
);

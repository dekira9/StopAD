import type { Language } from '@/constants/i18n';
import { getGrowthRingCopy } from '@/constants/growth-ring-labels';
import type { GrowthRingId } from '@/constants/growth-rings';
import { getGrowthRingLevel, type GrowthRingsLog } from '@/utils/growth-ring-log';

export function buildGrowthRingSummary(
  log: GrowthRingsLog,
  language: Language,
  labels: {
    growthRingEmptyHint: string;
    growthRingSummaryLevel: string;
  },
): { level: GrowthRingId | null; title: string; thought: string; summary: string } {
  const level = getGrowthRingLevel(log);
  if (!level) {
    return {
      level: null,
      title: '',
      thought: '',
      summary: labels.growthRingEmptyHint,
    };
  }

  const copy = getGrowthRingCopy(language, level);
  return {
    level,
    title: copy.title,
    thought: copy.thought,
    summary: labels.growthRingSummaryLevel.replace('{title}', copy.title),
  };
}

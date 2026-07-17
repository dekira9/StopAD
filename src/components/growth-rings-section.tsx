import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppLabels, Language } from '@/constants/i18n';
import {
  getGrowthRingActionLabel,
  getGrowthRingCopy,
  getGrowthRingEmotionLabel,
} from '@/constants/growth-ring-labels';
import { GROWTH_RINGS, type GrowthRingId, getGrowthRingDefinition } from '@/constants/growth-rings';
import { Fonts } from '@/constants/theme';
import { formatSectionTitle } from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import {
  countRingSelections,
  getGrowthRingLevel,
  toggleRingItem,
  type GrowthRingsLog,
} from '@/utils/growth-ring-log';
import { buildGrowthRingSummary } from '@/utils/growth-ring-summary';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  modalOverlay: string;
  modalBg: string;
  subtlePanelBorder: string;
  sectionLabelBg: string;
  rowBorder: string;
};

type Props = {
  language: Language;
  labels: AppLabels;
  value: GrowthRingsLog;
  onChange: (next: GrowthRingsLog) => void;
};

const RING_SIZE = 196;
const RING_STROKE = 16;
const RING_GAP = 5;

const RING_COLORS_LIGHT = ['#9BB0A6', '#8FA8B8', '#7A9AAD', '#6B8FA3'] as const;
const RING_COLORS_MUTED = ['rgba(155,176,166,0.28)', 'rgba(143,168,184,0.28)', 'rgba(122,154,173,0.28)', 'rgba(107,143,163,0.28)'] as const;

function resolveRingFromTouch(locationX: number, locationY: number): GrowthRingId {
  const center = RING_SIZE / 2;
  const dist = Math.hypot(locationX - center, locationY - center);

  for (let ringId = 1; ringId <= 4; ringId += 1) {
    const inset = (4 - ringId) * (RING_STROKE + RING_GAP);
    const outerR = (RING_SIZE - inset * 2) / 2;
    const innerR = outerR - RING_STROKE - RING_GAP / 2;
    if (dist <= outerR && dist > Math.max(0, innerR)) {
      return ringId as GrowthRingId;
    }
  }

  if (dist <= RING_SIZE / 2) return 1;
  return 4;
}

function RingsCanvas({
  level,
  onPressRing,
  theme,
  accessibilityLabel,
}: {
  level: GrowthRingId | null;
  onPressRing: (id: GrowthRingId) => void;
  theme: ThemeSlice;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      style={[styles.ringsCanvas, { width: RING_SIZE, height: RING_SIZE }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        onPressRing(resolveRingFromTouch(locationX, locationY));
      }}>
      {[4, 3, 2, 1].map((id) => {
        const ringId = id as GrowthRingId;
        const index = ringId - 1;
        const inset = (4 - ringId) * (RING_STROKE + RING_GAP);
        const size = RING_SIZE - inset * 2;
        const active = level !== null && ringId <= level;
        const color = active ? RING_COLORS_LIGHT[index] : RING_COLORS_MUTED[index];

        return (
          <View
            key={ringId}
            pointerEvents="none"
            style={[
              styles.ringVisual,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: RING_STROKE,
                borderColor: color,
                top: inset,
                left: inset,
              },
            ]}
          />
        );
      })}
      <View
        pointerEvents="none"
        style={[
          styles.ringsCenter,
          {
            backgroundColor: level ? RING_COLORS_LIGHT[Math.max(0, (level ?? 1) - 1)] : theme.sectionLabelBg,
            borderColor: theme.subtlePanelBorder,
          },
        ]}>
        <Text style={[styles.ringsCenterText, { color: level ? '#FFFFFF' : theme.textSecondary }]}>
          {level ?? '·'}
        </Text>
      </View>
    </Pressable>
  );
}

function Chip({
  label,
  selected,
  theme,
  onPress,
}: {
  label: string;
  selected: boolean;
  theme: ThemeSlice;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.activeBg : theme.inactiveBg,
          borderColor: selected ? theme.activeBg : theme.inactiveBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, { color: selected ? theme.activeText : theme.inactiveText }]}>{label}</Text>
    </Pressable>
  );
}

export function GrowthRingsSection({ language, labels, value, onChange }: Props) {
  const { modal: theme } = useAppChromeTheme();
  const [selectedRing, setSelectedRing] = useState<GrowthRingId | null>(null);
  const level = useMemo(() => getGrowthRingLevel(value), [value]);
  const summary = useMemo(
    () =>
      buildGrowthRingSummary(value, language, {
        growthRingEmptyHint: labels.growthRingEmptyHint,
        growthRingSummaryLevel: labels.growthRingSummaryLevel,
      }),
    [value, language, labels.growthRingEmptyHint, labels.growthRingSummaryLevel],
  );

  const openRing = selectedRing ? getGrowthRingDefinition(selectedRing) : null;
  const openCopy = selectedRing ? getGrowthRingCopy(language, selectedRing) : null;

  const setRingActions = (ringId: GrowthRingId, actionId: string) => {
    onChange({
      ...value,
      actionsByRing: {
        ...value.actionsByRing,
        [ringId]: toggleRingItem(value.actionsByRing[ringId], actionId),
      },
    });
  };

  const setRingEmotions = (ringId: GrowthRingId, emotionId: string) => {
    onChange({
      ...value,
      emotionsByRing: {
        ...value.emotionsByRing,
        [ringId]: toggleRingItem(value.emotionsByRing[ringId], emotionId),
      },
    });
  };

  return (
    <View style={[styles.section, { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder }]}>
      <Text style={[styles.sectionTitle, { backgroundColor: theme.sectionLabelBg, color: theme.textSecondary }]}>
        {formatSectionTitle(labels.whereAmIToday)}
      </Text>

      <View style={styles.body}>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{labels.growthRingTapHint}</Text>

        <View style={styles.ringsRow}>
          <RingsCanvas
            level={level}
            onPressRing={setSelectedRing}
            theme={theme}
            accessibilityLabel={labels.whereAmIToday}
          />
          <View style={styles.legendColumn}>
            {GROWTH_RINGS.map((ring) => {
              const copy = getGrowthRingCopy(language, ring.id);
              const count = countRingSelections(value, ring.id);
              const isActiveLevel = level === ring.id;
              return (
                <Pressable
                  key={ring.id}
                  onPress={() => setSelectedRing(ring.id)}
                  style={({ pressed }) => [styles.legendRow, pressed && styles.pressed]}>
                  <View
                    style={[
                      styles.legendDot,
                      {
                        backgroundColor:
                          level !== null && ring.id <= level
                            ? RING_COLORS_LIGHT[ring.id - 1]
                            : RING_COLORS_MUTED[ring.id - 1],
                      },
                    ]}
                  />
                  <View style={styles.legendTextWrap}>
                    <Text
                      style={[
                        styles.legendTitle,
                        { color: isActiveLevel ? theme.text : theme.textSecondary },
                      ]}
                      numberOfLines={2}>
                      {ring.id}. {copy.title}
                    </Text>
                    {count > 0 ? (
                      <Text style={[styles.legendCount, { color: theme.textSecondary }]}>{count}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder }]}>
          {summary.level ? (
            <>
              <Text style={[styles.summaryLevel, { color: theme.text }]}>{summary.summary}</Text>
              <Text style={[styles.summaryThought, { color: theme.textSecondary }]}>“{summary.thought}”</Text>
            </>
          ) : (
            <Text style={[styles.summaryLevel, { color: theme.textSecondary }]}>{summary.summary}</Text>
          )}
        </View>
      </View>

      <Modal
        transparent
        visible={selectedRing !== null}
        animationType="fade"
        onRequestClose={() => setSelectedRing(null)}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={() => setSelectedRing(null)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
            onPress={() => {}}>
            {openRing && openCopy && selectedRing ? (
              <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
                <Text style={[styles.sheetEyebrow, { color: theme.textSecondary }]}>{openCopy.zone}</Text>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>{openCopy.title}</Text>
                <Text style={[styles.sheetThought, { color: theme.textSecondary }]}>“{openCopy.thought}”</Text>

                <Text style={[styles.sheetSectionLabel, { color: theme.textSecondary }]}>
                  {labels.growthRingActions}
                </Text>
                <View style={styles.chipGrid}>
                  {openRing.actionIds.map((actionId) => (
                    <Chip
                      key={actionId}
                      label={getGrowthRingActionLabel(language, actionId)}
                      selected={(value.actionsByRing[selectedRing] ?? []).includes(actionId)}
                      theme={theme}
                      onPress={() => setRingActions(selectedRing, actionId)}
                    />
                  ))}
                </View>

                <Text style={[styles.sheetSectionLabel, { color: theme.textSecondary }]}>
                  {labels.growthRingEmotions}
                </Text>
                <View style={styles.chipGrid}>
                  {openRing.emotionIds.map((emotionId) => (
                    <Chip
                      key={emotionId}
                      label={getGrowthRingEmotionLabel(language, emotionId)}
                      selected={(value.emotionsByRing[selectedRing] ?? []).includes(emotionId)}
                      theme={theme}
                      onPress={() => setRingEmotions(selectedRing, emotionId)}
                    />
                  ))}
                </View>

                <Pressable
                  onPress={() => setSelectedRing(null)}
                  style={({ pressed }) => [
                    styles.doneButton,
                    { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.sans,
  },
  ringsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  ringsCanvas: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringVisual: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  ringsCenter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsCenterText: {
    fontSize: 16,
    fontFamily: Fonts.sansBold,
  },
  legendColumn: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  legendTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  legendTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.sansMedium,
  },
  legendCount: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: 1,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  summaryLevel: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sansSemiBold,
  },
  summaryThought: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.sans,
    fontStyle: 'italic',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheet: {
    maxHeight: '85%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
  },
  sheetEyebrow: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
    lineHeight: 26,
  },
  sheetThought: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.sans,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  sheetSectionLabel: {
    marginTop: 6,
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  doneButton: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  doneButtonText: {
    fontSize: 12,
    fontFamily: Fonts.sansExtraBold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
  },
});

import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getGrowthRingActionLabel,
  getGrowthRingCopy,
  getGrowthRingEmotionLabel,
} from '@/constants/growth-ring-labels';
import { getGrowthRingDefinition, GROWTH_RINGS, type GrowthRingId } from '@/constants/growth-rings';
import type { AppLabels, Language } from '@/constants/i18n';
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

const RING_WIDTH = 300;
const RING_HEIGHT = 164;
/** White gap between colored stadium bands (equal on all sides). */
const RING_GAP = 3;
/**
 * Same band thickness for every ring.
 * Side (L/R) is thicker than vertical (T/B).
 */
const RING_BAND_SIDE = 28;
const RING_BAND_VERTICAL = 10;
const RING_BAND = { side: RING_BAND_SIDE, vertical: RING_BAND_VERTICAL } as const;
/** Concentric stadiums centered in the canvas (as in the mockup). */
const CENTER_X = RING_WIDTH / 2;
const CENTER_Y = RING_HEIGHT / 2;
/** ~2:1 capsule proportion like the mockup. */
const OUTER_W = 296;
const OUTER_H = 148;

/** Inner → outer: muted blue → soft green. */
const RING_COLORS_LIGHT = ['#5B7F96', '#71A7B0', '#86B5AC', '#C5E0CA'] as const;
const RING_COLORS_MUTED = [
  'rgba(91,127,150,0.34)',
  'rgba(113,167,176,0.34)',
  'rgba(134,181,172,0.34)',
  'rgba(197,224,202,0.34)',
] as const;
const CENTER_FILL = '#E8E8E8';
/** Center digit colors — ring 4 uses a deeper green so it reads on light gray. */
const RING_CENTER_TEXT = ['#5B7F96', '#71A7B0', '#86B5AC', '#5A8F6E'] as const;
const CENTER_EMPTY_TEXT = '#9A9A9A';

function getRingBand(_ringId: GrowthRingId): { side: number; vertical: number } {
  return RING_BAND;
}

/** Cumulative inset outside this ring's outer edge. */
function getOuterInset(ringId: GrowthRingId): { side: number; vertical: number } {
  const outerCount = 4 - ringId;
  return {
    side: outerCount * (RING_BAND_SIDE + RING_GAP),
    vertical: outerCount * (RING_BAND_VERTICAL + RING_GAP),
  };
}

/** Outer width/height of the stadium band for this ring. */
function getRingOuterSize(ringId: GrowthRingId): { width: number; height: number } {
  const inset = getOuterInset(ringId);
  return {
    width: OUTER_W - inset.side * 2,
    height: OUTER_H - inset.vertical * 2,
  };
}

function getCenterSize(): { width: number; height: number } {
  // 4 bands + 4 gaps (including the gap before the center)
  const side = 4 * RING_BAND_SIDE + 4 * RING_GAP;
  const vertical = 4 * RING_BAND_VERTICAL + 4 * RING_GAP;
  return {
    width: Math.max(24, OUTER_W - side * 2),
    height: Math.max(20, OUTER_H - vertical * 2),
  };
}

/** Layers from outside in: colored fill, then gap cutout. Center is drawn separately. */
function getRingLayers(): Array<
  { key: string; width: number; height: number; kind: 'ring'; ringId: GrowthRingId } | { key: string; width: number; height: number; kind: 'gap' }
> {
  const layers: Array<
    { key: string; width: number; height: number; kind: 'ring'; ringId: GrowthRingId } | { key: string; width: number; height: number; kind: 'gap' }
  > = [];
  let side = 0;
  let vertical = 0;

  for (let id = 4; id >= 1; id -= 1) {
    const ringId = id as GrowthRingId;
    layers.push({
      key: `ring-${id}`,
      width: OUTER_W - side * 2,
      height: OUTER_H - vertical * 2,
      kind: 'ring',
      ringId,
    });
    side += RING_BAND_SIDE;
    vertical += RING_BAND_VERTICAL;
    layers.push({
      key: `gap-${id}`,
      width: OUTER_W - side * 2,
      height: OUTER_H - vertical * 2,
      kind: 'gap',
    });
    side += RING_GAP;
    vertical += RING_GAP;
  }

  return layers;
}

function pointInStadium(
  x: number,
  y: number,
  cx: number,
  cy: number,
  width: number,
  height: number,
): boolean {
  const rx = width / 2;
  const ry = height / 2;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  if (dy > ry || dx > rx) return false;
  if (dx <= rx - ry) return true;
  const capOffset = rx - ry;
  return Math.hypot(dx - capOffset, dy) <= ry;
}

function resolveRingFromTouch(locationX: number, locationY: number): GrowthRingId {
  for (let ringId = 1; ringId <= 4; ringId += 1) {
    const band = getRingBand(ringId as GrowthRingId);
    const outer = getRingOuterSize(ringId as GrowthRingId);
    const touchInner = {
      width: Math.max(0, outer.width - (band.side + RING_GAP) * 2),
      height: Math.max(0, outer.height - (band.vertical + RING_GAP) * 2),
    };
    const inOuter = pointInStadium(locationX, locationY, CENTER_X, CENTER_Y, outer.width, outer.height);
    const inInner = pointInStadium(
      locationX,
      locationY,
      CENTER_X,
      CENTER_Y,
      touchInner.width,
      touchInner.height,
    );
    if (inOuter && !inInner) {
      return ringId as GrowthRingId;
    }
  }

  const center = getCenterSize();
  if (pointInStadium(locationX, locationY, CENTER_X, CENTER_Y, center.width, center.height)) {
    return 1;
  }
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
  const center = getCenterSize();
  const layers = getRingLayers();

  return (
    <Pressable
      style={[styles.ringsCanvas, { width: RING_WIDTH, height: RING_HEIGHT }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(event) => {
        const { locationX, locationY } = event.nativeEvent;
        onPressRing(resolveRingFromTouch(locationX, locationY));
      }}>
      {layers.map((layer) => {
        const fill =
          layer.kind === 'gap'
            ? theme.inactiveBg
            : level !== null && layer.ringId <= level
              ? RING_COLORS_LIGHT[layer.ringId - 1]
              : RING_COLORS_MUTED[layer.ringId - 1];

        return (
          <View
            key={layer.key}
            pointerEvents="none"
            style={[
              styles.ringVisual,
              {
                width: layer.width,
                height: layer.height,
                borderRadius: layer.height / 2,
                backgroundColor: fill,
                top: CENTER_Y - layer.height / 2,
                left: CENTER_X - layer.width / 2,
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
            width: center.width,
            height: center.height,
            borderRadius: center.height / 2,
            left: CENTER_X - center.width / 2,
            top: CENTER_Y - center.height / 2,
            backgroundColor: CENTER_FILL,
            borderColor: theme.subtlePanelBorder,
          },
        ]}>
        <Text
          style={[
            styles.ringsCenterText,
            {
              color: level
                ? RING_CENTER_TEXT[Math.max(0, (level ?? 1) - 1)]
                : CENTER_EMPTY_TEXT,
            },
          ]}>
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

        <View style={styles.ringsBlock}>
          <RingsCanvas
            level={level}
            onPressRing={setSelectedRing}
            theme={theme}
            accessibilityLabel={labels.whereAmIToday}
          />
          <View style={styles.legendGrid}>
            {GROWTH_RINGS.map((ring) => {
              const copy = getGrowthRingCopy(language, ring.id);
              const count = countRingSelections(value, ring.id);
              const isActiveLevel = level === ring.id;
              return (
                <Pressable
                  key={ring.id}
                  onPress={() => setSelectedRing(ring.id)}
                  style={({ pressed }) => [styles.legendCell, pressed && styles.pressed]}>
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
  ringsBlock: {
    alignItems: 'center',
    gap: 14,
  },
  ringsCanvas: {
    position: 'relative',
    alignSelf: 'center',
  },
  ringVisual: {
    position: 'absolute',
  },
  ringsCenter: {
    position: 'absolute',
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsCenterText: {
    fontSize: 15,
    fontFamily: Fonts.sansBold,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    columnGap: 10,
    rowGap: 10,
  },
  legendCell: {
    width: '47%',
    flexGrow: 1,
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

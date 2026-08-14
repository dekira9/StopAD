import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLabels, Language } from '@/constants/i18n';
import { formatSectionTitle, daySectionLabelStyle, weekBodyTextStyle, weekButtonTextStyle, weekFieldLabelStyle } from '@/constants/typography';
import { TRIGGER_CATEGORIES, type TriggerCategoryId } from '@/constants/trigger-catalog';
import { getTriggerCategoryLabel, getTriggerLabel } from '@/constants/trigger-labels';
import {
  addCustomTrigger,
  parseTriggerLog,
  removeCustomTrigger,
  serializeTriggerLog,
  toggleCatalogTrigger,
  type TriggerLog,
} from '@/utils/trigger-log';

const TRIGGERS = {
  accent: '#8a9bd2',
  buttonBg: '#E4EEF7',
  selectedBg: '#F8F9FC',
} as const;

const TRIGGER_CATEGORY_IMAGES: Record<TriggerCategoryId, number> = {
  'sleep-fatigue': require('@/assets/images/trig-sleep-decor.png'),
  stress: require('@/assets/images/trig-stress-decor.png'),
  health: require('@/assets/images/trig-heal-decor.png'),
  'food-substances': require('@/assets/images/trig-food-decor.png'),
  medications: require('@/assets/images/trig-med-decor.png'),
  'physical-load': require('@/assets/images/trig-physical-decor.png'),
  'public-places': require('@/assets/images/trig-public-decor.png'),
  'emotional-events': require('@/assets/images/trig-emot-decor.png'),
  sensory: require('@/assets/images/trig-sensor-decor.png'),
  hormonal: require('@/assets/images/trig-hormon-decor.png'),
  internal: require('@/assets/images/trig-inter-decor.png'),
};

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  sectionLabelBg: string;
  rowBorder: string;
  iconMuted: string;
};

type Props = {
  label: string;
  value: string;
  language: Language;
  labels: AppLabels;
  theme: ThemeSlice;
  onChange: (value: string) => void;
  hideLabel?: boolean;
};

export function TriggersInput({ label, value, language, labels, theme, onChange, hideLabel }: Props) {
  const log = useMemo(() => parseTriggerLog(value), [value]);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<ReadonlySet<TriggerCategoryId>>(
    () => new Set(),
  );
  const [customDraft, setCustomDraft] = useState('');

  const updateLog = (nextLog: TriggerLog) => {
    onChange(serializeTriggerLog(nextLog));
  };

  const hasSelected = log.catalogIds.length > 0 || log.custom.length > 0;

  const toggleCategory = (categoryId: TriggerCategoryId) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const renderChip = (chipLabel: string, selected: boolean, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? TRIGGERS.selectedBg : theme.inactiveBg,
          borderColor: selected ? TRIGGERS.accent : theme.inactiveBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, { color: selected ? TRIGGERS.accent : theme.inactiveText }]}>{chipLabel}</Text>
    </Pressable>
  );

  const addCustom = () => {
    const nextLog = addCustomTrigger(log, customDraft);
    if (nextLog.custom.length !== log.custom.length) {
      updateLog(nextLog);
      setCustomDraft('');
    }
  };

  return (
    <View style={styles.sectionBlock}>
      {hideLabel ? null : (
        <Text style={[styles.sectionLabel, { backgroundColor: theme.sectionLabelBg }]}>
          {formatSectionTitle(label)}
        </Text>
      )}

      <View style={styles.content}>
        {hasSelected ? (
          <View style={styles.selectedRow}>
            {log.catalogIds.map((triggerId) =>
              renderChip(getTriggerLabel(language, triggerId), true, () => {
                updateLog(toggleCatalogTrigger(log, triggerId));
              }, triggerId),
            )}
            {log.custom.map((customText) =>
              renderChip(customText, true, () => {
                updateLog(removeCustomTrigger(log, customText));
              }, `custom-${customText}`),
            )}
          </View>
        ) : null}

        <Pressable
          onPress={() => setPickerExpanded((v) => !v)}
          style={({ pressed }) => [
            styles.pickerToggleButton,
            { borderColor: TRIGGERS.accent, backgroundColor: TRIGGERS.selectedBg },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.addIconCircle, { backgroundColor: TRIGGERS.buttonBg, borderColor: TRIGGERS.accent }]}>
            <Ionicons name={pickerExpanded ? 'chevron-up' : 'add'} size={16} color={TRIGGERS.accent} />
          </View>
          <Text style={[styles.pickerToggleTitle, { color: TRIGGERS.accent }]}>
            {labels.triggersPossible.toLocaleLowerCase()}
          </Text>
        </Pressable>

        {pickerExpanded ? (
          <View style={styles.pickerBody}>
            {TRIGGER_CATEGORIES.map((category) => {
              const categoryOpen = expandedCategoryIds.has(category.id);
              const categoryTitle = getTriggerCategoryLabel(language, category.id);

              return (
                <View key={category.id} style={styles.categoryBlock}>
                  <Pressable
                    onPress={() => toggleCategory(category.id)}
                    style={({ pressed }) => [styles.categoryHeader, pressed && styles.pressed]}>
                    <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>{categoryTitle}</Text>
                    {categoryOpen ? (
                      <Ionicons name="chevron-up" size={16} color={theme.textSecondary} />
                    ) : null}
                  </Pressable>

                  {categoryOpen ? (
                    <View style={styles.chipGrid}>
                      {category.triggerIds.map((triggerId) => {
                        const selected = log.catalogIds.includes(triggerId);
                        return renderChip(getTriggerLabel(language, triggerId), selected, () => {
                          updateLog(toggleCatalogTrigger(log, triggerId));
                        }, triggerId);
                      })}
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => toggleCategory(category.id)}
                      accessibilityRole="button"
                      accessibilityLabel={categoryTitle}
                      style={({ pressed }) => [styles.categoryImageWrap, pressed && styles.pressed]}>
                      <Image
                        source={TRIGGER_CATEGORY_IMAGES[category.id]}
                        style={styles.categoryImage}
                        contentFit="contain"
                        accessibilityIgnoresInvertColors
                      />
                    </Pressable>
                  )}
                </View>
              );
            })}

            <View style={styles.customBlock}>
              <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>
                {formatSectionTitle(labels.triggerCustomTitle)}
              </Text>
              <View style={styles.customRow}>
                <TextInput
                  value={customDraft}
                  onChangeText={setCustomDraft}
                  placeholder={labels.triggerCustomPlaceholder}
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.customInput,
                    {
                      color: theme.text,
                      borderColor: theme.inactiveBorder,
                      backgroundColor: theme.inactiveBg,
                    },
                  ]}
                  returnKeyType="done"
                  onSubmitEditing={addCustom}
                />
                <Pressable
                  onPress={addCustom}
                  disabled={!customDraft.trim()}
                  style={({ pressed }) => [
                    styles.customAddButton,
                    {
                      backgroundColor: theme.activeBg,
                      borderColor: theme.activeBg,
                      opacity: customDraft.trim() ? 1 : 0.45,
                    },
                    pressed && customDraft.trim() && styles.pressed,
                  ]}>
                  <Text style={[styles.customAddText, { color: theme.activeText }]}>{labels.triggerCustomAdd}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBlock: {},
  sectionLabel: {
    ...daySectionLabelStyle,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerToggleTitle: {
    ...weekButtonTextStyle,
  },
  pickerBody: {
    gap: 14,
  },
  categoryBlock: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryTitle: {
    ...weekFieldLabelStyle,
    flex: 1,
  },
  categoryImageWrap: {
    alignSelf: 'center',
  },
  categoryImage: {
    width: 148,
    height: 148,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  customBlock: {
    gap: 6,
    paddingTop: 2,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...weekBodyTextStyle,
  },
  customAddButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customAddText: {
    ...weekButtonTextStyle,
  },
  pressed: { opacity: 0.7 },
});

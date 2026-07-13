import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLabels, Language } from '@/constants/i18n';
import { formatSectionTitle, daySectionLabelStyle, weekBodyTextStyle, weekButtonTextStyle, weekFieldLabelStyle } from '@/constants/typography';
import { TRIGGER_CATEGORIES } from '@/constants/trigger-catalog';
import { getTriggerCategoryLabel, getTriggerLabel } from '@/constants/trigger-labels';
import {
  addCustomTrigger,
  parseTriggerLog,
  removeCustomTrigger,
  serializeTriggerLog,
  toggleCatalogTrigger,
  type TriggerLog,
} from '@/utils/trigger-log';

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
  const [customDraft, setCustomDraft] = useState('');

  const updateLog = (nextLog: TriggerLog) => {
    onChange(serializeTriggerLog(nextLog));
  };

  const hasSelected = log.catalogIds.length > 0 || log.custom.length > 0;

  const renderChip = (chipLabel: string, selected: boolean, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.activeBg : theme.inactiveBg,
          borderColor: selected ? theme.activeBg : theme.inactiveBorder,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.chipText, { color: selected ? theme.activeText : theme.inactiveText }]}>{chipLabel}</Text>
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
            { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg },
            pressed && styles.pressed,
          ]}>
          <Ionicons name="add-circle-outline" size={16} color={theme.activeBg} />
          <Text style={[styles.pickerToggleTitle, { color: theme.activeBg }]}>
            {labels.triggersPossible.toLocaleLowerCase()}
          </Text>
        </Pressable>

        {pickerExpanded ? (
          <View style={styles.pickerBody}>
            {TRIGGER_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.categoryBlock}>
                <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>
                  {getTriggerCategoryLabel(language, category.id)}
                </Text>
                <View style={styles.chipGrid}>
                  {category.triggerIds.map((triggerId) => {
                    const selected = log.catalogIds.includes(triggerId);
                    return renderChip(getTriggerLabel(language, triggerId), selected, () => {
                      updateLog(toggleCatalogTrigger(log, triggerId));
                    }, triggerId);
                  })}
                </View>
              </View>
            ))}

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
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerToggleTitle: {
    ...weekBodyTextStyle,
  },
  pickerBody: {
    gap: 12,
  },
  categoryBlock: {
    gap: 6,
  },
  categoryTitle: {
    ...weekFieldLabelStyle,
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
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '400',
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

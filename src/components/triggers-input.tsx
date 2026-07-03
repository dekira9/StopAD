import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLabels, Language } from '@/constants/i18n';
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
};

export function TriggersInput({ label, value, language, labels, theme, onChange }: Props) {
  const [log, setLog] = useState<TriggerLog>(() => parseTriggerLog(value));
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  useEffect(() => {
    setLog(parseTriggerLog(value));
  }, [value]);

  const updateLog = (nextLog: TriggerLog) => {
    setLog(nextLog);
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
    <View style={[styles.sectionBlock, { borderColor: theme.rowBorder }]}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary, backgroundColor: theme.sectionLabelBg }]}>
        {label}
      </Text>

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
            styles.pickerToggle,
            { borderTopColor: hasSelected ? theme.rowBorder : 'transparent' },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.pickerToggleTitle, { color: theme.textSecondary }]}>{labels.triggersPossible}</Text>
          <Ionicons name={pickerExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={theme.iconMuted} />
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
              <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>{labels.triggerCustomTitle}</Text>
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
  sectionBlock: { borderBottomWidth: 1 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pickerToggleTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  pickerBody: {
    gap: 12,
  },
  categoryBlock: {
    gap: 6,
  },
  categoryTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
    fontSize: 12,
    lineHeight: 16,
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
    fontSize: 13,
  },
  customAddButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customAddText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: { opacity: 0.7 },
});

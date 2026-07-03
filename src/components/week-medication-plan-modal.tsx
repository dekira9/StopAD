import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MedicationRepeatModal } from '@/components/medication-repeat-modal';
import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
  DEFAULT_MEDICATION_REPEAT,
  type MedicationPlanTemplate,
  type MedicationRepeatConfig,
} from '@/stores/wellness-store';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

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
  iconMuted: string;
};

type Props = {
  visible: boolean;
  weekKey: string;
  labels: AppLabels;
  theme: ThemeSlice;
  weekdayLabels: string[];
  initialTemplates: MedicationPlanTemplate[];
  onClose: () => void;
  onSave: (templates: MedicationPlanTemplate[]) => void;
};

function cloneTemplates(source: MedicationPlanTemplate[]): MedicationPlanTemplate[] {
  const templates = Array.isArray(source) ? source : [];
  return templates.map((template) => ({
    ...template,
    repeat: {
      ...(template.repeat ?? DEFAULT_MEDICATION_REPEAT),
      daysOfWeek: [...(template.repeat?.daysOfWeek ?? DEFAULT_MEDICATION_REPEAT.daysOfWeek)],
    },
  }));
}

function createTemplateId(weekKey: string, templates: MedicationPlanTemplate[]) {
  let id = `plan-${weekKey}-${templates.length}`;
  let suffix = 0;
  while (templates.some((template) => template.id === id)) {
    suffix += 1;
    id = `plan-${weekKey}-${templates.length}-${suffix}`;
  }
  return id;
}

export function formatRepeatSummary(
  repeat: MedicationRepeatConfig,
  labels: AppLabels,
  weekdayLabels: string[],
): string {
  const duration = `${repeat.months} ${labels.repeatMonthsUnit}`;
  if (repeat.intervalDays && repeat.intervalDays >= 2) {
    return `${duration} · ${labels.medicationIntakeIntervalEvery.replace('{n}', String(repeat.intervalDays))}`;
  }
  if (repeat.everyDay) return `${duration} · ${labels.repeatEveryDay}`;
  const days = repeat.daysOfWeek
    .slice()
    .sort((a, b) => WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) - WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number]))
    .map((dow) => weekdayLabels[WEEKDAY_ORDER.indexOf(dow as (typeof WEEKDAY_ORDER)[number])])
    .join(', ');
  return `${duration} · ${days}`;
}

export function WeekMedicationPlanModal({
  visible,
  weekKey,
  labels,
  theme,
  weekdayLabels,
  initialTemplates,
  onClose,
  onSave,
}: Props) {
  const [templates, setTemplateRows] = useState(() => cloneTemplates(initialTemplates));
  const [repeatTargetId, setRepeatTargetId] = useState<string | null>(null);

  const repeatTarget = templates.find((template) => template.id === repeatTargetId) ?? null;

  const updateTemplate = (id: string, patch: Partial<MedicationPlanTemplate>) => {
    setTemplateRows((current) => {
      const rows = Array.isArray(current) ? current : [];
      return rows.map((template) => (template.id === id ? { ...template, ...patch } : template));
    });
  };

  const addTemplate = () => {
    setTemplateRows((current) => {
      const rows = Array.isArray(current) ? current : [];
      return [
        ...rows,
        {
          id: createTemplateId(weekKey, rows),
          time: '',
          medication: '',
          reminderEnabled: true,
          repeat: {
            ...DEFAULT_MEDICATION_REPEAT,
            daysOfWeek: [...DEFAULT_MEDICATION_REPEAT.daysOfWeek],
          },
        },
      ];
    });
  };

  const removeTemplate = (id: string) => {
    setTemplateRows((current) => {
      const rows = Array.isArray(current) ? current : [];
      if (rows.length <= 1) {
        return [
          {
            id: createTemplateId(weekKey, []),
            time: '',
            medication: '',
            reminderEnabled: true,
            repeat: {
              ...DEFAULT_MEDICATION_REPEAT,
              daysOfWeek: [...DEFAULT_MEDICATION_REPEAT.daysOfWeek],
            },
          },
        ];
      }
      return rows.filter((template) => template.id !== id);
    });
  };

  const canSave = templates.some((template) => template.medication.trim());

  return (
    <>
      <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.weekMedicationPlan}</Text>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>{labels.weekMedicationPlanHint}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {templates.map((template) => (
                <View
                  key={template.id}
                  style={[styles.templateRow, { borderColor: theme.subtlePanelBorder, backgroundColor: theme.inactiveBg }]}>
                  <TextInput
                    value={template.time}
                    onChangeText={(time) => updateTemplate(template.id, { time })}
                    placeholder="08:00"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.timeInput, { color: theme.text }]}
                  />
                  <TextInput
                    value={template.medication}
                    onChangeText={(medication) => updateTemplate(template.id, { medication })}
                    placeholder={labels.medicationPlaceholder}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.medInput, { color: theme.text }]}
                  />
                  <Pressable
                    onPress={() => setRepeatTargetId(template.id)}
                    style={({ pressed }) => [
                      styles.repeatChip,
                      { borderColor: theme.inactiveBorder, backgroundColor: theme.modalBg },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="repeat-outline" size={12} color={theme.iconMuted} />
                    <Text style={[styles.repeatChipText, { color: theme.textSecondary }]} numberOfLines={2}>
                      {formatRepeatSummary(template.repeat, labels, weekdayLabels)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeTemplate(template.id)}
                    hitSlop={6}
                    style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}>
                    <Ionicons name="remove-circle-outline" size={18} color={theme.iconMuted} />
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={addTemplate}
                style={({ pressed }) => [
                  styles.addButton,
                  { borderColor: theme.inactiveBorder, backgroundColor: theme.inactiveBg },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="add" size={16} color={theme.text} />
                <Text style={[styles.addButtonText, { color: theme.text }]}>{labels.weekMedicationPlanAdd}</Text>
              </Pressable>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={[styles.actionButton, { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder }]}>
                <Text style={[styles.actionText, { color: theme.inactiveText }]}>{labels.weekMedicationPlanCancel}</Text>
              </Pressable>
              <Pressable
                disabled={!canSave}
                onPress={() => onSave(templates)}
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.activeBg, borderColor: theme.activeBg, opacity: canSave ? 1 : 0.45 },
                ]}>
                <Text style={[styles.actionText, { color: theme.activeText }]}>{labels.weekMedicationPlanSave}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <MedicationRepeatModal
        visible={repeatTarget !== null}
        labels={labels}
        theme={theme}
        weekdayLabels={weekdayLabels}
        initialDayOfWeek={1}
        initialRepeat={repeatTarget?.repeat}
        onClose={() => setRepeatTargetId(null)}
        onApply={(repeat) => {
          if (!repeatTargetId) return;
          updateTemplate(repeatTargetId, { repeat });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  hint: { marginTop: 6, fontSize: 10, lineHeight: 14 },
  closeBtn: { padding: 4 },
  scroll: { marginTop: 14 },
  scrollContent: { gap: 10, paddingBottom: 8 },
  templateRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  timeInput: {
    width: 72,
    fontSize: 12,
    fontFamily: Fonts.mono,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  medInput: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 18,
  },
  repeatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  repeatChipText: { flex: 1, fontSize: 9, fontWeight: '700', lineHeight: 12 },
  removeBtn: { alignSelf: 'flex-end' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  addButtonText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});

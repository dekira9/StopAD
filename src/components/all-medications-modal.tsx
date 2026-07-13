import { Ionicons } from '@expo/vector-icons';
import { addMonths, format, parse } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import { formatSectionTitle, weekButtonTextStyle, weekDayTitleStyle, weekFieldLabelStyle } from '@/constants/typography';
import {
  formatMedicationLabel,
  type MedicationCatalogEntry,
  wellnessStore,
} from '@/stores/wellness-store';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  buttonShadow: number;
  modalOverlay: string;
  modalBg: string;
  subtlePanelBorder: string;
};

type AllMedicationsLabels = AppLabels & {
  allMedicationsCurrent: string;
  allMedicationsCompleted: string;
};

type Props = {
  visible: boolean;
  labels: AllMedicationsLabels;
  theme: ThemeSlice;
  onClose: () => void;
  onOpenSchedule: (entry: MedicationCatalogEntry) => void;
};

function loadVisibleMedicationEntries() {
  wellnessStore.refreshMedicationCatalog();
  return wellnessStore.visibleMedicationCatalog;
}

type ContentProps = Omit<Props, 'visible'>;

function AllMedicationsModalContent({ labels, theme, onClose, onOpenSchedule }: ContentProps) {
  const [entries, setEntries] = useState<MedicationCatalogEntry[]>(loadVisibleMedicationEntries);

  const loadEntries = useCallback(() => {
    setEntries(loadVisibleMedicationEntries());
  }, []);

  const handleAdd = () => {
    wellnessStore.addMedicationCatalogEntry();
    loadEntries();
  };

  const handleRemove = (id: string) => {
    wellnessStore.removeMedicationCatalogEntry(id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const handleUpdate = (id: string, patch: Partial<Pick<MedicationCatalogEntry, 'name' | 'dose'>>) => {
    wellnessStore.updateMedicationCatalogEntry(id, patch);
    loadEntries();
  };

  const { currentEntries, completedEntries } = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const current: MedicationCatalogEntry[] = [];
    const completed: MedicationCatalogEntry[] = [];

    for (const entry of entries) {
      const label = catalogEntryMedicationLabel(entry);
      const schedule = wellnessStore.getMedicationScheduleForName(label);
      const repeat = schedule.repeat;
      let endKey: string | null = null;

      if (repeat.endDateKey === null) {
        endKey = null;
      } else if (repeat.endDateKey) {
        endKey = repeat.endDateKey;
      } else if (repeat.startDateKey) {
        const start = parse(repeat.startDateKey, 'yyyy-MM-dd', new Date());
        endKey = format(addMonths(start, repeat.months), 'yyyy-MM-dd');
      }

      if (endKey && endKey < todayKey) {
        completed.push(entry);
      } else {
        current.push(entry);
      }
    }

    return { currentEntries: current, completedEntries: completed };
  }, [entries]);

  const renderEntry = (entry: MedicationCatalogEntry) => {
    const label = catalogEntryMedicationLabel(entry);
    const schedule = wellnessStore.getMedicationScheduleForName(label);
    const hasSchedule = label.trim().length > 0 && (schedule.times.length > 0 || Boolean(schedule.repeat.startDateKey));
    const canRemoveDraft = entry.isDraft && !entry.name.trim() && !entry.dose.trim() && !hasSchedule;

    return (
      <View
        key={entry.id}
        style={[
          styles.row,
          {
            backgroundColor: theme.inactiveBg,
            borderColor: theme.inactiveBorder,
            shadowOpacity: theme.buttonShadow,
          },
        ]}>
        <View style={styles.rowHeader}>
          <View style={styles.fields}>
            <TextInput
              value={entry.name}
              onChangeText={(value) => handleUpdate(entry.id, { name: value })}
              placeholder={labels.medicationName}
              placeholderTextColor={theme.textSecondary}
              style={[styles.nameInput, { color: theme.text }]}
            />
            <TextInput
              value={entry.dose}
              onChangeText={(value) => handleUpdate(entry.id, { dose: value })}
              placeholder={labels.medicationDose}
              placeholderTextColor={theme.textSecondary}
              style={[styles.doseInput, { color: theme.text }]}
            />
          </View>
          {canRemoveDraft ? (
            <Pressable
              onPress={() => handleRemove(entry.id)}
              accessibilityLabel={labels.removeMedication}
              hitSlop={6}
              style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}>
              <Ionicons name="remove-circle" size={22} color={theme.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.deleteBtn} />
          )}
        </View>
        <Pressable
          onPress={() => onOpenSchedule(entry)}
          style={({ pressed }) => [
            styles.scheduleBtn,
            { borderColor: theme.inactiveBorder },
            pressed && styles.pressed,
          ]}>
          <Ionicons name="calendar-outline" size={14} color={theme.text} />
          <Text style={[styles.scheduleBtnText, { color: theme.inactiveText }]}>
            {formatSectionTitle(labels.medicationScheduleButton)}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerBtn} />
            <Text style={[styles.title, { color: theme.text }]}>{formatSectionTitle(labels.allMedicationsTitle)}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {entries.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{labels.allMedicationsEmpty}</Text>
            ) : (
              <>
                {currentEntries.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.activeBg }]}>
                      {labels.allMedicationsCurrent}
                    </Text>
                    {currentEntries.map(renderEntry)}
                  </View>
                ) : null}
                {completedEntries.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.activeBg }]}>
                      {labels.allMedicationsCompleted}
                    </Text>
                    {completedEntries.map(renderEntry)}
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: theme.inactiveBg,
                  borderColor: theme.inactiveBorder,
                  shadowOpacity: theme.buttonShadow,
                },
                pressed && styles.pressed,
              ]}>
              <View style={styles.addButtonIcon}>
                <Ionicons name="add-circle-outline" size={16} color={theme.activeBg} />
              </View>
              <Text style={[styles.addButtonText, { color: theme.activeBg }]}>{labels.addMedication}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                {
                  backgroundColor: theme.activeBg,
                  borderColor: theme.activeBg,
                  shadowOpacity: theme.buttonShadow,
                },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
            </Pressable>
          </View>
        </View>
      </View>
  );
}

export function AllMedicationsModal({ visible, labels, theme, onClose, onOpenSchedule }: Props) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <AllMedicationsModalContent
          key="all-medications-open"
          labels={labels}
          theme={theme}
          onClose={onClose}
          onOpenSchedule={onOpenSchedule}
        />
      ) : null}
    </Modal>
  );
}

export function catalogEntryMedicationLabel(entry: MedicationCatalogEntry): string {
  return formatMedicationLabel(entry.name, entry.dose);
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: { minWidth: 28, alignItems: 'flex-end' },
  title: { ...weekDayTitleStyle, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 14 },
  emptyText: { fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  section: { gap: 8 },
  sectionTitle: { ...weekFieldLabelStyle },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  fields: { flex: 1, gap: 6 },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  nameInput: { fontSize: 13, fontWeight: '700', paddingVertical: 0 },
  doseInput: { fontSize: 12, fontFamily: Fonts.mono, paddingVertical: 0 },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  scheduleBtnText: {
    ...weekButtonTextStyle,
    flexShrink: 1,
  },
  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addButtonIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { ...weekButtonTextStyle },
  doneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.7 },
});

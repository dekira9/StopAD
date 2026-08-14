import { Ionicons } from '@expo/vector-icons';
import { addMonths, format, parse } from 'date-fns';
import { BlurTargetView, BlurView } from 'expo-blur';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MedicineBottleIcon, ScheduleIcon } from '@/components/medical-ui-icons';
import { MedicationRefillReminderModal } from '@/components/medication-refill-reminder-modal';
import { MedicationStockEditModal } from '@/components/medication-stock-edit-modal';
import { MedicationStockModal } from '@/components/medication-stock-modal';
import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import { formatSectionTitle, weekButtonTextStyle, weekDayTitleStyle, weekServiceTextStyle } from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import {
  formatMedicationLabel,
  type MedicationCatalogEntry,
  wellnessStore,
} from '@/stores/wellness-store';

const HEADER_HEIGHT = 48;

type CatalogListTab = 'current' | 'completed';

type AllMedicationsLabels = AppLabels & {
  allMedicationsCurrent: string;
  allMedicationsCompleted: string;
};

type Props = {
  visible: boolean;
  labels: AllMedicationsLabels;
  onClose: () => void;
  onAddMedication: () => void;
  onOpenSchedule: (entry: MedicationCatalogEntry) => void;
  /** After create: open stock hub for this catalog entry. */
  initialStockCatalogId?: string | null;
  onInitialStockHandled?: () => void;
};

function loadVisibleMedicationEntries() {
  wellnessStore.refreshMedicationCatalog();
  return wellnessStore.visibleMedicationCatalog;
}

type ShellProps = Omit<Props, 'visible'>;

function AllMedicationsModalShell({
  labels,
  onClose,
  onAddMedication,
  onOpenSchedule,
  initialStockCatalogId,
  onInitialStockHandled,
}: ShellProps) {
  const { modal: theme, isDark } = useAppChromeTheme();
  const blurTargetRef = useRef<View | null>(null);
  const [initialState] = useState(() => {
    const initialEntries = loadVisibleMedicationEntries();
    const initialStockTarget = initialStockCatalogId
      ? initialEntries.find((entry) => entry.id === initialStockCatalogId) ?? null
      : null;
    return { entries: initialEntries, stockTarget: initialStockTarget };
  });
  const [entries, setEntries] = useState<MedicationCatalogEntry[]>(initialState.entries);
  const [stockTarget, setStockTarget] = useState<MedicationCatalogEntry | null>(initialState.stockTarget);
  const [showStockEdit, setShowStockEdit] = useState(initialState.stockTarget !== null);
  const [showRefillReminder, setShowRefillReminder] = useState(false);
  const [listTab, setListTab] = useState<CatalogListTab>('current');

  const loadEntries = useCallback(() => {
    setEntries(loadVisibleMedicationEntries());
  }, []);

  useEffect(() => {
    if (!initialStockCatalogId) return;
    onInitialStockHandled?.();
  }, [initialStockCatalogId, onInitialStockHandled]);

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

  const visibleEntries = listTab === 'current' ? currentEntries : completedEntries;

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
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => onOpenSchedule(entry)}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: theme.inactiveBorder },
              pressed && styles.pressed,
            ]}>
            <ScheduleIcon size={22} color={theme.text} />
            <Text style={[styles.actionBtnText, { color: theme.inactiveText }]}>
              {formatSectionTitle(labels.medicationScheduleButton)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => setStockTarget(entry)}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: theme.inactiveBorder },
              pressed && styles.pressed,
            ]}>
            <MedicineBottleIcon size={22} color={theme.text} />
            <Text style={[styles.actionBtnText, { color: theme.inactiveText }]}>
              {formatSectionTitle(labels.medicationStockAndRefillButton)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal transparent visible animationType="slide" onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          {stockTarget ? (
            <MedicationStockModal
              embedded
              visible
              labels={labels}
              name={stockTarget.name}
              dose={stockTarget.dose}
              stockCount={stockTarget.stockCount}
              refillReminderCount={stockTarget.refillReminderCount}
              packageSize={stockTarget.packageSize}
              onClose={() => {
                setShowStockEdit(false);
                setShowRefillReminder(false);
                setStockTarget(null);
              }}
              onOpenStockEdit={() => setShowStockEdit(true)}
              onOpenRefillReminder={() => setShowRefillReminder(true)}
            />
          ) : (
            <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
              <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + 8 }]}>
                  {entries.length === 0 ? (
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      {labels.allMedicationsEmpty}
                    </Text>
                  ) : (
                    <>
                      <View
                        style={[
                          styles.listTabs,
                          {
                            backgroundColor: theme.sectionLabelBg,
                          },
                        ]}>
                        {(
                          [
                            { id: 'current' as const, label: labels.allMedicationsCurrent },
                            { id: 'completed' as const, label: labels.allMedicationsCompleted },
                          ] as const
                        ).map((tab) => {
                          const active = listTab === tab.id;
                          return (
                            <Pressable
                              key={tab.id}
                              onPress={() => setListTab(tab.id)}
                              accessibilityRole="tab"
                              accessibilityState={{ selected: active }}
                              style={({ pressed }) => [
                                styles.listTabBtn,
                                active && [
                                  styles.listTabBtnActive,
                                  {
                                    backgroundColor: '#8A9BD2',
                                    shadowOpacity: isDark ? 0.25 : 0.08,
                                  },
                                ],
                                pressed && styles.pressed,
                              ]}>
                              <Text
                                style={[
                                  styles.listTabLabel,
                                  { color: active ? '#FFFFFF' : theme.textSecondary },
                                ]}
                                numberOfLines={1}>
                                {tab.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {visibleEntries.length === 0 ? (
                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                          {labels.allMedicationsEmpty}
                        </Text>
                      ) : (
                        <View style={styles.section}>{visibleEntries.map(renderEntry)}</View>
                      )}
                    </>
                  )}
                </ScrollView>
              </BlurTargetView>

              <BlurView
                blurTarget={blurTargetRef}
                blurMethod="dimezisBlurViewSdk31Plus"
                intensity={42}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.headerGlass, { borderBottomColor: theme.subtlePanelBorder }]}>
                <View
                  style={[
                    styles.headerGlassTint,
                    { backgroundColor: isDark ? 'rgba(22,26,38,0.90)' : 'rgba(255,255,255,0.90)' },
                  ]}
                />
                <View style={styles.headerRow}>
                  <View style={styles.headerBtn} />
                  <Text style={[styles.title, { color: theme.text }]}>
                    {formatSectionTitle(labels.allMedicationsTitle)}
                  </Text>
                  <View style={styles.headerBtn} />
                </View>
              </BlurView>

              <View style={[styles.footer, { backgroundColor: theme.modalBg }]}>
                <Pressable
                  onPress={onAddMedication}
                  style={({ pressed }) => [
                    styles.addButton,
                    {
                      backgroundColor: theme.sectionLabelBg,
                      borderColor: theme.rowBorder,
                      shadowOpacity: theme.buttonShadow,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View
                    style={[
                      styles.addIconCircle,
                      { backgroundColor: theme.inactiveBg, borderColor: theme.activeBg },
                    ]}>
                    <Ionicons name="add" size={16} color={theme.activeBg} />
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
                  <Ionicons name="checkmark-circle" size={20} color={theme.activeText} />
                  <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <MedicationStockEditModal
        visible={showStockEdit && stockTarget !== null}
        labels={labels}
        initialRemaining={stockTarget?.stockCount}
        initialPackageSize={stockTarget?.packageSize}
        initialLastRefillCount={stockTarget?.lastRefillCount}
        initialLastRefillDateKey={stockTarget?.lastRefillDateKey}
        onClose={() => setShowStockEdit(false)}
        onSave={({ stockCount, packageSize, lastRefillCount, lastRefillDateKey }) => {
          if (!stockTarget) return;
          wellnessStore.updateMedicationCatalogEntry(stockTarget.id, {
            ...(stockCount !== undefined ? { stockCount } : {}),
            ...(packageSize !== undefined ? { packageSize } : {}),
            ...(lastRefillCount !== undefined ? { lastRefillCount } : {}),
            ...(lastRefillDateKey !== undefined ? { lastRefillDateKey } : {}),
          });
          loadEntries();
          setStockTarget((current) =>
            current
              ? {
                  ...current,
                  ...(stockCount !== undefined ? { stockCount } : {}),
                  ...(packageSize !== undefined ? { packageSize } : {}),
                  ...(lastRefillCount !== undefined ? { lastRefillCount } : {}),
                  ...(lastRefillDateKey !== undefined ? { lastRefillDateKey } : {}),
                }
              : current,
          );
          setShowStockEdit(false);
        }}
      />

      <MedicationRefillReminderModal
        visible={showRefillReminder && stockTarget !== null}
        labels={labels}
        initialEnabled={stockTarget?.refillReminderEnabled !== false}
        initialCount={stockTarget?.refillReminderCount}
        onClose={() => setShowRefillReminder(false)}
        onSave={({ refillReminderEnabled, refillReminderCount }) => {
          if (!stockTarget) return;
          wellnessStore.updateMedicationCatalogEntry(stockTarget.id, {
            refillReminderEnabled,
            refillReminderCount,
          });
          loadEntries();
          setStockTarget((current) =>
            current ? { ...current, refillReminderEnabled, refillReminderCount } : current,
          );
          setShowRefillReminder(false);
        }}
      />
    </>
  );
}

export function AllMedicationsModal({
  visible,
  labels,
  onClose,
  onAddMedication,
  onOpenSchedule,
  initialStockCatalogId,
  onInitialStockHandled,
}: Props) {
  if (!visible) return null;
  return (
    <AllMedicationsModalShell
      key="all-medications-open"
      labels={labels}
      onClose={onClose}
      onAddMedication={onAddMedication}
      onOpenSchedule={onOpenSchedule}
      initialStockCatalogId={initialStockCatalogId}
      onInitialStockHandled={onInitialStockHandled}
    />
  );
}

export function catalogEntryMedicationLabel(entry: MedicationCatalogEntry): string {
  return formatMedicationLabel(entry.name, entry.dose);
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    height: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 0,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  headerGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    overflow: 'hidden',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerGlassTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: HEADER_HEIGHT,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerBtn: { minWidth: 28, alignItems: 'flex-end' },
  title: { ...weekDayTitleStyle, textAlign: 'center' },
  blurTarget: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 14,
  },
  listTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: 3,
    gap: 0,
  },
  listTabBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listTabBtnActive: {
    shadowColor: '#000',
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  listTabLabel: {
    ...weekServiceTextStyle,
    fontSize: 13,
    letterSpacing: 0.2,
    textTransform: 'none',
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  emptyText: { fontSize: 12, textAlign: 'center', paddingVertical: 24 },
  section: { gap: 8 },
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
  actionRow: {
    flexDirection: 'column',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  actionBtnText: {
    ...weekButtonTextStyle,
    flex: 1,
    flexShrink: 1,
    textAlign: 'left',
  },
  footer: {
    flexGrow: 0,
    flexShrink: 0,
    zIndex: 3,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
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
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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

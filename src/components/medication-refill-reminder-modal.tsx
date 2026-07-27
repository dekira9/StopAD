import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
  dayMedicationsHeaderStyle,
  formatSectionTitle,
  weekBodyTextStyle,
  weekCardTitleStyle,
  weekServiceTextStyle,
} from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

export type MedicationRefillReminderSavePayload = {
  refillReminderEnabled: boolean;
  refillReminderCount?: number;
};

type Props = {
  visible: boolean;
  labels: AppLabels;
  initialEnabled?: boolean;
  initialCount?: number;
  onClose: () => void;
  onSave: (payload: MedicationRefillReminderSavePayload) => void;
};

type ContentProps = Omit<Props, 'visible'>;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function parseCount(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function MedicationRefillReminderModalContent({
  labels,
  initialEnabled = true,
  initialCount,
  onClose,
  onSave,
}: ContentProps) {
  const { modal: theme, chrome } = useAppChromeTheme();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [count, setCount] = useState(initialCount !== undefined ? String(initialCount) : '');

  return (
    <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
      <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: theme.subtlePanelBorder }]} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerSide} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {formatSectionTitle(labels.medicationStockRefillReminder)}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel={labels.done}
            style={({ pressed }) => [styles.headerSide, styles.headerSideEnd, pressed && styles.pressed]}>
            <Ionicons name="close" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View
            style={[
              styles.panel,
              { backgroundColor: chrome.notesBlockBg, borderColor: chrome.dayBorder },
            ]}>
            <View
              style={[
                styles.panelHeader,
                { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
              ]}>
              <Text style={styles.panelHeaderText}>
                {formatSectionTitle(labels.medicationStockRemindWhen)}
              </Text>
            </View>
            <View
              style={[
                styles.panelBody,
                {
                  backgroundColor: theme.inactiveBg,
                  borderColor: theme.rowBorder,
                  opacity: enabled ? 1 : 0.45,
                },
              ]}>
              <TextInput
                value={count}
                onChangeText={(value) => setCount(digitsOnly(value))}
                editable={enabled}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={5}
                placeholder="0"
                placeholderTextColor={theme.iconMuted}
                style={[styles.panelInput, { color: chrome.medicationFieldText }]}
              />
            </View>

            <View
              style={[
                styles.panelHeader,
                { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder },
              ]}>
              <Text style={styles.panelHeaderText}>
                {formatSectionTitle(labels.medicationStockRemind)}
              </Text>
            </View>
            <View style={[styles.reminderRow, { backgroundColor: theme.inactiveBg }]}>
              <View style={styles.reminderTextWrap}>
                <Text style={[styles.reminderStatus, { color: enabled ? theme.activeBg : theme.textSecondary }]}>
                  {enabled ? labels.medicationScheduleReminderOn : labels.medicationScheduleReminderOff}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: theme.inactiveBorder, true: theme.activeBg }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.inactiveBorder}
              />
            </View>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.subtlePanelBorder, backgroundColor: theme.modalBg }]}>
          <Pressable
            onPress={() =>
              onSave({
                refillReminderEnabled: enabled,
                refillReminderCount: parseCount(count),
              })
            }
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.activeBg,
                borderColor: theme.activeBg,
              },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.saveButtonText, { color: theme.activeText }]}>
              {labels.medicationStockSave}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MedicationRefillReminderModal({ visible, ...contentProps }: Props) {
  const key = `${contentProps.initialEnabled ? 'on' : 'off'}-${contentProps.initialCount ?? 'empty'}`;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={contentProps.onClose}>
      {visible ? <MedicationRefillReminderModalContent key={key} {...contentProps} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 4,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerSide: { minWidth: 36 },
  headerSideEnd: { alignItems: 'flex-end' },
  title: {
    ...weekCardTitleStyle,
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  panelHeaderText: {
    ...dayMedicationsHeaderStyle,
  },
  panelBody: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  panelInput: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reminderTextWrap: {
    flex: 1,
  },
  reminderStatus: {
    ...weekServiceTextStyle,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: 12,
    fontFamily: Fonts.sansExtraBold,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.7,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
  formatSectionTitle,
  weekBodyTextStyle,
  weekCardTitleStyle,
  weekServiceTextStyle,
} from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

/** Resize pills-remaining.png here (numeric px). */
const PILLS_REMAINING_WIDTH = 130;
const PILLS_REMAINING_HEIGHT = 115;

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
          <Image
            source={require('@/assets/images/schedule-reminder-decor.png')}
            style={styles.headerDecor}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.headerTextWrap}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
              {formatSectionTitle(labels.medicationStockRefillReminder)}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {labels.medicationStockRefillReminderHint}
            </Text>
          </View>
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
              styles.thresholdCard,
              {
                opacity: enabled ? 1 : 0.45,
                minHeight: PILLS_REMAINING_HEIGHT + 12,
              },
            ]}>
            <Image
              source={require('@/assets/images/pills-remaining.png')}
              style={{
                position: 'absolute',
                left: 0,
                top: '56%',
                width: PILLS_REMAINING_WIDTH,
                height: PILLS_REMAINING_HEIGHT,
                marginTop: -PILLS_REMAINING_HEIGHT / 2,
              }}
              contentFit="fill"
              accessibilityIgnoresInvertColors
            />
            <View style={[styles.thresholdFields, { marginLeft: PILLS_REMAINING_WIDTH - 4 }]}>
              <Text style={[styles.thresholdLabel, { color: theme.text }]}>
                {labels.medicationStockRemindWhen}
              </Text>
              <View style={styles.thresholdInputRow}>
                <TextInput
                  value={count}
                  onChangeText={(value) => setCount(digitsOnly(value))}
                  editable={enabled}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="0"
                  placeholderTextColor={theme.iconMuted}
                  style={[styles.thresholdInput, { color: theme.text, borderColor: theme.rowBorder }]}
                />
                <Text style={[styles.thresholdUnit, { color: chrome.medicationFieldText }]}>
                  {labels.medicationStockIntakes}
                </Text>
              </View>
              <Text style={[styles.thresholdHint, { color: theme.textSecondary }]}>
                {labels.medicationStockEnterNumber}
              </Text>
            </View>
          </View>

          <View style={[styles.remindCard, { backgroundColor: '#FCF6F2' }]}>
            <View style={styles.remindHeader}>
              <Image
                source={require('@/assets/images/reminder.png')}
                style={styles.remindIcon}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
              <Text style={[styles.thresholdLabel, { color: theme.text, textAlign: 'left' }]}>
                {formatSectionTitle(labels.medicationStockRemind)}
              </Text>
            </View>
            <View style={styles.remindInner}>
              <Text style={[styles.reminderStatus, { color: enabled ? theme.activeBg : theme.textSecondary }]}>
                {enabled ? labels.medicationScheduleReminderOn : labels.medicationScheduleReminderOff}
              </Text>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: theme.inactiveBorder, true: theme.activeBg }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.inactiveBorder}
              />
            </View>
            {enabled ? (
              <Text style={[styles.remindScreenHint, { color: theme.textSecondary }]}>
                {labels.medicationStockRemindScreenHint}
              </Text>
            ) : null}
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
                shadowOpacity: theme.buttonShadow,
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
    paddingBottom: 10,
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
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerDecor: {
    width: 64,
    height: 64,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerSide: { minWidth: 28 },
  headerSideEnd: { alignItems: 'flex-end' },
  title: {
    ...weekCardTitleStyle,
    fontWeight: '700',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'left',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  thresholdCard: {
    position: 'relative',
    backgroundColor: '#F3F0FF',
    borderRadius: 18,
    paddingRight: 12,
    paddingVertical: 10,
    overflow: 'visible',
  },
  thresholdFields: {
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  thresholdLabel: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  thresholdInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  thresholdInput: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 72,
    maxWidth: 100,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 28,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  thresholdUnit: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
    lineHeight: 18,
  },
  thresholdHint: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
  remindCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  remindHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remindIcon: {
    width: 46,
    height: 46,
  },
  remindInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  reminderStatus: {
    ...weekServiceTextStyle,
    flex: 1,
  },
  remindScreenHint: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '500',
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 48,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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

import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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

export type MedicationStockEditSavePayload = {
  stockCount: number;
  packageSize?: number;
};

type Props = {
  visible: boolean;
  labels: AppLabels;
  initialRemaining?: number;
  initialPackageSize?: number;
  onClose: () => void;
  onSave: (payload: MedicationStockEditSavePayload) => void;
};

type ContentProps = Omit<Props, 'visible'>;

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function parseCount(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function MedicationStockEditModalContent({
  labels,
  initialRemaining,
  initialPackageSize,
  onClose,
  onSave,
}: ContentProps) {
  const { modal: theme, chrome } = useAppChromeTheme();
  const [remaining, setRemaining] = useState(
    initialRemaining !== undefined ? String(initialRemaining) : '',
  );
  const [refill, setRefill] = useState('');
  const [packageSize, setPackageSize] = useState(
    initialPackageSize !== undefined ? String(initialPackageSize) : '',
  );

  const total = useMemo(() => parseCount(remaining) + parseCount(refill), [remaining, refill]);
  const hasStockInput = remaining.trim() !== '' || refill.trim() !== '';
  const hasPackageInput = packageSize.trim() !== '';
  const canSave = hasStockInput || hasPackageInput || initialRemaining !== undefined;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
      <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
        <View style={styles.handleWrap}>
          <View style={[styles.handle, { backgroundColor: theme.subtlePanelBorder }]} />
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerSide} />
          <Text style={[styles.title, { color: theme.text }]}>
            {formatSectionTitle(labels.medicationStockButton)}
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
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{labels.medicationStockDoseHint}</Text>

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
                {formatSectionTitle(labels.medicationStockRemaining)}
              </Text>
            </View>
            <View style={[styles.panelBody, { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder }]}>
              <TextInput
                value={remaining}
                onChangeText={(value) => setRemaining(digitsOnly(value))}
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
                {formatSectionTitle(labels.medicationStockRefill)}
              </Text>
            </View>
            <View style={[styles.panelBody, { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder }]}>
              <TextInput
                value={refill}
                onChangeText={(value) => setRefill(digitsOnly(value))}
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
                {formatSectionTitle(labels.medicationStockPackageSize)}
              </Text>
            </View>
            <View style={[styles.panelBody, { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder }]}>
              <TextInput
                value={packageSize}
                onChangeText={(value) => setPackageSize(digitsOnly(value))}
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
                {formatSectionTitle(labels.medicationStockTotal)}
              </Text>
            </View>
            <View style={[styles.panelBodyLast, { backgroundColor: theme.inactiveBg }]}>
              <Text style={[styles.totalValue, { color: chrome.medicationFieldText }]}>
                {hasStockInput ? total : (initialRemaining ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.subtlePanelBorder, backgroundColor: theme.modalBg }]}>
          <Pressable
            onPress={() => {
              if (!canSave) return;
              onSave({
                stockCount: hasStockInput ? total : (initialRemaining ?? 0),
                packageSize: hasPackageInput ? parseCount(packageSize) : initialPackageSize,
              });
            }}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.activeBg,
                borderColor: theme.activeBg,
                opacity: canSave ? 1 : 0.45,
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

export function MedicationStockEditModal({ visible, ...contentProps }: Props) {
  const key = `${contentProps.initialRemaining ?? 'empty'}-${contentProps.initialPackageSize ?? 'pack'}`;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={contentProps.onClose}>
      {visible ? <MedicationStockEditModalContent key={key} {...contentProps} /> : null}
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
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  hint: {
    ...weekServiceTextStyle,
    letterSpacing: 0,
    lineHeight: 18,
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
  panelBodyLast: {
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
  totalValue: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '700',
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

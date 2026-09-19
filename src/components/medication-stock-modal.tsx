import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MedicineBottleIcon, PillIcon } from '@/components/medical-ui-icons';
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

const RESERVE_MED_SIZE = 120;
const CARD_PADDING_BOTTOM = 24;

type Props = {
  visible: boolean;
  embedded?: boolean;
  labels: AppLabels;
  name: string;
  dose: string;
  stockCount?: number;
  refillReminderCount?: number;
  packageSize?: number;
  onClose: () => void;
  onOpenStockEdit: () => void;
  onOpenRefillReminder: () => void;
};

type ContentProps = Omit<Props, 'visible' | 'embedded'>;

function formatPillsLeft(labels: AppLabels, count: number | undefined): string {
  if (count === undefined || Number.isNaN(count)) {
    return labels.medicationStockNotSet;
  }
  return labels.medicationStockPillsLeft.replace('{n}', String(count));
}

function formatStockHint(labels: AppLabels, stockCount?: number, packageSize?: number): string {
  const remaining = formatPillsLeft(labels, stockCount);
  if (typeof packageSize !== 'number' || packageSize <= 0) return remaining;
  const pack = labels.medicationStockPackageHint.replace('{n}', String(packageSize));
  if (stockCount === undefined) return pack;
  return `${remaining} · ${pack}`;
}

function MedicationStockModalContent({
  labels,
  name,
  dose,
  stockCount,
  refillReminderCount,
  packageSize,
  onClose,
  onOpenStockEdit,
  onOpenRefillReminder,
}: ContentProps) {
  const { modal: theme, chrome } = useAppChromeTheme();
  const insets = useSafeAreaInsets();
  const medName = name.trim() || labels.medicationName;
  const doseLabel = dose.trim();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.modalBg,
          borderColor: theme.subtlePanelBorder,
          paddingBottom: CARD_PADDING_BOTTOM + insets.bottom,
        },
      ]}>
      <View style={styles.handleWrap}>
        <View style={[styles.handle, { backgroundColor: theme.subtlePanelBorder }]} />
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerSide} />
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {formatSectionTitle(labels.medicationStockAndRefillButton)}
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
        <View style={[styles.identityBody, { backgroundColor: theme.inactiveBg }]}>
          <Image
            source={require('@/assets/images/reservemed.png')}
            style={styles.reserveMedImage}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.identityTextWrap}>
            <Text style={[styles.identityName, { color: chrome.medicationFieldText }]} numberOfLines={2}>
              {medName}
            </Text>
            {doseLabel ? (
              <Text style={[styles.identityDose, { color: theme.textSecondary }]} numberOfLines={1}>
                {doseLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.panel,
            { backgroundColor: chrome.notesBlockBg, borderColor: chrome.dayBorder },
          ]}>
          <Pressable
            onPress={onOpenStockEdit}
            style={({ pressed }) => [
              styles.sheetRow,
              { backgroundColor: theme.inactiveBg, borderColor: theme.rowBorder },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={labels.medicationStockButton}>
            <MedicineBottleIcon size={22} color={theme.text} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{formatSectionTitle(labels.medicationStockButton)}</Text>
              <Text style={[styles.rowHint, { color: theme.textSecondary }]}>
                {formatStockHint(labels, stockCount, packageSize)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onOpenRefillReminder}
            style={({ pressed }) => [
              styles.sheetRowLast,
              { backgroundColor: theme.inactiveBg },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={labels.medicationStockRefillReminder}>
            <PillIcon size={22} color={theme.text} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>
                {formatSectionTitle(labels.medicationStockRefillReminder)}
              </Text>
              <Text style={[styles.rowHint, { color: theme.textSecondary }]}>
                {formatPillsLeft(labels, refillReminderCount)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function MedicationStockModal({ visible, embedded = false, ...contentProps }: Props) {
  const { modal: theme } = useAppChromeTheme();

  if (embedded) {
    if (!visible) return null;
    return <MedicationStockModalContent {...contentProps} />;
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={contentProps.onClose}>
      {visible ? (
        <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
          <MedicationStockModalContent {...contentProps} />
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 4,
    paddingBottom: CARD_PADDING_BOTTOM,
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
  headerSide: {
    minWidth: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerSideEnd: {
    alignItems: 'flex-end',
  },
  title: {
    ...weekCardTitleStyle,
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  identityBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  identityTextWrap: {
    flexShrink: 1,
    gap: 2,
    minWidth: 0,
  },
  identityName: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  identityDose: {
    ...weekServiceTextStyle,
    textAlign: 'center',
  },
  reserveMedImage: {
    width: RESERVE_MED_SIZE,
    height: RESERVE_MED_SIZE,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sheetRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...dayMedicationsHeaderStyle,
  },
  rowHint: {
    ...weekServiceTextStyle,
  },
  pressed: {
    opacity: 0.7,
  },
});

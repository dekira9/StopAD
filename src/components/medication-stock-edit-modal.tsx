import { Ionicons } from '@expo/vector-icons';
import { format, parse } from 'date-fns';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { LANGUAGES } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import {
  dayMedicationsHeaderStyle,
  formatSectionTitle,
  weekBodyTextStyle,
  weekCardTitleStyle,
  weekServiceTextStyle,
} from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import { wellnessStore } from '@/stores/wellness-store';
import { formatDayMonth } from '@/utils/date-format';

const RESERVE_DECOR_WIDTH = 110;
const RESERVE_DECOR_HEIGHT = 110;

export type MedicationStockEditSavePayload = {
  stockCount?: number;
  packageSize?: number;
  /** Present only when the user entered a refill amount > 0. */
  lastRefillCount?: number;
  lastRefillDateKey?: string;
};

type Props = {
  visible: boolean;
  labels: AppLabels;
  initialRemaining?: number;
  initialPackageSize?: number;
  initialLastRefillCount?: number;
  initialLastRefillDateKey?: string;
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
  initialLastRefillCount,
  initialLastRefillDateKey,
  onClose,
  onSave,
}: ContentProps) {
  const { modal: theme, chrome: ui } = useAppChromeTheme();
  const language = wellnessStore.preferredLanguage ?? 'en';
  const locale = LANGUAGES[language].locale;
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

  const lastRefillHint = useMemo(() => {
    if (
      typeof initialLastRefillCount !== 'number' ||
      initialLastRefillCount <= 0 ||
      !initialLastRefillDateKey
    ) {
      return null;
    }
    const date = parse(initialLastRefillDateKey, 'yyyy-MM-dd', new Date());
    if (Number.isNaN(date.getTime())) return null;
    return labels.medicationStockLastRefill
      .replace('{n}', String(initialLastRefillCount))
      .replace('{date}', formatDayMonth(date, locale));
  }, [initialLastRefillCount, initialLastRefillDateKey, labels.medicationStockLastRefill, locale]);

  return (
    <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
      <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
        <View style={styles.headerChrome}>
          <View
            style={[
              styles.headerSurface,
              { backgroundColor: theme.modalBg, borderBottomColor: theme.subtlePanelBorder },
            ]}>
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
          </View>
          <View pointerEvents="none" style={styles.headerDownShadow}>
            <View style={[styles.headerDownShadowBand, { bottom: -2, opacity: ui.panelEdgeShadow * 1.3 }]} />
            <View style={[styles.headerDownShadowBand, { bottom: -4, opacity: ui.panelEdgeShadow * 0.9 }]} />
            <View style={[styles.headerDownShadowBand, { bottom: -6, opacity: ui.panelEdgeShadow * 0.55 }]} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hintRow}>
            <Image
              source={require('@/assets/images/dose1.png')}
              style={styles.hintDecor}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {labels.medicationStockDoseHint}
            </Text>
          </View>

          <View
            style={[
              styles.remainingCard,
              { minHeight: RESERVE_DECOR_HEIGHT + 12 },
            ]}>
            <Image
              source={require('@/assets/images/medication-reserve-decor-soft.png')}
              style={styles.remainingDecor}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.remainingFields}>
              <Text style={[styles.remainingLabel, { color: theme.text }]}>
                {formatSectionTitle(labels.medicationStockRemaining)}
              </Text>
              <TextInput
                value={remaining}
                onChangeText={(value) => setRemaining(digitsOnly(value))}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={5}
                placeholder="0"
                placeholderTextColor={theme.iconMuted}
                style={[
                  styles.remainingInput,
                  { color: ui.medicationFieldText, borderColor: theme.rowBorder },
                ]}
              />
            </View>
          </View>

          <View
            style={[
              styles.remainingCard,
              {
                minHeight: RESERVE_DECOR_HEIGHT + 12,
                backgroundColor: '#F3FAF6',
              },
            ]}>
            <Image
              source={require('@/assets/images/med-refill-green.png')}
              style={styles.remainingDecor}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.remainingFields}>
              <Text style={[styles.remainingLabel, { color: theme.text }]}>
                {formatSectionTitle(labels.medicationStockRefill)}
              </Text>
              <View style={styles.refillInputWrap}>
                {!refill.trim() ? (
                  <Text
                    pointerEvents="none"
                    style={[styles.refillPlusPlaceholder, { color: theme.iconMuted }]}>
                    +
                  </Text>
                ) : null}
                <TextInput
                  value={refill}
                  onChangeText={(value) => setRefill(digitsOnly(value))}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={5}
                  style={[
                    styles.remainingInput,
                    { color: ui.medicationFieldText, borderColor: theme.rowBorder },
                  ]}
                />
              </View>
              {lastRefillHint ? (
                <Text style={[styles.lastRefillHint, { color: theme.textSecondary }]}>
                  {lastRefillHint}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.remainingCard,
              {
                minHeight: RESERVE_DECOR_HEIGHT + 12,
                backgroundColor: '#F3F8FC',
              },
            ]}>
            <Image
              source={require('@/assets/images/medication-blister-mint-blue5.png')}
              style={styles.remainingDecor}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.remainingFields}>
              <Text style={[styles.remainingLabel, { color: theme.text }]}>
                {formatSectionTitle(labels.medicationStockPackageSize)}
              </Text>
              <TextInput
                value={packageSize}
                onChangeText={(value) => setPackageSize(digitsOnly(value))}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={5}
                placeholder="0"
                placeholderTextColor={theme.iconMuted}
                style={[
                  styles.remainingInput,
                  { color: ui.medicationFieldText, borderColor: theme.rowBorder },
                ]}
              />
            </View>
          </View>

          <View
            style={[
              styles.panel,
              styles.totalRow,
              {
                backgroundColor: theme.sectionLabelBg,
                borderColor: ui.dayBorder,
              },
            ]}>
            <Text style={[styles.panelHeaderText, { color: theme.text }]}>
              {formatSectionTitle(labels.medicationStockTotal)}
            </Text>
            <Text style={[styles.totalValue, { color: ui.medicationFieldText }]}>
              {hasStockInput ? total : (initialRemaining ?? 0)}
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footerChrome,
            { borderColor: theme.subtlePanelBorder, backgroundColor: theme.modalBg },
          ]}>
          <View pointerEvents="none" style={styles.footerUpShadow}>
            <View style={[styles.footerUpShadowBand, { top: -2, opacity: ui.panelEdgeShadow * 1.3 }]} />
            <View style={[styles.footerUpShadowBand, { top: -4, opacity: ui.panelEdgeShadow * 0.9 }]} />
            <View style={[styles.footerUpShadowBand, { top: -6, opacity: ui.panelEdgeShadow * 0.55 }]} />
          </View>
          <View style={[styles.footer, { shadowOpacity: ui.panelEdgeShadow }]}>
          <Pressable
            onPress={() => {
              if (!canSave) return;
              const refillCount = parseCount(refill);
              onSave({
                // Keep existing remaining when user only edits package size.
                stockCount: hasStockInput ? total : initialRemaining,
                packageSize: hasPackageInput ? parseCount(packageSize) : initialPackageSize,
                ...(refillCount > 0
                  ? {
                      lastRefillCount: refillCount,
                      lastRefillDateKey: format(new Date(), 'yyyy-MM-dd'),
                    }
                  : {}),
              });
            }}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: theme.activeBg,
                borderColor: theme.activeBg,
                shadowOpacity: theme.buttonShadow,
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
    </View>
  );
}

export function MedicationStockEditModal({ visible, ...contentProps }: Props) {
  const key = `${contentProps.initialRemaining ?? 'empty'}-${contentProps.initialPackageSize ?? 'pack'}-${contentProps.initialLastRefillCount ?? 'norefill'}-${contentProps.initialLastRefillDateKey ?? 'nodate'}`;

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
    flexShrink: 1,
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
  headerChrome: {
    position: 'relative',
    zIndex: 2,
  },
  headerSurface: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDownShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    zIndex: 1,
  },
  headerDownShadowBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
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
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintDecor: {
    width: 60,
    height: 60,
  },
  hint: {
    ...weekServiceTextStyle,
    flex: 1,
    letterSpacing: 0,
    lineHeight: 18,
  },
  remainingCard: {
    position: 'relative',
    justifyContent: 'center',
    backgroundColor: '#F3F0FF',
    borderRadius: 18,
    paddingRight: 12,
    paddingVertical: 10,
    overflow: 'visible',
  },
  remainingDecor: {
    position: 'absolute',
    left: 2,
    top: '60%',
    width: RESERVE_DECOR_WIDTH,
    height: RESERVE_DECOR_HEIGHT,
    transform: [{ translateY: -RESERVE_DECOR_HEIGHT / 2 }],
  },
  remainingFields: {
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    marginLeft: RESERVE_DECOR_WIDTH - 4,
  },
  remainingLabel: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  lastRefillHint: {
    ...weekServiceTextStyle,
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 16,
  },
  remainingInput: {
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
  refillInputWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refillPlusPlaceholder: {
    position: 'absolute',
    zIndex: 1,
    fontSize: 40,
    lineHeight: 44,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  panel: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  panelHeaderText: {
    ...dayMedicationsHeaderStyle,
    flexShrink: 1,
  },
  totalValue: {
    ...weekBodyTextStyle,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '700',
  },
  footerChrome: {
    position: 'relative',
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 3,
  },
  footerUpShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    zIndex: 1,
  },
  footerUpShadowBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
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

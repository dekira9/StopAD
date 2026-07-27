import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BellOnIcon, ScheduleIcon } from '@/components/medical-ui-icons';
import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

type Props = {
  visible: boolean;
  labels: AppLabels;
  onClose: () => void;
};

type LegendRowProps = {
  icon: ReactNode;
  text: string;
  textColor: string;
  iconWrapStyle?: object;
};

function LegendRow({ icon, text, textColor, iconWrapStyle }: LegendRowProps) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendIconWrap, iconWrapStyle]}>{icon}</View>
      <Text style={[styles.legendText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export function MedicationIntakeLegendModal({ visible, labels, onClose }: Props) {
  const { modal: theme } = useAppChromeTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
          onPress={() => {}}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.medicationIntakeLegendTitle}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <LegendRow
            icon={<BellOnIcon size={24} color={theme.text} />}
            text={labels.medicationIntakeLegendBell}
            textColor={theme.text}
          />
          <LegendRow
            icon={<ScheduleIcon size={24} color={theme.text} />}
            text={labels.medicationScheduleButton}
            textColor={theme.text}
          />
          <LegendRow
            icon={
              <View style={[styles.takeButtonSample, { backgroundColor: theme.sectionLabelBg, borderColor: theme.rowBorder }]}>
                <Text style={[styles.takeButtonSampleText, { color: theme.textSecondary }]} numberOfLines={1}>
                  {labels.medicationTake}
                </Text>
              </View>
            }
            text={labels.medicationIntakeLegendCheck}
            textColor={theme.text}
            iconWrapStyle={styles.takeButtonIconWrap}
          />
          <LegendRow
            icon={
              <Text style={[styles.legendTimeSample, { color: theme.textSecondary }]} numberOfLines={1}>
                12:30
              </Text>
            }
            text={labels.medicationIntakeLegendTime}
            textColor={theme.text}
            iconWrapStyle={styles.timeSampleIconWrap}
          />
          <LegendRow
            icon={<Text style={[styles.legendNumberSample, { color: theme.textSecondary }]}>3</Text>}
            text={labels.medicationIntakeLegendNumber}
            textColor={theme.text}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  legendIconWrap: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  takeButtonIconWrap: {
    width: 72,
  },
  timeSampleIconWrap: {
    width: 40,
  },
  takeButtonSample: {
    minHeight: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignSelf: 'stretch',
  },
  takeButtonSampleText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemiBold,
    lineHeight: 14,
    textAlign: 'center',
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  legendTimeSample: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    lineHeight: 14,
    textAlign: 'center',
  },
  legendNumberSample: {
    fontSize: 18,
    fontFamily: Fonts.mono,
    lineHeight: 22,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  modalOverlay: string;
  modalBg: string;
  subtlePanelBorder: string;
};

type LegendLabels = AppLabels & {
  medicationIntakeLegendSchedule: string;
  medicationIntakeLegendSetTime: string;
};

type Props = {
  visible: boolean;
  labels: LegendLabels;
  theme: ThemeSlice;
  onClose: () => void;
};

type LegendRowProps = {
  icon: ReactNode;
  text: string;
  textColor: string;
};

function LegendRow({ icon, text, textColor }: LegendRowProps) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendIconWrap}>{icon}</View>
      <Text style={[styles.legendText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export function MedicationIntakeLegendModal({ visible, labels, theme, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
          onPress={() => {}}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.medicationIntakeLegendTitle}</Text>

          <LegendRow
            icon={<Ionicons name="notifications-outline" size={28} color={theme.text} />}
            text={labels.medicationIntakeLegendBell}
            textColor={theme.text}
          />
          <LegendRow
            icon={<Ionicons name="time-outline" size={28} color={theme.text} />}
            text={labels.medicationIntakeLegendSetTime}
            textColor={theme.text}
          />
          <LegendRow
            icon={
              <View style={[styles.checkboxIcon, { backgroundColor: theme.activeBg, borderColor: theme.activeBg }]}>
                <Ionicons name="checkmark" size={14} color={theme.activeText} />
              </View>
            }
            text={labels.medicationIntakeLegendCheck}
            textColor={theme.text}
          />
          <LegendRow
            icon={<View style={[styles.checkboxIcon, styles.checkboxIconEmpty, { borderColor: theme.activeBg }]} />}
            text={labels.medicationIntakeLegendSchedule}
            textColor={theme.text}
          />
          <LegendRow
            icon={<Text style={[styles.legendTimeSample, { color: theme.textSecondary }]}>12:30</Text>}
            text={labels.medicationIntakeLegendTime}
            textColor={theme.text}
          />
          <LegendRow
            icon={<Text style={[styles.legendNumberSample, { color: theme.textSecondary }]}>3</Text>}
            text={labels.medicationIntakeLegendNumber}
            textColor={theme.text}
          />

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneButton,
              { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
          </Pressable>
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
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
  checkboxIcon: {
    width: 20,
    height: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIconEmpty: {
    backgroundColor: 'transparent',
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  legendTimeSample: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    lineHeight: 10,
  },
  legendNumberSample: {
    fontSize: 18,
    fontFamily: Fonts.mono,
    lineHeight: 22,
    fontWeight: '700',
  },
  doneButton: {
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

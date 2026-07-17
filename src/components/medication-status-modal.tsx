import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

type Props = {
  visible: boolean;
  labels: AppLabels;
  onClose: () => void;
  onSelectTaken: () => void;
  onSelectSkipped: () => void;
  onSelectCleared: () => void;
  onOpenSchedule: () => void;
};

export function MedicationStatusModal({
  visible,
  labels,
  onClose,
  onSelectTaken,
  onSelectSkipped,
  onSelectCleared,
  onOpenSchedule,
}: Props) {
  const { modal: theme } = useAppChromeTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
          onPress={() => {}}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.medicationStatusTitle}</Text>

          <Pressable
            onPress={onSelectTaken}
            style={({ pressed }) => [
              styles.optionRow,
              { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="checkmark" size={18} color={theme.activeText} />
            <Text style={[styles.optionText, { color: theme.activeText }]}>{labels.medicationTaken}</Text>
          </Pressable>

          <Pressable
            onPress={onSelectSkipped}
            style={({ pressed }) => [
              styles.optionRow,
              { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="close" size={18} color="#ef4444" />
            <Text style={[styles.optionText, { color: theme.inactiveText }]}>{labels.medicationSkipped}</Text>
          </Pressable>

          <Pressable
            onPress={onSelectCleared}
            style={({ pressed }) => [
              styles.optionRow,
              { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="remove-circle-outline" size={18} color={theme.text} />
            <Text style={[styles.optionText, { color: theme.inactiveText }]}>{labels.medicationUnmark}</Text>
          </Pressable>

          <Pressable
            onPress={onOpenSchedule}
            style={({ pressed }) => [
              styles.optionRow,
              { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="calendar-outline" size={18} color={theme.text} />
            <Text style={[styles.optionText, { color: theme.inactiveText }]}>{labels.medicationScheduleButton}</Text>
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
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  doneButton: {
    marginTop: 4,
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

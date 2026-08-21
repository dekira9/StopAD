import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

export type MedicationStatusChoice = 'taken' | 'skipped' | 'cleared';

type Props = {
  visible: boolean;
  labels: AppLabels;
  /** Current mark on the row when the modal opens. */
  initialStatus?: MedicationStatusChoice | null;
  onClose: () => void;
  onConfirm: (status: MedicationStatusChoice) => void;
};

export function MedicationStatusModal({
  visible,
  labels,
  initialStatus = null,
  onClose,
  onConfirm,
}: Props) {
  const { modal: theme } = useAppChromeTheme();
  const [selected, setSelected] = useState<MedicationStatusChoice | null>(initialStatus ?? null);

  useEffect(() => {
    if (visible) {
      setSelected(initialStatus ?? null);
    }
  }, [visible, initialStatus]);

  const optionStyle = (value: MedicationStatusChoice) => {
    const isSelected = selected === value;
    return [
      styles.optionRow,
      {
        backgroundColor: isSelected ? theme.activeBg : theme.inactiveBg,
        borderColor: isSelected ? theme.activeBg : theme.inactiveBorder,
      },
    ];
  };

  const optionTextColor = (value: MedicationStatusChoice) =>
    selected === value ? theme.activeText : theme.inactiveText;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
          onPress={() => {}}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{labels.medicationStatusTitle}</Text>

          <Pressable
            onPress={() => setSelected('taken')}
            style={({ pressed }) => [...optionStyle('taken'), pressed && styles.pressed]}>
            <Ionicons
              name="checkmark"
              size={18}
              color={selected === 'taken' ? theme.activeText : theme.activeBg}
            />
            <Text style={[styles.optionText, { color: optionTextColor('taken') }]}>
              {labels.medicationTaken}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelected('skipped')}
            style={({ pressed }) => [...optionStyle('skipped'), pressed && styles.pressed]}>
            <Ionicons
              name="close"
              size={18}
              color={selected === 'skipped' ? theme.activeText : '#ef4444'}
            />
            <Text style={[styles.optionText, { color: optionTextColor('skipped') }]}>
              {labels.medicationSkipped}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelected('cleared')}
            style={({ pressed }) => [...optionStyle('cleared'), pressed && styles.pressed]}>
            <Ionicons
              name="remove-circle-outline"
              size={18}
              color={selected === 'cleared' ? theme.activeText : theme.text}
            />
            <Text style={[styles.optionText, { color: optionTextColor('cleared') }]}>
              {labels.medicationUnmark}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (selected) {
                onConfirm(selected);
              } else {
                onClose();
              }
            }}
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
    borderRadius: 999,
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

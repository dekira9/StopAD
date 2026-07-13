import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Colors } from '@/constants/theme';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  modalOverlay: string;
  modalBg: string;
  subtlePanelBorder: string;
};

type Props = {
  visible: boolean;
  title: string;
  labels: AppLabels;
  theme: ThemeSlice;
  initialTime: string;
  onClose: () => void;
  onSelect: (time: string) => void;
};

export function parseTimeValue(time: string): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  const value = new Date();
  if (!match) return value;
  value.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return value;
}

export function formatTimeValue(date: Date): string {
  return format(date, 'HH:mm');
}

type ContentProps = Omit<Props, 'visible'>;

function MedicationTimePickerModalContent({
  title,
  labels,
  theme,
  initialTime,
  onClose,
  onSelect,
}: ContentProps) {
  const [pickerValue, setPickerValue] = useState(() => parseTimeValue(initialTime));

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={pickerValue}
        mode="time"
        is24Hour
        display="default"
        onValueChange={(_, date) => {
          onSelect(formatTimeValue(date));
          onClose();
        }}
        onDismiss={onClose}
      />
    );
  }

  return (
      <Pressable style={[styles.overlay, { backgroundColor: theme.modalOverlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}
          onPress={() => {}}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <DateTimePicker
            value={pickerValue}
            mode="time"
            display="spinner"
            is24Hour
            themeVariant={theme.modalBg === Colors.light.background || theme.modalBg === '#FFFFFF' ? 'light' : 'dark'}
            onValueChange={(_, date) => setPickerValue(date)}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.actionButton, { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder }]}>
              <Text style={[styles.actionText, { color: theme.inactiveText }]}>{labels.repeatCancel}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSelect(formatTimeValue(pickerValue));
                onClose();
              }}
              style={[styles.actionButton, { backgroundColor: theme.activeBg, borderColor: theme.activeBg }]}>
              <Text style={[styles.actionText, { color: theme.activeText }]}>{labels.repeatApply}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
  );
}

export function MedicationTimePickerModal({ visible, ...contentProps }: Props) {
  if (Platform.OS === 'android') {
    return visible ? <MedicationTimePickerModalContent key={contentProps.initialTime} {...contentProps} /> : null;
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={contentProps.onClose}>
      {visible ? <MedicationTimePickerModalContent key={contentProps.initialTime} {...contentProps} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', flex: 1 },
  closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  actionText: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  pressed: { opacity: 0.7 },
});

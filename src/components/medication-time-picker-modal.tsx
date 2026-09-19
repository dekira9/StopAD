import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { Colors } from '@/constants/theme';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

type Props = {
  visible: boolean;
  /** Render inside a parent Modal (required on iOS — stacked Modals do not receive touches). */
  embedded?: boolean;
  title: string;
  labels: AppLabels;
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

type ContentProps = Omit<Props, 'visible' | 'embedded'>;

function MedicationTimePickerModalContent({
  title,
  labels,
  initialTime,
  onClose,
  onSelect,
}: ContentProps) {
  const { modal: theme } = useAppChromeTheme();
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

          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={pickerValue}
              mode="time"
              display="spinner"
              is24Hour
              themeVariant={theme.modalBg === Colors.light.background || theme.modalBg === '#FFFFFF' ? 'light' : 'dark'}
              onValueChange={(_, date) => setPickerValue(date)}
              style={styles.picker}
            />
          </View>

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

export function MedicationTimePickerModal({ visible, embedded = false, ...contentProps }: Props) {
  if (!visible) return null;

  const content = (
    <MedicationTimePickerModalContent key={contentProps.initialTime} {...contentProps} />
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{content}</View>;
  }

  if (Platform.OS === 'android') {
    return content;
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={contentProps.onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
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
  pickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 216,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 216,
  },
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

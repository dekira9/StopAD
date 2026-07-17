import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppLabels } from '@/constants/i18n';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

type Props = {
  visible: boolean;
  labels: AppLabels;
  onClose: () => void;
};

const STEPS = ['panicAttackStep1', 'panicAttackStep2', 'panicAttackStep3', 'panicAttackStep4', 'panicAttackStep5'] as const;

export function PanicAttackModal({ visible, labels, onClose }: Props) {
  const { modal: theme } = useAppChromeTheme();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View style={[styles.card, { backgroundColor: theme.modalBg, borderColor: theme.subtlePanelBorder }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerBtn} />
            <Text style={[styles.title, { color: theme.text }]}>{labels.panicAttackButton}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.reassurance, { color: theme.text }]}>{labels.panicAttackReassurance}</Text>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary, backgroundColor: theme.sectionLabelBg }]}>
              {labels.panicAttackDoThis1}
            </Text>
            {STEPS.map((key, idx) => (
              <View key={key} style={styles.stepRow}>
                <Text style={[styles.stepNumber, { color: theme.textSecondary }]}>{idx + 1}.</Text>
                <Text style={[styles.bodyText, { color: theme.text }]}>{labels[key]}</Text>
              </View>
            ))}
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>{labels.panicAttackColdWaterNote}</Text>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary, backgroundColor: theme.sectionLabelBg }]}>
              {labels.panicAttackContraindicationsTitle}
            </Text>
            <Text style={[styles.bodyText, { color: theme.text }]}>{labels.panicAttackContraindications}</Text>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary, backgroundColor: theme.sectionLabelBg }]}>
              {labels.panicAttackDoThis2}
            </Text>
            <Text style={[styles.bodyText, { color: theme.text }]}>{labels.panicAttackGrounding}</Text>
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.doneButton,
              { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.doneButtonText, { color: theme.activeText }]}>{labels.done}</Text>
          </Pressable>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8, gap: 4 },
  reassurance: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    paddingRight: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
    width: 20,
  },
  bodyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 4,
  },
  doneButton: {
    marginTop: 12,
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

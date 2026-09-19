import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppLabels } from '@/constants/i18n';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

const CARD_PADDING_BOTTOM = 24;

type Props = {
  visible: boolean;
  title: string;
  body: string;
  labels: AppLabels;
  onClose: () => void;
};

export function LegalDocModal({ visible, title, body, labels, onClose }: Props) {
  const { modal: theme } = useAppChromeTheme();
  const insets = useSafeAreaInsets();
  const paragraphs = body.split('\n\n').filter(Boolean);
  const [heading, ...rest] = paragraphs;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.modalBg,
              borderColor: theme.subtlePanelBorder,
              paddingBottom: CARD_PADDING_BOTTOM + insets.bottom,
            },
          ]}>
          <View style={styles.headerRow}>
            <View style={styles.headerBtn} />
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {heading ? (
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.textSecondary, backgroundColor: theme.sectionLabelBg },
                ]}>
                {heading}
              </Text>
            ) : null}
            {rest.map((paragraph, index) => (
              <Text key={`${index}-${paragraph.slice(0, 16)}`} style={[styles.bodyText, { color: theme.text }]}>
                {paragraph}
              </Text>
            ))}
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    maxHeight: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    paddingBottom: CARD_PADDING_BOTTOM,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: { minWidth: 28, alignItems: 'flex-end' },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    lineHeight: 16,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  doneButton: {
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.7 },
});

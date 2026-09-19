import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AppLabels, Language } from '@/constants/i18n';
import {
  getImportantInfoText,
  isImportantInfoSectionTitle,
  parseImportantInfoEmojiSection,
} from '@/constants/important-info';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

const CARD_PADDING_BOTTOM = 24;

type Props = {
  visible: boolean;
  /** Render inside a parent Modal (avoids iOS stacked-Modal issues). */
  embedded?: boolean;
  language: Language;
  labels: AppLabels;
  onClose: () => void;
};

type ContentProps = Omit<Props, 'visible' | 'embedded'> & { bottomInset: number };

function ImportantInfoModalContent({ language, labels, bottomInset, onClose }: ContentProps) {
  const { modal: theme } = useAppChromeTheme();
  const paragraphs = getImportantInfoText(language).split('\n\n').filter(Boolean);

  return (
    <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.modalBg,
            borderColor: theme.subtlePanelBorder,
            paddingBottom: CARD_PADDING_BOTTOM + bottomInset,
          },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerBtn} />
          <View style={styles.headerTitleSpacer} />
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityLabel={labels.done}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Ionicons name="close" size={20} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {paragraphs.map((paragraph, index) => {
            const isSectionTitle = isImportantInfoSectionTitle(paragraph);
            const emojiSection = parseImportantInfoEmojiSection(paragraph);

            if (emojiSection) {
              return (
                <View
                  key={`${index}-${paragraph.slice(0, 12)}`}
                  style={[styles.sectionBlock, { backgroundColor: theme.sectionLabelBg }]}>
                  <Text style={[styles.sectionTitleInBlock, { color: theme.textSecondary }]}>
                    {emojiSection.title}
                  </Text>
                  {emojiSection.intro ? (
                    <Text style={[styles.bodyText, { color: theme.text }]}>{emojiSection.intro}</Text>
                  ) : null}
                  {emojiSection.examplesLabel ? (
                    <Text style={[styles.examplesLabel, { color: theme.text }]}>
                      {emojiSection.examplesLabel}
                    </Text>
                  ) : null}
                  {emojiSection.examples.length > 0 ? (
                    <View style={styles.list}>
                      {emojiSection.examples.map((item, itemIndex) => (
                        <View key={`${itemIndex}-${item.slice(0, 24)}`} style={styles.listItem}>
                          <Text style={[styles.listBullet, { color: theme.text }]}>•</Text>
                          <Text style={[styles.listItemText, { color: theme.text }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {emojiSection.outro ? (
                    <Text style={[styles.bodyText, { color: theme.text }]}>{emojiSection.outro}</Text>
                  ) : null}
                </View>
              );
            }

            return (
              <Text
                key={`${index}-${paragraph.slice(0, 12)}`}
                style={[
                  isSectionTitle ? styles.sectionTitle : styles.bodyText,
                  {
                    color: isSectionTitle ? theme.textSecondary : theme.text,
                    backgroundColor: isSectionTitle ? theme.sectionLabelBg : 'transparent',
                  },
                ]}>
                {paragraph}
              </Text>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export function ImportantInfoModal({ visible, embedded = false, language, labels, onClose }: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const content = (
    <ImportantInfoModalContent
      language={language}
      labels={labels}
      // Embedded overlays sit inside a parent that already pads for the system bar.
      bottomInset={embedded ? 0 : insets.bottom}
      onClose={onClose}
    />
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{content}</View>;
  }

  return (
    <Modal
      transparent
      visible
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
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
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleSpacer: { flex: 1 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  sectionBlock: {
    gap: 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    lineHeight: 16,
  },
  sectionTitleInBlock: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: 16,
  },
  bodyText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  examplesLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  list: {
    gap: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  listBullet: {
    fontSize: 13,
    lineHeight: 20,
    width: 12,
    textAlign: 'center',
  },
  listItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  pressed: { opacity: 0.7 },
});

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LANGUAGES, type AppLabels, type Language } from '@/constants/i18n';
import { weekBodyTextStyle, weekButtonTextStyle, weekCardTitleStyle } from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

type Props = {
  visible: boolean;
  language: Language;
  labels: AppLabels;
  reviewMode: boolean;
  onReviewModeChange: (value: boolean) => void;
  onLanguageChange: (language: Language) => void;
  onEnableReminders: () => void;
  onShowOnboardingAgain: () => void;
  onClose: () => void;
};

export function SettingsModal({
  visible,
  language,
  labels,
  reviewMode,
  onReviewModeChange,
  onLanguageChange,
  onEnableReminders,
  onShowOnboardingAgain,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { modal: theme } = useAppChromeTheme();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.modalOverlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.modalBg,
              borderColor: theme.subtlePanelBorder,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <View style={styles.headerRow}>
            <View style={styles.headerBtn} />
            <Text style={[styles.title, { color: theme.text }]}>{labels.settingsTitle}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel={labels.done}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.brandCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
              <Text style={[styles.brandName, { color: theme.text }]}>{labels.appName}</Text>
              <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>{labels.appTagline}</Text>
            </View>

            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{labels.selectLanguage}</Text>
            <View style={styles.langList}>
              {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
                const active = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => onLanguageChange(lang)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [
                      styles.langRow,
                      active
                        ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                        : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.langRowText, { color: active ? theme.activeText : theme.inactiveText }]}>
                      {LANGUAGES[lang].name}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={16} color={theme.activeText} /> : <View style={styles.langCheckSpacer} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.rowCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{labels.reviewMode}</Text>
                <Text style={[styles.rowHint, { color: theme.textSecondary }]}>{labels.reviewModeHint}</Text>
              </View>
              <Switch value={reviewMode} onValueChange={onReviewModeChange} />
            </View>

            <View style={[styles.rowCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{labels.reminder}</Text>
                <Text style={[styles.rowHint, { color: theme.textSecondary }]}>{labels.reminderHint}</Text>
              </View>
              <Pressable
                onPress={onEnableReminders}
                accessibilityLabel={labels.configureNotifications}
                style={({ pressed }) => [
                  styles.iconAction,
                  { backgroundColor: theme.activeBg },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="notifications-outline" size={16} color={theme.activeText} />
              </Pressable>
            </View>

            <View style={[styles.privacyCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
              <View style={styles.privacyHeader}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.icon} />
                <Text style={[styles.rowTitle, { color: theme.text }]}>{labels.dataManagement}</Text>
              </View>
              <Text style={[styles.rowHint, { color: theme.textSecondary }]}>{labels.privacyHint}</Text>
            </View>

            <Pressable
              onPress={onShowOnboardingAgain}
              accessibilityLabel={labels.showOnboardingAgain}
              style={({ pressed }) => [
                styles.onboardingBtn,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="school-outline" size={16} color={theme.icon} />
              <Text style={[styles.onboardingText, { color: theme.text }]}>{labels.showOnboardingAgain}</Text>
            </Pressable>
          </ScrollView>
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
    flexGrow: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...weekCardTitleStyle,
    fontSize: 17,
    fontWeight: '700',
  },
  scroll: { flexShrink: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  brandCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  brandName: {
    ...weekCardTitleStyle,
    fontSize: 18,
    fontWeight: '800',
  },
  brandTagline: {
    ...weekBodyTextStyle,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    ...weekBodyTextStyle,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  langList: { gap: 8 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  langRowText: { fontSize: 13, fontWeight: '700' },
  langCheckSpacer: { width: 16, height: 16 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowTextWrap: { flex: 1, gap: 2 },
  rowTitle: { ...weekCardTitleStyle, fontSize: 15 },
  rowHint: { ...weekBodyTextStyle, fontSize: 13, lineHeight: 18 },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onboardingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  onboardingText: { ...weekButtonTextStyle, fontSize: 14 },
  pressed: { opacity: 0.7 },
});

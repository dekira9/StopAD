import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MenuPersonIcon } from '@/components/footer-bar-icons';
import { LegalDocModal } from '@/components/legal-doc-modal';
import { LANGUAGES, type AppLabels, type Language } from '@/constants/i18n';
import {
  getMedicalDisclaimerText,
  getPrivacyPolicyText,
  getSupportInfoText,
} from '@/constants/legal-info';
import { REMINDER_SOUND_IDS, type ReminderSoundId } from '@/constants/reminder-sounds';
import { getDayWeekBackground } from '@/constants/theme';
import {
  dayHeaderTitleStyle,
  formatSectionTitle,
  weekBodyTextStyle,
  weekButtonTextStyle,
  weekCardTitleStyle,
} from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import { playReminderSoundPreview } from '@/utils/reminder-sound';

type Props = {
  visible: boolean;
  language: Language;
  labels: AppLabels;
  reviewMode: boolean;
  onReviewModeChange: (value: boolean) => void;
  onLanguageChange: (language: Language) => void;
  onEnableReminders: () => void;
  reminderSound: ReminderSoundId;
  onReminderSoundChange: (soundId: ReminderSoundId) => void;
  onShowOnboardingAgain: () => void;
  onOpenUnderstandingAnxiety: () => void;
  onClose: () => void;
};

type LegalDocKey = 'disclaimer' | 'privacy' | 'support' | null;
type SettingsSubModalKey = 'language' | 'reviewMode' | 'reminder' | null;

const MENU_LINK_ICON_COLOR = '#D08A6A';
const MENU_HEADER_PERSON_FILL = '#8A9BD2';

function MenuSectionHeader({
  title,
  weekdayNameColor,
  dayBorderColor,
  headerBg,
}: {
  title: string;
  weekdayNameColor: string;
  dayBorderColor: string;
  headerBg: string;
}) {
  return (
    <View style={styles.menuSection}>
      <View style={[styles.menuSectionDivider, { backgroundColor: dayBorderColor }]} />
      <View style={[styles.menuSectionHeader, { backgroundColor: headerBg }]}>
        <Text style={[styles.menuSectionHeaderText, { color: weekdayNameColor }]}>
          {formatSectionTitle(title)}
        </Text>
      </View>
      <View style={[styles.menuSectionDivider, { backgroundColor: dayBorderColor }]} />
    </View>
  );
}

export function SettingsModal({
  visible,
  language,
  labels,
  reviewMode,
  onReviewModeChange,
  onLanguageChange,
  onEnableReminders,
  reminderSound,
  onReminderSoundChange,
  onShowOnboardingAgain,
  onOpenUnderstandingAnxiety,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { modal: theme, theme: colorTheme, isDark, chrome } = useAppChromeTheme();
  const sectionHeaderBg = getDayWeekBackground(isDark, 0);
  const [legalDoc, setLegalDoc] = useState<LegalDocKey>(null);
  const [settingsSubModal, setSettingsSubModal] = useState<SettingsSubModalKey>(null);

  const legalBody =
    legalDoc === 'disclaimer'
      ? getMedicalDisclaimerText(language)
      : legalDoc === 'privacy'
        ? getPrivacyPolicyText(language)
        : legalDoc === 'support'
          ? getSupportInfoText(language)
          : '';

  const legalTitle =
    legalDoc === 'disclaimer'
      ? labels.medicalDisclaimerTitle
      : legalDoc === 'privacy'
        ? labels.privacyPolicyTitle
        : legalDoc === 'support'
          ? labels.supportTitle
          : '';

  const settingsSubModalTitle =
    settingsSubModal === 'language'
      ? labels.selectLanguage
      : settingsSubModal === 'reviewMode'
        ? labels.reviewMode
        : settingsSubModal === 'reminder'
          ? labels.reminder
          : '';

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
            <View accessible accessibilityRole="header" accessibilityLabel={labels.menuButton} style={styles.headerTitleIcon}>
              <MenuPersonIcon size={36} fillColor={MENU_HEADER_PERSON_FILL} strokeColor={theme.text} />
            </View>
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

            <MenuSectionHeader
              title={labels.menuHelpSection}
              weekdayNameColor={colorTheme.weekdayName}
              dayBorderColor={chrome.dayBorder}
              headerBg={sectionHeaderBg}
            />

            <Pressable
              onPress={onOpenUnderstandingAnxiety}
              accessibilityLabel={labels.understandingAnxietyTitle}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="heart-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.understandingAnxietyTitle}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <Pressable
              onPress={onShowOnboardingAgain}
              accessibilityLabel={labels.showOnboardingAgain}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="school-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.showOnboardingAgain}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <MenuSectionHeader
              title={labels.settingsTitle}
              weekdayNameColor={colorTheme.weekdayName}
              dayBorderColor={chrome.dayBorder}
              headerBg={sectionHeaderBg}
            />

            <Pressable
              onPress={() => setSettingsSubModal('language')}
              accessibilityLabel={labels.selectLanguage}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="globe-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.selectLanguage}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <Pressable
              onPress={() => setSettingsSubModal('reviewMode')}
              accessibilityLabel={labels.reviewMode}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="eye-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.reviewMode}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <Pressable
              onPress={() => setSettingsSubModal('reminder')}
              accessibilityLabel={labels.reminder}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="notifications-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.reminder}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <MenuSectionHeader
              title={labels.menuAboutSection}
              weekdayNameColor={colorTheme.weekdayName}
              dayBorderColor={chrome.dayBorder}
              headerBg={sectionHeaderBg}
            />

            <Pressable
              onPress={() => setLegalDoc('disclaimer')}
              accessibilityLabel={labels.medicalDisclaimerTitle}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="medical-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.medicalDisclaimerTitle}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <Pressable
              onPress={() => setLegalDoc('privacy')}
              accessibilityLabel={labels.privacyPolicyTitle}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="document-text-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.privacyPolicyTitle}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <Pressable
              onPress={() => setLegalDoc('support')}
              accessibilityLabel={labels.supportTitle}
              style={({ pressed }) => [
                styles.linkRow,
                { backgroundColor: theme.circleBg, borderColor: theme.circleBorder },
                pressed && styles.pressed,
              ]}>
              <Ionicons name="mail-outline" size={16} color={MENU_LINK_ICON_COLOR} />
              <Text style={[styles.linkRowText, { color: theme.text }]}>{labels.supportTitle}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.iconMuted} />
            </Pressable>

            <View style={[styles.privacyCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
              <View style={styles.privacyHeader}>
                <Ionicons name="lock-closed-outline" size={16} color={MENU_LINK_ICON_COLOR} />
                <Text style={[styles.rowTitle, { color: theme.text }]}>{labels.dataManagement}</Text>
              </View>
              <Text style={[styles.rowHint, { color: theme.textSecondary }]}>{labels.privacyHint}</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      <LegalDocModal
        visible={legalDoc !== null}
        title={legalTitle}
        body={legalBody}
        labels={labels}
        onClose={() => setLegalDoc(null)}
      />

      <Modal
        transparent
        visible={settingsSubModal !== null}
        animationType="slide"
        onRequestClose={() => setSettingsSubModal(null)}>
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
              <Text style={[styles.title, { color: theme.text }]}>{settingsSubModalTitle}</Text>
              <Pressable
                onPress={() => setSettingsSubModal(null)}
                hitSlop={8}
                accessibilityLabel={labels.done}
                style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled">
              {settingsSubModal === 'language' ? (
                <View style={styles.langList}>
                  {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
                    const active = language === lang;
                    return (
                      <Pressable
                        key={lang}
                        onPress={() => {
                          onLanguageChange(lang);
                          setSettingsSubModal(null);
                        }}
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
                        {active ? (
                          <Ionicons name="checkmark" size={16} color={theme.activeText} />
                        ) : (
                          <View style={styles.langCheckSpacer} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}

              {settingsSubModal === 'reviewMode' ? (
                <View style={[styles.rowCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
                  <View style={styles.rowTextWrap}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{labels.reviewMode}</Text>
                    <Text style={[styles.rowHint, { color: theme.textSecondary }]}>{labels.reviewModeHint}</Text>
                  </View>
                  <Switch
                    value={reviewMode}
                    onValueChange={onReviewModeChange}
                    trackColor={{ false: theme.inactiveBorder, true: theme.activeBg }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={theme.inactiveBorder}
                  />
                </View>
              ) : null}

              {settingsSubModal === 'reminder' ? (
                <View style={[styles.reminderCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
                  <View style={styles.reminderTopRow}>
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

                  <View style={styles.soundBlock}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{labels.reminderSound}</Text>
                    <Text style={[styles.rowHint, { color: theme.textSecondary }]}>{labels.reminderSoundHint}</Text>
                    <View style={styles.soundChips}>
                      {REMINDER_SOUND_IDS.map((soundId) => {
                        const active = reminderSound === soundId;
                        const soundLabel =
                          soundId === 'quiet'
                            ? labels.reminderSoundQuiet
                            : soundId === 'normal'
                              ? labels.reminderSoundNormal
                              : labels.reminderSoundNoticeable;
                        return (
                          <Pressable
                            key={soundId}
                            onPress={() => {
                              void playReminderSoundPreview(soundId);
                              onReminderSoundChange(soundId);
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={soundLabel}
                            style={({ pressed }) => [
                              styles.soundChip,
                              active
                                ? { backgroundColor: theme.activeBg, borderColor: theme.activeBg }
                                : { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder },
                              pressed && styles.pressed,
                            ]}>
                            <Text
                              style={[
                                styles.soundChipText,
                                { color: active ? theme.activeText : theme.inactiveText },
                              ]}
                              numberOfLines={1}>
                              {soundLabel}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitleIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
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
  menuSection: {
    marginHorizontal: -16,
  },
  menuSectionDivider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  menuSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuSectionHeaderText: {
    ...dayHeaderTitleStyle,
    lineHeight: 26,
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
  reminderCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  reminderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundBlock: { gap: 6 },
  soundChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  soundChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  soundChipText: {
    ...weekButtonTextStyle,
    fontSize: 12,
    fontWeight: '700',
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  linkRowText: {
    ...weekButtonTextStyle,
    fontSize: 14,
    flex: 1,
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

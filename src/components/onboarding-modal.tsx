import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LANGUAGES, type AppLabels, type Language } from '@/constants/i18n';

export type OnboardingResult = {
  language: Language;
};

type ThemeSlice = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  modalBg: string;
  subtlePanelBg: string;
  subtlePanelBorder: string;
  sectionLabelBg: string;
};

type Props = {
  visible: boolean;
  language: Language;
  labels: AppLabels;
  theme: ThemeSlice;
  onLanguageChange: (language: Language) => void;
  onLearnMore: () => void;
  onComplete: (result: OnboardingResult) => void;
};

const STEP_COUNT = 3;

export function OnboardingModal({
  visible,
  language,
  labels,
  theme,
  onLanguageChange,
  onLearnMore,
  onComplete,
}: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  const finish = () => {
    onComplete({ language });
  };

  const goNext = () => {
    if (step >= STEP_COUNT - 1) return;
    setStep((current) => current + 1);
  };

  const goBack = () => {
    if (step <= 0) return;
    setStep((current) => current - 1);
  };

  const stepTitle = useMemo(() => {
    switch (step) {
      case 0:
        return labels.onboardingLanguageTitle;
      case 1:
        return labels.onboardingSlide1Title;
      default:
        return labels.onboardingSlide2Title;
    }
  }, [labels, step]);

  const stepBody = useMemo(() => {
    switch (step) {
      case 0:
        return labels.onboardingLanguageHint;
      case 1:
        return labels.onboardingSlide1Body;
      default:
        return labels.onboardingSlide2Body;
    }
  }, [labels, step]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={finish}>
      <View
        style={[
          styles.screen,
          {
            backgroundColor: theme.modalBg,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <View style={styles.topBar}>
          <View style={styles.topBarSide}>
            {step > 0 ? (
              <Pressable onPress={goBack} hitSlop={8} style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                <Text style={[styles.textBtnLabel, { color: theme.textSecondary }]}>{labels.onboardingBack}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.dots}>
            {Array.from({ length: STEP_COUNT }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === step ? theme.activeBg : theme.subtlePanelBorder,
                    opacity: index === step ? 1 : 0.45,
                  },
                ]}
              />
            ))}
          </View>
          <View style={[styles.topBarSide, styles.topBarSideRight]}>
            {step < STEP_COUNT - 1 ? (
              <Pressable
                onPress={finish}
                hitSlop={8}
                style={({ pressed }) => [styles.textBtn, pressed && styles.pressed]}>
                <Text style={[styles.textBtnLabel, { color: theme.textSecondary }]}>{labels.onboardingSkip}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Text style={[styles.title, { color: theme.text }]}>{stepTitle}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{stepBody}</Text>

          {step === 1 ? (
            <Pressable onPress={onLearnMore} style={({ pressed }) => [styles.learnMoreBtn, pressed && styles.pressed]}>
              <Text style={[styles.learnMoreText, { color: theme.activeBg }]}>{labels.onboardingLearnMore}</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.activeBg} />
            </Pressable>
          ) : null}

          {step === 0 ? (
            <View style={styles.langList}>
              {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
                const active = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => onLanguageChange(lang)}
                    style={({ pressed }) => [
                      styles.langRow,
                      active
                        ? [styles.langRowActive, { backgroundColor: theme.activeBg, borderColor: theme.activeBg }]
                        : [styles.langRowInactive, { backgroundColor: theme.inactiveBg, borderColor: theme.inactiveBorder }],
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
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step < STEP_COUNT - 1 ? (
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.primaryButtonText, { color: theme.activeText }]}>{labels.onboardingNext}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={finish}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.primaryButtonText, { color: theme.activeText }]}>{labels.done}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: 36,
  },
  topBarSide: { width: 88 },
  topBarSideRight: { alignItems: 'flex-end' },
  dots: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  textBtn: { paddingVertical: 4 },
  textBtnLabel: { fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  body: { fontSize: 15, lineHeight: 22 },
  learnMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  learnMoreText: { fontSize: 13, fontWeight: '700' },
  langList: { gap: 8, marginTop: 8 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  langRowActive: {},
  langRowInactive: {},
  langRowText: { fontSize: 13, fontWeight: '700' },
  langCheckSpacer: { width: 16, height: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, gap: 10 },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  primaryButtonText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  pressed: { opacity: 0.7 },
});

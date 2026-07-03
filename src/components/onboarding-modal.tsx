import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { formatTimeValue, parseTimeValue } from '@/components/medication-time-picker-modal';
import { LANGUAGES, type AppLabels, type Language } from '@/constants/i18n';

export type OnboardingResult = {
  language: Language;
  medication?: { name: string; dose: string; time: string };
  enableNotifications: boolean;
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

const STEP_COUNT = 5;

export function OnboardingModal({
  visible,
  language,
  labels,
  theme,
  onLanguageChange,
  onLearnMore,
  onComplete,
}: Props) {
  const [step, setStep] = useState(0);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medTime, setMedTime] = useState(() => format(new Date(), 'HH:mm'));
  const [showTimePicker, setShowTimePicker] = useState(false);

  const finish = (enableNotifications: boolean, includeMedication: boolean) => {
    const trimmedName = medName.trim();
    onComplete({
      language,
      enableNotifications,
      medication:
        includeMedication && trimmedName
          ? { name: trimmedName, dose: medDose.trim(), time: medTime.trim() }
          : undefined,
    });
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
        return labels.onboardingSlide1Title;
      case 1:
        return labels.onboardingSlide2Title;
      case 2:
        return labels.onboardingLanguageTitle;
      case 3:
        return labels.onboardingMedicationTitle;
      default:
        return labels.onboardingNotificationsTitle;
    }
  }, [labels, step]);

  const stepBody = useMemo(() => {
    switch (step) {
      case 0:
        return labels.onboardingSlide1Body;
      case 1:
        return labels.onboardingSlide2Body;
      case 2:
        return labels.onboardingLanguageHint;
      case 3:
        return labels.onboardingMedicationHint;
      default:
        return labels.onboardingNotificationsHint;
    }
  }, [labels, step]);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => finish(false, false)}>
      <View style={[styles.screen, { backgroundColor: theme.modalBg }]}>
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
                onPress={() => finish(false, false)}
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

          {step === 0 ? (
            <Pressable onPress={onLearnMore} style={({ pressed }) => [styles.learnMoreBtn, pressed && styles.pressed]}>
              <Text style={[styles.learnMoreText, { color: theme.activeBg }]}>{labels.onboardingLearnMore}</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.activeBg} />
            </Pressable>
          ) : null}

          {step === 2 ? (
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

          {step === 3 ? (
            <View style={[styles.formCard, { backgroundColor: theme.subtlePanelBg, borderColor: theme.subtlePanelBorder }]}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{labels.medicationName}</Text>
              <TextInput
                value={medName}
                onChangeText={setMedName}
                placeholder={labels.medicationName}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.subtlePanelBorder, backgroundColor: theme.inactiveBg }]}
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{labels.medicationDose}</Text>
              <TextInput
                value={medDose}
                onChangeText={setMedDose}
                placeholder={labels.medicationDose}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.subtlePanelBorder, backgroundColor: theme.inactiveBg }]}
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{labels.time}</Text>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={({ pressed }) => [
                  styles.timeButton,
                  { borderColor: theme.subtlePanelBorder, backgroundColor: theme.inactiveBg },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="time-outline" size={18} color={theme.text} />
                <Text style={[styles.timeButtonText, { color: theme.text }]}>{medTime}</Text>
              </Pressable>
              {showTimePicker ? (
                <DateTimePicker
                  value={parseTimeValue(medTime)}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowTimePicker(false);
                    if (date) setMedTime(formatTimeValue(date));
                  }}
                />
              ) : null}
              {Platform.OS === 'ios' && showTimePicker ? (
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    { borderColor: theme.subtlePanelBorder },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.secondaryActionText, { color: theme.text }]}>{labels.done}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step < 4 ? (
            step === 3 ? (
              <View style={styles.footerStack}>
                <Pressable
                  onPress={() => setStep(4)}
                  disabled={!medName.trim()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.activeBg, borderColor: theme.activeBg, opacity: medName.trim() ? 1 : 0.45 },
                    pressed && medName.trim() && styles.pressed,
                  ]}>
                  <Text style={[styles.primaryButtonText, { color: theme.activeText }]}>{labels.onboardingNext}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMedName('');
                    setMedDose('');
                    setStep(4);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    { borderColor: theme.subtlePanelBorder },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.secondaryActionText, { color: theme.text }]}>{labels.onboardingMedicationSkip}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={goNext}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.primaryButtonText, { color: theme.activeText }]}>{labels.onboardingNext}</Text>
              </Pressable>
            )
          ) : (
            <View style={styles.footerStack}>
              <Pressable
                onPress={() => finish(true, true)}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.activeBg, borderColor: theme.activeBg },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.primaryButtonText, { color: theme.activeText }]}>
                  {labels.onboardingNotificationsEnable}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => finish(false, true)}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  { borderColor: theme.subtlePanelBorder },
                  pressed && styles.pressed,
                ]}>
                <Text style={[styles.secondaryActionText, { color: theme.text }]}>{labels.onboardingNotificationsLater}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
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
  formCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8, marginTop: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timeButtonText: { fontSize: 15, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 8, gap: 10 },
  footerStack: { gap: 10 },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  primaryButtonText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  secondaryActionText: { fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState, type ComponentProps } from 'react';
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
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';

export type OnboardingResult = {
  language: Language;
};

type Props = {
  visible: boolean;
  language: Language;
  labels: AppLabels;
  onLanguageChange: (language: Language) => void;
  onLearnMore: () => void;
  onComplete: (result: OnboardingResult) => void;
};

/** 0 language · 1 hello · 2 not catastrophe · 3 manage · 4 growth rings · 5 week */
const STEP_COUNT = 6;

type IllustrationName = ComponentProps<typeof Ionicons>['name'];

const RING_ILLUSTRATION_SIZE = 128;
const RING_ILLUSTRATION_STROKE = 11;
const RING_ILLUSTRATION_GAP = 4;
const RING_ILLUSTRATION_COLORS = ['#9BB0A6', '#8FA8B8', '#7A9AAD', '#6B8FA3'] as const;
const RING_ILLUSTRATION_MUTED = [
  'rgba(155,176,166,0.35)',
  'rgba(143,168,184,0.35)',
  'rgba(122,154,173,0.35)',
  'rgba(107,143,163,0.35)',
] as const;

function StepIllustration({
  name,
  color,
  backgroundColor,
  borderColor,
}: {
  name: IllustrationName;
  color: string;
  backgroundColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.illustrationWrap, { backgroundColor, borderColor }]}>
      <Ionicons name={name} size={40} color={color} />
    </View>
  );
}

function GrowthRingsIllustration({
  centerLabel,
  captionColor,
}: {
  centerLabel: string;
  captionColor: string;
}) {
  return (
    <View style={styles.ringsIllustrationWrap} accessibilityLabel={centerLabel}>
      <View style={[styles.ringsCanvas, { width: RING_ILLUSTRATION_SIZE, height: RING_ILLUSTRATION_SIZE }]}>
        {[4, 3, 2, 1].map((id) => {
          const index = id - 1;
          const inset = (4 - id) * (RING_ILLUSTRATION_STROKE + RING_ILLUSTRATION_GAP);
          const size = RING_ILLUSTRATION_SIZE - inset * 2;
          // Inner rings are “now”; outer rings hint at wider life
          const color = id <= 2 ? RING_ILLUSTRATION_COLORS[index] : RING_ILLUSTRATION_MUTED[index];

          return (
            <View
              key={id}
              pointerEvents="none"
              style={[
                styles.ringVisual,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: RING_ILLUSTRATION_STROKE,
                  borderColor: color,
                  top: inset,
                  left: inset,
                },
              ]}
            />
          );
        })}
        <View
          pointerEvents="none"
          style={[
            styles.ringsCenter,
            {
              backgroundColor: RING_ILLUSTRATION_COLORS[0],
            },
          ]}
        />
      </View>
      <Text style={[styles.ringsCaption, { color: captionColor }]}>{centerLabel}</Text>
    </View>
  );
}

export function OnboardingModal({
  visible,
  language,
  labels,
  onLanguageChange,
  onLearnMore,
  onComplete,
}: Props) {
  const insets = useSafeAreaInsets();
  const { modal: theme } = useAppChromeTheme();
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
        return labels.appName;
      case 2:
        return labels.onboardingSlide2Title;
      case 3:
        return labels.onboardingSlide3Title;
      case 4:
        return labels.onboardingSlide4Title;
      default:
        return labels.onboardingSlide5Title;
    }
  }, [labels, step]);

  const stepBody = useMemo(() => {
    switch (step) {
      case 0:
        return labels.onboardingLanguageHint;
      case 1:
        return labels.onboardingSlide1Body;
      case 2:
        return labels.onboardingSlide2Body;
      case 3:
        return labels.onboardingSlide3Body;
      case 4:
        return labels.onboardingSlide4Body;
      default:
        return labels.onboardingSlide5Body;
    }
  }, [labels, step]);

  const illustration = useMemo(() => {
    switch (step) {
      case 1:
        return 'hand-left-outline' as const;
      case 2:
        return 'shield-checkmark-outline' as const;
      case 3:
        return 'leaf-outline' as const;
      case 5:
        return 'calendar-outline' as const;
      default:
        return null;
    }
  }, [step]);

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
            {step > 0 && step < STEP_COUNT - 1 ? (
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
          {step === 1 ? (
            <View style={styles.brandArtWrap}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.brandArt}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
          ) : null}

          {step === 4 ? (
            <GrowthRingsIllustration
              centerLabel={labels.onboardingSlide4RingHint}
              captionColor={theme.textSecondary}
            />
          ) : null}

          {illustration && step !== 1 ? (
            <StepIllustration
              name={illustration}
              color={theme.activeBg}
              backgroundColor={theme.subtlePanelBg}
              borderColor={theme.subtlePanelBorder}
            />
          ) : null}

          <Text style={[step === 1 ? styles.brandTitle : styles.title, { color: theme.text }]}>{stepTitle}</Text>
          {step === 1 ? (
            <Text style={[styles.brandTagline, { color: theme.activeBg }]}>{labels.appTagline}</Text>
          ) : null}
          <Text style={[styles.body, { color: theme.textSecondary }]}>{stepBody}</Text>

          {step === 3 ? (
            <Pressable onPress={onLearnMore} style={({ pressed }) => [styles.learnMoreBtn, pressed && styles.pressed]}>
              <Text style={[styles.learnMoreText, { color: theme.activeBg }]}>{labels.onboardingLearnMore}</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.activeBg} />
            </Pressable>
          ) : null}

          {step === 0 ? (
            <View style={styles.langList}>
              <Text style={[styles.langBrandMark, { color: theme.activeBg }]}>{labels.appName}</Text>
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
              <Text style={[styles.primaryButtonText, { color: theme.activeText }]}>{labels.onboardingStart}</Text>
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
  brandArtWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  brandArt: {
    width: 112,
    height: 112,
    borderRadius: 28,
  },
  brandTitle: { fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -0.3 },
  brandTagline: { fontSize: 15, fontWeight: '700', lineHeight: 21, marginTop: -4 },
  illustrationWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  ringsIllustrationWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  ringsCanvas: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringVisual: {
    position: 'absolute',
  },
  ringsCenter: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  ringsCaption: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  body: { fontSize: 15, lineHeight: 22 },
  learnMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  learnMoreText: { fontSize: 13, fontWeight: '700' },
  langList: { gap: 8, marginTop: 8 },
  langBrandMark: { fontSize: 20, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
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

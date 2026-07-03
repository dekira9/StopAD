import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AllMedicationsModal, catalogEntryMedicationLabel } from '@/components/all-medications-modal';
import { CoachMarksOverlay, type CoachMarkTarget } from '@/components/coach-marks-overlay';
import { ExpandableInput } from '@/components/expandable-input';
import { ImportantInfoModal } from '@/components/important-info-modal';
import { MedicationScheduleModal } from '@/components/medication-schedule-modal';
import { MedicationStatusModal } from '@/components/medication-status-modal';
import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import { OnboardingModal, type OnboardingResult } from '@/components/onboarding-modal';
import { PanicAttackCountInput } from '@/components/panic-attack-count-input';
import { PanicAttackModal } from '@/components/panic-attack-modal';
import { SleepInput } from '@/components/sleep-input';
import { SportInput } from '@/components/sport-input';
import { TriggersInput } from '@/components/triggers-input';
import { WeeklySummaryCharts } from '@/components/weekly-summary-charts';
import { LANGUAGES, type Language } from '@/constants/i18n';
import { Colors, Fonts, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ensureNotificationPermissions } from '@/services/notifications';
import { DEFAULT_MEDICATION_ROWS, formatMedicationLabel, wellnessStore, type MedicationRow } from '@/stores/wellness-store';
import { formatIntakeDaysSummary } from '@/utils/medication-intake';
import { resolvePanicAttackCount } from '@/utils/panic-attack-log';
import { hasSleepLogContent, parseSleepLog } from '@/utils/sleep-log';
import { hasSportLogContent, parseSportLog } from '@/utils/sport-log';
import { hasTriggerLogContent, parseTriggerLog } from '@/utils/trigger-log';
import { exportWeeklySummaryPdf } from '@/utils/weekly-summary-pdf';
import {
  addDays,
  addWeeks,
  addYears,
  differenceInCalendarWeeks,
  endOfMonth,
  format,
  getDay,
  getMonth,
  getYear,
  isPast,
  isSameDay,
  parse,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
  subYears,
} from 'date-fns';

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function generateSafeId(dateKey: string, baseIndex: number, existing: MedicationRow[]) {
  let newId = `med-${dateKey}-${baseIndex}`;
  let suffix = 0;
  while (existing.some((r) => r.id === newId)) {
    suffix++;
    newId = `med-${dateKey}-${baseIndex}-${suffix}`;
  }
  return newId;
}

function isDayNotesExpandedByDefault(day: Date) {
  const today = new Date();
  return isSameDay(day, today) || isSameDay(day, subDays(today, 1));
}

function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = theme.background === Colors.dark.background;

  const ui = useMemo(
    () => ({
      icon: theme.text,
      iconMuted: isDark ? 'rgba(242,242,242,0.55)' : 'rgba(20,20,20,0.45)',
      cardBorder: isDark ? 'rgba(125,168,146,0.20)' : 'rgba(107,144,128,0.18)',
      circleBg: isDark ? 'rgba(26,36,32,0.95)' : '#FFFFFF',
      circleBorder: isDark ? 'rgba(125,168,146,0.30)' : 'rgba(107,144,128,0.22)',
      circleShadow: isDark ? 0 : 0.07,
      contentBg: isDark ? theme.background : '#FFFFFF',
      dayHeaderBg: theme.backgroundElement,
      dayBorder: isDark ? 'rgba(125,168,146,0.24)' : 'rgba(107,144,128,0.20)',
      rowBorder: isDark ? 'rgba(125,168,146,0.12)' : 'rgba(26,46,36,0.07)',
      sectionLabelBg: theme.backgroundSelected,
      notesBlockBg: isDark ? 'rgba(21,28,24,0.70)' : 'rgba(247,249,247,0.92)',
      panicRowBg: theme.panicRow,
      accent: theme.accent,
      footerBg: isDark ? 'rgba(21,28,24,0.90)' : 'rgba(255,255,255,0.94)',
      footerBorder: isDark ? 'rgba(125,168,146,0.22)' : 'rgba(107,144,128,0.16)',
      modalOverlay: isDark ? 'rgba(5,10,7,0.72)' : 'rgba(20,35,25,0.38)',
      modalBg: isDark ? '#151C18' : '#FFFFFF',
      modalMutedBg: isDark ? '#0F1411' : '#F8FAF8',
      subtlePanelBg: isDark ? 'rgba(26,36,32,0.80)' : 'rgba(229,237,232,0.55)',
      subtlePanelBorder: isDark ? 'rgba(125,168,146,0.26)' : 'rgba(107,144,128,0.18)',
      checkOffBg: isDark ? 'rgba(26,36,32,0.95)' : '#F0F4F1',
      checkOffBorder: isDark ? 'rgba(125,168,146,0.30)' : 'rgba(107,144,128,0.24)',
      reminderOnBg: isDark ? 'rgba(125,168,146,0.24)' : 'rgba(107,144,128,0.14)',
      activeBg: theme.accent,
      activeText: theme.accentText,
      inactiveBg: isDark ? 'rgba(26,36,32,0.95)' : '#FFFFFF',
      inactiveBorder: isDark ? 'rgba(125,168,146,0.30)' : 'rgba(107,144,128,0.20)',
      inactiveText: theme.text,
      panicYesBg: isDark ? '#DC2626' : '#EF4444',
      panicYesText: '#FFFFFF',
      panicNoBg: isDark ? 'rgba(26,36,32,0.95)' : '#F0F4F1',
      panicNoBorder: isDark ? '#4ADE80' : '#22C55E',
      panicNoIcon: isDark ? '#4ADE80' : '#22C55E',
    }),
    [isDark, theme],
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [language, setLanguage] = useState<Language>('ru');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isMonthPickerMounted, setIsMonthPickerMounted] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [expandedInputs, setExpandedInputs] = useState<Record<string, boolean>>({});
  const [inputSelections, setInputSelections] = useState<Record<string, { start: number; end: number }>>({});
  const [statusTarget, setStatusTarget] = useState<{ dateKey: string; rowId: string; idx: number } | null>(null);
  const [showMedicationSchedule, setShowMedicationSchedule] = useState(false);
  const [showAllMedications, setShowAllMedications] = useState(false);
  const [showImportantInfo, setShowImportantInfo] = useState(false);
  const [showPanicAttack, setShowPanicAttack] = useState(false);
  const [isExportingWeeklyPdf, setIsExportingWeeklyPdf] = useState(false);
  const [catalogScheduleTarget, setCatalogScheduleTarget] = useState<{
    medication: string;
    time: string;
  } | null>(null);
  const [coachMarkStep, setCoachMarkStep] = useState<0 | 1>(0);
  const [panicCoachTarget, setPanicCoachTarget] = useState<CoachMarkTarget | null>(null);
  const [infoCoachTarget, setInfoCoachTarget] = useState<CoachMarkTarget | null>(null);
  const panicButtonRef = useRef<View>(null);
  const infoButtonRef = useRef<View>(null);
  const [medTimeTarget, setMedTimeTarget] = useState<{
    dateKey: string;
    rowId: string;
    idx: number;
    time: string;
  } | null>(null);

  const monthPickerAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const fieldAnchorRefs = useRef<Record<string, View | null>>({});
  const lastFocusedFieldKey = useRef<string | null>(null);
  const [footerHeight, setFooterHeight] = useState(72);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const t = LANGUAGES[language].labels;
  const locale = LANGUAGES[language].locale;
  const showOnboarding = wellnessStore.hydrated && !wellnessStore.onboardingCompleted;
  const showCoachMarks =
    wellnessStore.hydrated &&
    wellnessStore.onboardingCompleted &&
    !wellnessStore.coachMarksSeen &&
    !showOnboarding;

  useEffect(() => {
    if (!wellnessStore.hydrated || !wellnessStore.preferredLanguage) return;
    setLanguage(wellnessStore.preferredLanguage);
  }, [wellnessStore.hydrated, wellnessStore.preferredLanguage]);

  const measureCoachMarkTargets = useCallback(() => {
    panicButtonRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setPanicCoachTarget({ x, y, width, height });
      }
    });
    infoButtonRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setInfoCoachTarget({ x, y, width, height });
      }
    });
  }, []);

  useEffect(() => {
    if (!showCoachMarks) return;
    setCoachMarkStep(0);
    const timer = setTimeout(measureCoachMarkTargets, 180);
    return () => clearTimeout(timer);
  }, [showCoachMarks, measureCoachMarkTargets, footerHeight]);

  const handleOnboardingComplete = useCallback(
    async (result: OnboardingResult) => {
      setLanguage(result.language);
      wellnessStore.setPreferredLanguage(result.language);

      if (result.medication?.name.trim()) {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const day = wellnessStore.getDay(todayKey);
        const row = day.medications[0];
        const medication = formatMedicationLabel(result.medication.name, result.medication.dose);
        wellnessStore.updateMedication(
          todayKey,
          row.id,
          {
            medication,
            time: result.medication.time,
            reminderEnabled: result.enableNotifications,
          },
          0,
        );
      }

      if (result.enableNotifications) {
        await ensureNotificationPermissions();
        void wellnessStore.rescheduleReminders();
      }

      wellnessStore.completeOnboarding();
    },
    [],
  );

  const handleLanguageChange = useCallback((nextLanguage: Language) => {
    setLanguage(nextLanguage);
    wellnessStore.setPreferredLanguage(nextLanguage);
  }, []);

  useEffect(() => {
    wellnessStore.setReminderLabels({
      notificationTitle: t.notificationTitle,
      notificationBody: t.notificationBody,
    });
    void wellnessStore.rescheduleReminders();
  }, [language, t.notificationTitle, t.notificationBody]);

  useEffect(() => {
    if (!wellnessStore.hydrated || !wellnessStore.onboardingCompleted) return;
    void ensureNotificationPermissions();
  }, [wellnessStore.hydrated, wellnessStore.onboardingCompleted]);

  const scrollFieldIntoView = useCallback(
    (key: string, keyboardInset = keyboardHeight) => {
      const target = fieldAnchorRefs.current[key];
      if (!target || !scrollViewRef.current) return;

      target.measureInWindow((_, y, __, height) => {
        const windowHeight = Dimensions.get('window').height;
        const reservedBottom = footerHeight + keyboardInset + insets.bottom + 40;
        const visibleBottom = windowHeight - reservedBottom;
        const overflow = y + height - visibleBottom;

        if (overflow > 0) {
          scrollViewRef.current?.scrollTo({
            y: scrollYRef.current + overflow,
            animated: true,
          });
        }
      });
    },
    [footerHeight, keyboardHeight, insets.bottom],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextKeyboardHeight = event.endCoordinates.height;
      setKeyboardHeight(nextKeyboardHeight);
      const focusedKey = lastFocusedFieldKey.current;
      if (focusedKey) {
        setTimeout(
          () => scrollFieldIntoView(focusedKey, nextKeyboardHeight),
          Platform.OS === 'ios' ? 50 : 150,
        );
      }
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollFieldIntoView]);

  useEffect(() => {
    if (showMonthPicker) {
      setIsMonthPickerMounted(true);
      monthPickerAnim.setValue(0);
      Animated.timing(monthPickerAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    if (isMonthPickerMounted) {
      Animated.timing(monthPickerAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setIsMonthPickerMounted(false);
      });
    }
  }, [showMonthPicker, isMonthPickerMounted, monthPickerAnim]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const currentWeekKey = useMemo(() => format(weekDays[0], 'yyyy-MM-dd'), [weekDays]);

  const showWeeklySummaryNudge =
    wellnessStore.onboardingCompleted &&
    !wellnessStore.weeklySummaryNudgeSeen &&
    weekDays.some((day) => getDay(day) === 0) &&
    !(wellnessStore.weeklySummary[currentWeekKey] || '').trim();

  const handleExportWeeklyPdf = useCallback(async () => {
    if (isExportingWeeklyPdf) return;

    setIsExportingWeeklyPdf(true);
    try {
      await exportWeeklySummaryPdf({
        weekDays,
        days: wellnessStore.days,
        labels: t,
        locale,
        language,
        weekSummaryText: wellnessStore.weeklySummary[currentWeekKey] || '',
      });
    } catch {
      Alert.alert(t.weeklyExportPdf, t.weeklyExportPdfError);
    } finally {
      setIsExportingWeeklyPdf(false);
    }
  }, [currentWeekKey, isExportingWeeklyPdf, language, locale, t, weekDays]);

  const weekHeaderLabel = useMemo(() => {
    const weekStart = weekDays[0];
    const weekEnd = weekDays[weekDays.length - 1];
    const startMonth = format(weekStart, 'LLLL', { locale });
    const endMonth = format(weekEnd, 'LLLL', { locale });
    const startYear = format(weekStart, 'yyyy');
    const endYear = format(weekEnd, 'yyyy');

    const spansMultipleMonths = getMonth(weekStart) !== getMonth(weekEnd) || getYear(weekStart) !== getYear(weekEnd);

    return {
      monthTitle: spansMultipleMonths ? `${startMonth} – ${endMonth}` : startMonth,
      yearTitle: startYear === endYear ? startYear : `${startYear} – ${endYear}`,
      compactMonthTitle: spansMultipleMonths,
    };
  }, [weekDays, locale]);

  const scheduleContext = useMemo(() => {
    const weekdayLabels = weekDays.map((dayItem) => format(dayItem, 'EEE', { locale }).toUpperCase());

    let medName = '';
    let row: MedicationRow | null = null;
    let fallbackWeekKey = currentWeekKey;
    let defaultDurationStart = currentWeekKey;

    if (catalogScheduleTarget) {
      medName = catalogScheduleTarget.medication.trim();
      if (!medName) return null;
      row = {
        id: 'catalog-schedule',
        time: catalogScheduleTarget.time?.trim() ?? '',
        medication: medName,
        taken: false,
        reminderEnabled: true,
      };
    } else if (statusTarget) {
      const day = wellnessStore.getDay(statusTarget.dateKey);
      row =
        day.medications.find((medicationRow) => medicationRow.id === statusTarget.rowId) ??
        day.medications[statusTarget.idx];
      if (!row) return null;
      medName = row.medication.trim();
      fallbackWeekKey = format(
        startOfWeek(parse(statusTarget.dateKey, 'yyyy-MM-dd', new Date()), { weekStartsOn: 1 }),
        'yyyy-MM-dd',
      );
      defaultDurationStart = statusTarget.dateKey;
      row = { ...row, time: wellnessStore.resolveMedicationRowTime(statusTarget.dateKey, row, statusTarget.idx) };
    } else {
      return null;
    }

    const schedule = wellnessStore.getMedicationScheduleForName(medName, fallbackWeekKey);
    const times =
      schedule.times.length > 0
        ? schedule.times
        : row.time?.trim()
          ? [row.time.trim()]
          : [format(new Date(), 'HH:mm')];
    const repeat = schedule.repeat;
    const intakeDaysSummary = formatIntakeDaysSummary(repeat, t, weekdayLabels);

    return {
      row: { ...row, time: times[0] },
      repeat,
      intakeDaysSummary,
      weekKey: schedule.planWeekKey,
      durationStartKey: repeat.startDateKey ?? defaultDurationStart,
      times,
    };
  }, [catalogScheduleTarget, statusTarget, weekDays, locale, t, currentWeekKey]);

  useEffect(() => {
    if (!showMedicationSchedule || !scheduleContext) return;
    if (scheduleContext.row.time?.trim()) return;
    wellnessStore.setMedicationIntakeTimes(
      scheduleContext.weekKey,
      scheduleContext.row.medication,
      scheduleContext.times,
      scheduleContext.repeat,
    );
  }, [showMedicationSchedule, scheduleContext]);

  const { currentWeekPage, totalWeekPages } = useMemo(() => {
    const weekStartsOn = 1 as const;
    const monthStart = startOfMonth(currentDate);
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn });
    const monthStartWeek = startOfWeek(monthStart, { weekStartsOn });
    const monthEndWeek = startOfWeek(endOfMonth(currentDate), { weekStartsOn });
    return {
      currentWeekPage: differenceInCalendarWeeks(currentWeekStart, monthStartWeek, { weekStartsOn }) + 1,
      totalWeekPages: differenceInCalendarWeeks(monthEndWeek, monthStartWeek, { weekStartsOn }) + 1,
    };
  }, [currentDate]);

  const toggleExpanded = (key: string) => {
    setExpandedInputs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBlur = (key: string) => {
    setInputSelections((prev) => ({ ...prev, [key]: { start: 0, end: 0 } }));
  };

  const handleFocus = (key: string) => {
    lastFocusedFieldKey.current = key;
    setInputSelections((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    requestAnimationFrame(() => {
      setTimeout(() => scrollFieldIntoView(key), Platform.OS === 'ios' ? 80 : 200);
    });
  };

  const medInputRefs = useRef<Record<string, Array<TextInput | null>>>({});

  const focusMedInput = (dateKey: string, idx: number) => {
    medInputRefs.current[dateKey]?.[idx]?.focus();
  };

  const setMedRef = (dateKey: string, idx: number, el: TextInput | null) => {
    if (!medInputRefs.current[dateKey]) medInputRefs.current[dateKey] = [];
    medInputRefs.current[dateKey][idx] = el;
  };

  const renderSectionField = (
    dateKey: string,
    field: 'sleep' | 'sport' | 'events',
    label: string,
    value: string,
  ) => {
    const expandKey = `${dateKey}-${field}`;
    return (
      <View
        ref={(node) => {
          fieldAnchorRefs.current[expandKey] = node;
        }}
        collapsable={false}
        style={[styles.sectionBlock, { borderColor: ui.rowBorder }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary, backgroundColor: ui.sectionLabelBg }]}>
          {label}
        </Text>
        <View style={styles.sectionInputWrap}>
          <ExpandableInput
            value={value}
            onChangeText={(text) => wellnessStore.updateDayField(dateKey, field, text)}
            expandKey={expandKey}
            isExpanded={!!expandedInputs[expandKey]}
            onToggleExpand={() => toggleExpanded(expandKey)}
            onFocus={() => handleFocus(expandKey)}
            onBlur={() => handleBlur(expandKey)}
            selection={inputSelections[expandKey]}
            iconMuted={ui.iconMuted}
            placeholder="..."
            placeholderTextColor={theme.textSecondary}
            color={theme.text}
          />
        </View>
      </View>
    );
  };

  const renderPanicAttackField = (dateKey: string, storedDay: typeof wellnessStore.days[string] | undefined) => (
    <PanicAttackCountInput
      label={t.panicAttackDay}
      count={resolvePanicAttackCount(storedDay)}
      language={language}
      labels={t}
      theme={{
        text: theme.text,
        textSecondary: theme.textSecondary,
        activeBg: ui.activeBg,
        activeText: ui.activeText,
        inactiveBg: ui.inactiveBg,
        inactiveBorder: ui.inactiveBorder,
        inactiveText: ui.inactiveText,
        rowBorder: ui.rowBorder,
        sectionLabelBg: ui.sectionLabelBg,
        panicRowBg: ui.panicRowBg,
        iconMuted: ui.iconMuted,
      }}
      onChange={(count) => wellnessStore.setPanicAttackCount(dateKey, count)}
    />
  );

  const renderDayNotesGroup = (dateKey: string, day: Date, storedDay: typeof wellnessStore.days[string] | undefined) => {
    const notesExpandKey = `${dateKey}-notes`;
    const isNotesExpanded =
      notesExpandKey in expandedInputs
        ? !!expandedInputs[notesExpandKey]
        : isDayNotesExpandedByDefault(day);
    const hasNotes =
      resolvePanicAttackCount(storedDay) > 0 ||
      hasSleepLogContent(parseSleepLog(storedDay?.sleep ?? '')) ||
      hasTriggerLogContent(parseTriggerLog(storedDay?.triggers ?? '')) ||
      hasSportLogContent(parseSportLog(storedDay?.sport ?? '')) ||
      [storedDay?.events].some((v) => v?.trim());

    return (
      <View style={[styles.dayNotesGroup, { borderColor: ui.rowBorder }]}>
        <Pressable
          onPress={() => toggleExpanded(notesExpandKey)}
          style={({ pressed }) => [styles.dayNotesHeader, pressed && styles.pressed]}>
          <View style={styles.dayNotesHeaderLeft}>
            <Text style={[styles.dayNotesTitle, { color: theme.textSecondary }]}>{t.dayNotes}</Text>
            {!isNotesExpanded && hasNotes ? (
              <View style={[styles.dayNotesDot, { backgroundColor: ui.accent }]} />
            ) : null}
          </View>
          <Ionicons name={isNotesExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={ui.iconMuted} />
        </Pressable>
        {isNotesExpanded ? (
          <View style={[styles.dayNotesBody, { backgroundColor: ui.notesBlockBg, borderColor: ui.dayBorder }]}>
            <SleepInput
              label={t.sleep}
              value={storedDay?.sleep ?? ''}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                inactiveBg: ui.inactiveBg,
                inactiveBorder: ui.inactiveBorder,
                inactiveText: ui.inactiveText,
                modalOverlay: ui.modalOverlay,
                modalBg: ui.modalBg,
                subtlePanelBorder: ui.subtlePanelBorder,
                sectionLabelBg: ui.sectionLabelBg,
                rowBorder: ui.rowBorder,
                iconMuted: ui.iconMuted,
              }}
              onChange={(text) => wellnessStore.updateDayField(dateKey, 'sleep', text)}
            />
            <TriggersInput
              label={t.triggers}
              value={storedDay?.triggers ?? ''}
              language={language}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                inactiveBg: ui.inactiveBg,
                inactiveBorder: ui.inactiveBorder,
                inactiveText: ui.inactiveText,
                sectionLabelBg: ui.sectionLabelBg,
                rowBorder: ui.rowBorder,
                iconMuted: ui.iconMuted,
              }}
              onChange={(text) => wellnessStore.updateDayField(dateKey, 'triggers', text)}
            />
            <SportInput
              label={t.sport}
              value={storedDay?.sport ?? ''}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                inactiveBg: ui.inactiveBg,
                inactiveBorder: ui.inactiveBorder,
                inactiveText: ui.inactiveText,
                sectionLabelBg: ui.sectionLabelBg,
                rowBorder: ui.rowBorder,
                iconMuted: ui.iconMuted,
              }}
              onChange={(text) => wellnessStore.updateDayField(dateKey, 'sport', text)}
            />
            {renderSectionField(dateKey, 'events', t.events, storedDay?.events ?? '')}
            {renderPanicAttackField(dateKey, storedDay)}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.outer, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.cardWrapper, { maxWidth: MaxContentWidth }]}>
          <View style={[styles.card, { backgroundColor: ui.contentBg, borderColor: ui.cardBorder }]}>
            <View style={[styles.stickyHeader, { borderColor: ui.dayBorder, backgroundColor: ui.contentBg }]}>
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  <Pressable
                    onPress={() => setCurrentDate(subWeeks(currentDate, 1))}
                    style={({ pressed }) => [
                      styles.circleButton,
                      { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="chevron-back" size={20} color={ui.icon} />
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setShowLangPicker(false);
                      setShowMonthPicker(true);
                    }}
                    style={styles.monthPickerButton}>
                    <Text
                      style={[
                        styles.monthTitle,
                        weekHeaderLabel.compactMonthTitle && styles.monthTitleCompact,
                        { color: theme.text },
                      ]}
                      numberOfLines={2}>
                      {weekHeaderLabel.monthTitle}
                    </Text>
                    <Text style={[styles.monthYear, { color: theme.textSecondary }]}>{weekHeaderLabel.yearTitle}</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setCurrentDate(addWeeks(currentDate, 1))}
                    style={({ pressed }) => [
                      styles.circleButton,
                      { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="chevron-forward" size={20} color={ui.icon} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.tableHeaderRow}>
                <View style={styles.colDelete} />
                <View style={styles.colTime}>
                  <Text style={[styles.tableHeaderText, { color: theme.textSecondary }]}>{t.time}</Text>
                </View>
                <View style={styles.colMed}>
                  <Text style={[styles.tableHeaderText, { color: theme.textSecondary }]}>{t.medication}</Text>
                </View>
                <View style={styles.colStatus}>
                  <Text style={[styles.tableHeaderText, { color: theme.textSecondary }]}>{t.status}</Text>
                </View>
              </View>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={[styles.scroll, { backgroundColor: ui.contentBg }]}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  backgroundColor: ui.contentBg,
                  paddingBottom: 32 + footerHeight + keyboardHeight,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              onScroll={(event) => {
                scrollYRef.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}>
              {weekDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const storedDay = wellnessStore.days[dateKey];
                const dayLog = wellnessStore.getDay(dateKey);
                const storedMeds = storedDay?.medications ?? dayLog.medications;
                const isToday = isSameDay(day, new Date());
                const isPastDay = isPast(day) && !isToday;
                const isSunday = getDay(day) === 0;
                const adherence = wellnessStore.getMedicationAdherence(dateKey);

                const displayCount = Math.max(storedMeds.length, DEFAULT_MEDICATION_ROWS);
                const medRows: MedicationRow[] = Array.from({ length: displayCount }).map((_, idx) => {
                  if (storedMeds[idx]) return storedMeds[idx];
                  return {
                    id: generateSafeId(dateKey, idx, storedMeds),
                    time: '',
                    medication: '',
                    taken: false,
                    skipped: false,
                    reminderEnabled: true,
                  };
                });

                const reviewBg =
                  isReviewMode && isPastDay && !isSunday
                    ? adherence === 'full'
                      ? 'rgba(34, 197, 94, 0.08)'
                      : adherence === 'partial' || adherence === 'none'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'transparent'
                    : 'transparent';

                const dayHeaderBg =
                  isReviewMode && isPastDay && !isSunday && adherence !== 'empty'
                    ? adherence === 'full'
                      ? 'rgba(34, 197, 94, 0.16)'
                      : 'rgba(239, 68, 68, 0.16)'
                    : ui.dayHeaderBg;

                return (
                  <View key={dateKey} style={[styles.daySection, { backgroundColor: reviewBg }]}>
                    <View style={[styles.dayDivider, { backgroundColor: ui.dayBorder }]} />
                    <View style={[styles.dayHeader, { backgroundColor: dayHeaderBg }]}>
                      <View style={styles.dayHeaderTextWrap}>
                        <Text
                          style={[
                            styles.dayHeaderText,
                            { color: theme.text },
                            isReviewMode && isPastDay ? { textDecorationLine: 'line-through', opacity: 0.4 } : null,
                          ]}>
                          {format(day, 'EEEE', { locale })}
                        </Text>
                        <Text style={[styles.dayHeaderSubText, { color: theme.textSecondary }]}>
                          ({format(day, 'd.MM')})
                        </Text>
                        {isToday ? <View style={[styles.todayDot, { backgroundColor: ui.accent }]} /> : null}
                      </View>
                      <Pressable
                        onPress={() => wellnessStore.addMedicationRow(dateKey)}
                        style={({ pressed }) => [
                          styles.smallCircleButton,
                          { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                          pressed && styles.pressed,
                        ]}>
                        <Ionicons name="add" size={16} color={ui.icon} />
                      </Pressable>
                    </View>
                    <View style={[styles.dayDivider, { backgroundColor: ui.dayBorder }]} />

                    <Text style={[styles.blockTitle, { color: theme.textSecondary, backgroundColor: 'transparent' }]}>
                      {t.medications}
                    </Text>

                    <View style={[styles.dayNotesBody, { backgroundColor: ui.notesBlockBg, borderColor: ui.dayBorder }]}>
                    {medRows.map((row, idx) => {
                      const medExpandKey = `${dateKey}-med-${row.id}`;
                      const displayTime = wellnessStore.resolveMedicationRowTime(dateKey, row, idx);
                      const canStrike = row.taken || row.skipped || (isReviewMode && isPastDay);
                      const hasReminder = !!displayTime?.trim() && !!row.medication.trim();
                      const canDeleteRow =
                        storedMeds.length > DEFAULT_MEDICATION_ROWS && idx < storedMeds.length;

                      return (
                        <View key={row.id} style={[styles.row, { borderColor: ui.rowBorder }]}>
                          <View style={styles.colDeleteCell}>
                            <Pressable
                              onPress={() => wellnessStore.deleteMedicationRow(dateKey, idx)}
                              disabled={!canDeleteRow}
                              hitSlop={6}
                              style={({ pressed }) => [styles.deleteBtn, pressed && canDeleteRow && styles.pressed]}>
                              <Ionicons
                                name="remove-circle"
                                size={20}
                                color={ui.iconMuted}
                                style={{ opacity: canDeleteRow ? 1 : 0.35 }}
                              />
                            </Pressable>
                          </View>
                          <View style={styles.colTimeCell}>
                            <Pressable
                              onPress={() =>
                                setMedTimeTarget({
                                  dateKey,
                                  rowId: row.id,
                                  idx,
                                  time: displayTime,
                                })
                              }
                              style={({ pressed }) => [styles.timeBtn, pressed && styles.pressed]}>
                              <Text
                                style={[
                                  styles.timeText,
                                  {
                                    color: displayTime?.trim() ? theme.text : theme.textSecondary,
                                    opacity: canStrike ? 0.3 : 1,
                                    textDecorationLine: canStrike ? 'line-through' : 'none',
                                  },
                                ]}>
                                {displayTime?.trim()
                                  ? formatTimeValue(parseTimeValue(displayTime))
                                  : formatTimeValue(new Date())}
                              </Text>
                            </Pressable>
                          </View>
                          <View style={styles.colMedCell}>
                            <ExpandableInput
                              value={row.medication}
                              onChangeText={(text) =>
                                wellnessStore.updateMedication(dateKey, row.id, { medication: text }, idx)
                              }
                              expandKey={medExpandKey}
                              isExpanded={!!expandedInputs[medExpandKey]}
                              onToggleExpand={() => toggleExpanded(medExpandKey)}
                              onFocus={() => handleFocus(medExpandKey)}
                              onBlur={() => handleBlur(medExpandKey)}
                              selection={inputSelections[medExpandKey]}
                              iconMuted={ui.iconMuted}
                              placeholder={t.medicationPlaceholder}
                              placeholderTextColor={theme.textSecondary}
                              color={theme.text}
                              opacity={canStrike ? 0.3 : 1}
                              textDecorationLine={canStrike ? 'line-through' : 'none'}
                              returnKeyType={expandedInputs[medExpandKey] ? 'default' : 'next'}
                              blurOnSubmit={false}
                              onSubmitEditing={() => {
                                const isLast = idx === medRows.length - 1;
                                if (isLast) {
                                  wellnessStore.addMedicationRow(dateKey);
                                  setTimeout(() => focusMedInput(dateKey, idx + 1), 50);
                                } else {
                                  focusMedInput(dateKey, idx + 1);
                                }
                              }}
                            />
                          </View>
                          <View style={styles.colReminderCell}>
                            <Pressable
                              onPress={() => wellnessStore.toggleMedicationReminder(dateKey, row.id, idx)}
                              disabled={!hasReminder}
                              style={({ pressed }) => [
                                styles.reminderButton,
                                pressed && styles.pressed,
                                row.reminderEnabled && hasReminder ? { backgroundColor: ui.reminderOnBg } : null,
                                !hasReminder ? { opacity: 0.25 } : null,
                              ]}>
                              <Ionicons
                                name={row.reminderEnabled ? 'notifications' : 'notifications-off-outline'}
                                size={13}
                                color={ui.icon}
                              />
                            </Pressable>
                          </View>
                          <View style={styles.colCheckCell}>
                            <View style={styles.takenStatusWrap}>
                              <Pressable
                                onPress={() => setStatusTarget({ dateKey, rowId: row.id, idx })}
                                style={({ pressed }) => [
                                  styles.checkButton,
                                  pressed && styles.pressed,
                                  row.taken
                                    ? [styles.checkOn, { backgroundColor: ui.activeBg, borderColor: ui.activeBg }]
                                    : row.skipped
                                      ? [styles.checkSkipped, { backgroundColor: ui.checkOffBg, borderColor: '#ef4444' }]
                                      : [styles.checkOff, { backgroundColor: ui.checkOffBg, borderColor: ui.checkOffBorder }],
                                ]}>
                                {row.taken ? <Ionicons name="checkmark" size={14} color={ui.activeText} /> : null}
                                {row.skipped ? <Ionicons name="close" size={14} color="#ef4444" /> : null}
                              </Pressable>
                              {row.taken && row.takenAt ? (
                                <Text style={[styles.takenAtText, { color: theme.textSecondary }]}>{row.takenAt}</Text>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    </View>

                    {renderDayNotesGroup(dateKey, day, storedDay)}
                  </View>
                );
              })}

              <View style={[styles.dayDivider, { backgroundColor: ui.dayBorder }]} />

              <View
                ref={(node) => {
                  fieldAnchorRefs.current[`week-${currentWeekKey}`] = node;
                }}
                collapsable={false}
                style={styles.weeklyNotesWrap}>
                {showWeeklySummaryNudge ? (
                  <Pressable
                    onPress={() => wellnessStore.markWeeklySummaryNudgeSeen()}
                    style={({ pressed }) => [
                      styles.weeklyNudgeBanner,
                      { backgroundColor: ui.subtlePanelBg, borderColor: ui.subtlePanelBorder },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="calendar-outline" size={16} color={ui.accent} />
                    <Text style={[styles.weeklyNudgeText, { color: theme.textSecondary }]}>{t.weeklySummaryNudge}</Text>
                    <Ionicons name="close" size={14} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
                <View style={styles.weeklyNotesHeader}>
                  <Text style={[styles.weeklyNotesTitle, { color: theme.textSecondary, borderColor: ui.rowBorder }]}>
                    {t.weeklySummary}
                  </Text>
                  <Pressable
                    onPress={handleExportWeeklyPdf}
                    disabled={isExportingWeeklyPdf}
                    style={({ pressed }) => [
                      styles.weeklyExportButton,
                      {
                        backgroundColor: ui.circleBg,
                        borderColor: ui.circleBorder,
                        opacity: isExportingWeeklyPdf ? 0.6 : 1,
                      },
                      pressed && !isExportingWeeklyPdf && styles.pressed,
                    ]}>
                    <Ionicons name="document-text-outline" size={14} color={ui.icon} />
                    <Text style={[styles.weeklyExportButtonText, { color: theme.text }]}>{t.weeklyExportPdf}</Text>
                  </Pressable>
                </View>
                <WeeklySummaryCharts
                  weekDays={weekDays}
                  days={wellnessStore.days}
                  labels={t}
                  locale={locale}
                  language={language}
                  theme={{
                    text: theme.text,
                    textSecondary: theme.textSecondary,
                    panelBg: ui.notesBlockBg,
                    barColor: theme.text,
                    borderColor: ui.rowBorder,
                  }}
                />
                <ExpandableInput
                  value={wellnessStore.weeklySummary[currentWeekKey] || ''}
                  onChangeText={(text) => wellnessStore.updateWeeklySummary(currentWeekKey, text)}
                  expandKey={`week-${currentWeekKey}`}
                  isExpanded={!!expandedInputs[`week-${currentWeekKey}`]}
                  onToggleExpand={() => toggleExpanded(`week-${currentWeekKey}`)}
                  onFocus={() => {
                    wellnessStore.markWeeklySummaryNudgeSeen();
                    handleFocus(`week-${currentWeekKey}`);
                  }}
                  onBlur={() => handleBlur(`week-${currentWeekKey}`)}
                  selection={inputSelections[`week-${currentWeekKey}`]}
                  iconMuted={ui.iconMuted}
                  placeholder="..."
                  placeholderTextColor={theme.textSecondary}
                  color={theme.text}
                  style={styles.weeklyInput}
                />
              </View>
            </ScrollView>

            <View
              style={[styles.footer, { borderColor: ui.footerBorder, backgroundColor: ui.footerBg }]}
              onLayout={(event) => {
                setFooterHeight(event.nativeEvent.layout.height);
              }}>
              <View style={styles.footerActions}>
                <Pressable
                  onPress={() => setShowAllMedications(true)}
                  accessibilityLabel={t.allMedicationsTitle}
                  style={({ pressed }) => [
                    styles.footerIconButton,
                    { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="medkit-outline" size={18} color={ui.icon} />
                  <Text style={[styles.footerIconLabel, styles.footerIconLabelCompact, { color: theme.text }]}>
                    {t.allMedicationsButton}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowAllMedications(false);
                    setShowLangPicker(true);
                  }}
                  accessibilityLabel={t.selectLanguage}
                  style={({ pressed }) => [
                    styles.footerIconButton,
                    { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="globe-outline" size={18} color={ui.icon} />
                  <Text style={[styles.footerIconLabel, { color: theme.text }]}>{language.toUpperCase()}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowLangPicker(false);
                    setShowMonthPicker(true);
                  }}
                  accessibilityLabel={t.selectMonth}
                  style={({ pressed }) => [
                    styles.footerIconButton,
                    styles.footerIconButtonIconOnly,
                    { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="settings-outline" size={18} color={ui.icon} />
                </Pressable>
                <Pressable
                  ref={infoButtonRef}
                  collapsable={false}
                  onPress={() => setShowImportantInfo(true)}
                  accessibilityLabel={t.importantInfoTitle}
                  style={({ pressed }) => [
                    styles.footerIconButton,
                    styles.footerIconButtonIconOnly,
                    { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="information-circle-outline" size={18} color={ui.icon} />
                </Pressable>
              </View>
              <Pressable
                ref={panicButtonRef}
                collapsable={false}
                onPress={() => setShowPanicAttack(true)}
                accessibilityLabel={t.panicAttackButton}
                accessibilityHint={t.panicAttackButton}
                style={({ pressed }) => [
                  styles.panicButton,
                  { backgroundColor: ui.activeBg, borderColor: ui.activeBg, shadowOpacity: ui.circleShadow },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="pulse" size={24} color={ui.activeText} />
              </Pressable>
            </View>

            <ImportantInfoModal
              visible={showImportantInfo}
              language={language}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                modalOverlay: ui.modalOverlay,
                modalBg: ui.modalBg,
                subtlePanelBorder: ui.subtlePanelBorder,
                sectionLabelBg: ui.sectionLabelBg,
              }}
              onClose={() => setShowImportantInfo(false)}
            />

            <OnboardingModal
              key={showOnboarding ? 'onboarding-open' : 'onboarding-closed'}
              visible={showOnboarding}
              language={language}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                inactiveBg: ui.inactiveBg,
                inactiveBorder: ui.inactiveBorder,
                inactiveText: ui.inactiveText,
                modalBg: ui.modalBg,
                subtlePanelBg: ui.subtlePanelBg,
                subtlePanelBorder: ui.subtlePanelBorder,
                sectionLabelBg: ui.sectionLabelBg,
              }}
              onLanguageChange={handleLanguageChange}
              onLearnMore={() => setShowImportantInfo(true)}
              onComplete={handleOnboardingComplete}
            />

            <CoachMarksOverlay
              key={showCoachMarks ? 'coach-open' : 'coach-closed'}
              visible={showCoachMarks}
              step={coachMarkStep}
              panicTarget={panicCoachTarget}
              infoTarget={infoCoachTarget}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                modalOverlay: ui.modalOverlay,
                modalBg: ui.modalBg,
                subtlePanelBorder: ui.subtlePanelBorder,
              }}
              onNext={() => {
                setCoachMarkStep(1);
                setTimeout(measureCoachMarkTargets, 120);
              }}
              onDismiss={() => wellnessStore.dismissCoachMarks()}
            />

            <PanicAttackModal
              visible={showPanicAttack}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                modalOverlay: ui.modalOverlay,
                modalBg: ui.modalBg,
                subtlePanelBorder: ui.subtlePanelBorder,
                sectionLabelBg: ui.sectionLabelBg,
              }}
              onClose={() => setShowPanicAttack(false)}
            />

            {isMonthPickerMounted ? (
              <Animated.View
                style={[
                  styles.modalOverlayFullScreen,
                  {
                    backgroundColor: ui.modalBg,
                    opacity: monthPickerAnim,
                    transform: [
                      {
                        translateY: monthPickerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [24, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <View style={[styles.modalCardFullScreen, { backgroundColor: ui.modalMutedBg }]}>
                  <View style={styles.modalHeaderRow}>
                    <Text style={[styles.modalTitle, { color: theme.textSecondary }]}>{t.selectMonth}</Text>
                    <Pressable
                      onPress={() => setShowMonthPicker(false)}
                      style={({ pressed }) => [
                        styles.circleButton,
                        { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="close" size={22} color={ui.icon} />
                    </Pressable>
                  </View>

                  <View style={styles.yearStepperRow}>
                    <Pressable
                      onPress={() => setCurrentDate(subYears(currentDate, 1))}
                      style={({ pressed }) => [
                        styles.yearNavButton,
                        { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="chevron-back" size={24} color={ui.icon} />
                    </Pressable>
                    <View style={styles.yearTitleWrap}>
                      <Text style={[styles.yearTitleText, { color: theme.text }]}>{format(currentDate, 'yyyy')}</Text>
                      <Pressable
                        onPress={() => {
                          setCurrentDate(new Date());
                          setShowMonthPicker(false);
                        }}
                        style={({ pressed }) => [
                          styles.todayButton,
                          { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.todayButtonText, { color: theme.text }]}>{t.today}</Text>
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => setCurrentDate(addYears(currentDate, 1))}
                      style={({ pressed }) => [
                        styles.yearNavButton,
                        { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="chevron-forward" size={24} color={ui.icon} />
                    </Pressable>
                  </View>

                  <View style={[styles.monthPickerDivider, { backgroundColor: ui.dayBorder }]} />

                  <View style={[styles.reviewRow, { backgroundColor: ui.subtlePanelBg, borderColor: ui.subtlePanelBorder }]}>
                    <View style={styles.reviewTextWrap}>
                      <Text style={[styles.reviewTitle, { color: theme.text }]}>{t.reviewMode}</Text>
                      <Text style={[styles.reviewSubText, { color: theme.textSecondary }]}>{t.reviewModeHint}</Text>
                    </View>
                    <Switch value={isReviewMode} onValueChange={setIsReviewMode} />
                  </View>

                  <View style={[styles.reviewRow, { backgroundColor: ui.subtlePanelBg, borderColor: ui.subtlePanelBorder }]}>
                    <View style={styles.reviewTextWrap}>
                      <Text style={[styles.reviewTitle, { color: theme.text }]}>{t.reminder}</Text>
                      <Text style={[styles.reviewSubText, { color: theme.textSecondary }]}>{t.reminderHint}</Text>
                    </View>
                    <Pressable
                      onPress={() => void ensureNotificationPermissions()}
                      style={({ pressed }) => [
                        styles.reminderSetupBtn,
                        { backgroundColor: ui.activeBg },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="notifications-outline" size={16} color={ui.activeText} />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => {
                      wellnessStore.resetOnboarding();
                      setShowMonthPicker(false);
                    }}
                    style={({ pressed }) => [
                      styles.onboardingAgainBtn,
                      { backgroundColor: ui.circleBg, borderColor: ui.circleBorder },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="school-outline" size={16} color={ui.icon} />
                    <Text style={[styles.onboardingAgainText, { color: theme.text }]}>{t.showOnboardingAgain}</Text>
                  </Pressable>

                  <View style={styles.monthsGrid}>
                    {MONTHS.map((m) => {
                      const date = new Date(currentDate.getFullYear(), m, 1);
                      const isActive = currentDate.getMonth() === m;
                      return (
                        <Pressable
                          key={m}
                          onPress={() => {
                            setCurrentDate(date);
                            setShowMonthPicker(false);
                          }}
                          style={({ pressed }) => [
                            styles.monthButton,
                            isActive
                              ? [styles.monthButtonActive, { backgroundColor: ui.activeBg, borderColor: ui.activeBg }]
                              : [styles.monthButtonInactive, { backgroundColor: ui.inactiveBg, borderColor: ui.inactiveBorder }],
                            pressed && styles.pressed,
                          ]}>
                          <Text
                            style={[
                              isActive ? styles.monthButtonTextActive : styles.monthButtonTextInactive,
                              { color: isActive ? ui.activeText : ui.inactiveText },
                            ]}>
                            {format(date, 'MMMM', { locale })}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {showAllMedications ? (
              <AllMedicationsModal
                visible
                labels={t}
                theme={{
                  text: theme.text,
                  textSecondary: theme.textSecondary,
                  activeBg: ui.activeBg,
                  activeText: ui.activeText,
                  inactiveBg: ui.inactiveBg,
                  inactiveBorder: ui.inactiveBorder,
                  inactiveText: ui.inactiveText,
                  modalOverlay: ui.modalOverlay,
                  modalBg: ui.modalBg,
                  subtlePanelBorder: ui.subtlePanelBorder,
                  buttonShadow: ui.circleShadow,
                }}
                onClose={() => setShowAllMedications(false)}
                onOpenSchedule={(entry) => {
                  const medication = catalogEntryMedicationLabel(entry);
                  if (!medication.trim()) return;
                  setCatalogScheduleTarget({ medication, time: '' });
                  setShowAllMedications(false);
                  setShowMedicationSchedule(true);
                }}
              />
            ) : null}

            {statusTarget && !showMedicationSchedule ? (
              <MedicationStatusModal
                visible
                labels={t}
                theme={{
                  text: theme.text,
                  textSecondary: theme.textSecondary,
                  activeBg: ui.activeBg,
                  activeText: ui.activeText,
                  inactiveBg: ui.inactiveBg,
                  inactiveBorder: ui.inactiveBorder,
                  inactiveText: ui.inactiveText,
                  modalOverlay: ui.modalOverlay,
                  modalBg: ui.modalBg,
                  subtlePanelBorder: ui.subtlePanelBorder,
                  buttonShadow: ui.circleShadow,
                }}
                onClose={() => {
                  setStatusTarget(null);
                  setShowMedicationSchedule(false);
                }}
                onOpenSchedule={() => setShowMedicationSchedule(true)}
                onSelectTaken={() => {
                  wellnessStore.setMedicationStatus(statusTarget.dateKey, statusTarget.rowId, statusTarget.idx, 'taken');
                  setStatusTarget(null);
                  setShowMedicationSchedule(false);
                }}
                onSelectSkipped={() => {
                  wellnessStore.setMedicationStatus(statusTarget.dateKey, statusTarget.rowId, statusTarget.idx, 'skipped');
                  setStatusTarget(null);
                  setShowMedicationSchedule(false);
                }}
              />
            ) : null}

            {showMedicationSchedule && scheduleContext ? (
              <MedicationScheduleModal
                visible
                labels={t}
                theme={{
                  text: theme.text,
                  textSecondary: theme.textSecondary,
                  activeBg: ui.activeBg,
                  activeText: ui.activeText,
                  inactiveBg: ui.inactiveBg,
                  inactiveBorder: ui.inactiveBorder,
                  inactiveText: ui.inactiveText,
                  modalOverlay: ui.modalOverlay,
                  modalBg: ui.modalBg,
                  subtlePanelBorder: ui.subtlePanelBorder,
                  buttonShadow: ui.circleShadow,
                }}
                medication={scheduleContext.row.medication}
                times={scheduleContext.times}
                intakeDaysSummary={scheduleContext.intakeDaysSummary}
                repeat={scheduleContext.repeat}
                weekdayLabels={weekDays.map((dayItem) => format(dayItem, 'EEE', { locale }).toUpperCase())}
                durationStartKey={scheduleContext.durationStartKey}
                locale={locale}
                onClose={() => {
                  setShowMedicationSchedule(false);
                  setCatalogScheduleTarget(null);
                }}
                onDelete={() => {
                  wellnessStore.deleteMedicationSchedule(
                    scheduleContext.weekKey,
                    scheduleContext.row.medication,
                  );
                  setShowMedicationSchedule(false);
                  setCatalogScheduleTarget(null);
                  setStatusTarget(null);
                }}
                onUpdateRepeat={(repeat) => {
                  wellnessStore.setMedicationIntakeRepeat(scheduleContext.weekKey, scheduleContext.row, repeat);
                }}
                onUpdateDuration={(updates) => {
                  wellnessStore.setMedicationDuration(scheduleContext.weekKey, scheduleContext.row, updates);
                }}
                onUpdateTimes={(times) => {
                  wellnessStore.setMedicationIntakeTimes(
                    scheduleContext.weekKey,
                    scheduleContext.row.medication,
                    times,
                    scheduleContext.repeat,
                  );
                }}
              />
            ) : null}

            <MedicationTimePickerModal
              visible={medTimeTarget !== null}
              title={t.time}
              labels={t}
              theme={{
                text: theme.text,
                textSecondary: theme.textSecondary,
                activeBg: ui.activeBg,
                activeText: ui.activeText,
                inactiveBg: ui.inactiveBg,
                inactiveBorder: ui.inactiveBorder,
                inactiveText: ui.inactiveText,
                modalOverlay: ui.modalOverlay,
                modalBg: ui.modalBg,
                subtlePanelBorder: ui.subtlePanelBorder,
              }}
              initialTime={
                medTimeTarget?.time?.trim()
                  ? medTimeTarget.time
                  : formatTimeValue(new Date())
              }
              onClose={() => setMedTimeTarget(null)}
              onSelect={(time) => {
                if (!medTimeTarget) return;
                wellnessStore.updateMedication(
                  medTimeTarget.dateKey,
                  medTimeTarget.rowId,
                  { time: formatTimeValue(parseTimeValue(time)) },
                  medTimeTarget.idx,
                );
              }}
            />

            {showLangPicker ? (
              <Modal transparent visible animationType="fade">
                <Pressable
                  style={[styles.langModalOverlay, { backgroundColor: ui.modalOverlay }]}
                  onPress={() => setShowLangPicker(false)}>
                  <View style={[styles.langModalCard, { backgroundColor: ui.modalBg, borderColor: ui.subtlePanelBorder }]}>
                    <Text style={[styles.modalTitle, { color: theme.textSecondary }]}>{t.selectLanguage}</Text>
                    <View style={styles.langList}>
                      {(Object.keys(LANGUAGES) as Language[]).map((lang) => {
                        const active = language === lang;
                        return (
                          <Pressable
                            key={lang}
                            onPress={() => {
                              handleLanguageChange(lang);
                              setShowLangPicker(false);
                            }}
                            style={({ pressed }) => [
                              styles.langRow,
                              active
                                ? [styles.langRowActive, { backgroundColor: ui.activeBg, borderColor: ui.activeBg }]
                                : [styles.langRowInactive, { backgroundColor: ui.inactiveBg, borderColor: ui.inactiveBorder }],
                              pressed && styles.pressed,
                            ]}>
                            <Text
                              style={[
                                active ? styles.langRowTextActive : styles.langRowTextInactive,
                                { color: active ? ui.activeText : ui.inactiveText },
                              ]}>
                              {LANGUAGES[lang].name}
                            </Text>
                            {active ? <Ionicons name="checkmark" size={16} color={ui.activeText} /> : <View style={styles.langCheckSpacer} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </Pressable>
              </Modal>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default observer(HomeScreen);

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', alignItems: 'stretch', maxWidth: MaxContentWidth },
  cardWrapper: { width: '100%', flex: 1 },
  card: {
    flex: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 2,
  },
  header: { paddingTop: 24, paddingBottom: 12, paddingHorizontal: 24 },
  stickyHeader: {
    zIndex: 2,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  monthPickerButton: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  monthTitle: { fontSize: 22, fontWeight: '500', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center' },
  monthTitleCompact: { fontSize: 16, letterSpacing: 1 },
  monthYear: { marginTop: 6, fontSize: 12, fontFamily: Fonts.mono, textAlign: 'center' },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pressed: { transform: [{ scale: 0.95 }] },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16 },
  colDelete: { width: 28, flexShrink: 0 },
  colTime: { width: 56, alignItems: 'center' },
  colMed: { flex: 1, alignItems: 'center' },
  colStatus: { width: 56, alignItems: 'center' },
  tableHeaderText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  daySection: {},
  dayDivider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dayHeaderTextWrap: { flex: 1, flexDirection: 'row' },
  dayHeaderText: { fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  dayHeaderSubText: { marginLeft: 4, fontSize: 12, fontWeight: '800', fontFamily: Fonts.mono },
  todayDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
    alignSelf: 'center',
  },
  smallCircleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  blockTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', borderBottomWidth: 1 },
  colDeleteCell: {
    width: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colTimeCell: {
    width: 50,
    flexShrink: 0,
    paddingVertical: 10,
    paddingLeft: 5,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  timeBtn: {
    paddingVertical: 2,
    minWidth: 44,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    fontWeight: '700',
  },
  colMedCell: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 4,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  colReminderCell: {
    width: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  colCheckCell: {
    width: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  takenStatusWrap: {
    alignItems: 'center',
    gap: 2,
  },
  takenAtText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    lineHeight: 10,
  },
  reminderButton: {
    width: 28,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButton: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkOn: { borderWidth: 1 },
  checkOff: { borderWidth: 1 },
  checkSkipped: { borderWidth: 1 },
  dayNotesGroup: { borderTopWidth: 1 },
  dayNotesBody: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dayNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  dayNotesHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayNotesTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dayNotesDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionBlock: { borderBottomWidth: 1 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionInputWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  weeklyNotesWrap: { paddingHorizontal: 10, paddingTop: 18 },
  weeklyNudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  weeklyNudgeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  weeklyNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  weeklyNotesTitle: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  weeklyExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  weeklyExportButtonText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  weeklyInput: { minHeight: 96 },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    borderTopWidth: 1,
    gap: 8,
  },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  panicButton: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  footerIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  footerIconButtonIconOnly: { width: 36, paddingHorizontal: 0 },
  footerIconLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  footerIconLabelCompact: { fontSize: 7, letterSpacing: 0.3, maxWidth: 72, textAlign: 'center' },
  modalOverlayFullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  modalCardFullScreen: { flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 18 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' },
  yearStepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthPickerDivider: { height: 1, marginVertical: 24 },
  yearNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  yearTitleWrap: { flex: 1, alignItems: 'center' },
  yearTitleText: { fontSize: 40, fontFamily: Fonts.mono, fontWeight: '800' },
  todayButton: {
    marginTop: 10,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  todayButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  reviewTextWrap: { flex: 1, paddingRight: 12 },
  reviewTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  reviewSubText: { marginTop: 4, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  reminderSetupBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  onboardingAgainText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthButton: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  monthButtonActive: {},
  monthButtonInactive: {},
  monthButtonTextActive: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  monthButtonTextInactive: { fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  langModalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  langModalCard: { width: '85%', paddingHorizontal: 24, paddingVertical: 18, borderRadius: 18, borderWidth: 1 },
  langList: { marginTop: 10, gap: 10 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  langRowActive: {},
  langRowInactive: {},
  langRowTextActive: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  langRowTextInactive: { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  langCheckSpacer: { width: 16, height: 16 },
});

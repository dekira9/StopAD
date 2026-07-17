import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AllMedicationsModal, catalogEntryMedicationLabel } from '@/components/all-medications-modal';
import { CoachMarksOverlay, type CoachMarkTarget } from '@/components/coach-marks-overlay';
import { DayDottedDivider } from '@/components/day-dotted-divider';
import { DaySectionCollapsible } from '@/components/day-section-collapsible';
import { ExpandableInput } from '@/components/expandable-input';
import { GrowthRingsSection } from '@/components/growth-rings-section';
import { ImportantInfoModal } from '@/components/important-info-modal';
import { MedicationIntakeLegendModal } from '@/components/medication-intake-legend-modal';
import { MedicationScheduleModal } from '@/components/medication-schedule-modal';
import { MedicationStatusModal } from '@/components/medication-status-modal';
import { formatTimeValue, MedicationTimePickerModal, parseTimeValue } from '@/components/medication-time-picker-modal';
import { OnboardingModal, type OnboardingResult } from '@/components/onboarding-modal';
import { PanicAttackCountInput } from '@/components/panic-attack-count-input';
import { PanicAttackModal } from '@/components/panic-attack-modal';
import { SettingsModal } from '@/components/settings-modal';
import { SleepInput } from '@/components/sleep-input';
import { SleepNightObservationOverlay } from '@/components/sleep-night-observation-modal';
import { SportInput } from '@/components/sport-input';
import { TriggersInput } from '@/components/triggers-input';
import { WeeklySummaryCharts } from '@/components/weekly-summary-charts';
import { LANGUAGES, type Language } from '@/constants/i18n';
import { Fonts, getDayWeekBackground, MaxContentWidth, type WeekdayIndex } from '@/constants/theme';
import {
  dayHeaderTitleStyle,
  dayMedicationsHeaderStyle,
  dayMedicationsStatusStyle,
  daySectionLabelStyle,
  formatSectionTitle,
  sectionTitleStyle,
  weekBodyTextStyle,
  weekButtonTextStyle,
  weekCardTitleStyle,
  weekDateStyle,
  weekFieldLabelStyle,
  weekMonthTitleStyle,
  weekServiceTextStyle,
  weekYearStyle,
} from '@/constants/typography';
import { useAppChromeTheme } from '@/hooks/use-app-chrome-theme';
import { ensureNotificationPermissions } from '@/services/notifications';
import { DEFAULT_MEDICATION_ROWS, formatMedicationLabel, parseMedicationLabel, wellnessStore, type MedicationRow } from '@/stores/wellness-store';
import { formatMonthName, formatWeekDayRange } from '@/utils/date-format';
import { getDayProgress } from '@/utils/day-progress';
import {
  summarizeEvents,
  summarizeSleep,
  summarizeSport,
  summarizeTriggers,
} from '@/utils/day-section-summaries';
import { emptyGrowthRingsLog } from '@/utils/growth-ring-log';
import { formatIntakeDaysSummary } from '@/utils/medication-intake';
import { resolvePanicAttackCount } from '@/utils/panic-attack-log';
import { parseSleepLog, serializeSleepLog } from '@/utils/sleep-log';
import { mergeNightObservationIntoSleepLog } from '@/utils/sleep-night-observation';
import { exportWeeklySummaryPdf } from '@/utils/weekly-summary-pdf';
import {
  addDays,
  addWeeks,
  addYears,
  format,
  getDay,
  getMonth,
  getYear,
  isPast,
  isSameDay,
  parse,
  startOfDay,
  startOfWeek,
  subWeeks,
  subYears,
} from 'date-fns';

const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

type MainTab = 'today' | 'week' | 'insights';

function DayCelebrationBanner({
  message,
  accent,
  backgroundColor,
  borderColor,
  textColor,
}: {
  message: string;
  accent: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [message, anim]);

  return (
    <Animated.View
      style={[
        styles.dayCelebrationBanner,
        {
          backgroundColor,
          borderColor,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}>
      <Ionicons name="leaf-outline" size={16} color={accent} />
      <Text style={[styles.dayCelebrationText, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
}

function generateSafeId(dateKey: string, baseIndex: number, existing: MedicationRow[]) {
  let newId = `med-${dateKey}-${baseIndex}`;
  let suffix = 0;
  while (existing.some((r) => r.id === newId)) {
    suffix++;
    newId = `med-${dateKey}-${baseIndex}-${suffix}`;
  }
  return newId;
}

type DisplayMedicationRow = {
  row: MedicationRow;
  originalIndex: number;
  displayTime: string;
};

function getMedicationSortMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function compareMedicationDisplayRows(a: DisplayMedicationRow, b: DisplayMedicationRow) {
  const aMinutes = getMedicationSortMinutes(a.displayTime);
  const bMinutes = getMedicationSortMinutes(b.displayTime);

  if (aMinutes !== null && bMinutes !== null && aMinutes !== bMinutes) {
    return aMinutes - bMinutes;
  }
  if (aMinutes !== null && bMinutes === null) return -1;
  if (aMinutes === null && bMinutes !== null) return 1;

  return a.originalIndex - b.originalIndex;
}

function findNextDose(rows: DisplayMedicationRow[]): DisplayMedicationRow | null {
  const pending = rows.filter(
    (item) => item.row.medication.trim() && !item.row.taken && !item.row.skipped && item.displayTime.trim(),
  );
  if (pending.length === 0) return null;

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = pending.find((item) => {
    const minutes = getMedicationSortMinutes(item.displayTime);
    return minutes !== null && minutes >= nowMinutes;
  });
  return upcoming ?? pending[0];
}

function HomeScreen() {
  const { theme, isDark, chrome: ui } = useAppChromeTheme();
  const insets = useSafeAreaInsets();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [mainTab, setMainTab] = useState<MainTab>('today');
  const [localLanguage, setLocalLanguage] = useState<Language>('ru');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isMonthPickerMounted, setIsMonthPickerMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [expandedInputs, setExpandedInputs] = useState<Record<string, boolean>>({});
  const [inputSelections, setInputSelections] = useState<Record<string, { start: number; end: number }>>({});
  const [statusTarget, setStatusTarget] = useState<{ dateKey: string; rowId: string; idx: number } | null>(null);
  const [showMedicationSchedule, setShowMedicationSchedule] = useState(false);
  const [showAllMedications, setShowAllMedications] = useState(false);
  const [showImportantInfo, setShowImportantInfo] = useState(false);
  const [showMedicationIntakeLegend, setShowMedicationIntakeLegend] = useState(false);
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

  const [monthPickerAnim] = useState(() => new Animated.Value(0));
  const [tabContentAnim] = useState(() => new Animated.Value(1));
  const [tabBarAnim] = useState(() => new Animated.Value(1));
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const fieldAnchorRefs = useRef<Record<string, View | null>>({});
  const lastFocusedFieldKey = useRef<string | null>(null);
  const [nightObservationDateKey, setNightObservationDateKey] = useState<string | null>(null);
  const nightObservationActive = nightObservationDateKey !== null;
  const [footerHeight, setFooterHeight] = useState(72);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const language = wellnessStore.preferredLanguage ?? localLanguage;
  const t = LANGUAGES[language].labels;
  const locale = LANGUAGES[language].locale;
  const showOnboarding = wellnessStore.hydrated && !wellnessStore.onboardingCompleted;
  const shouldEnsureNotificationPermissions = wellnessStore.hydrated && wellnessStore.onboardingCompleted;
  const showCoachMarks =
    wellnessStore.hydrated &&
    wellnessStore.onboardingCompleted &&
    !wellnessStore.coachMarksSeen &&
    !showOnboarding;

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
    const timer = setTimeout(() => {
      setCoachMarkStep(0);
      measureCoachMarkTargets();
    }, 180);
    return () => clearTimeout(timer);
  }, [showCoachMarks, measureCoachMarkTargets, footerHeight]);

  const handleOnboardingComplete = useCallback(
    (result: OnboardingResult) => {
      setLocalLanguage(result.language);
      wellnessStore.setPreferredLanguage(result.language);
      wellnessStore.completeOnboarding();
    },
    [],
  );

  const handleLanguageChange = useCallback((nextLanguage: Language) => {
    setLocalLanguage(nextLanguage);
    wellnessStore.setPreferredLanguage(nextLanguage);
  }, []);

  useEffect(() => {
    wellnessStore.setReminderLabels({
      notificationTitle: t.notificationTitle,
      notificationBody: t.notificationBody,
    });
    void wellnessStore.rescheduleReminders();
  }, [t.notificationTitle, t.notificationBody]);

  useEffect(() => {
    if (!shouldEnsureNotificationPermissions) return;
    void ensureNotificationPermissions();
  }, [shouldEnsureNotificationPermissions]);

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

  useEffect(() => {
    tabContentAnim.setValue(0);
    tabBarAnim.setValue(0.985);
    Animated.parallel([
      Animated.timing(tabContentAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tabBarAnim, {
        toValue: 1,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mainTab, tabContentAnim, tabBarAnim]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const daysToRender = useMemo(() => {
    if (mainTab === 'insights') return [] as Date[];
    if (mainTab === 'today') {
      const today = startOfDay(new Date());
      const inWeek = weekDays.find((day) => isSameDay(day, today));
      return [inWeek ?? today];
    }
    return weekDays;
  }, [mainTab, weekDays]);

  const currentWeekKey = useMemo(() => format(weekDays[0], 'yyyy-MM-dd'), [weekDays]);

  useEffect(() => {
    if (mainTab === 'today') {
      setCurrentDate(new Date());
    }
  }, [mainTab]);

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
    const startMonth = formatMonthName(weekStart, locale);
    const endMonth = formatMonthName(weekEnd, locale);

    const spansMultipleMonths = getMonth(weekStart) !== getMonth(weekEnd) || getYear(weekStart) !== getYear(weekEnd);

    return {
      monthTitle: spansMultipleMonths ? `${startMonth} – ${endMonth}` : startMonth,
      weekRangeTitle: formatWeekDayRange(weekStart, weekEnd, locale),
      compactMonthTitle: spansMultipleMonths,
    };
  }, [weekDays, locale]);

  const scheduleContext = useMemo(() => {
    const weekdayLabels = weekDays.map((dayItem) => format(dayItem, 'EEE', { locale }).toUpperCase());

    let medName = '';
    let row: MedicationRow | null = null;
    let fallbackWeekKey = currentWeekKey;
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    let defaultDurationStart = todayKey;

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
      defaultDurationStart = todayKey;
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
          : [''];
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

  const openMonthPicker = () => {
    setShowSettings(false);
    if (mainTab === 'today') setMainTab('week');
    setIsMonthPickerMounted(true);
    setShowMonthPicker(true);
  };

  const openSettings = () => {
    setShowMonthPicker(false);
    setShowSettings(true);
  };

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

  const medInputRefs = useRef<Record<string, (TextInput | null)[]>>({});

  const focusMedInput = (dateKey: string, idx: number) => {
    medInputRefs.current[dateKey]?.[idx]?.focus();
  };

  const setMedRef = (dateKey: string, idx: number, el: TextInput | null) => {
    if (!medInputRefs.current[dateKey]) medInputRefs.current[dateKey] = [];
    medInputRefs.current[dateKey][idx] = el;
  };

  const renderEventsField = (dateKey: string, value: string) => {
    const expandKey = `${dateKey}-events`;
    return (
      <View
        ref={(node) => {
          fieldAnchorRefs.current[expandKey] = node;
        }}
        collapsable={false}
        style={styles.sectionInputWrap}>
        <ExpandableInput
          value={value}
          onChangeText={(text) => wellnessStore.updateDayField(dateKey, 'events', text)}
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
    );
  };

  const renderPanicAttackField = (dateKey: string, storedDay: typeof wellnessStore.days[string] | undefined) => (
    <PanicAttackCountInput
      label={t.panicAttackDay}
      count={resolvePanicAttackCount(storedDay)}
      language={language}
      labels={t}
      hideLabel
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
        iconMuted: ui.iconMuted,
      }}
      onChange={(count) => wellnessStore.setPanicAttackCount(dateKey, count)}
    />
  );

  const isSectionOpen = (dateKey: string, section: string) => {
    const key = `${dateKey}-section-${section}`;
    return !!expandedInputs[key];
  };

  const toggleDayNotesSection = (dateKey: string, section: string) => {
    const key = `${dateKey}-section-${section}`;
    setExpandedInputs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDayNotesGroup = (
    dateKey: string,
    storedDay: typeof wellnessStore.days[string] | undefined,
    dayTitleBg: string,
  ) => {
    const sleepValue = storedDay?.sleep ?? '';
    const triggersValue = storedDay?.triggers ?? '';
    const sportValue = storedDay?.sport ?? '';
    const eventsValue = storedDay?.events ?? '';
    const panicCount = resolvePanicAttackCount(storedDay);
    const sleepSummary = summarizeSleep(sleepValue, t);
    const triggersSummary = summarizeTriggers(triggersValue, language);
    const sportSummary = summarizeSport(sportValue, t);
    const eventsSummary = summarizeEvents(eventsValue);
    const sectionTheme = {
      textSecondary: theme.textSecondary,
      rowBorder: ui.rowBorder,
      iconMuted: ui.iconMuted,
      sectionLabelBg: ui.sectionLabelBg,
    };
    const noteSectionTheme = {
      ...sectionTheme,
      sectionLabelBg: '#FFFFFF',
      bodyBg: dayTitleBg,
    };

    return (
      <View style={styles.dayNotesSections}>
        <DaySectionCollapsible
          title={formatSectionTitle(t.sleep)}
          summary={sleepSummary}
          open={isSectionOpen(dateKey, 'sleep')}
          onToggle={() => toggleDayNotesSection(dateKey, 'sleep')}
          theme={noteSectionTheme}
          shadowOpacity={ui.panelEdgeShadow}>
          <SleepInput
            label={t.sleep}
            value={sleepValue}
            labels={t}
            hideLabel
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
            onOpenNightObservation={() => setNightObservationDateKey(dateKey)}
          />
        </DaySectionCollapsible>

        <DaySectionCollapsible
          title={formatSectionTitle(t.triggers)}
          summary={triggersSummary}
          open={isSectionOpen(dateKey, 'triggers')}
          onToggle={() => toggleDayNotesSection(dateKey, 'triggers')}
          theme={noteSectionTheme}
          shadowOpacity={ui.panelEdgeShadow}>
          <TriggersInput
            label={t.triggers}
            value={triggersValue}
            language={language}
            labels={t}
            hideLabel
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
        </DaySectionCollapsible>

        <DaySectionCollapsible
          title={formatSectionTitle(t.sport)}
          summary={sportSummary}
          open={isSectionOpen(dateKey, 'sport')}
          onToggle={() => toggleDayNotesSection(dateKey, 'sport')}
          theme={noteSectionTheme}
          shadowOpacity={ui.panelEdgeShadow}>
          <SportInput
            label={t.sport}
            value={sportValue}
            labels={t}
            hideLabel
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
        </DaySectionCollapsible>

        <DaySectionCollapsible
          title={formatSectionTitle(t.events)}
          summary={eventsSummary}
          open={isSectionOpen(dateKey, 'events')}
          onToggle={() => toggleDayNotesSection(dateKey, 'events')}
          theme={noteSectionTheme}
          shadowOpacity={ui.panelEdgeShadow}>
          {renderEventsField(dateKey, eventsValue)}
        </DaySectionCollapsible>

        <DaySectionCollapsible
          title={formatSectionTitle(t.panicAttackDay)}
          summary={panicCount > 0 ? String(panicCount) : ''}
          open={isSectionOpen(dateKey, 'panic')}
          onToggle={() => toggleDayNotesSection(dateKey, 'panic')}
          theme={noteSectionTheme}
          shadowOpacity={ui.panelEdgeShadow}>
          {renderPanicAttackField(dateKey, storedDay)}
        </DaySectionCollapsible>
      </View>
    );
  };

  return (
    <>
      <View style={[styles.outer, { backgroundColor: theme.background }]}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.cardWrapper, { maxWidth: MaxContentWidth }]}>
          <View style={[styles.card, styles.cardSurface, { backgroundColor: ui.contentBg, borderColor: ui.cardBorder }]}>
            <View
              style={[
                styles.stickyHeader,
                { borderColor: ui.dayBorder, backgroundColor: ui.contentBg, shadowOpacity: ui.panelEdgeShadow },
              ]}>
              <View style={styles.header}>
                <View style={styles.headerRow}>
                  {mainTab === 'today' ? (
                    <View style={styles.circleButtonSpacer} />
                  ) : (
                    <Pressable
                      onPress={() => setCurrentDate(subWeeks(currentDate, 1))}
                      style={({ pressed }) => [
                        styles.circleButton,
                        { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="chevron-back" size={20} color={ui.icon} />
                    </Pressable>
                  )}

                  <Pressable
                    onPress={openMonthPicker}
                    style={styles.monthPickerButton}>
                    <Text
                      style={[
                        styles.monthTitle,
                        weekHeaderLabel.compactMonthTitle && styles.monthTitleCompact,
                        { color: theme.text },
                      ]}
                      numberOfLines={2}>
                      {mainTab === 'today' ? t.today : weekHeaderLabel.monthTitle}
                    </Text>
                    <Text style={[styles.monthYear, { color: theme.textSecondary }]} numberOfLines={2}>
                      {mainTab === 'today'
                        ? format(new Date(), 'd MMMM yyyy', { locale })
                        : weekHeaderLabel.weekRangeTitle}
                    </Text>
                  </Pressable>

                  {mainTab === 'today' ? (
                    <View style={styles.circleButtonSpacer} />
                  ) : (
                    <Pressable
                      onPress={() => setCurrentDate(addWeeks(currentDate, 1))}
                      style={({ pressed }) => [
                        styles.circleButton,
                        { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="chevron-forward" size={20} color={ui.icon} />
                    </Pressable>
                  )}
                </View>

                <Animated.View style={[styles.mainTabs, { borderColor: ui.rowBorder, transform: [{ scale: tabBarAnim }] }]}>
                  {(
                    [
                      { id: 'today' as const, label: t.tabToday },
                      { id: 'week' as const, label: t.tabWeek },
                      { id: 'insights' as const, label: t.tabReview },
                    ] as const
                  ).map((tab) => {
                    const active = mainTab === tab.id;
                    return (
                      <Pressable
                        key={tab.id}
                        onPress={() => setMainTab(tab.id)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                          styles.mainTabBtn,
                          active
                            ? { backgroundColor: ui.activeBg, borderColor: ui.activeBg }
                            : { backgroundColor: ui.inactiveBg, borderColor: ui.inactiveBorder },
                          pressed && styles.pressed,
                        ]}>
                        <Text
                          style={[
                            styles.mainTabLabel,
                            { color: active ? ui.activeText : ui.inactiveText },
                          ]}
                          numberOfLines={1}>
                          {tab.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Animated.View>
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
              <Animated.View
                style={{
                  opacity: tabContentAnim,
                  transform: [
                    {
                      translateY: tabContentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0],
                      }),
                    },
                  ],
                }}>
              {mainTab !== 'insights' && showWeeklySummaryNudge ? (
                <Pressable
                  onPress={() => setMainTab('insights')}
                  style={({ pressed }) => [
                    styles.weeklyNudgeBanner,
                    styles.tabNudgeBanner,
                    { backgroundColor: ui.subtlePanelBg, borderColor: ui.subtlePanelBorder },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="calendar-outline" size={16} color={ui.accent} />
                  <Text style={[styles.weeklyNudgeText, { color: theme.textSecondary }]}>{t.weeklySummaryNudge}</Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                </Pressable>
              ) : null}

              {daysToRender.map((day, dayIndex) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const storedDay = wellnessStore.days[dateKey];
                const dayLog = wellnessStore.getDay(dateKey);
                const storedMeds = storedDay?.medications ?? dayLog.medications;
                const isToday = isSameDay(day, new Date());
                const isPastDay = isPast(day) && !isToday;
                const isSunday = getDay(day) === 0;
                const adherence = wellnessStore.getMedicationAdherence(dateKey);

                const displayCount = Math.max(storedMeds.length, DEFAULT_MEDICATION_ROWS);
                const medRows: DisplayMedicationRow[] = Array.from({ length: displayCount })
                  .map((_, idx) => {
                    const row =
                      storedMeds[idx] ??
                      {
                        id: generateSafeId(dateKey, idx, storedMeds),
                        time: '',
                        medication: '',
                        taken: false,
                        skipped: false,
                        reminderEnabled: true,
                      };

                    return {
                      row,
                      originalIndex: idx,
                      displayTime: wellnessStore.resolveMedicationRowTime(dateKey, row, idx),
                    };
                  })
                  .sort(compareMedicationDisplayRows);

                const weekdayIndex = getDay(day) as WeekdayIndex;
                const dayWeekBg = getDayWeekBackground(isDark, weekdayIndex);
                const filledMeds = medRows.filter((item) => item.row.medication.trim());
                const takenMedsCount = filledMeds.filter((item) => item.row.taken).length;
                const nextDose = isToday ? findNextDose(medRows) : null;
                const dayProgress = isToday ? getDayProgress(storedDay) : null;
                const dayCelebrationMessage =
                  dayProgress?.celebration === 'complete'
                    ? t.dayCelebrationComplete
                    : dayProgress?.celebration === 'meds'
                      ? t.dayCelebrationMeds
                      : dayProgress?.celebration === 'noted'
                        ? t.dayCelebrationNoted
                        : null;

                const reviewBg =
                  isReviewMode && isPastDay && !isSunday
                    ? adherence === 'full'
                      ? 'rgba(34, 197, 94, 0.14)'
                      : adherence === 'partial' || adherence === 'none'
                        ? 'rgba(239, 68, 68, 0.14)'
                        : dayWeekBg
                    : dayWeekBg;

                return (
                  <Fragment key={dateKey}>
                  <View style={styles.daySection}>
                    <View style={[styles.dayDivider, { backgroundColor: ui.dayBorder }]} />
                    <View
                      style={[styles.dayHeader, { backgroundColor: reviewBg }]}
                      accessibilityLabel={isToday ? t.today : undefined}>
                      {isToday ? (
                        <View
                          style={[styles.todayMarker, { backgroundColor: theme.todayMarker }]}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      ) : null}
                      <View style={styles.dayHeaderTextWrap}>
                        <Text
                          style={[
                            styles.dayHeaderText,
                            { color: theme.text },
                            isReviewMode && isPastDay ? { textDecorationLine: 'line-through', opacity: 0.4 } : null,
                          ]}>
                          {formatSectionTitle(format(day, 'EEEE', { locale }))}
                        </Text>
                        <Text style={[styles.dayHeaderSubText, { color: theme.textSecondary }]}>
                          ({format(day, 'd.MM')})
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.dayDivider, { backgroundColor: ui.dayBorder }]} />

                    {nextDose ? (
                      <Pressable
                        onPress={() =>
                          setStatusTarget({
                            dateKey,
                            rowId: nextDose.row.id,
                            idx: nextDose.originalIndex,
                          })
                        }
                        style={({ pressed }) => [
                          styles.nextDoseBanner,
                          { backgroundColor: ui.notesBlockBg, borderColor: ui.dayBorder },
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.nextDoseLabel, { color: theme.textSecondary }]}>{t.nextDoseTitle}</Text>
                        <Text style={[styles.nextDoseValue, { color: theme.text }]} numberOfLines={1}>
                          {formatTimeValue(parseTimeValue(nextDose.displayTime))}
                          {' · '}
                          {parseMedicationLabel(nextDose.row.medication).name || nextDose.row.medication}
                        </Text>
                      </Pressable>
                    ) : null}

                    <View style={[styles.dayNotesBodyShadow, { shadowOpacity: ui.panelEdgeShadow }]}>
                    <View style={[styles.dayNotesBody, { backgroundColor: ui.notesBlockBg, borderColor: ui.dayBorder }]}>
                    <View style={[styles.medicationsBlockHeader, { borderColor: ui.rowBorder, backgroundColor: ui.sectionLabelBg }]}>
                      <View style={styles.medicationsHeaderLeft}>
                        <Text style={styles.medicationsHeaderText}>
                          {formatSectionTitle(t.medications)}
                        </Text>
                        <Pressable
                          onPress={() => wellnessStore.addMedicationRow(dateKey)}
                          accessibilityLabel={t.addMedication}
                          style={({ pressed }) => [
                            styles.smallCircleButton,
                            { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                            pressed && styles.pressed,
                          ]}>
                          <Ionicons name="add" size={22} color={ui.icon} />
                        </Pressable>
                      </View>
                      <View style={styles.medicationsHeaderStatus}>
                        <Pressable
                          onPress={() => setShowMedicationIntakeLegend(true)}
                          hitSlop={8}
                          accessibilityLabel={t.medicationIntakeLegendTitle}
                          style={({ pressed }) => [pressed && styles.pressed]}>
                          <Ionicons name="help-circle-outline" size={13} color={ui.iconMuted} />
                        </Pressable>
                        <Text style={styles.medicationsHeaderStatusText}>
                          {filledMeds.length > 0
                            ? `${takenMedsCount}/${filledMeds.length}`
                            : t.status.toLocaleLowerCase()}
                        </Text>
                      </View>
                    </View>
                    {medRows.map(({ row, originalIndex, displayTime }, displayIndex) => {
                      const medExpandKey = `${dateKey}-med-${row.id}`;
                      const medRowMutedStyle = row.taken
                        ? { color: ui.medicationCompleted, opacity: 1, textDecorationLine: 'line-through' as const }
                        : row.skipped
                          ? { color: theme.textSecondary, opacity: 0.8, textDecorationLine: 'line-through' as const }
                          : isReviewMode && isPastDay
                            ? { color: theme.text, opacity: 0.35, textDecorationLine: 'line-through' as const }
                            : { color: theme.text, opacity: 1, textDecorationLine: 'none' as const };
                      const hasReminder = !!displayTime?.trim() && !!row.medication.trim();
                      const canDeleteRow =
                        storedMeds.length > DEFAULT_MEDICATION_ROWS &&
                        originalIndex < storedMeds.length &&
                        !row.medication.trim();
                      const scheduledIntakeNumber = row.taken
                        ? wellnessStore.getMedicationScheduledIntakeNumber(dateKey, row, originalIndex)
                        : null;
                      const hasTakenMeta = row.taken && (row.takenAt || scheduledIntakeNumber !== null);
                      const showMedicationRowMeta = canDeleteRow || hasTakenMeta;
                      const medicationParts = parseMedicationLabel(row.medication);
                      const updateMedicationParts = (updates: Partial<{ name: string; dose: string }>) => {
                        wellnessStore.updateMedication(
                          dateKey,
                          row.id,
                          {
                            medication: formatMedicationLabel(
                              updates.name ?? medicationParts.name,
                              updates.dose ?? medicationParts.dose,
                            ),
                          },
                          originalIndex,
                        );
                      };

                      return (
                        <View key={row.id} style={[styles.row, { borderColor: ui.rowBorder, backgroundColor: ui.inactiveBg }]}>
                          <View style={styles.medicationRowMain}>
                            <View style={styles.colTimeCell}>
                              <Pressable
                                onPress={() =>
                                  setMedTimeTarget({
                                    dateKey,
                                    rowId: row.id,
                                    idx: originalIndex,
                                    time: displayTime,
                                  })
                                }
                                style={({ pressed }) => [styles.timeBtn, pressed && styles.pressed]}>
                                {displayTime?.trim() ? (
                                  <Text style={[styles.timeText, medRowMutedStyle]}>
                                    {formatTimeValue(parseTimeValue(displayTime))}
                                  </Text>
                                ) : (
                                  <Ionicons name="time-outline" size={28} color={ui.iconMuted} />
                                )}
                              </Pressable>
                            </View>
                            <View style={styles.colMedCell}>
                              <View style={styles.medicationSplitInputRow}>
                                <TextInput
                                  ref={(node) => setMedRef(dateKey, displayIndex, node)}
                                  value={medicationParts.name}
                                  onChangeText={(name) => updateMedicationParts({ name })}
                                  onFocus={() => handleFocus(medExpandKey)}
                                  onBlur={() => handleBlur(medExpandKey)}
                                  placeholder={`... ${t.medicationName}`}
                                  placeholderTextColor={ui.iconMuted}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  multiline
                                  scrollEnabled={false}
                                  textAlign="left"
                                  textAlignVertical="top"
                                  onSubmitEditing={() => {
                                    const isLast = displayIndex === medRows.length - 1;
                                    if (isLast) {
                                      wellnessStore.addMedicationRow(dateKey);
                                      setTimeout(() => focusMedInput(dateKey, displayIndex + 1), 50);
                                    } else {
                                      focusMedInput(dateKey, displayIndex + 1);
                                    }
                                  }}
                                  style={[
                                    styles.medicationNameInput,
                                    {
                                      color: medRowMutedStyle.color,
                                      opacity: medRowMutedStyle.opacity,
                                      textDecorationLine: medRowMutedStyle.textDecorationLine,
                                    },
                                  ]}
                                />
                                <TextInput
                                  value={medicationParts.dose}
                                  onChangeText={(dose) => updateMedicationParts({ dose })}
                                  onFocus={() => handleFocus(`${medExpandKey}-dose`)}
                                  onBlur={() => handleBlur(`${medExpandKey}-dose`)}
                                  placeholder={t.medicationDose}
                                  placeholderTextColor={ui.iconMuted}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  multiline
                                  scrollEnabled={false}
                                  textAlign="left"
                                  textAlignVertical="top"
                                  onSubmitEditing={() => {
                                    const isLast = displayIndex === medRows.length - 1;
                                    if (isLast) {
                                      wellnessStore.addMedicationRow(dateKey);
                                      setTimeout(() => focusMedInput(dateKey, displayIndex + 1), 50);
                                    } else {
                                      focusMedInput(dateKey, displayIndex + 1);
                                    }
                                  }}
                                  style={[
                                    styles.medicationDoseInput,
                                    {
                                      color: medRowMutedStyle.color,
                                      opacity: medRowMutedStyle.opacity,
                                      textDecorationLine: medRowMutedStyle.textDecorationLine,
                                    },
                                  ]}
                                />
                              </View>
                            </View>
                            <View style={styles.colReminderCell}>
                              <Pressable
                                onPress={() => wellnessStore.toggleMedicationReminder(dateKey, row.id, originalIndex)}
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
                              <Pressable
                                onPress={() => {
                                  if (!row.medication.trim()) return;
                                  setStatusTarget({ dateKey, rowId: row.id, idx: originalIndex });
                                }}
                                onLongPress={() => setStatusTarget({ dateKey, rowId: row.id, idx: originalIndex })}
                                disabled={!row.medication.trim()}
                                accessibilityLabel={
                                  row.taken
                                    ? t.medicationTaken
                                    : row.skipped
                                      ? t.medicationSkipped
                                      : t.medicationTake
                                }
                                style={({ pressed }) => [
                                  styles.takeButton,
                                  row.taken
                                    ? { backgroundColor: ui.activeBg, borderColor: ui.activeBg }
                                    : row.skipped
                                      ? { backgroundColor: ui.checkOffBg, borderColor: '#ef4444' }
                                      : {
                                          backgroundColor: row.medication.trim() ? ui.activeBg : ui.checkOffBg,
                                          borderColor: row.medication.trim() ? ui.activeBg : ui.checkOffBorder,
                                          opacity: row.medication.trim() ? 1 : 0.35,
                                        },
                                  pressed && styles.pressed,
                                ]}>
                                <Text
                                  style={[
                                    styles.takeButtonText,
                                    {
                                      color: row.taken || (!row.skipped && row.medication.trim())
                                        ? ui.activeText
                                        : row.skipped
                                          ? '#ef4444'
                                          : theme.textSecondary,
                                    },
                                  ]}
                                  numberOfLines={1}>
                                  {row.taken
                                    ? t.medicationTaken
                                    : row.skipped
                                      ? t.medicationSkipped
                                      : t.medicationTake}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                          {showMedicationRowMeta ? (
                            <View style={styles.medicationRowMeta}>
                              {hasTakenMeta ? (
                                <View style={styles.takenMetaWrap}>
                                  {row.takenAt ? (
                                    <Text
                                      style={[styles.takenAtText, { color: theme.textSecondary }]}
                                      numberOfLines={1}
                                      adjustsFontSizeToFit>
                                      {row.takenAt}
                                    </Text>
                                  ) : null}
                                  {scheduledIntakeNumber !== null ? (
                                    <View style={styles.takenIntakeNumberWrap}>
                                      <Image
                                        source={require('@/assets/images/medication-intake-pill.png')}
                                        style={styles.takenIntakePillIcon}
                                        contentFit="contain"
                                      />
                                      <Text style={[styles.takenIntakeNumberText, { color: theme.textSecondary }]}>
                                        {scheduledIntakeNumber}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                              ) : null}
                              {canDeleteRow ? (
                                <Pressable
                                  onPress={() => wellnessStore.deleteMedicationRow(dateKey, originalIndex)}
                                  hitSlop={6}
                                  style={({ pressed }) => [
                                    styles.deleteBtn,
                                    pressed && styles.pressed,
                                  ]}>
                                  <Ionicons name="remove-circle-outline" size={16} color={theme.textSecondary} />
                                </Pressable>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                    </View>
                    </View>

                    {isToday ? (
                      <GrowthRingsSection
                        language={language}
                        labels={t}
                        value={storedDay?.growthRings ?? emptyGrowthRingsLog()}
                        onChange={(next) => wellnessStore.setGrowthRings(dateKey, next)}
                      />
                    ) : null}

                    {renderDayNotesGroup(dateKey, storedDay, reviewBg)}

                    {dayCelebrationMessage ? (
                      <DayCelebrationBanner
                        message={dayCelebrationMessage}
                        accent={ui.accent}
                        backgroundColor={ui.subtlePanelBg}
                        borderColor={ui.subtlePanelBorder}
                        textColor={theme.textSecondary}
                      />
                    ) : null}
                  </View>
                  {dayIndex < daysToRender.length - 1 ? (
                    <DayDottedDivider color={ui.iconMuted} />
                  ) : null}
                  </Fragment>
                );
              })}

              {mainTab === 'insights' ? (
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
                      {formatSectionTitle(t.weeklySummary)}
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
                      panelBg: ui.modalBg,
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
              ) : null}
              </Animated.View>
            </ScrollView>

            {!nightObservationActive ? (
            <View
              style={[
                styles.footerChrome,
                { borderColor: ui.footerBorder, backgroundColor: ui.contentBg },
              ]}>
              {Platform.OS === 'android' ? (
                <View pointerEvents="none" style={styles.footerUpShadow}>
                  <View style={[styles.footerUpShadowBand, { top: -2, opacity: ui.panelEdgeShadow * 1.3 }]} />
                  <View style={[styles.footerUpShadowBand, { top: -4, opacity: ui.panelEdgeShadow * 0.9 }]} />
                  <View style={[styles.footerUpShadowBand, { top: -6, opacity: ui.panelEdgeShadow * 0.55 }]} />
                </View>
              ) : null}
            <View
              style={[
                styles.footer,
                { shadowOpacity: ui.panelEdgeShadow },
              ]}
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
                <Pressable
                  onPress={openSettings}
                  accessibilityLabel={t.settingsTitle}
                  style={({ pressed }) => [
                    styles.footerIconButton,
                    styles.footerIconButtonIconOnly,
                    { backgroundColor: ui.circleBg, borderColor: ui.circleBorder, shadowOpacity: ui.circleShadow },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="settings-outline" size={18} color={ui.icon} />
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
            </View>
            ) : null}

            <ImportantInfoModal
              visible={showImportantInfo}
              language={language}
              labels={t}
              onClose={() => setShowImportantInfo(false)}
            />

            <MedicationIntakeLegendModal
              visible={showMedicationIntakeLegend}
              labels={t}
              onClose={() => setShowMedicationIntakeLegend(false)}
            />

            <OnboardingModal
              key={showOnboarding ? 'onboarding-open' : 'onboarding-closed'}
              visible={showOnboarding}
              language={language}
              labels={t}
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
              onNext={() => {
                setCoachMarkStep(1);
                setTimeout(measureCoachMarkTargets, 120);
              }}
              onDismiss={() => wellnessStore.dismissCoachMarks()}
            />

            <PanicAttackModal
              visible={showPanicAttack}
              labels={t}
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

                  <ScrollView
                    style={styles.monthPickerScroll}
                    contentContainerStyle={styles.monthPickerScrollContent}
                    showsVerticalScrollIndicator={false}>
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
                              {formatMonthName(date, locale)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </Animated.View>
            ) : null}

            <SettingsModal
              visible={showSettings}
              language={language}
              labels={t}
              reviewMode={isReviewMode}
              onReviewModeChange={setIsReviewMode}
              onLanguageChange={handleLanguageChange}
              onEnableReminders={() => void ensureNotificationPermissions()}
              onShowOnboardingAgain={() => {
                wellnessStore.resetOnboarding();
                setShowSettings(false);
              }}
              onClose={() => setShowSettings(false)}
            />

            {showAllMedications ? (
              <AllMedicationsModal
                visible
                labels={t}
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
                onSelectCleared={() => {
                  wellnessStore.setMedicationStatus(statusTarget.dateKey, statusTarget.rowId, statusTarget.idx, 'cleared');
                  setStatusTarget(null);
                  setShowMedicationSchedule(false);
                }}
              />
            ) : null}

            {showMedicationSchedule && scheduleContext ? (
              <MedicationScheduleModal
                visible
                labels={t}
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

          </View>
        </View>
      </SafeAreaView>
      </View>

      {nightObservationDateKey ? (
        <SleepNightObservationOverlay
          labels={t}
          onClose={() => setNightObservationDateKey(null)}
          onFinish={(nightLog) => {
            const day = wellnessStore.getDay(nightObservationDateKey);
            const merged = mergeNightObservationIntoSleepLog(parseSleepLog(day.sleep), nightLog);
            wellnessStore.updateDayField(nightObservationDateKey, 'sleep', serializeSleepLog(merged));
            setNightObservationDateKey(null);
          }}
        />
      ) : null}
    </>
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
    overflow: 'visible',
  },
  cardSurface: Platform.select({
    android: { elevation: 0 },
    default: { elevation: 2 },
  }),
  header: { paddingTop: 24, paddingBottom: 12, paddingHorizontal: 24 },
  stickyHeader: {
    zIndex: 2,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  monthPickerButton: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  monthTitle: { ...weekMonthTitleStyle, textAlign: 'center' },
  monthTitleCompact: { fontSize: 22 },
  monthYear: { ...weekYearStyle, marginTop: 4, textAlign: 'center' },
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
  circleButtonSpacer: { width: 40, height: 40 },
  mainTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  mainTabBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mainTabLabel: {
    ...weekServiceTextStyle,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'none',
  },
  pressed: { transform: [{ scale: 0.95 }] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  tabNudgeBanner: {
    marginHorizontal: 12,
    marginTop: 12,
  },
  daySection: {
    marginBottom: 0,
  },
  dayDivider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  dayHeader: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  todayMarker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
  },
  dayHeaderTextWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  dayHeaderText: { ...dayHeaderTitleStyle, lineHeight: 26 },
  dayHeaderSubText: { ...weekDateStyle, marginLeft: 6, lineHeight: 26 },
  nextDoseBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  nextDoseLabel: {
    ...weekServiceTextStyle,
    letterSpacing: 1.2,
    fontSize: 10,
  },
  nextDoseValue: {
    ...weekCardTitleStyle,
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
  medicationsBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  medicationsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicationsHeaderText: {
    ...dayMedicationsHeaderStyle,
  },
  medicationsHeaderStatusText: {
    ...dayMedicationsStatusStyle,
  },
  medicationsHeaderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  row: { borderBottomWidth: 1 },
  medicationRowMain: { flexDirection: 'row' },
  medicationRowMeta: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 8,
    paddingRight: 12,
    paddingBottom: 8,
  },
  deleteBtn: {
    width: 20,
    height: 20,
    borderRadius: 12,
  
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
    ...weekServiceTextStyle,
    fontFamily: Fonts.mono,
    letterSpacing: 0,
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
  medicationPlaceholderText: {
    ...weekServiceTextStyle,
  },
  medicationSplitInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  medicationNameInput: {
    ...weekBodyTextStyle,
    flex: 1,
    minWidth: 0,
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  medicationDoseInput: {
    ...weekBodyTextStyle,
    width: 72,
    maxWidth: 72,
    flexShrink: 0,
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  colReminderCell: {
    width: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingRight: 10,
  },
  colCheckCell: {
    width: 78,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingRight: 6,
  },
  takenMetaWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    minWidth: 44,
  },
  takenAtText: {
    fontSize: 8,
    fontFamily: Fonts.mono,
    lineHeight: 10,
    textAlign: 'center',
  },
  takenIntakeNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  takenIntakePillIcon: {
    width: 12,
    height: 12,
  },
  takenIntakeNumberText: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  reminderButton: {
    width: 28,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeButton: {
    minWidth: 70,
    maxWidth: 78,
    minHeight: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  takeButtonText: {
    fontSize: 11,
    fontFamily: Fonts.sansSemiBold,
    lineHeight: 14,
    textAlign: 'center',
  },
  dayNotesSections: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
  },
  dayCelebrationBanner: {
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayCelebrationText: {
    ...weekBodyTextStyle,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  dayNotesSectionCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dayNotesBodyShadow: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  dayNotesBody: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionLabel: {
    ...daySectionLabelStyle,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionInputWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
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
  weeklyNudgeText: { ...weekBodyTextStyle, flex: 1, lineHeight: 22 },
  weeklyNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  weeklyNotesTitle: {
    ...weekCardTitleStyle,
    flex: 1,
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
    ...weekButtonTextStyle,
  },
  weeklyInput: { minHeight: 96 },
  footerChrome: {
    position: 'relative',
    borderTopWidth: 1,
    zIndex: 2,
  },
  footerUpShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    zIndex: 1,
  },
  footerUpShadowBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 0 },
      default: { elevation: 3 },
    }),
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
  footerIconLabel: { ...weekServiceTextStyle },
  footerIconLabelCompact: { fontSize: 10, letterSpacing: 0.3, maxWidth: 72, textAlign: 'center' },
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
  modalTitle: { ...sectionTitleStyle, fontSize: 15, fontWeight: '600' },
  monthPickerScroll: { flex: 1 },
  monthPickerScrollContent: { paddingBottom: 24 },
  yearStepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
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
  todayButtonText: { ...weekButtonTextStyle },
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
  monthButtonTextActive: { ...weekFieldLabelStyle },
  monthButtonTextInactive: { ...weekFieldLabelStyle },
});

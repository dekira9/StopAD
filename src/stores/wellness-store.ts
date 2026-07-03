import { addDays, addMonths, differenceInCalendarDays, differenceInCalendarMonths, format, getDay, parse, startOfDay, startOfWeek } from 'date-fns';
import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import { makeAutoObservable, runInAction, toJS } from 'mobx';
import { Platform } from 'react-native';

import type { Language } from '@/constants/i18n';
import { rescheduleMedicationReminders } from '@/services/notifications';
import { normalizeDayLogPanicAttack } from '@/utils/panic-attack-log';

const STORAGE_KEY = 'stop-ad-v1';
const NATIVE_FILE = `${STORAGE_KEY}.json`;
export const DEFAULT_MEDICATION_ROWS = 1;
export const MEDICATION_REPEAT_MONTH_OPTIONS = [1, 2, 3, 6, 12] as const;

export type MedicationRepeatConfig = {
  months: number;
  everyDay: boolean;
  daysOfWeek: number[];
  intervalDays?: number;
  startDateKey?: string;
  endDateKey?: string | null;
};

export type MedicationPlanTemplate = {
  id: string;
  time: string;
  medication: string;
  reminderEnabled: boolean;
  repeat: MedicationRepeatConfig;
};

export type MedicationCatalogEntry = {
  id: string;
  name: string;
  dose: string;
  /** Manually added via catalog; shown until schedule is saved or entry is removed. */
  isDraft?: boolean;
};

export function parseMedicationLabel(medication: string): { name: string; dose: string } {
  const trimmed = medication.trim();
  if (!trimmed) return { name: '', dose: '' };
  const commaIndex = trimmed.indexOf(',');
  if (commaIndex < 0) return { name: trimmed, dose: '' };
  return {
    name: trimmed.slice(0, commaIndex).trim(),
    dose: trimmed.slice(commaIndex + 1).trim(),
  };
}

export function formatMedicationLabel(name: string, dose: string): string {
  const trimmedName = name.trim();
  const trimmedDose = dose.trim();
  if (!trimmedName) return '';
  if (!trimmedDose) return trimmedName;
  return `${trimmedName}, ${trimmedDose}`;
}

export const DEFAULT_MEDICATION_REPEAT: MedicationRepeatConfig = {
  months: 1,
  everyDay: true,
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
};

export type MedicationRow = {
  id: string;
  time?: string;
  medication: string;
  taken: boolean;
  skipped?: boolean;
  takenAt?: string;
  reminderEnabled: boolean;
};

export type DayLog = {
  medications: MedicationRow[];
  sleep: string;
  triggers: string;
  sport: string;
  events: string;
  panicAttackCount?: number;
};

export type DayLogs = {
  [dateKey: string]: DayLog;
};

function emptyDayLog(): DayLog {
  return {
    medications: [],
    sleep: '',
    triggers: '',
    sport: '',
    events: '',
  };
}

const WEEK_STARTS_ON = 1 as const;

function scoreMedicationRepeat(repeat: MedicationRepeatConfig): number {
  let score = 0;
  if (repeat.startDateKey) score += 10;
  if (repeat.endDateKey !== undefined) score += 5;
  return score;
}

function medicationRepeatMatchesDay(date: Date, anchorDate: Date, repeat: MedicationRepeatConfig): boolean {
  if (repeat.intervalDays && repeat.intervalDays >= 2) {
    const diff = differenceInCalendarDays(date, anchorDate);
    return diff >= 0 && diff % repeat.intervalDays === 0;
  }
  if (repeat.everyDay) return true;
  return repeat.daysOfWeek.includes(getDay(date));
}

function normalizeMedicationRepeat(repeat?: Partial<MedicationRepeatConfig>): MedicationRepeatConfig {
  const merged = {
    ...DEFAULT_MEDICATION_REPEAT,
    ...repeat,
    daysOfWeek: [...(repeat?.daysOfWeek ?? DEFAULT_MEDICATION_REPEAT.daysOfWeek)],
  };
  let normalized: MedicationRepeatConfig;
  if (merged.intervalDays && merged.intervalDays >= 2) {
    normalized = { ...merged, everyDay: false, daysOfWeek: [] };
  } else if (merged.everyDay) {
    normalized = { ...merged, intervalDays: undefined, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] };
  } else {
    normalized = { ...merged, intervalDays: undefined };
  }
  return {
    ...normalized,
    startDateKey: repeat?.startDateKey ?? merged.startDateKey,
    endDateKey: repeat?.endDateKey !== undefined ? repeat.endDateKey : merged.endDateKey,
  };
}

function getMedicationDurationStart(repeat: MedicationRepeatConfig, weekStartKey: string): Date {
  const startKey = repeat.startDateKey ?? weekStartKey;
  return parse(startKey, 'yyyy-MM-dd', new Date());
}

function getMedicationDurationEnd(repeat: MedicationRepeatConfig, weekStartKey: string): Date {
  const start = getMedicationDurationStart(repeat, weekStartKey);
  if (repeat.endDateKey === null) {
    return addMonths(start, 24);
  }
  if (repeat.endDateKey) {
    return parse(repeat.endDateKey, 'yyyy-MM-dd', new Date());
  }
  return addMonths(start, repeat.months);
}

function isWithinMedicationDuration(date: Date, repeat: MedicationRepeatConfig, weekStartKey: string): boolean {
  const start = startOfDay(getMedicationDurationStart(repeat, weekStartKey));
  const end = startOfDay(getMedicationDurationEnd(repeat, weekStartKey));
  const target = startOfDay(date);
  return target >= start && target <= end;
}

function generatePlanTemplateId(weekKey: string, baseIndex: number, existing: MedicationPlanTemplate[]) {
  let newId = `plan-${weekKey}-${baseIndex}`;
  let suffix = 0;
  while (existing.some((row) => row.id === newId)) {
    suffix++;
    newId = `plan-${weekKey}-${baseIndex}-${suffix}`;
  }
  return newId;
}

function defaultPlanTemplate(weekKey: string, index = 0): MedicationPlanTemplate {
  return {
    id: generatePlanTemplateId(weekKey, index, []),
    time: '',
    medication: '',
    reminderEnabled: true,
    repeat: { ...DEFAULT_MEDICATION_REPEAT, daysOfWeek: [...DEFAULT_MEDICATION_REPEAT.daysOfWeek] },
  };
}

function medicationMatches(
  row: Pick<MedicationRow, 'time' | 'medication'>,
  template: Pick<MedicationRow, 'time' | 'medication'>,
) {
  return row.medication.trim() === template.medication.trim() && (row.time ?? '').trim() === (template.time ?? '').trim();
}

function normalizeMedicationTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time.trim();
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function medicationTimesEqual(a: string, b: string): boolean {
  return normalizeMedicationTime(a) === normalizeMedicationTime(b);
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

function ensureMinimumMedicationRows(dateKey: string, meds: MedicationRow[]): MedicationRow[] {
  if (meds.length >= DEFAULT_MEDICATION_ROWS) return meds;
  const padded = [...meds];
  while (padded.length < DEFAULT_MEDICATION_ROWS) {
    padded.push({
      id: generateSafeId(dateKey, padded.length, padded),
      time: '',
      medication: '',
      taken: false,
      reminderEnabled: true,
    });
  }
  return padded;
}

function defaultMedicationRows(dateKey: string, count = DEFAULT_MEDICATION_ROWS): MedicationRow[] {
  return Array.from({ length: count }).map((_, idx) => ({
    id: generateSafeId(dateKey, idx, []),
    time: '',
    medication: '',
    taken: false,
    reminderEnabled: true,
  }));
}

function getNativeFileUri(): string | null {
  const base = documentDirectory;
  if (!base) return null;
  return `${base}${NATIVE_FILE}`;
}

async function persistenceRead(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
        return globalThis.localStorage.getItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return null;
  }

  const uri = getNativeFileUri();
  if (!uri) return null;
  try {
    const info = await getInfoAsync(uri);
    if (!info.exists) return null;
    return await readAsStringAsync(uri);
  } catch {
    return null;
  }
}

async function persistenceWrite(payload: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
      globalThis.localStorage.setItem(STORAGE_KEY, payload);
    }
    return;
  }

  const uri = getNativeFileUri();
  if (!uri) throw new Error('No document directory for persistence');
  await writeAsStringAsync(uri, payload);
}

export type ReminderLabels = {
  notificationTitle: string;
  notificationBody: string;
};

class WellnessStore {
  days: DayLogs = {};
  weeklySummary: Record<string, string> = {};
  weekMedicationPlans: Record<string, MedicationPlanTemplate[]> = {};
  medicationCatalog: MedicationCatalogEntry[] = [];
  onboardingCompleted = false;
  coachMarksSeen = false;
  weeklySummaryNudgeSeen = false;
  preferredLanguage: Language | null = null;
  hydrated = false;
  private persistQueue: Promise<void> = Promise.resolve();
  private reminderLabels: ReminderLabels = {
    notificationTitle: 'Stop AD',
    notificationBody: 'Time to take:',
  };

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    void this.hydrate();
  }

  setReminderLabels(labels: ReminderLabels) {
    this.reminderLabels = labels;
  }

  setPreferredLanguage(language: Language) {
    this.preferredLanguage = language;
    this.schedulePersist();
  }

  completeOnboarding() {
    this.onboardingCompleted = true;
    this.schedulePersist();
  }

  dismissCoachMarks() {
    this.coachMarksSeen = true;
    this.schedulePersist();
  }

  markWeeklySummaryNudgeSeen() {
    if (this.weeklySummaryNudgeSeen) return;
    this.weeklySummaryNudgeSeen = true;
    this.schedulePersist();
  }

  resetOnboarding() {
    this.onboardingCompleted = false;
    this.coachMarksSeen = false;
    this.schedulePersist();
  }

  getDay(dateKey: string): DayLog {
    const existing = this.days[dateKey];
    if (existing) return existing;
    return { ...emptyDayLog(), medications: defaultMedicationRows(dateKey) };
  }

  private ensureDay(dateKey: string): DayLog {
    if (!this.days[dateKey]) {
      this.days[dateKey] = { ...emptyDayLog(), medications: defaultMedicationRows(dateKey) };
    }
    const day = this.days[dateKey];
    if (day.medications.length === 0) {
      day.medications = defaultMedicationRows(dateKey);
    }
    return day;
  }

  async hydrate() {
    if (this.hydrated) return;
    try {
      const raw = await persistenceRead();
      if (!raw) {
        runInAction(() => {
          this.hydrated = true;
        });
        return;
      }

      const parsed = JSON.parse(raw) as {
        days?: DayLogs;
        weeklySummary?: Record<string, string>;
        weekMedicationPlans?: Record<string, MedicationPlanTemplate[]>;
        medicationCatalog?: MedicationCatalogEntry[];
        onboardingCompleted?: boolean;
        coachMarksSeen?: boolean;
        weeklySummaryNudgeSeen?: boolean;
        preferredLanguage?: Language | null;
      };
      const hasLocalState = Object.keys(this.days).length > 0;

      runInAction(() => {
        if (!hasLocalState) {
          const days = parsed.days ?? {};
          for (const day of Object.values(days)) {
            normalizeDayLogPanicAttack(day as Record<string, unknown>);
          }
          this.days = days;
          this.weeklySummary = parsed.weeklySummary ?? {};
          this.weekMedicationPlans = parsed.weekMedicationPlans ?? {};
          this.medicationCatalog = parsed.medicationCatalog ?? [];
          this.onboardingCompleted = parsed.onboardingCompleted ?? false;
          this.coachMarksSeen = parsed.coachMarksSeen ?? false;
          this.weeklySummaryNudgeSeen = parsed.weeklySummaryNudgeSeen ?? false;
          this.preferredLanguage = parsed.preferredLanguage ?? null;
          const hasExistingDiary = Object.keys(parsed.days ?? {}).some((dateKey) => {
            const day = parsed.days?.[dateKey];
            if (!day) return false;
            return (
              day.medications.some((row) => row.medication.trim() || row.taken || row.skipped) ||
              Boolean(day.sleep?.trim()) ||
              Boolean(day.triggers?.trim()) ||
              Boolean(day.sport?.trim()) ||
              Boolean(day.events?.trim()) ||
              (day.panicAttackCount ?? 0) > 0
            );
          });
          if (!this.onboardingCompleted && hasExistingDiary) {
            this.onboardingCompleted = true;
            this.coachMarksSeen = true;
          }
          if (this.medicationCatalog.length === 0) {
            this.medicationCatalog = this.collectMedicationsFromData();
          } else {
            this.pruneMedicationCatalog();
          }
        }
        this.hydrated = true;
      });

      if (hasLocalState) {
        await this.flushPersist();
      } else {
        void this.syncReminders();
      }
    } catch {
      runInAction(() => {
        this.hydrated = true;
      });
    }
  }

  private schedulePersist() {
    const payload = JSON.stringify({
      days: toJS(this.days),
      weeklySummary: toJS(this.weeklySummary),
      weekMedicationPlans: toJS(this.weekMedicationPlans),
      medicationCatalog: toJS(this.medicationCatalog),
      onboardingCompleted: this.onboardingCompleted,
      coachMarksSeen: this.coachMarksSeen,
      weeklySummaryNudgeSeen: this.weeklySummaryNudgeSeen,
      preferredLanguage: this.preferredLanguage,
    });

    this.persistQueue = this.persistQueue
      .then(() => persistenceWrite(payload))
      .then(() => this.syncReminders())
      .catch(() => {
        // ignore storage errors
      });
  }

  private async flushPersist() {
    this.schedulePersist();
    await this.persistQueue;
  }

  rescheduleReminders() {
    const { notificationTitle, notificationBody } = this.reminderLabels;
    return rescheduleMedicationReminders(
      toJS(this.days),
      (med) => `${notificationBody} ${med}`,
      notificationTitle,
    );
  }

  private syncReminders() {
    return this.rescheduleReminders();
  }

  updateWeeklySummary(weekKey: string, text: string) {
    this.weeklySummary[weekKey] = text;
    this.schedulePersist();
  }

  refreshMedicationCatalog() {
    this.syncCatalogFromDayRows();
  }

  get visibleMedicationCatalog(): MedicationCatalogEntry[] {
    return this.medicationCatalog
      .filter((entry) => this.shouldShowCatalogEntry(entry))
      .map((entry) => ({ ...entry }));
  }

  resolveMedicationRowTime(dateKey: string, row: MedicationRow, rowIndex: number): string {
    const rowTime = (row.time ?? '').trim();
    const medName = row.medication.trim();
    if (!medName) return rowTime;

    const weekKey = format(
      startOfWeek(parse(dateKey, 'yyyy-MM-dd', new Date()), { weekStartsOn: WEEK_STARTS_ON }),
      'yyyy-MM-dd',
    );
    const schedule = this.getMedicationScheduleForName(medName, weekKey);
    if (schedule.times.length === 0) return rowTime;

    const day = this.getDay(dateKey);
    const slotIndex = this.getMedicationTimeSlotIndex(day.medications, row.id, medName, rowIndex);
    const scheduleTime = schedule.times[slotIndex] ?? schedule.times[0] ?? '';
    if (!scheduleTime) return rowTime;

    if (rowTime && !medicationTimesEqual(rowTime, scheduleTime)) {
      return scheduleTime;
    }

    return rowTime || scheduleTime;
  }

  hasMedicationInDays(medicationName: string): boolean {
    const target = medicationName.trim().toLowerCase();
    if (!target) return false;

    return Object.values(this.days).some((day) =>
      day.medications.some((row) => row.medication.trim().toLowerCase() === target),
    );
  }

  hasMedicationSchedule(medicationName: string): boolean {
    const target = medicationName.trim().toLowerCase();
    if (!target) return false;

    return Object.values(this.weekMedicationPlans).some((plan) =>
      plan.some((template) => template.medication.trim().toLowerCase() === target),
    );
  }

  findMedicationScheduleWeekKey(medicationName: string): string | null {
    const target = medicationName.trim().toLowerCase();
    if (!target) return null;

    let bestWeekKey: string | null = null;
    let bestHasStartDate = false;

    for (const [weekKey, plan] of Object.entries(this.weekMedicationPlans)) {
      const matching = plan.filter((template) => template.medication.trim().toLowerCase() === target);
      if (matching.length === 0) continue;

      const hasStartDate = matching.some((template) => Boolean(template.repeat?.startDateKey));
      if (!bestWeekKey || (hasStartDate && !bestHasStartDate)) {
        bestWeekKey = weekKey;
        bestHasStartDate = hasStartDate;
      }
    }

    return bestWeekKey;
  }

  getMedicationScheduleForName(
    medicationName: string,
    fallbackWeekKey?: string,
  ): {
    repeat: MedicationRepeatConfig;
    times: string[];
    planWeekKey: string;
  } {
    const trimmedName = medicationName.trim();
    const fallback =
      fallbackWeekKey ?? format(startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON }), 'yyyy-MM-dd');

    if (!trimmedName) {
      return {
        repeat: { ...DEFAULT_MEDICATION_REPEAT, daysOfWeek: [...DEFAULT_MEDICATION_REPEAT.daysOfWeek] },
        times: [],
        planWeekKey: fallback,
      };
    }

    const target = trimmedName.toLowerCase();
    let bestRepeat: MedicationRepeatConfig | null = null;
    let bestScore = -1;
    const times = new Set<string>();

    for (const plan of Object.values(this.weekMedicationPlans)) {
      for (const template of plan) {
        if (template.medication.trim().toLowerCase() !== target) continue;
        const time = (template.time ?? '').trim();
        if (time) times.add(time);
        const repeat = normalizeMedicationRepeat(template.repeat);
        const score = scoreMedicationRepeat(repeat);
        if (score > bestScore) {
          bestScore = score;
          bestRepeat = repeat;
        }
      }
    }

    const repeat = bestRepeat ?? {
      ...DEFAULT_MEDICATION_REPEAT,
      daysOfWeek: [...DEFAULT_MEDICATION_REPEAT.daysOfWeek],
    };
    const planWeekKey = this.resolveMedicationPlanWeekKey(trimmedName, repeat, fallback);

    return {
      repeat,
      times: [...times],
      planWeekKey,
    };
  }

  private resolveMedicationPlanWeekKey(
    medicationName: string,
    repeat: MedicationRepeatConfig,
    fallbackWeekKey: string,
  ): string {
    if (repeat.startDateKey) {
      return format(
        startOfWeek(parse(repeat.startDateKey, 'yyyy-MM-dd', new Date()), { weekStartsOn: WEEK_STARTS_ON }),
        'yyyy-MM-dd',
      );
    }
    const existing = this.findMedicationScheduleWeekKey(medicationName);
    if (existing) return existing;
    return fallbackWeekKey;
  }

  private removeMedicationFromOtherWeekPlans(medicationName: string, keepWeekKey: string) {
    const trimmedName = medicationName.trim();
    if (!trimmedName) return;

    const nextPlans = { ...this.weekMedicationPlans };
    let changed = false;

    for (const [weekKey, plan] of Object.entries(nextPlans)) {
      if (weekKey === keepWeekKey) continue;
      const filtered = plan.filter((template) => template.medication.trim() !== trimmedName);
      if (filtered.length === plan.length) continue;
      nextPlans[weekKey] = filtered.map((entry) => ({
        ...entry,
        repeat: { ...entry.repeat, daysOfWeek: [...entry.repeat.daysOfWeek] },
      }));
      changed = true;
    }

    if (changed) {
      this.weekMedicationPlans = nextPlans;
    }
  }

  private setMedicationPlanForWeek(weekKey: string, plan: MedicationPlanTemplate[]) {
    this.weekMedicationPlans = {
      ...this.weekMedicationPlans,
      [weekKey]: plan.map((entry) => ({
        ...entry,
        repeat: { ...entry.repeat, daysOfWeek: [...entry.repeat.daysOfWeek] },
      })),
    };
  }

  private applyMedicationPlanTemplates(
    planWeekKey: string,
    medicationName: string,
    times: string[],
    repeat: MedicationRepeatConfig,
    reminderEnabled = true,
  ): MedicationPlanTemplate[] {
    const medName = medicationName.trim();
    const normalized = normalizeMedicationRepeat(repeat);
    this.removeMedicationFromOtherWeekPlans(medName, planWeekKey);

    const existingPlan = this.getWeekMedicationPlan(planWeekKey);
    const kept = existingPlan.filter((template) => template.medication.trim() !== medName);
    const existingForMed = existingPlan.filter((template) => template.medication.trim() === medName);
    const nextPlan: MedicationPlanTemplate[] = [...kept];

    times.forEach((time, index) => {
      const trimmedTime = time.trim();
      const existing = existingForMed.find((template) => (template.time ?? '').trim() === trimmedTime);
      nextPlan.push({
        id: existing?.id ?? generatePlanTemplateId(planWeekKey, nextPlan.length + index, nextPlan),
        time: trimmedTime,
        medication: medName,
        reminderEnabled: existing?.reminderEnabled ?? existingForMed[0]?.reminderEnabled ?? reminderEnabled,
        repeat: normalized,
      });
    });

    this.setMedicationPlanForWeek(planWeekKey, nextPlan);
    return nextPlan;
  }

  private spreadMedicationTemplatesForName(planWeekKey: string, medicationName: string, plan: MedicationPlanTemplate[]) {
    const templates = plan.filter((template) => template.medication.trim() === medicationName.trim());
    const scheduled = templates.find((template) => normalizeMedicationRepeat(template.repeat).startDateKey);
    if (!scheduled) return;
    this.spreadMedicationTemplate(planWeekKey, scheduled);
  }

  private shouldShowCatalogEntry(entry: MedicationCatalogEntry): boolean {
    if (entry.isDraft) return true;
    const label = formatMedicationLabel(entry.name, entry.dose).trim();
    if (!label) return true;
    return this.hasMedicationSchedule(label) || this.hasMedicationInDays(label);
  }

  private syncCatalogFromDayRows() {
    let changed = false;
    for (const day of Object.values(this.days)) {
      for (const row of day.medications) {
        if (this.ensureCatalogEntryForMedication(row.medication, false)) {
          changed = true;
        }
      }
    }
    if (changed) {
      this.schedulePersist();
    }
  }

  private ensureCatalogEntryForMedication(label: string, persist = true): boolean {
    const trimmed = label.trim();
    if (!trimmed) return false;

    const key = trimmed.toLowerCase();
    const exists = this.medicationCatalog.some(
      (entry) => formatMedicationLabel(entry.name, entry.dose).trim().toLowerCase() === key,
    );
    if (exists) return false;

    const { name, dose } = parseMedicationLabel(trimmed);
    this.medicationCatalog = [
      ...this.medicationCatalog,
      {
        id: `med-catalog-${Date.now()}-${this.medicationCatalog.length}`,
        name,
        dose,
      },
    ];
    if (persist) {
      this.schedulePersist();
    }
    return true;
  }

  private pruneMedicationCatalog() {
    const next = this.medicationCatalog.filter((entry) => this.shouldShowCatalogEntry(entry));
    if (next.length !== this.medicationCatalog.length) {
      this.medicationCatalog = next;
      this.schedulePersist();
    }
  }

  private collectMedicationsFromData(): MedicationCatalogEntry[] {
    const seen = new Map<string, MedicationCatalogEntry>();
    const addLabel = (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) return;
      const { name, dose } = parseMedicationLabel(trimmed);
      seen.set(key, {
        id: `med-catalog-${seen.size}`,
        name,
        dose,
      });
    };

    for (const plan of Object.values(this.weekMedicationPlans)) {
      for (const template of plan) {
        addLabel(template.medication);
      }
    }
    for (const day of Object.values(this.days)) {
      for (const row of day.medications) {
        addLabel(row.medication);
      }
    }

    return [...seen.values()];
  }

  private markCatalogEntryScheduled(medicationName: string) {
    const target = medicationName.trim().toLowerCase();
    if (!target) return;

    this.medicationCatalog = this.medicationCatalog.map((entry) => {
      const label = formatMedicationLabel(entry.name, entry.dose).trim().toLowerCase();
      if (label === target) return { ...entry, isDraft: false };
      return entry;
    });
  }

  private removeMedicationFromCatalog(medicationName: string) {
    const target = medicationName.trim().toLowerCase();
    if (!target) return;

    this.medicationCatalog = this.medicationCatalog.filter((entry) => {
      const label = formatMedicationLabel(entry.name, entry.dose).trim().toLowerCase();
      return label !== target;
    });
  }

  addMedicationCatalogEntry() {
    const entry: MedicationCatalogEntry = {
      id: `med-catalog-${Date.now()}`,
      name: '',
      dose: '',
      isDraft: true,
    };
    this.medicationCatalog = [...this.medicationCatalog, entry];
    this.schedulePersist();
    return entry.id;
  }

  removeMedicationCatalogEntry(id: string) {
    const entry = this.medicationCatalog.find((item) => item.id === id);
    if (!entry) return;

    const label = formatMedicationLabel(entry.name, entry.dose).trim();
    this.medicationCatalog = this.medicationCatalog.filter((item) => item.id !== id);

    if (label) {
      this.purgeMedicationData(label, false);
    }

    this.schedulePersist();
  }

  updateMedicationCatalogEntry(id: string, patch: Partial<Pick<MedicationCatalogEntry, 'name' | 'dose'>>) {
    const index = this.medicationCatalog.findIndex((entry) => entry.id === id);
    if (index < 0) return;

    const current = this.medicationCatalog[index];
    const oldLabel = formatMedicationLabel(current.name, current.dose);
    const next = { ...current, ...patch };
    const newLabel = formatMedicationLabel(next.name, next.dose);

    this.medicationCatalog = this.medicationCatalog.map((entry) =>
      entry.id === id ? next : entry,
    );

    if (oldLabel && newLabel && oldLabel !== newLabel) {
      this.renameMedicationLabel(oldLabel, newLabel);
    }

    this.schedulePersist();
  }

  private renameMedicationLabel(oldLabel: string, newLabel: string) {
    const nextDays: DayLogs = {};
    for (const [dateKey, day] of Object.entries(this.days)) {
      nextDays[dateKey] = {
        ...day,
        medications: day.medications.map((row) =>
          row.medication.trim() === oldLabel ? { ...row, medication: newLabel } : row,
        ),
      };
    }
    this.days = nextDays;

    const nextPlans: Record<string, MedicationPlanTemplate[]> = {};
    for (const [weekKey, plan] of Object.entries(this.weekMedicationPlans)) {
      nextPlans[weekKey] = plan.map((template) =>
        template.medication.trim() === oldLabel ? { ...template, medication: newLabel } : template,
      );
    }
    this.weekMedicationPlans = nextPlans;
  }

  updateDayField(dateKey: string, field: 'sleep' | 'triggers' | 'sport' | 'events', text: string) {
    const day = this.ensureDay(dateKey);
    day[field] = text;
    this.days = { ...this.days, [dateKey]: { ...day } };
    this.schedulePersist();
  }

  setPanicAttackCount(dateKey: string, count: number) {
    const day = this.ensureDay(dateKey);
    const panicAttackCount = Math.max(0, Math.floor(count));
    this.days = { ...this.days, [dateKey]: { ...day, panicAttackCount } };
    this.schedulePersist();
  }

  addMedicationRow(dateKey: string) {
    const day = this.ensureDay(dateKey);
    const meds = [...day.medications];
    meds.push({
      id: generateSafeId(dateKey, meds.length, meds),
      time: '',
      medication: '',
      taken: false,
      reminderEnabled: true,
    });
    this.days = { ...this.days, [dateKey]: { ...day, medications: meds } };
    this.schedulePersist();
  }

  updateMedication(
    dateKey: string,
    rowId: string,
    patch: Partial<Pick<MedicationRow, 'time' | 'medication' | 'reminderEnabled'>>,
    idx: number,
  ) {
    const day = this.ensureDay(dateKey);
    const meds = [...day.medications];

    let rowIndex = meds.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) {
      while (meds.length < idx) {
        meds.push({
          id: generateSafeId(dateKey, meds.length, meds),
          time: '',
          medication: '',
          taken: false,
          reminderEnabled: true,
        });
      }
      meds[idx] = {
        id: rowId,
        time: '',
        medication: '',
        taken: false,
        reminderEnabled: true,
      };
      rowIndex = idx;
    }

    const previousLabel = meds[rowIndex]?.medication ?? '';
    const previousTime = (meds[rowIndex]?.time ?? '').trim();
    meds[rowIndex] = { ...meds[rowIndex], ...patch };
    this.days = { ...this.days, [dateKey]: { ...day, medications: meds } };

    let syncedSchedule = false;
    if ('time' in patch && patch.time !== undefined) {
      const medName = meds[rowIndex].medication.trim();
      const newTime = (patch.time ?? '').trim();
      if (medName && newTime) {
        const weekKey = format(
          startOfWeek(parse(dateKey, 'yyyy-MM-dd', new Date()), { weekStartsOn: WEEK_STARTS_ON }),
          'yyyy-MM-dd',
        );
        const schedule = this.getMedicationScheduleForName(medName, weekKey);
        const slotIndex = this.getMedicationTimeSlotIndex(meds, rowId, medName, idx);
        const nextTimes = this.buildNextScheduleTimes(schedule.times, slotIndex, previousTime, newTime);
        const fallbackRepeat = normalizeMedicationRepeat({
          ...DEFAULT_MEDICATION_REPEAT,
          startDateKey: dateKey,
        });
        this.setMedicationIntakeTimes(
          weekKey,
          medName,
          nextTimes,
          schedule.repeat.startDateKey ? schedule.repeat : fallbackRepeat,
        );
        syncedSchedule = true;
      }
    }

    if ('medication' in patch) {
      this.ensureCatalogEntryForMedication(patch.medication ?? '');
      if (previousLabel.trim() && previousLabel.trim() !== (patch.medication ?? '').trim()) {
        this.pruneMedicationCatalog();
      }
    }

    if (!syncedSchedule) {
      this.schedulePersist();
    }
  }

  setMedicationStatus(dateKey: string, rowId: string, idx: number, status: 'taken' | 'skipped') {
    const day = this.ensureDay(dateKey);
    const meds = [...day.medications];

    let rowIndex = meds.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) {
      while (meds.length < idx) {
        meds.push({
          id: generateSafeId(dateKey, meds.length, meds),
          time: '',
          medication: '',
          taken: false,
          skipped: false,
          reminderEnabled: true,
        });
      }
      meds[idx] = {
        id: rowId,
        time: '',
        medication: '',
        taken: status === 'taken',
        skipped: status === 'skipped',
        takenAt: status === 'taken' ? format(new Date(), 'HH:mm') : undefined,
        reminderEnabled: true,
      };
    } else {
      meds[rowIndex] = {
        ...meds[rowIndex],
        taken: status === 'taken',
        skipped: status === 'skipped',
        takenAt: status === 'taken' ? format(new Date(), 'HH:mm') : undefined,
      };
    }

    this.days = { ...this.days, [dateKey]: { ...day, medications: meds } };
    this.schedulePersist();
  }

  toggleMedicationReminder(dateKey: string, rowId: string, idx: number) {
    const day = this.ensureDay(dateKey);
    const meds = [...day.medications];
    const rowIndex = meds.findIndex((r) => r.id === rowId);
    if (rowIndex < 0) return;
    meds[rowIndex] = { ...meds[rowIndex], reminderEnabled: !meds[rowIndex].reminderEnabled };
    this.days = { ...this.days, [dateKey]: { ...day, medications: meds } };
    this.schedulePersist();
  }

  deleteMedicationRow(dateKey: string, idx: number) {
    const day = this.ensureDay(dateKey);
    if (idx < 0 || idx >= day.medications.length) return;
    if (day.medications.length <= DEFAULT_MEDICATION_ROWS) return;
    const meds = [...day.medications];
    meds.splice(idx, 1);
    this.days = { ...this.days, [dateKey]: { ...day, medications: meds } };
    this.schedulePersist();
  }

  getWeekMedicationPlan(weekKey: string): MedicationPlanTemplate[] {
    const saved = this.weekMedicationPlans[weekKey];
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map((template) => ({
        ...template,
        repeat: normalizeMedicationRepeat({
          ...(template.repeat ?? DEFAULT_MEDICATION_REPEAT),
          daysOfWeek: [...(template.repeat?.daysOfWeek ?? DEFAULT_MEDICATION_REPEAT.daysOfWeek)],
        }),
      }));
    }
    return [defaultPlanTemplate(weekKey)];
  }

  applyWeekMedicationPlan(weekStartKey: string, templates: MedicationPlanTemplate[]) {
    const activeTemplates = templates
      .filter((template) => template.medication.trim())
      .map((template) => ({
        ...template,
        medication: template.medication.trim(),
        repeat: normalizeMedicationRepeat({
          ...template.repeat,
          daysOfWeek: template.repeat.everyDay ? [0, 1, 2, 3, 4, 5, 6] : [...template.repeat.daysOfWeek],
        }),
      }));

    this.weekMedicationPlans = {
      ...this.weekMedicationPlans,
      [weekStartKey]: activeTemplates.map((template) => ({
        ...template,
        repeat: { ...template.repeat, daysOfWeek: [...template.repeat.daysOfWeek] },
      })),
    };

    const weekStart = parse(weekStartKey, 'yyyy-MM-dd', new Date());
    for (let offset = 0; offset < 7; offset += 1) {
      const day = addDays(weekStart, offset);
      const dateKey = format(day, 'yyyy-MM-dd');
      this.syncDayMedicationsFromPlan(dateKey, activeTemplates, weekStartKey);
    }

    for (const template of activeTemplates) {
      this.spreadMedicationTemplate(weekStartKey, template);
    }

    this.schedulePersist();
  }

  setMedicationIntakeRepeat(
    weekStartKey: string,
    row: Pick<MedicationRow, 'medication' | 'time'>,
    repeat: MedicationRepeatConfig,
  ) {
    this.updateMedicationRepeat(weekStartKey, row, repeat);
  }

  deleteMedicationSchedule(weekStartKey: string, medicationName: string) {
    const trimmedName = medicationName.trim();
    if (!trimmedName) return;

    this.purgeMedicationData(trimmedName, true);
    this.schedulePersist();
  }

  private purgeMedicationData(medicationName: string, removeFromCatalog: boolean) {
    const trimmedName = medicationName.trim();
    if (!trimmedName) return;

    const nextPlans: Record<string, MedicationPlanTemplate[]> = {};
    for (const [weekKey, plan] of Object.entries(this.weekMedicationPlans)) {
      nextPlans[weekKey] = plan
        .filter((template) => template.medication.trim() !== trimmedName)
        .map((entry) => ({
          ...entry,
          repeat: { ...entry.repeat, daysOfWeek: [...entry.repeat.daysOfWeek] },
        }));
    }
    this.weekMedicationPlans = nextPlans;

    const nextDays: DayLogs = {};
    for (const [dateKey, day] of Object.entries(this.days)) {
      let meds = day.medications.filter((row) => row.medication.trim() !== trimmedName);
      if (meds.length < DEFAULT_MEDICATION_ROWS) {
        const padCount = DEFAULT_MEDICATION_ROWS - meds.length;
        const emptyRows = Array.from({ length: padCount }).map((_, idx) => ({
          id: generateSafeId(dateKey, meds.length + idx, meds),
          time: '',
          medication: '',
          taken: false,
          reminderEnabled: true,
        }));
        meds = [...meds, ...emptyRows];
      }
      nextDays[dateKey] = { ...day, medications: meds };
    }
    this.days = nextDays;

    if (removeFromCatalog) {
      this.removeMedicationFromCatalog(trimmedName);
    }
  }

  setMedicationDuration(
    weekStartKey: string,
    row: Pick<MedicationRow, 'medication' | 'time'>,
    updates: { startDateKey?: string; endDateKey?: string | null },
  ) {
    const schedule = this.getMedicationScheduleForName(row.medication.trim(), weekStartKey);
    const current = normalizeMedicationRepeat(schedule.repeat);
    const nextRepeat: MedicationRepeatConfig = { ...current };

    if (updates.startDateKey) {
      nextRepeat.startDateKey = updates.startDateKey;
    }

    if ('endDateKey' in updates) {
      if (!nextRepeat.startDateKey) {
        nextRepeat.startDateKey = current.startDateKey ?? weekStartKey;
      }
      if (updates.endDateKey === null) {
        nextRepeat.endDateKey = null;
      } else if (updates.endDateKey) {
        nextRepeat.endDateKey = updates.endDateKey;
        const startKey = nextRepeat.startDateKey ?? weekStartKey;
        const start = parse(startKey, 'yyyy-MM-dd', new Date());
        const end = parse(updates.endDateKey, 'yyyy-MM-dd', new Date());
        nextRepeat.months = Math.max(1, differenceInCalendarMonths(end, start) || 1);
      }
    }

    this.updateMedicationRepeat(weekStartKey, row, normalizeMedicationRepeat(nextRepeat));
  }

  private updateMedicationRepeat(
    weekStartKey: string,
    row: Pick<MedicationRow, 'medication' | 'time'>,
    repeat: MedicationRepeatConfig,
  ) {
    const normalized = normalizeMedicationRepeat(repeat);
    const medName = row.medication.trim();
    if (!medName) return;

    const schedule = this.getMedicationScheduleForName(medName, weekStartKey);
    const planWeekKey = this.resolveMedicationPlanWeekKey(medName, normalized, weekStartKey);
    const times =
      schedule.times.length > 0 ? schedule.times : row.time?.trim() ? [row.time.trim()] : [''];

    const nextPlan = this.applyMedicationPlanTemplates(planWeekKey, medName, times, normalized);
    this.spreadMedicationTemplatesForName(planWeekKey, medName, nextPlan);

    this.markCatalogEntryScheduled(medName);
    this.schedulePersist();
  }

  setMedicationIntakeTimes(
    weekStartKey: string,
    medicationName: string,
    times: string[],
    fallbackRepeat: MedicationRepeatConfig,
  ) {
    const trimmedName = medicationName.trim();
    const cleanedTimes = [...new Set(times.map((time) => time.trim()).filter(Boolean))];
    if (!trimmedName || cleanedTimes.length === 0) return;

    const schedule = this.getMedicationScheduleForName(trimmedName, weekStartKey);
    const repeat = schedule.repeat.startDateKey
      ? schedule.repeat
      : normalizeMedicationRepeat(fallbackRepeat);
    const planWeekKey = this.resolveMedicationPlanWeekKey(trimmedName, repeat, weekStartKey);

    const nextPlan = this.applyMedicationPlanTemplates(planWeekKey, trimmedName, cleanedTimes, repeat);
    this.spreadMedicationTemplatesForName(planWeekKey, trimmedName, nextPlan);

    this.markCatalogEntryScheduled(trimmedName);
    this.schedulePersist();
  }

  private getMedicationTimeSlotIndex(
    meds: MedicationRow[],
    rowId: string,
    medName: string,
    fallbackIndex = 0,
  ): number {
    const target = medName.trim().toLowerCase();
    if (!target) return fallbackIndex;

    let slot = 0;
    for (const med of meds) {
      if (med.medication.trim().toLowerCase() !== target) continue;
      if (med.id === rowId) return slot;
      slot += 1;
    }

    return fallbackIndex;
  }

  private buildNextScheduleTimes(
    currentTimes: string[],
    slotIndex: number,
    oldTime: string,
    newTime: string,
  ): string[] {
    const normalizedNew = normalizeMedicationTime(newTime);
    if (!normalizedNew) return currentTimes;

    if (currentTimes.length === 0) {
      return [normalizedNew];
    }

    const oldNormalized = oldTime.trim();
    if (oldNormalized) {
      const byOldTime = currentTimes.findIndex((time) => medicationTimesEqual(time, oldNormalized));
      if (byOldTime >= 0) {
        const next = [...currentTimes];
        next[byOldTime] = normalizedNew;
        return next;
      }
    }

    if (slotIndex >= 0 && slotIndex < currentTimes.length) {
      const next = [...currentTimes];
      next[slotIndex] = normalizedNew;
      return next;
    }

    if (currentTimes.length === 1) {
      return [normalizedNew];
    }

    return [...currentTimes];
  }

  private purgeMedicationOutsideSchedule(
    medicationName: string,
    template: MedicationPlanTemplate,
    weekStartKey: string,
  ) {
    const trimmedName = medicationName.trim();
    if (!trimmedName) return;

    const repeat = normalizeMedicationRepeat(template.repeat);
    if (!repeat.startDateKey) return;

    const anchor = getMedicationDurationStart(repeat, weekStartKey);
    const nextDays: DayLogs = { ...this.days };

    for (const [dateKey, day] of Object.entries(this.days)) {
      const hasMedication = day.medications.some((row) => row.medication.trim() === trimmedName);
      if (!hasMedication) continue;

      const targetDate = parse(dateKey, 'yyyy-MM-dd', new Date());
      const shouldKeep =
        isWithinMedicationDuration(targetDate, repeat, weekStartKey) &&
        medicationRepeatMatchesDay(targetDate, anchor, repeat);

      if (shouldKeep) continue;

      const meds = ensureMinimumMedicationRows(
        dateKey,
        day.medications.filter((row) => row.medication.trim() !== trimmedName),
      );
      nextDays[dateKey] = { ...day, medications: meds };
    }

    this.days = nextDays;
  }

  private syncDayMedicationsFromPlan(
    dateKey: string,
    templates: MedicationPlanTemplate[],
    weekStartKey: string,
  ) {
    const day = this.ensureDay(dateKey);
    const targetDate = parse(dateKey, 'yyyy-MM-dd', new Date());
    const matching = templates.filter((template) => {
      const repeat = normalizeMedicationRepeat(template.repeat);
      if (!repeat.startDateKey) return false;
      if (!isWithinMedicationDuration(targetDate, repeat, weekStartKey)) return false;
      const anchorDate = getMedicationDurationStart(repeat, weekStartKey);
      return medicationRepeatMatchesDay(targetDate, anchorDate, repeat);
    });

    if (matching.length === 0) {
      this.days = {
        ...this.days,
        [dateKey]: { ...day, medications: defaultMedicationRows(dateKey) },
      };
      return;
    }

    const meds = matching.map((template, index) => {
      const existing = day.medications.find((row) => medicationMatches(row, template));
      return {
        id: existing?.id ?? generateSafeId(dateKey, index, day.medications),
        time: template.time,
        medication: template.medication,
        taken: existing?.taken ?? false,
        skipped: existing?.skipped ?? false,
        takenAt: existing?.takenAt,
        reminderEnabled: template.reminderEnabled,
      };
    });

    this.days = { ...this.days, [dateKey]: { ...day, medications: meds } };
  }

  private syncMedicationRowsForDay(
    dateKey: string,
    medName: string,
    expectedEntries: Pick<MedicationRow, 'time' | 'medication' | 'reminderEnabled'>[],
  ) {
    if (expectedEntries.length === 0) return;

    const day = this.ensureDay(dateKey);
    const meds = [...day.medications];

    const medRowIndices: number[] = [];
    meds.forEach((row, index) => {
      if (row.medication.trim() === medName) {
        medRowIndices.push(index);
      }
    });

    const existingMedRows = medRowIndices.map((index) => meds[index]);
    const syncedRows: MedicationRow[] = expectedEntries.map((expected, index) => {
      const existing = existingMedRows[index];
      return {
        id: existing?.id ?? generateSafeId(dateKey, meds.length + index, meds),
        time: expected.time,
        medication: expected.medication,
        taken: existing?.taken ?? false,
        skipped: existing?.skipped ?? false,
        takenAt: existing?.takenAt,
        reminderEnabled: expected.reminderEnabled,
      };
    });

    if (medRowIndices.length === 0) {
      for (const syncedRow of syncedRows) {
        const emptyIndex = meds.findIndex((row) => !row.medication.trim() && !(row.time ?? '').trim());
        if (emptyIndex >= 0) {
          meds[emptyIndex] = { ...syncedRow, id: meds[emptyIndex].id };
        } else {
          meds.push(syncedRow);
        }
      }
    } else {
      const insertAt = medRowIndices[0];
      for (let index = medRowIndices.length - 1; index >= 0; index -= 1) {
        meds.splice(medRowIndices[index], 1);
      }
      meds.splice(insertAt, 0, ...syncedRows);
    }

    this.days = {
      ...this.days,
      [dateKey]: { ...day, medications: ensureMinimumMedicationRows(dateKey, meds) },
    };
  }

  private spreadMedicationTemplate(weekStartKey: string, template: MedicationPlanTemplate) {
    const medName = template.medication.trim();
    if (!medName) return;

    const repeat = normalizeMedicationRepeat(template.repeat);
    if (!repeat.startDateKey) return;

    const planWeekKey = this.resolveMedicationPlanWeekKey(medName, repeat, weekStartKey);
    const plan = this.getWeekMedicationPlan(planWeekKey);
    const templatesForMed = plan.filter((entry) => entry.medication.trim() === medName);
    const expectedEntries = templatesForMed.map((entry) => ({
      time: entry.time,
      medication: entry.medication,
      reminderEnabled: entry.reminderEnabled,
    }));

    this.purgeMedicationOutsideSchedule(medName, template, weekStartKey);

    const start = getMedicationDurationStart(repeat, weekStartKey);
    const end = getMedicationDurationEnd(repeat, weekStartKey);
    if (startOfDay(start) > startOfDay(end)) return;

    let cursor = start;

    while (cursor <= end) {
      if (medicationRepeatMatchesDay(cursor, start, repeat)) {
        this.syncMedicationRowsForDay(format(cursor, 'yyyy-MM-dd'), medName, expectedEntries);
      }
      cursor = addDays(cursor, 1);
    }
  }

  repeatMedication(sourceDateKey: string, rowId: string, config: MedicationRepeatConfig) {
    const sourceDay = this.ensureDay(sourceDateKey);
    const sourceRow = sourceDay.medications.find((row) => row.id === rowId);
    if (!sourceRow?.medication.trim()) return 0;

    const template = {
      time: sourceRow.time,
      medication: sourceRow.medication.trim(),
      reminderEnabled: sourceRow.reminderEnabled,
    };

    const start = parse(sourceDateKey, 'yyyy-MM-dd', new Date());
    const end = addMonths(start, config.months);
    let applied = 0;
    let cursor = addDays(start, 1);

    while (cursor <= end) {
      const matches = medicationRepeatMatchesDay(cursor, start, normalizeMedicationRepeat(config));
      if (matches) {
        const targetKey = format(cursor, 'yyyy-MM-dd');
        if (this.upsertMedicationFromTemplate(targetKey, template)) {
          applied += 1;
        }
      }
      cursor = addDays(cursor, 1);
    }

    if (applied > 0) {
      this.schedulePersist();
    }
    return applied;
  }

  private upsertMedicationFromTemplate(
    targetDateKey: string,
    template: Pick<MedicationRow, 'time' | 'medication' | 'reminderEnabled'>,
  ): boolean {
    const day = this.ensureDay(targetDateKey);
    const meds = [...day.medications];

    const duplicate = meds.some((row) => medicationMatches(row, template));
    if (duplicate) return false;

    const emptyIndex = meds.findIndex((row) => !row.medication.trim() && !(row.time ?? '').trim());
    const nextRow: MedicationRow = {
      id: generateSafeId(targetDateKey, meds.length, meds),
      time: template.time,
      medication: template.medication,
      taken: false,
      reminderEnabled: template.reminderEnabled,
    };

    if (emptyIndex >= 0) {
      meds[emptyIndex] = { ...nextRow, id: meds[emptyIndex].id };
    } else {
      meds.push(nextRow);
    }

    this.days = { ...this.days, [targetDateKey]: { ...day, medications: meds } };
    return true;
  }

  getMedicationAdherence(dateKey: string): 'none' | 'partial' | 'full' | 'empty' {
    const day = this.days[dateKey];
    if (!day) return 'empty';
    const filled = day.medications.filter((m) => m.medication.trim());
    if (filled.length === 0) return 'empty';
    const taken = filled.filter((m) => m.taken);
    if (taken.length === filled.length) return 'full';
    if (taken.length > 0) return 'partial';
    return 'none';
  }
}

export const wellnessStore = new WellnessStore();

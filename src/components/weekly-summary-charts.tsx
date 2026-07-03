import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Locale } from 'date-fns';

import type { AppLabels, Language } from '@/constants/i18n';
import { Fonts } from '@/constants/theme';
import type { DayLog } from '@/stores/wellness-store';
import { formatSleepClock } from '@/utils/sleep-log';
import {
  buildWeeklySummaryEntries,
  buildWeeklyTriggerCounts,
  formatWeeklyTriggerLine,
  getWeeklySummaryMaxPanic,
  type WeeklySummaryDayEntry,
} from '@/utils/weekly-summary-data';

type ThemeSlice = {
  text: string;
  textSecondary: string;
  panelBg: string;
  barColor: string;
  borderColor: string;
};

type Props = {
  weekDays: Date[];
  days: Record<string, DayLog>;
  labels: AppLabels;
  locale: Locale;
  language: Language;
  theme: ThemeSlice;
};

const BLOCK_SIZE = 6;
const BLOCK_GAP = 1;

function VerticalBlockBar({
  value,
  maxBlocks,
  color,
}: {
  value: number;
  maxBlocks: number;
  color: string;
}) {
  const filledCount = value <= 0 ? 0 : Math.min(value, maxBlocks);

  return (
    <View style={[styles.verticalBarTrack, { height: maxBlocks * (BLOCK_SIZE + BLOCK_GAP) - BLOCK_GAP }]}>
      {Array.from({ length: maxBlocks }).map((_, index) => {
        const fromBottom = maxBlocks - 1 - index;
        const filled = fromBottom < filledCount;

        return (
          <View
            key={index}
            style={[
              styles.verticalBlock,
              {
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                backgroundColor: filled ? color : 'transparent',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function MedicationsCell({
  entry,
  noData,
  theme,
}: {
  entry: WeeklySummaryDayEntry;
  noData: string;
  theme: ThemeSlice;
}) {
  if (entry.medications.length === 0) {
    return <Text style={[styles.cellText, styles.wrappedText, { color: theme.textSecondary }]}>{noData}</Text>;
  }

  return (
    <View style={styles.stackContent}>
      {entry.medications.map((medication, index) => (
        <View key={`${entry.dateKey}-${index}`} style={styles.medicationItem}>
          <Text style={[styles.medicationName, styles.wrappedText, { color: theme.text }]}>{medication.name}</Text>
          {medication.dose ? (
            <Text style={[styles.medicationDose, styles.wrappedText, { color: theme.textSecondary }]}>
              {medication.dose}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function TriggersCell({
  entry,
  noData,
  theme,
}: {
  entry: WeeklySummaryDayEntry;
  noData: string;
  theme: ThemeSlice;
}) {
  if (entry.triggers.length === 0) {
    return <Text style={[styles.cellText, styles.wrappedText, { color: theme.textSecondary }]}>{noData}</Text>;
  }

  return (
    <View style={styles.stackContent}>
      {entry.triggers.map((trigger, index) => (
        <Text key={`${entry.dateKey}-${index}`} style={[styles.triggerText, styles.wrappedText, { color: theme.text }]}>
          {trigger}
        </Text>
      ))}
    </View>
  );
}

export function WeeklySummaryCharts({ weekDays, days, labels, locale, language, theme }: Props) {
  const entries = useMemo(
    () => buildWeeklySummaryEntries(weekDays, days, locale, language),
    [weekDays, days, locale, language],
  );

  const maxPanic = useMemo(() => getWeeklySummaryMaxPanic(entries), [entries]);
  const triggerCounts = useMemo(() => buildWeeklyTriggerCounts(entries), [entries]);

  return (
    <View style={styles.wrap}>
    <View style={[styles.table, { backgroundColor: theme.panelBg, borderColor: theme.borderColor }]}>
      <View style={[styles.tableRow, styles.headerRow, { borderColor: theme.borderColor }]}>
        <View style={styles.labelCell} />
        {entries.map((entry) => (
          <View key={entry.dateKey} style={styles.dayCell}>
            <Text style={[styles.dayHeader, { color: theme.text }]}>{entry.dayLabel}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.tableRow, styles.expandedRow, { borderColor: theme.borderColor }]}>
        <Text style={[styles.rowLabel, styles.expandedRowLabel, { color: theme.text }]}>
          {labels.weeklyChartMedications}
        </Text>
        {entries.map((entry) => (
          <View key={entry.dateKey} style={[styles.dayCell, styles.dayCellExpanded]}>
            <MedicationsCell entry={entry} noData={labels.weeklyNoData} theme={theme} />
          </View>
        ))}
      </View>

      <View style={[styles.tableRow, { borderColor: theme.borderColor }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]} numberOfLines={2}>
          {labels.weeklyChartAnxiety}
        </Text>
        {entries.map((entry) => (
          <View key={entry.dateKey} style={styles.dayCell}>
            <VerticalBlockBar value={entry.panicCount} maxBlocks={maxPanic} color={theme.barColor} />
          </View>
        ))}
      </View>

      <View style={[styles.tableRow, { borderColor: theme.borderColor }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]} numberOfLines={2}>
          {labels.weeklyChartSleep}
        </Text>
        {entries.map((entry) => (
          <View key={entry.dateKey} style={styles.dayCell}>
            <Text style={[styles.cellText, { color: theme.text }]}>
              {entry.sleepMinutes !== null ? formatSleepClock(entry.sleepMinutes) : labels.weeklyNoData}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.tableRow, styles.sportRow, { borderColor: theme.borderColor }]}>
        <Text style={[styles.rowLabel, { color: theme.text }]} numberOfLines={2}>
          {labels.weeklyChartSport}
        </Text>
        {entries.map((entry) => (
          <View key={entry.dateKey} style={styles.dayCell}>
            <Text style={[styles.cellText, { color: theme.text }]}>
              {entry.sportMinutes > 0 ? formatSleepClock(entry.sportMinutes) : labels.weeklyNoData}
            </Text>
            <Text style={[styles.cellTextSecondary, { color: theme.textSecondary }]}>
              {entry.sportSteps > 0 ? entry.sportSteps.toLocaleString() : labels.weeklyNoData}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.tableRow, styles.expandedRow, styles.lastRow, { borderColor: theme.borderColor }]}>
        <Text style={[styles.rowLabel, styles.expandedRowLabel, { color: theme.text }]}>
          {labels.weeklyChartTriggers}
        </Text>
        {entries.map((entry) => (
          <View key={entry.dateKey} style={[styles.dayCell, styles.dayCellExpanded]}>
            <TriggersCell entry={entry} noData={labels.weeklyNoData} theme={theme} />
          </View>
        ))}
      </View>
    </View>

    <View style={[styles.mainTriggersBlock, { backgroundColor: theme.panelBg, borderColor: theme.borderColor }]}>
      <Text style={[styles.mainTriggersTitle, { color: theme.text }]}>{labels.weeklyMainTriggers}</Text>
      {triggerCounts.length === 0 ? (
        <Text style={[styles.mainTriggersLine, { color: theme.textSecondary }]}>{labels.weeklyNoData}</Text>
      ) : (
        triggerCounts.map((item) => (
          <Text key={item.name} style={[styles.mainTriggersLine, { color: theme.text }]}>
            {formatWeeklyTriggerLine(item.name, item.count, language)}
          </Text>
        ))
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginBottom: 14,
  },
  table: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    minHeight: 28,
  },
  headerRow: {
    minHeight: 24,
  },
  sportRow: {
    minHeight: 36,
  },
  expandedRow: {
    alignItems: 'stretch',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  labelCell: {
    width: 58,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  rowLabel: {
    width: 58,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  expandedRowLabel: {
    alignSelf: 'flex-start',
  },
  dayCell: {
    flex: 1,
    flexBasis: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    minWidth: 0,
    overflow: 'hidden',
  },
  dayCellExpanded: {
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
  },
  stackContent: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  wrappedText: {
    width: '100%',
    flexShrink: 1,
    textAlign: 'center',
  },
  dayHeader: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Fonts.mono,
  },
  verticalBarTrack: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
    gap: BLOCK_GAP,
  },
  verticalBlock: {
    borderRadius: 1,
  },
  cellText: {
    fontSize: 9,
    fontFamily: Fonts.mono,
    fontWeight: '600',
    lineHeight: 12,
    textAlign: 'center',
  },
  cellTextSecondary: {
    marginTop: 2,
    fontSize: 8,
    fontFamily: Fonts.mono,
    fontWeight: '600',
    lineHeight: 10,
    textAlign: 'center',
  },
  triggerText: {
    fontSize: 7,
    fontWeight: '600',
    lineHeight: 9,
  },
  medicationItem: {
    width: '100%',
    alignItems: 'center',
    gap: 1,
  },
  medicationName: {
    fontSize: 7,
    fontWeight: '700',
    lineHeight: 9,
  },
  medicationDose: {
    fontSize: 7,
    fontWeight: '600',
    lineHeight: 9,
  },
  mainTriggersBlock: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  mainTriggersTitle: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  mainTriggersLine: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 15,
  },
});

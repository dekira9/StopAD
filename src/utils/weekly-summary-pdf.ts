import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { AppLabels, Language } from '@/constants/i18n';
import type { DayLog } from '@/stores/wellness-store';
import { formatSleepClock } from '@/utils/sleep-log';
import {
  buildWeeklySummaryEntries,
  buildWeeklyTriggerCounts,
  formatWeeklyTriggerLine,
  getWeeklySummaryMaxPanic,
  type WeeklySummaryDayEntry,
} from '@/utils/weekly-summary-data';

type ExportOptions = {
  weekDays: Date[];
  days: Record<string, DayLog>;
  labels: AppLabels;
  locale: Locale;
  language: Language;
  weekSummaryText?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatWeekRange(weekDays: Date[], locale: Locale): string {
  const start = weekDays[0];
  const end = weekDays[weekDays.length - 1];
  return `${format(start, 'd.MM.yyyy', { locale })} – ${format(end, 'd.MM.yyyy', { locale })}`;
}

function renderPanicBars(count: number, maxBlocks: number): string {
  const filledCount = count <= 0 ? 0 : Math.min(count, maxBlocks);
  const blocks = Array.from({ length: maxBlocks })
    .map((_, index) => {
      const fromBottom = maxBlocks - 1 - index;
      const filled = fromBottom < filledCount;
      return `<div class="panic-block${filled ? ' filled' : ''}"></div>`;
    })
    .join('');

  return `<div class="panic-bars">${blocks}</div>`;
}

function renderMedicationsCell(entry: WeeklySummaryDayEntry, noData: string): string {
  if (entry.medications.length === 0) {
    return `<span class="muted">${escapeHtml(noData)}</span>`;
  }

  return entry.medications
    .map((medication) => {
      const dose = medication.dose
        ? `<div class="secondary">${escapeHtml(medication.dose)}</div>`
        : '';
      return `<div class="stack-item"><div class="primary">${escapeHtml(medication.name)}</div>${dose}</div>`;
    })
    .join('');
}

function renderTriggersCell(entry: WeeklySummaryDayEntry, noData: string): string {
  if (entry.triggers.length === 0) {
    return `<span class="muted">${escapeHtml(noData)}</span>`;
  }

  return entry.triggers
    .map((trigger) => `<div class="stack-item compact">${escapeHtml(trigger)}</div>`)
    .join('');
}

function renderSportCell(entry: WeeklySummaryDayEntry, noData: string): string {
  const time =
    entry.sportMinutes > 0 ? escapeHtml(formatSleepClock(entry.sportMinutes)) : escapeHtml(noData);
  const steps =
    entry.sportSteps > 0 ? escapeHtml(entry.sportSteps.toLocaleString()) : escapeHtml(noData);

  return `<div class="primary">${time}</div><div class="secondary">${steps}</div>`;
}

export function buildWeeklySummaryHtml({
  weekDays,
  days,
  labels,
  locale,
  language,
  weekSummaryText,
}: ExportOptions): string {
  const entries = buildWeeklySummaryEntries(weekDays, days, locale, language);
  const maxPanic = getWeeklySummaryMaxPanic(entries);
  const triggerCounts = buildWeeklyTriggerCounts(entries, language);
  const weekRange = formatWeekRange(weekDays, locale);
  const noData = labels.weeklyNoData;

  const headerCells = entries.map((entry) => `<th>${escapeHtml(entry.dayLabel)}</th>`).join('');
  const medicationCells = entries
    .map((entry) => `<td class="data-cell">${renderMedicationsCell(entry, noData)}</td>`)
    .join('');
  const anxietyCells = entries
    .map((entry) => `<td class="data-cell center">${renderPanicBars(entry.panicCount, maxPanic)}</td>`)
    .join('');
  const sleepCells = entries
    .map(
      (entry) =>
        `<td class="data-cell center"><span class="mono">${
          entry.sleepMinutes !== null ? escapeHtml(formatSleepClock(entry.sleepMinutes)) : escapeHtml(noData)
        }</span></td>`,
    )
    .join('');
  const sportCells = entries
    .map((entry) => `<td class="data-cell center">${renderSportCell(entry, noData)}</td>`)
    .join('');
  const triggerCells = entries
    .map((entry) => `<td class="data-cell">${renderTriggersCell(entry, noData)}</td>`)
    .join('');

  const summaryBlock = weekSummaryText?.trim()
    ? `<div class="notes"><div class="notes-title">${escapeHtml(labels.weeklySummary)}</div><div class="notes-body">${escapeHtml(weekSummaryText.trim())}</div></div>`
    : '';

  const mainTriggersBlock =
    triggerCounts.length === 0
      ? `<div class="main-triggers"><div class="main-triggers-title">${escapeHtml(labels.weeklyMainTriggers)}</div><div class="main-triggers-line muted">${escapeHtml(noData)}</div></div>`
      : `<div class="main-triggers"><div class="main-triggers-title">${escapeHtml(labels.weeklyMainTriggers)}</div>${triggerCounts
          .map(
            (item) =>
              `<div class="main-triggers-line">${escapeHtml(formatWeeklyTriggerLine(item.name, item.count, language))}</div>`,
          )
          .join('')}</div>`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #141414;
        margin: 24px;
        font-size: 10px;
      }
      h1 {
        font-size: 14px;
        margin: 0 0 4px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .week-range {
        color: #6b6b6b;
        margin-bottom: 16px;
        font-size: 11px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      th, td {
        border: 1px solid #d8d8d8;
        vertical-align: top;
        padding: 6px 4px;
      }
      th {
        font-size: 9px;
        font-weight: 700;
        text-align: center;
        background: #f3f3f3;
      }
      th:first-child, td.label {
        width: 72px;
        font-weight: 800;
        background: #fafafa;
      }
      td.data-cell {
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }
      .center { text-align: center; vertical-align: middle; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .muted { color: #6b6b6b; }
      .primary { font-size: 9px; font-weight: 600; line-height: 1.3; }
      .secondary { font-size: 8px; color: #6b6b6b; line-height: 1.3; margin-top: 2px; }
      .stack-item { margin-bottom: 4px; }
      .stack-item:last-child { margin-bottom: 0; }
      .stack-item.compact { font-size: 8px; line-height: 1.25; }
      .panic-bars {
        display: inline-flex;
        flex-direction: column-reverse;
        gap: 1px;
        min-height: 24px;
        justify-content: flex-start;
      }
      .panic-block {
        width: 6px;
        height: 6px;
        border-radius: 1px;
      }
      .panic-block.filled { background: #141414; }
      .notes {
        margin-top: 18px;
        border-top: 1px solid #d8d8d8;
        padding-top: 12px;
      }
      .notes-title {
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .notes-body {
        white-space: pre-wrap;
        font-size: 11px;
        line-height: 1.45;
      }
      .main-triggers {
        margin-top: 14px;
        border: 1px solid #d8d8d8;
        border-radius: 10px;
        padding: 10px 12px;
      }
      .main-triggers-title {
        font-size: 11px;
        font-weight: 800;
        margin-bottom: 8px;
      }
      .main-triggers-line {
        font-size: 11px;
        line-height: 1.45;
        margin-bottom: 4px;
      }
      .main-triggers-line:last-child { margin-bottom: 0; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(labels.weeklySummary)}</h1>
    <div class="week-range">${escapeHtml(weekRange)}</div>
    <table>
      <thead>
        <tr>
          <th></th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="label">${escapeHtml(labels.weeklyChartMedications)}</td>
          ${medicationCells}
        </tr>
        <tr>
          <td class="label">${escapeHtml(labels.weeklyChartAnxiety)}</td>
          ${anxietyCells}
        </tr>
        <tr>
          <td class="label">${escapeHtml(labels.weeklyChartSleep)}</td>
          ${sleepCells}
        </tr>
        <tr>
          <td class="label">${escapeHtml(labels.weeklyChartSport)}</td>
          ${sportCells}
        </tr>
        <tr>
          <td class="label">${escapeHtml(labels.weeklyChartTriggers)}</td>
          ${triggerCells}
        </tr>
      </tbody>
    </table>
    ${mainTriggersBlock}
    ${summaryBlock}
  </body>
</html>`;
}

export async function exportWeeklySummaryPdf(options: ExportOptions): Promise<void> {
  const html = buildWeeklySummaryHtml(options);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: options.labels.weeklyExportPdf,
    });
    return;
  }

  await Print.printAsync({ html });
}

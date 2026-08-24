import { Colors, type ThemeColor } from '@/constants/theme';

export type AppColorTheme = (typeof Colors)['light'] | (typeof Colors)['dark'];

export type AppChromeTheme = {
  icon: string;
  iconMuted: string;
  cardBorder: string;
  circleBg: string;
  circleBorder: string;
  circleShadow: number;
  contentBg: string;
  /** Top / bottom chrome bars — slightly darker than main content. */
  barBg: string;
  dayBorder: string;
  rowBorder: string;
  sectionLabelBg: string;
  notesBlockBg: string;
  medicationCompleted: string;
  /** Soft periwinkle for medication name / dose / time fields in day rows. */
  medicationFieldText: string;
  accent: string;
  panelEdgeShadow: number;
  footerBorder: string;
  modalOverlay: string;
  modalBg: string;
  modalMutedBg: string;
  subtlePanelBg: string;
  subtlePanelBorder: string;
  checkOffBg: string;
  checkOffBorder: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  /** Darker outline for inactive top-bar tabs (Today / Week / Insights). */
  mainTabInactiveBorder: string;
  inactiveText: string;
};

export type ModalSurfaceTheme = {
  text: string;
  textSecondary: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  modalOverlay: string;
  modalBg: string;
  subtlePanelBg: string;
  subtlePanelBorder: string;
  sectionLabelBg: string;
  circleBg: string;
  circleBorder: string;
  icon: string;
  iconMuted: string;
  rowBorder: string;
  buttonShadow: number;
};

export function buildAppChromeTheme(theme: AppColorTheme, isDark: boolean): AppChromeTheme {
  const chromeBorder = theme.chromeBorder;

  return {
    icon: theme.text,
    iconMuted: isDark ? 'rgba(232,234,242,0.55)' : 'rgba(44,54,84,0.45)',
    cardBorder: chromeBorder,
    circleBg: isDark ? 'rgba(26,30,42,0.95)' : '#FFFFFF',
    circleBorder: chromeBorder,
    circleShadow: isDark ? 0 : 0.07,
    contentBg: theme.background,
    barBg: isDark ? theme.background : '#F5F6FA',
    dayBorder: chromeBorder,
    rowBorder: isDark ? 'rgba(154,168,212,0.12)' : 'rgba(44,54,84,0.07)',
    sectionLabelBg: theme.backgroundSelected,
    notesBlockBg: isDark ? 'rgba(22,26,38,0.70)' : Colors.light.cardSurface,
    medicationCompleted: isDark ? Colors.dark.medicationCompleted : Colors.light.medicationCompleted,
    medicationFieldText: isDark ? '#A8B6DE' : Colors.light.todayMarker,
    accent: theme.accent,
    panelEdgeShadow: isDark ? 0.22 : 0.08,
    footerBorder: chromeBorder,
    modalOverlay: isDark ? 'rgba(8,10,16,0.72)' : 'rgba(44,54,84,0.32)',
    modalBg: isDark ? Colors.dark.cardSurface : Colors.light.cardSurface,
    modalMutedBg: isDark ? Colors.dark.background : Colors.light.background,
    subtlePanelBg: isDark ? 'rgba(26,30,42,0.80)' : 'rgba(238,240,248,0.75)',
    subtlePanelBorder: chromeBorder,
    checkOffBg: isDark ? 'rgba(26,30,42,0.95)' : '#EEF0F8',
    checkOffBorder: chromeBorder,
    activeBg: theme.accent,
    activeText: theme.accentText,
    inactiveBg: isDark ? 'rgba(26,30,42,0.95)' : '#FFFFFF',
    inactiveBorder: chromeBorder,
    mainTabInactiveBorder: isDark ? 'rgba(154,168,212,0.48)' : 'rgba(138,155,210,0.42)',
    inactiveText: theme.text,
  };
}

export function getModalSurfaceTheme(theme: AppColorTheme, chrome: AppChromeTheme): ModalSurfaceTheme {
  return {
    text: theme.text,
    textSecondary: theme.textSecondary,
    activeBg: chrome.activeBg,
    activeText: chrome.activeText,
    inactiveBg: chrome.inactiveBg,
    inactiveBorder: chrome.inactiveBorder,
    inactiveText: chrome.inactiveText,
    modalOverlay: chrome.modalOverlay,
    modalBg: chrome.modalBg,
    subtlePanelBg: chrome.subtlePanelBg,
    subtlePanelBorder: chrome.subtlePanelBorder,
    sectionLabelBg: chrome.sectionLabelBg,
    circleBg: chrome.circleBg,
    circleBorder: chrome.circleBorder,
    icon: chrome.icon,
    iconMuted: chrome.iconMuted,
    rowBorder: chrome.rowBorder,
    buttonShadow: chrome.circleShadow,
  };
}

export type { ThemeColor };

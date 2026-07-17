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
  dayBorder: string;
  rowBorder: string;
  sectionLabelBg: string;
  notesBlockBg: string;
  medicationCompleted: string;
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
  reminderOnBg: string;
  activeBg: string;
  activeText: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
  panicYesBg: string;
  panicYesText: string;
  panicNoBg: string;
  panicNoBorder: string;
  panicNoIcon: string;
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
  return {
    icon: theme.text,
    iconMuted: isDark ? 'rgba(242,242,242,0.55)' : 'rgba(20,20,20,0.45)',
    cardBorder: isDark ? 'rgba(125,168,146,0.20)' : 'rgba(107,144,128,0.18)',
    circleBg: isDark ? 'rgba(26,36,32,0.95)' : '#FFFFFF',
    circleBorder: isDark ? 'rgba(125,168,146,0.30)' : 'rgba(107,144,128,0.22)',
    circleShadow: isDark ? 0 : 0.07,
    contentBg: theme.background,
    dayBorder: isDark ? 'rgba(125,168,146,0.24)' : 'rgba(107,144,128,0.20)',
    rowBorder: isDark ? 'rgba(125,168,146,0.12)' : 'rgba(26,46,36,0.07)',
    sectionLabelBg: theme.backgroundSelected,
    notesBlockBg: isDark ? 'rgba(21,28,24,0.70)' : Colors.light.cardSurface,
    medicationCompleted: isDark ? Colors.dark.medicationCompleted : Colors.light.medicationCompleted,
    accent: theme.accent,
    panelEdgeShadow: isDark ? 0.22 : 0.09,
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

import type { TextStyle } from 'react-native';
import { Platform } from 'react-native';

import { Fonts } from '@/constants/theme';

type FontWeightName = '300' | '400' | '500' | '600' | '700' | '800';

function appFont(
  nativeFamily: string,
  weight: FontWeightName,
): Pick<TextStyle, 'fontFamily' | 'fontWeight'> {
  return Platform.OS === 'web'
    ? { fontFamily: Fonts.sans, fontWeight: weight }
    : { fontFamily: nativeFamily };
}

export function formatSectionTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLocaleLowerCase();
  return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
}

export const weekMonthTitleStyle: TextStyle = {
  fontSize: 28,
  ...appFont(Fonts.sansMedium, '500'),
  letterSpacing: 0,
};

export const weekYearStyle: TextStyle = {
  fontSize: 14,
  ...appFont(Fonts.sansLight, '300'),
  letterSpacing: 0,
};

export const weekDayTitleStyle: TextStyle = {
  fontSize: 22,
  ...appFont(Fonts.sansSemiBold, '600'),
  letterSpacing: 0,
};

export const weekDateStyle: TextStyle = {
  fontSize: 16,
  ...appFont(Fonts.sansLight, '300'),
  letterSpacing: 0,
};

export const weekCardTitleStyle: TextStyle = {
  fontSize: 16,
  ...appFont(Fonts.sansMedium, '500'),
  letterSpacing: 0,
};

export const weekFieldLabelStyle: TextStyle = {
  fontSize: 15,
  ...appFont(Fonts.sansMedium, '500'),
  letterSpacing: 0,
};

export const weekBodyTextStyle: TextStyle = {
  fontSize: 16,
  ...appFont(Fonts.sansLight, '300'),
  letterSpacing: 0,
};

export const weekButtonTextStyle: TextStyle = {
  fontSize: 16,
  ...appFont(Fonts.sansMedium, '500'),
  letterSpacing: 0,
};

export const weekServiceTextStyle: TextStyle = {
  fontSize: 12,
  ...appFont(Fonts.sansMedium, '500'),
  letterSpacing: 2.2,
};

export const sectionTitleStyle: TextStyle = {
  ...weekFieldLabelStyle,
};

export const daySectionLabelColor = '#5b4d5b';

export const daySectionLabelStyle: TextStyle = {
  ...sectionTitleStyle,
  fontFamily: Fonts.condensed,
  color: daySectionLabelColor,
};

export const dayMedicationsHeaderStyle: TextStyle = {
  ...weekCardTitleStyle,
  fontFamily: Fonts.condensed,
  color: daySectionLabelColor,
};

export const dayMedicationsStatusStyle: TextStyle = {
  ...weekCardTitleStyle,
  fontSize: 14,
  fontFamily: Fonts.condensed,
  color: daySectionLabelColor,
};

export const dayHeaderTitleStyle: TextStyle = {
  ...weekDayTitleStyle,
};

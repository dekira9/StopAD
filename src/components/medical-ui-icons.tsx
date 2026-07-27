import { MaterialCommunityIcons } from '@expo/vector-icons';

/** Shared gray outline medical/UI icons (MaterialCommunityIcons). */
export const MEDICAL_ICON_GRAY = '#6B6B6B';

type IconProps = {
  size?: number;
  color?: string;
};

/** Reminder on — ringing bell. */
export function BellOnIcon({ size = 24, color = MEDICAL_ICON_GRAY }: IconProps) {
  return <MaterialCommunityIcons name="bell-ring-outline" size={size} color={color} />;
}

/** Reminder off. */
export function BellOffIcon({ size = 24, color = MEDICAL_ICON_GRAY }: IconProps) {
  return <MaterialCommunityIcons name="bell-off-outline" size={size} color={color} />;
}

/** Intake schedule / calendar plan. */
export function ScheduleIcon({ size = 24, color = MEDICAL_ICON_GRAY }: IconProps) {
  return <MaterialCommunityIcons name="calendar-clock-outline" size={size} color={color} />;
}

/** Single pill / capsule. */
export function PillIcon({ size = 24, color = MEDICAL_ICON_GRAY }: IconProps) {
  return <MaterialCommunityIcons name="pill" size={size} color={color} />;
}

/** Medicine bottle with cross (stock / pack). */
export function MedicineBottleIcon({ size = 24, color = MEDICAL_ICON_GRAY }: IconProps) {
  return <MaterialCommunityIcons name="bottle-tonic-plus-outline" size={size} color={color} />;
}

/** Medications group (bottle-style alternate). */
export function MedicationsIcon({ size = 24, color = MEDICAL_ICON_GRAY }: IconProps) {
  return <MaterialCommunityIcons name="medication-outline" size={size} color={color} />;
}

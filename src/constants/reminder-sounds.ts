export type ReminderSoundId = 'quiet' | 'normal' | 'noticeable';

export const DEFAULT_REMINDER_SOUND: ReminderSoundId = 'normal';

export const REMINDER_SOUND_IDS: ReminderSoundId[] = ['quiet', 'normal', 'noticeable'];

type ReminderSoundConfig = {
  fileName: string;
  preview: number;
  androidChannelId: string;
  androidChannelName: string;
  androidImportance: number;
  vibrationPattern: number[] | null;
};

export const REMINDER_SOUND_CONFIG: Record<ReminderSoundId, ReminderSoundConfig> = {
  quiet: {
    fileName: 'reminder_quiet.wav',
    preview: require('../../assets/Sounds/reminder_quiet.wav'),
    androidChannelId: 'meds-quiet-v3',
    androidChannelName: 'Medication reminders (quiet)',
    androidImportance: 5,
    vibrationPattern: [0, 120],
  },
  normal: {
    fileName: 'reminder_normal.wav',
    preview: require('../../assets/Sounds/reminder_normal.wav'),
    androidChannelId: 'meds-normal-v3',
    androidChannelName: 'Medication reminders (normal)',
    androidImportance: 6,
    vibrationPattern: [0, 250, 160, 250],
  },
  noticeable: {
    fileName: 'reminder_noticeable.wav',
    preview: require('../../assets/Sounds/reminder_noticeable.wav'),
    androidChannelId: 'meds-noticeable-v3',
    androidChannelName: 'Medication reminders (noticeable)',
    androidImportance: 7,
    vibrationPattern: [0, 400, 120, 400, 120, 400],
  },
};

export function isReminderSoundId(value: unknown): value is ReminderSoundId {
  return value === 'quiet' || value === 'normal' || value === 'noticeable';
}

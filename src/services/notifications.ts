import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import {
  IosAuthorizationStatus,
  type NotificationPermissionsStatus,
} from 'expo-notifications/build/NotificationPermissions.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { Platform } from 'react-native';

import type { DayLog } from '@/stores/wellness-store';

const isNative = Platform.OS !== 'web';

if (isNative) {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function parseMedicationTime(time: string): { hour: number; minute: number } | null {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function notificationsAllowed(settings: NotificationPermissionsStatus): boolean {
  const granted = (settings as NotificationPermissionsStatus & { granted?: boolean }).granted;
  if (granted) return true;
  return settings.ios?.status === IosAuthorizationStatus.AUTHORIZED;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!isNative) return false;

  const existing = await getPermissionsAsync();
  if (notificationsAllowed(existing)) return true;

  const requested = await requestPermissionsAsync();
  return notificationsAllowed(requested);
}

export function setupNotificationResponseHandler(
  onResponse: (data: { dateKey?: string; rowId?: string; screen?: string }) => void,
): () => void {
  if (!isNative) return () => {};

  try {
    const subscription = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        dateKey?: string;
        rowId?: string;
        screen?: string;
      };
      onResponse(data);
    });
    return () => subscription.remove();
  } catch {
    return () => {};
  }
}

export async function rescheduleMedicationReminders(
  days: Record<string, DayLog>,
  formatBody: (medication: string) => string,
  title: string,
) {
  if (!isNative) return;

  await cancelAllScheduledNotificationsAsync();

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  const now = Date.now();

  for (const [dateKey, day] of Object.entries(days)) {
    for (const row of day.medications) {
      if (!row.reminderEnabled || !row.time?.trim() || !row.medication.trim()) continue;

      const parsed = parseMedicationTime(row.time);
      if (!parsed) continue;

      const triggerDate = new Date(
        `${dateKey}T${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}:00`,
      );
      if (triggerDate.getTime() <= now) continue;

      await scheduleNotificationAsync({
        identifier: `med-${dateKey}-${row.id}`,
        content: {
          title,
          body: formatBody(row.medication.trim()),
          data: { dateKey, rowId: row.id, screen: 'today' },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }
  }
}

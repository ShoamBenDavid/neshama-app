import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationPrefs } from '../screens/NotificationOptionsScreen';

/**
 * Local notification preferences are the source of truth for which
 * reminders are scheduled on the device. Each time the user toggles a
 * switch we re-apply the schedule (cancel + schedule-again) so the OS
 * notification queue always matches the UI state.
 *
 * NOTE: Starting with Expo SDK 53, `expo-notifications` no longer works
 * inside Expo Go on Android (remote push was removed, and loading the
 * module there throws at runtime). To keep the app working in Expo Go
 * we lazy-require the module and short-circuit to a no-op implementation
 * when we're in Expo Go on Android. The full scheduler runs in dev /
 * production builds and on iOS Expo Go.
 */

export const NOTIF_PREFS_STORAGE_KEY = '@neshama_notification_prefs';
const QUIET_HOURS_START = 22; // 22:00 inclusive
const QUIET_HOURS_END = 7;    // 07:00 exclusive

type ScheduleEntry = {
  hour: number;
  minute: number;
  titleKey: keyof NotificationLabels;
  bodyKey: keyof NotificationLabels;
};

export type NotificationLabels = {
  dailyMoodTitle: string;
  dailyMoodBody: string;
  journalTitle: string;
  journalBody: string;
  breathingTitle: string;
  breathingBody: string;
  communityTitle: string;
  communityBody: string;
  supportCenterTitle: string;
  supportCenterBody: string;
  generalTitle: string;
  generalBody: string;
};

const SCHEDULE: Partial<Record<keyof NotificationPrefs, ScheduleEntry>> = {
  dailyMood:     { hour: 20, minute: 0, titleKey: 'dailyMoodTitle',     bodyKey: 'dailyMoodBody' },
  journal:       { hour: 21, minute: 0, titleKey: 'journalTitle',       bodyKey: 'journalBody' },
  breathing:     { hour: 10, minute: 0, titleKey: 'breathingTitle',     bodyKey: 'breathingBody' },
  community:     { hour: 18, minute: 0, titleKey: 'communityTitle',     bodyKey: 'communityBody' },
  supportCenter: { hour: 11, minute: 0, titleKey: 'supportCenterTitle', bodyKey: 'supportCenterBody' },
  general:       { hour: 9,  minute: 0, titleKey: 'generalTitle',       bodyKey: 'generalBody' },
};

const NOTIF_ID_PREFIX = 'neshama-';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroid = Platform.OS === 'android';

/**
 * expo-notifications throws at import time in Expo Go on Android
 * (remote push was removed in SDK 53). We detect that environment and
 * skip loading the module entirely — reminders simply become a no-op
 * until the user switches to a dev / production build.
 */
export const notificationsSupported = !(isExpoGo && isAndroid) && Platform.OS !== 'web';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
let handlerConfigured = false;

function getNotifications(): NotificationsModule | null {
  if (!notificationsSupported) return null;
  if (Notifications) return Notifications;
  try {
    // Lazy require so that the module's push-token side effects never run
    // in unsupported environments (Expo Go + Android).
    Notifications = require('expo-notifications') as NotificationsModule;
    configureHandler(Notifications);
    return Notifications;
  } catch {
    return null;
  }
}

function configureHandler(mod: NotificationsModule) {
  if (handlerConfigured) return;
  handlerConfigured = true;
  mod.setNotificationHandler({
    handleNotification: async () => {
      let suppress = false;
      try {
        const raw = await AsyncStorage.getItem(NOTIF_PREFS_STORAGE_KEY);
        if (raw) {
          const prefs = JSON.parse(raw) as Partial<NotificationPrefs>;
          suppress = !!prefs.quietHours && isInQuietHours();
        }
      } catch {
        // Ignore storage errors — fall through to showing the notification.
      }
      return {
        shouldShowAlert: !suppress,
        shouldShowBanner: !suppress,
        shouldShowList: !suppress,
        shouldPlaySound: !suppress,
        shouldSetBadge: false,
      };
    },
  });
}

function isInQuietHours(date = new Date()): boolean {
  const h = date.getHours();
  // Range wraps past midnight: [22:00, 07:00).
  return h >= QUIET_HOURS_START || h < QUIET_HOURS_END;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  const mod = getNotifications();
  if (!mod) return false;

  try {
    const { status: existing } = await mod.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await mod.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await mod.setNotificationChannelAsync('default', {
        name: 'Neshama Reminders',
        importance: mod.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C5CFC',
      });
    }

    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/**
 * Apply the user's notification preferences to the OS scheduler.
 * Cancels any previously scheduled Neshama reminders and re-schedules
 * only the ones that are currently enabled.
 *
 * Returns `{ supported: false }` when running in an environment where
 * local notifications can't be scheduled (e.g. Expo Go on Android).
 */
export async function applyNotificationPrefs(
  prefs: NotificationPrefs,
  labels: NotificationLabels,
): Promise<{ supported: boolean; granted: boolean; scheduled: string[] }> {
  const mod = getNotifications();
  if (!mod) {
    return { supported: false, granted: false, scheduled: [] };
  }

  const granted = await ensureNotificationPermissions();

  // Always clear previously scheduled reminders so toggling OFF takes
  // effect immediately — even if we can't reschedule (no permission).
  await cancelAllNeshamaReminders();

  if (!granted) {
    return { supported: true, granted: false, scheduled: [] };
  }

  const scheduled: string[] = [];
  for (const key of Object.keys(SCHEDULE) as (keyof NotificationPrefs)[]) {
    const entry = SCHEDULE[key];
    if (!entry) continue;
    if (!prefs[key]) continue;

    try {
      await mod.scheduleNotificationAsync({
        identifier: `${NOTIF_ID_PREFIX}${key}`,
        content: {
          title: labels[entry.titleKey],
          body: labels[entry.bodyKey],
          sound: 'default',
        },
        trigger: {
          type: mod.SchedulableTriggerInputTypes.DAILY,
          hour: entry.hour,
          minute: entry.minute,
        },
      });
      scheduled.push(key);
    } catch {
      // Skip this reminder but keep scheduling the rest.
    }
  }

  return { supported: true, granted: true, scheduled };
}

export async function cancelAllNeshamaReminders(): Promise<void> {
  const mod = getNotifications();
  if (!mod) return;

  try {
    const all = await mod.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => (n.identifier ?? '').startsWith(NOTIF_ID_PREFIX))
        .map((n) => mod.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    try {
      await mod.cancelAllScheduledNotificationsAsync();
    } catch {
      // Nothing else we can do — leave the schedule as-is.
    }
  }
}

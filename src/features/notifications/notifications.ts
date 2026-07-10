import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Local daily reminders — the ritual engine. Two optional nudges: a morning
 * check-in and an evening reflection. Times and on/off state persist in
 * AsyncStorage; scheduling is fully local (no push server needed).
 */

export type ReminderPrefs = {
  morningEnabled: boolean;
  morningHour: number; // 0..23
  eveningEnabled: boolean;
  eveningHour: number;
};

export const DEFAULT_PREFS: ReminderPrefs = {
  morningEnabled: false,
  morningHour: 8,
  eveningEnabled: false,
  eveningHour: 21,
};

const PREFS_KEY = 'vitalis.reminderPrefs';

// Show reminders as visible alerts even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function loadPrefs(): Promise<ReminderPrefs> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ReminderPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: ReminderPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/** Requests notification permission; returns whether it was granted. */
export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Re-syncs the OS schedule to the given prefs: clears existing reminders and
 * schedules only the enabled ones as repeating daily triggers.
 */
export async function applyReminders(prefs: ReminderPrefs): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const daily = (hour: number): Notifications.NotificationTriggerInput => ({
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute: 0,
  });

  if (prefs.morningEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Morning check-in ☀️',
        body: 'How are you feeling today? Log your mood to start the loop.',
      },
      trigger: daily(prefs.morningHour),
    });
  }

  if (prefs.eveningEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Evening reflection 🌙',
        body: 'Check off your habits and see how your day went.',
      },
      trigger: daily(prefs.eveningHour),
    });
  }
}

/** Applies whatever is currently saved — called on app start. */
export async function initReminders(): Promise<void> {
  const prefs = await loadPrefs();
  if (prefs.morningEnabled || prefs.eveningEnabled) {
    const ok = await ensurePermission();
    if (ok) await applyReminders(prefs);
  }
}

import { create } from 'zustand';
import {
  applyReminders,
  DEFAULT_PREFS,
  ensurePermission,
  loadPrefs,
  savePrefs,
  type ReminderPrefs,
} from './notifications';

type ReminderState = {
  prefs: ReminderPrefs;
  loaded: boolean;
  load: () => Promise<void>;
  /** Merge a partial update, persist, and re-sync the OS schedule. */
  update: (patch: Partial<ReminderPrefs>) => Promise<{ error: string | null }>;
};

export const useReminderStore = create<ReminderState>((set, get) => ({
  prefs: DEFAULT_PREFS,
  loaded: false,

  load: async () => {
    set({ prefs: await loadPrefs(), loaded: true });
  },

  update: async (patch) => {
    const next = { ...get().prefs, ...patch };

    // If a reminder is being turned on, make sure we have permission first.
    const turningOn =
      (patch.morningEnabled && !get().prefs.morningEnabled) ||
      (patch.eveningEnabled && !get().prefs.eveningEnabled);
    if (turningOn) {
      const ok = await ensurePermission();
      if (!ok) return { error: 'Notifications permission was denied.' };
    }

    set({ prefs: next });
    await savePrefs(next);
    await applyReminders(next);
    return { error: null };
  },
}));

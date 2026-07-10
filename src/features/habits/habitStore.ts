import { create } from 'zustand';
import { getDb } from '@/lib/db';
import { nowIso, today, uid } from '@/lib/id';
import { syncNow } from '@/lib/sync';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  created_at: string;
  streak: number; // consecutive days ending today (computed)
  doneToday: boolean; // computed
};

type HabitState = {
  habits: Habit[];
  loading: boolean;
  load: () => Promise<void>;
  addHabit: (name: string, emoji?: string) => Promise<void>;
  toggleToday: (habitId: string) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  /** All YYYY-MM-DD check-in days for a habit (for the heatmap). */
  checkinDays: (habitId: string) => Promise<string[]>;
};

/** Compute a consecutive-day streak ending today from a set of check-in days. */
function computeStreak(days: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  // Streak counts today only if done; otherwise it counts up to yesterday.
  if (!days.has(today(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(today(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const db = await getDb();
    const habitRows = await db.getAllAsync<{
      id: string;
      name: string;
      emoji: string;
      created_at: string;
    }>('SELECT id, name, emoji, created_at FROM habits WHERE archived = 0 ORDER BY created_at ASC');

    const checkinRows = await db.getAllAsync<{ habit_id: string; day: string }>(
      'SELECT habit_id, day FROM habit_checkins',
    );

    const byHabit = new Map<string, Set<string>>();
    for (const row of checkinRows) {
      if (!byHabit.has(row.habit_id)) byHabit.set(row.habit_id, new Set());
      byHabit.get(row.habit_id)!.add(row.day);
    }

    const todayStr = today();
    const habits: Habit[] = habitRows.map((h) => {
      const days = byHabit.get(h.id) ?? new Set<string>();
      return {
        ...h,
        streak: computeStreak(days),
        doneToday: days.has(todayStr),
      };
    });
    set({ habits, loading: false });
  },

  addHabit: async (name, emoji = '✅') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const db = await getDb();
    const id = uid();
    await db.runAsync(
      'INSERT INTO habits (id, name, emoji, created_at, updated_at, archived, synced) VALUES (?, ?, ?, ?, ?, 0, 0)',
      id,
      trimmed,
      emoji,
      nowIso(),
      nowIso(),
    );
    await get().load();
    void syncNow();
  },

  toggleToday: async (habitId) => {
    const db = await getDb();
    const day = today();
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM habit_checkins WHERE habit_id = ? AND day = ?',
      habitId,
      day,
    );
    if (existing) {
      await db.runAsync('DELETE FROM habit_checkins WHERE id = ?', existing.id);
    } else {
      await db.runAsync(
        'INSERT INTO habit_checkins (id, habit_id, day, updated_at, synced) VALUES (?, ?, ?, ?, 0)',
        uid(),
        habitId,
        day,
        nowIso(),
      );
    }
    await get().load();
    void syncNow();
  },

  archiveHabit: async (habitId) => {
    const db = await getDb();
    await db.runAsync(
      'UPDATE habits SET archived = 1, updated_at = ?, synced = 0 WHERE id = ?',
      nowIso(),
      habitId,
    );
    await get().load();
    void syncNow();
  },

  checkinDays: async (habitId) => {
    const db = await getDb();
    const rows = await db.getAllAsync<{ day: string }>(
      'SELECT day FROM habit_checkins WHERE habit_id = ? ORDER BY day ASC',
      habitId,
    );
    return rows.map((r) => r.day);
  },
}));

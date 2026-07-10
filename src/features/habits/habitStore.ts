import { create } from 'zustand';
import { getDb } from '@/lib/db';
import { nowIso, today, uid } from '@/lib/id';
import { syncNow } from '@/lib/sync';
import { computeStreak } from './streak';

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
  deleteHabit: (habitId: string) => Promise<void>;
  /** All YYYY-MM-DD check-in days for a habit (for the heatmap). */
  checkinDays: (habitId: string) => Promise<string[]>;
};

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
    }>('SELECT id, name, emoji, created_at FROM habits WHERE archived = 0 AND deleted = 0 ORDER BY created_at ASC');

    const checkinRows = await db.getAllAsync<{ habit_id: string; day: string }>(
      'SELECT habit_id, day FROM habit_checkins WHERE deleted = 0',
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
    const existing = await db.getFirstAsync<{ id: string; deleted: number }>(
      'SELECT id, deleted FROM habit_checkins WHERE habit_id = ? AND day = ?',
      habitId,
      day,
    );
    if (existing) {
      // Flip the tombstone instead of hard-deleting so the change syncs.
      const nextDeleted = existing.deleted === 1 ? 0 : 1;
      await db.runAsync(
        'UPDATE habit_checkins SET deleted = ?, updated_at = ?, synced = 0 WHERE id = ?',
        nextDeleted,
        nowIso(),
        existing.id,
      );
    } else {
      await db.runAsync(
        'INSERT INTO habit_checkins (id, habit_id, day, updated_at, deleted, synced) VALUES (?, ?, ?, ?, 0, 0)',
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

  deleteHabit: async (habitId) => {
    // Optimistic removal.
    set({ habits: get().habits.filter((h) => h.id !== habitId) });
    const db = await getDb();
    // Tombstone the habit and its check-ins so the deletion propagates.
    const stamp = nowIso();
    await db.runAsync(
      'UPDATE habits SET deleted = 1, updated_at = ?, synced = 0 WHERE id = ?',
      stamp,
      habitId,
    );
    await db.runAsync(
      'UPDATE habit_checkins SET deleted = 1, updated_at = ?, synced = 0 WHERE habit_id = ? AND deleted = 0',
      stamp,
      habitId,
    );
    void syncNow();
  },

  checkinDays: async (habitId) => {
    const db = await getDb();
    const rows = await db.getAllAsync<{ day: string }>(
      'SELECT day FROM habit_checkins WHERE habit_id = ? AND deleted = 0 ORDER BY day ASC',
      habitId,
    );
    return rows.map((r) => r.day);
  },
}));

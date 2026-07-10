import { create } from 'zustand';
import { getDb } from '@/lib/db';
import { nowIso, uid } from '@/lib/id';
import { syncNow } from '@/lib/sync';

export type Mood = {
  id: string;
  score: number; // 1..5
  note: string | null;
  logged_at: string;
  updated_at: string;
};

type MoodState = {
  moods: Mood[];
  loading: boolean;
  load: () => Promise<void>;
  logMood: (score: number, note?: string) => Promise<void>;
};

/** Mood logging — writes to SQLite instantly, updates the list optimistically. */
export const useMoodStore = create<MoodState>((set, get) => ({
  moods: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const db = await getDb();
    const rows = await db.getAllAsync<Mood>(
      'SELECT id, score, note, logged_at, updated_at FROM moods ORDER BY logged_at DESC LIMIT 100',
    );
    set({ moods: rows, loading: false });
  },

  logMood: async (score, note) => {
    const entry: Mood = {
      id: uid(),
      score,
      note: note?.trim() ? note.trim() : null,
      logged_at: nowIso(),
      updated_at: nowIso(),
    };
    // Optimistic UI first.
    set({ moods: [entry, ...get().moods] });

    const db = await getDb();
    await db.runAsync(
      'INSERT INTO moods (id, score, note, logged_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, 0)',
      entry.id,
      entry.score,
      entry.note,
      entry.logged_at,
      entry.updated_at,
    );
    void syncNow(); // best-effort push; no-op when offline or signed out
  },
}));

import NetInfo from '@react-native-community/netinfo';
import { getDb } from '@/lib/db';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Sync engine. Drains locally-created rows (synced = 0) up to Supabase, then
 * marks them synced. Push-only for v1 — timestamp-wins conflict resolution via
 * upsert on the primary key. Pull-down (cloud → device) is a later addition.
 *
 * Runs on: login, app foreground, after writes (best-effort), and on reconnect.
 */

let running = false;

async function requireUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function pushTable(
  table: 'moods' | 'habits' | 'habit_checkins',
  rows: Record<string, unknown>[],
  userId: string,
): Promise<boolean> {
  if (rows.length === 0) return true;
  const payload = rows.map((r) => ({ ...r, user_id: userId }));
  const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' });
  return !error;
}

export async function syncNow(): Promise<{ pushed: number } | null> {
  if (!isSupabaseConfigured || running) return null;
  const userId = await requireUserId();
  if (!userId) return null; // signed out — nothing to sync

  running = true;
  try {
    const db = await getDb();
    let pushed = 0;

    const moods = await db.getAllAsync<Record<string, unknown>>(
      'SELECT id, score, note, logged_at, updated_at FROM moods WHERE synced = 0',
    );
    if (await pushTable('moods', moods, userId)) {
      await markSynced(db, 'moods', moods);
      pushed += moods.length;
    }

    const habits = await db.getAllAsync<Record<string, unknown>>(
      'SELECT id, name, emoji, archived, created_at, updated_at FROM habits WHERE synced = 0',
    );
    // SQLite stores booleans as 0/1; Postgres wants real booleans.
    const habitPayload = habits.map((h) => ({ ...h, archived: h.archived === 1 }));
    if (await pushTable('habits', habitPayload, userId)) {
      await markSynced(db, 'habits', habits);
      pushed += habits.length;
    }

    const checkins = await db.getAllAsync<Record<string, unknown>>(
      'SELECT id, habit_id, day, updated_at FROM habit_checkins WHERE synced = 0',
    );
    if (await pushTable('habit_checkins', checkins, userId)) {
      await markSynced(db, 'habit_checkins', checkins);
      pushed += checkins.length;
    }

    return { pushed };
  } finally {
    running = false;
  }
}

async function markSynced(
  db: Awaited<ReturnType<typeof getDb>>,
  table: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const row of rows) {
    await db.runAsync(`UPDATE ${table} SET synced = 1 WHERE id = ?`, row.id as string);
  }
}

/** Subscribe to connectivity changes; kicks a sync when the device comes online. */
export function startSyncListener(): () => void {
  if (!isSupabaseConfigured) return () => {};
  const unsub = NetInfo.addEventListener((state) => {
    if (state.isConnected) void syncNow();
  });
  return unsub;
}

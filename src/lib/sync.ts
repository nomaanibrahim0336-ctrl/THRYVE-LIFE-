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

// Subscribers notified after a sync pulls new rows, so mounted screens can
// refresh their in-memory state from SQLite. Avoids a store <-> sync import cycle.
type Listener = () => void;
const pullListeners = new Set<Listener>();

export function onPulled(fn: Listener): () => void {
  pullListeners.add(fn);
  return () => pullListeners.delete(fn);
}

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

export async function syncNow(): Promise<{ pushed: number; pulled: number } | null> {
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

    const pulled = await pullAll(db);
    if (pulled > 0) pullListeners.forEach((fn) => fn());
    return { pushed, pulled };
  } finally {
    running = false;
  }
}

/**
 * Pull cloud rows into SQLite. Timestamp-wins: a remote row overwrites the local
 * one only when its updated_at is newer (or the local row is absent). Rows written
 * here are marked synced = 1 so we don't immediately push them back.
 */
async function pullAll(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  let pulled = 0;

  const { data: moods } = await supabase
    .from('moods')
    .select('id, score, note, logged_at, updated_at');
  for (const r of moods ?? []) {
    const existing = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM moods WHERE id = ?',
      r.id,
    );
    if (existing && existing.updated_at >= r.updated_at) continue;
    await db.runAsync(
      `INSERT INTO moods (id, score, note, logged_at, updated_at, synced) VALUES (?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET score = excluded.score, note = excluded.note,
         logged_at = excluded.logged_at, updated_at = excluded.updated_at, synced = 1`,
      r.id,
      r.score,
      r.note,
      r.logged_at,
      r.updated_at,
    );
    pulled += 1;
  }

  const { data: habits } = await supabase
    .from('habits')
    .select('id, name, emoji, archived, created_at, updated_at');
  for (const r of habits ?? []) {
    const existing = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM habits WHERE id = ?',
      r.id,
    );
    if (existing && existing.updated_at >= r.updated_at) continue;
    await db.runAsync(
      `INSERT INTO habits (id, name, emoji, created_at, updated_at, archived, synced) VALUES (?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, emoji = excluded.emoji,
         created_at = excluded.created_at, updated_at = excluded.updated_at,
         archived = excluded.archived, synced = 1`,
      r.id,
      r.name,
      r.emoji,
      r.created_at,
      r.updated_at,
      r.archived ? 1 : 0,
    );
    pulled += 1;
  }

  const { data: checkins } = await supabase
    .from('habit_checkins')
    .select('id, habit_id, day, updated_at');
  for (const r of checkins ?? []) {
    // Check-ins are keyed by (habit_id, day); insert if that day isn't present.
    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM habit_checkins WHERE habit_id = ? AND day = ?',
      r.habit_id,
      r.day,
    );
    if (existing) continue;
    await db.runAsync(
      'INSERT OR IGNORE INTO habit_checkins (id, habit_id, day, updated_at, synced) VALUES (?, ?, ?, ?, 1)',
      r.id,
      r.habit_id,
      r.day,
      r.updated_at,
    );
    pulled += 1;
  }

  return pulled;
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

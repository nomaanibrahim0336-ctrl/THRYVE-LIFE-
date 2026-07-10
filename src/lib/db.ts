import * as SQLite from 'expo-sqlite';

/**
 * Offline-first local store. Every write lands here instantly so the UI is never
 * blocked on the network. A `synced` flag marks rows that still need to be pushed
 * to Supabase; the sync engine (src/lib/sync.ts) drains them when connectivity
 * returns. Timestamp-wins conflict resolution keeps things simple for v1.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('vitalis.db').then(async (db) => {
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS moods (
      id TEXT PRIMARY KEY NOT NULL,
      score INTEGER NOT NULL,          -- 1..5 emoji scale
      note TEXT,
      logged_at TEXT NOT NULL,         -- ISO timestamp
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0, -- tombstone for two-way delete sync
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '✅',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0, -- tombstone for two-way delete sync
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habit_checkins (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      day TEXT NOT NULL,               -- YYYY-MM-DD (one check-in per habit per day)
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0, -- tombstone: uncheck = deleted, not hard-removed
      synced INTEGER NOT NULL DEFAULT 0,
      UNIQUE (habit_id, day)
    );

    CREATE INDEX IF NOT EXISTS idx_moods_logged_at ON moods (logged_at DESC);
    CREATE INDEX IF NOT EXISTS idx_checkins_habit ON habit_checkins (habit_id, day);
  `);
}

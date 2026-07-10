import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db';
import { today } from '@/lib/id';
import { localReflection, type WeekSummary } from './summary';

export type { WeekSummary };

/** Aggregate the last 7 days from SQLite to feed the reflection. */
export async function buildWeekSummary(): Promise<WeekSummary> {
  const db = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceDay = today(since);
  const sinceIso = `${sinceDay}T00:00:00.000Z`;

  const moodAgg = await db.getFirstAsync<{ c: number; avg: number | null }>(
    'SELECT COUNT(*) as c, AVG(score) as avg FROM moods WHERE deleted = 0 AND logged_at >= ?',
    sinceIso,
  );
  const checkins = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM habit_checkins WHERE deleted = 0 AND day >= ?',
    sinceDay,
  );

  return {
    moodCount: moodAgg?.c ?? 0,
    avgMood: moodAgg?.avg ?? null,
    habitCheckins: checkins?.c ?? 0,
    topStreak: 0,
  };
}

/**
 * Streams a reflection. When Supabase is configured it calls the `reflect` edge
 * function (which owns the Claude call + safety layer); otherwise it returns the
 * local heuristic so the app is fully usable offline / pre-backend.
 */
export async function generateReflection(): Promise<{ text: string; source: 'ai' | 'local' }> {
  const summary = await buildWeekSummary();

  if (!isSupabaseConfigured) {
    return { text: localReflection(summary), source: 'local' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('reflect', {
      body: { summary },
    });
    if (error || !data?.text) throw error ?? new Error('Empty reflection');
    return { text: data.text as string, source: 'ai' };
  } catch {
    // Graceful degradation — never leave the user with a blank screen.
    return { text: localReflection(summary), source: 'local' };
  }
}

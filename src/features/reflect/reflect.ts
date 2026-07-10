import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getDb } from '@/lib/db';
import { today } from '@/lib/id';

export type WeekSummary = {
  moodCount: number;
  avgMood: number | null;
  habitCheckins: number;
  topStreak: number;
};

/** Aggregate the last 7 days from SQLite to feed the reflection. */
export async function buildWeekSummary(): Promise<WeekSummary> {
  const db = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceDay = today(since);
  const sinceIso = `${sinceDay}T00:00:00.000Z`;

  const moodAgg = await db.getFirstAsync<{ c: number; avg: number | null }>(
    'SELECT COUNT(*) as c, AVG(score) as avg FROM moods WHERE logged_at >= ?',
    sinceIso,
  );
  const checkins = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM habit_checkins WHERE day >= ?',
    sinceDay,
  );

  return {
    moodCount: moodAgg?.c ?? 0,
    avgMood: moodAgg?.avg ?? null,
    habitCheckins: checkins?.c ?? 0,
    topStreak: 0,
  };
}

/** A gentle, non-clinical local reflection used when the backend isn't wired up. */
function localReflection(s: WeekSummary): string {
  if (s.moodCount === 0 && s.habitCheckins === 0) {
    return "You're just getting started. Try logging your mood once today and adding a single habit — small steps compound.";
  }
  const moodLine =
    s.avgMood == null
      ? ''
      : s.avgMood >= 4
      ? 'Your mood has trended positive this week — nice. '
      : s.avgMood <= 2
      ? 'This week looked heavier than usual. Be kind to yourself. '
      : 'Your week felt fairly even. ';
  const habitLine =
    s.habitCheckins > 0
      ? `You completed ${s.habitCheckins} habit check-in${s.habitCheckins === 1 ? '' : 's'}. That consistency is the engine.`
      : 'No habit check-ins yet this week — pick the easiest one and just do it once.';
  return `${moodLine}${habitLine}`;
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

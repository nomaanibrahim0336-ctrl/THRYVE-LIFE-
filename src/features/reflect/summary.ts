/** Pure reflection logic — no SQLite / network, so it's unit-testable. */

export type WeekSummary = {
  moodCount: number;
  avgMood: number | null;
  habitCheckins: number;
  topStreak: number;
};

/** A gentle, non-clinical local reflection used when the backend isn't wired up. */
export function localReflection(s: WeekSummary): string {
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

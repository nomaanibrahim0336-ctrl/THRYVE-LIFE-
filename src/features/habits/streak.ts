import { today } from '@/lib/id';

/**
 * Consecutive-day streak ending "today". Pure and side-effect free so it can be
 * unit-tested. `reference` defaults to now but is injectable for deterministic tests.
 *
 * Rule: today counts only if it's in the set; otherwise the streak is measured up
 * to yesterday (so an unchecked-yet today doesn't break a run mid-day).
 */
export function computeStreak(days: Set<string>, reference: Date = new Date()): number {
  let streak = 0;
  const cursor = new Date(reference);
  if (!days.has(today(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(today(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

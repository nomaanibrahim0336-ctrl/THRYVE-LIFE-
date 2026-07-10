import { computeStreak } from '../streak';
import { today } from '@/lib/id';

/** Build a set of the N calendar days ending at (and including) `end`. */
function lastNDays(n: number, end: Date): Set<string> {
  const set = new Set<string>();
  const cursor = new Date(end);
  for (let i = 0; i < n; i++) {
    set.add(today(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return set;
}

const REF = new Date(2026, 6, 10); // fixed reference so tests are deterministic

describe('computeStreak', () => {
  it('is 0 when there are no check-ins', () => {
    expect(computeStreak(new Set(), REF)).toBe(0);
  });

  it('counts a run ending today', () => {
    expect(computeStreak(lastNDays(3, REF), REF)).toBe(3);
  });

  it('still counts yesterday-back when today is not yet done', () => {
    const yesterday = new Date(REF);
    yesterday.setDate(yesterday.getDate() - 1);
    // 4 days ending yesterday, today unchecked → streak should be 4.
    expect(computeStreak(lastNDays(4, yesterday), REF)).toBe(4);
  });

  it('breaks the streak on a gap', () => {
    const days = lastNDays(2, REF); // today + yesterday
    const threeDaysAgo = new Date(REF);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    days.add(today(threeDaysAgo)); // isolated older day
    expect(computeStreak(days, REF)).toBe(2);
  });

  it('is 0 when the only check-in is two days ago', () => {
    const twoAgo = new Date(REF);
    twoAgo.setDate(twoAgo.getDate() - 2);
    expect(computeStreak(new Set([today(twoAgo)]), REF)).toBe(0);
  });
});

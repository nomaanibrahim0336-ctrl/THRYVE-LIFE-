import { localReflection, type WeekSummary } from '../summary';

const base: WeekSummary = { moodCount: 0, avgMood: null, habitCheckins: 0, topStreak: 0 };

describe('localReflection', () => {
  it('nudges brand-new users with no data', () => {
    expect(localReflection(base)).toMatch(/just getting started/i);
  });

  it('celebrates a positive mood trend', () => {
    const text = localReflection({ ...base, moodCount: 5, avgMood: 4.4, habitCheckins: 3 });
    expect(text).toMatch(/trended positive/i);
    expect(text).toMatch(/3 habit check-ins/);
  });

  it('is gentle about a heavy week without diagnosing', () => {
    const text = localReflection({ ...base, moodCount: 4, avgMood: 1.5, habitCheckins: 1 });
    expect(text).toMatch(/be kind to yourself/i);
    expect(text).toMatch(/1 habit check-in\b/); // singular
    // Safety: never clinical.
    expect(text).not.toMatch(/depress|diagnos|disorder/i);
  });

  it('encourages when habits are untouched', () => {
    const text = localReflection({ ...base, moodCount: 2, avgMood: 3, habitCheckins: 0 });
    expect(text).toMatch(/no habit check-ins/i);
  });
});

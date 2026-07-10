/** Shared mood scale metadata used by the logger, home summary and reflection. */
export const MOOD_SCALE = [
  { score: 1, emoji: '😢', label: 'Awful' },
  { score: 2, emoji: '😕', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
] as const;

export function moodEmoji(score: number): string {
  return MOOD_SCALE.find((m) => m.score === score)?.emoji ?? '😐';
}

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useHabitStore } from '@/features/habits/habitStore';
import { today } from '@/lib/id';
import { useTheme } from '@/theme/useTheme';

/** Last-N-days completion heatmap for a single habit (GitHub-contribution style). */
export function Heatmap({ habitId, days = 35 }: { habitId: string; days?: number }) {
  const { theme } = useTheme();
  const { checkinDays } = useHabitStore();
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkinDays(habitId).then((list) => setDone(new Set(list)));
  }, [habitId, checkinDays]);

  const cells: { key: string; active: boolean }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = today(cursor);
    cells.push({ key, active: done.has(key) });
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {cells.map((c) => (
        <View
          key={c.key}
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            backgroundColor: c.active ? theme.secondary : theme.border,
          }}
        />
      ))}
    </View>
  );
}

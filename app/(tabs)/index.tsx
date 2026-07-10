import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenTitle, Subtle } from '@/components/ui';
import { useHabitStore } from '@/features/habits/habitStore';
import { moodEmoji } from '@/features/mood/moodMeta';
import { useMoodStore } from '@/features/mood/moodStore';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

/** Glanceable dashboard: today's mood, habit progress, entry into the daily loop. */
export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const { moods, load: loadMoods } = useMoodStore();
  const { habits, load: loadHabits } = useHabitStore();

  useEffect(() => {
    loadMoods();
    loadHabits();
  }, [loadMoods, loadHabits]);

  const lastMood = moods[0];
  const doneCount = habits.filter((h) => h.doneToday).length;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View>
          <Subtle>{greeting}</Subtle>
          <ScreenTitle>Today</ScreenTitle>
        </View>

        <Card>
          <Subtle>How you feel</Subtle>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
            <Text style={{ fontSize: 40 }}>{lastMood ? moodEmoji(lastMood.score) : '➕'}</Text>
            <Text style={{ fontSize: 18, color: theme.text, flex: 1 }}>
              {lastMood ? 'Latest mood logged' : 'No mood logged yet today'}
            </Text>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <Button label="Log mood" onPress={() => router.push('/mood')} />
          </View>
        </Card>

        <Card>
          <Subtle>Habits</Subtle>
          <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text, marginTop: spacing.xs }}>
            {doneCount}/{habits.length} done today
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <Button label="Open habits" variant="ghost" onPress={() => router.push('/habits')} />
          </View>
        </Card>

        <Card>
          <Subtle>Weekly reflection</Subtle>
          <Text style={{ fontSize: 16, color: theme.text, marginTop: spacing.xs }}>
            Let your AI companion reflect on your week.
          </Text>
          <View style={{ marginTop: spacing.md }}>
            <Button label="Reflect" onPress={() => router.push('/reflect')} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

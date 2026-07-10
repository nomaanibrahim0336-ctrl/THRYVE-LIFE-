import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenTitle, Subtle } from '@/components/ui';
import { MOOD_SCALE, moodEmoji } from '@/features/mood/moodMeta';
import { useMoodStore } from '@/features/mood/moodStore';
import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function MoodScreen() {
  const { theme } = useTheme();
  const { moods, load, logMood } = useMoodStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    load();
  }, [load]);

  const onSelect = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(score);
  };

  const onSave = async () => {
    if (selected == null) return;
    await logMood(selected, note);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelected(null);
    setNote('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <ScreenTitle>Mood</ScreenTitle>
            <Card>
              <Subtle>How are you feeling right now?</Subtle>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
                {MOOD_SCALE.map((m) => (
                  <Pressable
                    key={m.score}
                    onPress={() => onSelect(m.score)}
                    style={{
                      alignItems: 'center',
                      padding: spacing.sm,
                      borderRadius: radius.md,
                      backgroundColor: selected === m.score ? theme.primary + '22' : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{m.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                placeholder="Add a note (optional)"
                placeholderTextColor={theme.textMuted}
                value={note}
                onChangeText={setNote}
                multiline
                style={{
                  marginTop: spacing.md,
                  minHeight: 60,
                  color: theme.text,
                  backgroundColor: theme.background,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              />
              <View style={{ marginTop: spacing.md }}>
                <Button label="Save mood" onPress={onSave} disabled={selected == null} />
              </View>
            </Card>
            <Subtle>Recent</Subtle>
          </View>
        }
        data={moods}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Text style={{ fontSize: 28 }}>{moodEmoji(item.score)}</Text>
            <View style={{ flex: 1 }}>
              {item.note ? <Text style={{ color: theme.text }}>{item.note}</Text> : null}
              <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                {new Date(item.logged_at).toLocaleString()}
              </Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Subtle>No moods yet — log your first above.</Subtle>}
      />
    </SafeAreaView>
  );
}

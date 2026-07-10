import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenTitle, Subtle } from '@/components/ui';
import { Heatmap } from '@/features/habits/Heatmap';
import { useHabitStore } from '@/features/habits/habitStore';
import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function HabitsScreen() {
  const { theme } = useTheme();
  const { habits, load, addHabit, toggleToday, deleteHabit } = useHabitStore();
  const [name, setName] = useState('');

  const confirmDelete = (id: string, habitName: string) => {
    Alert.alert('Delete habit', `Delete "${habitName}" and its history?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(id) },
    ]);
  };

  useEffect(() => {
    load();
  }, [load]);

  const onToggle = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleToday(id);
  };

  const onAdd = async () => {
    await addHabit(name);
    setName('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <FlatList
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md }}>
            <ScreenTitle>Habits</ScreenTitle>
            <Card>
              <Subtle>New habit</Subtle>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <TextInput
                  placeholder="e.g. Drink water"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  onSubmitEditing={onAdd}
                  style={{
                    flex: 1,
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                />
                <Button label="Add" onPress={onAdd} disabled={!name.trim()} />
              </View>
            </Card>
          </View>
        }
        data={habits}
        keyExtractor={(h) => h.id}
        renderItem={({ item }) => (
          <Card style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Pressable onLongPress={() => confirmDelete(item.id, item.name)} hitSlop={8}>
                <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>{item.name}</Text>
                <Text style={{ color: theme.accent, fontWeight: '600' }}>🔥 {item.streak} day streak</Text>
              </View>
              <Pressable
                onPress={() => onToggle(item.id)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: item.doneToday ? theme.secondary : 'transparent',
                  borderWidth: 2,
                  borderColor: item.doneToday ? theme.secondary : theme.border,
                }}
              >
                <Text style={{ fontSize: 20, color: item.doneToday ? '#fff' : theme.textMuted }}>✓</Text>
              </Pressable>
            </View>
            <Heatmap habitId={item.id} />
          </Card>
        )}
        ListEmptyComponent={<Subtle>No habits yet — add one above to start a streak.</Subtle>}
        ListFooterComponent={
          habits.length > 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.sm }}>
              Tap the ring to check in · long-press the emoji to delete.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

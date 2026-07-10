import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, ScreenTitle, Subtle } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/supabase';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function ProfileScreen() {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <ScreenTitle>Profile</ScreenTitle>

        <Card>
          <Subtle>Backend status</Subtle>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isSupabaseConfigured ? theme.secondary : theme.textMuted,
              }}
            />
            <Text style={{ color: theme.text }}>
              {isSupabaseConfigured ? 'Supabase connected — cloud sync ready' : 'Local-only mode (no backend yet)'}
            </Text>
          </View>
          <Text style={{ marginTop: spacing.sm, color: theme.textMuted, fontSize: 13 }}>
            All your data lives on-device in SQLite. Configure Supabase in .env to enable
            sign-in, sync, and AI reflections.
          </Text>
        </Card>

        <Card>
          <Subtle>About</Subtle>
          <Text style={{ marginTop: spacing.sm, color: theme.text }}>Vitalis — the daily wellness loop.</Text>
          <Text style={{ marginTop: spacing.xs, color: theme.textMuted, fontSize: 13 }}>Version 0.1.0 (MVP scaffold)</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

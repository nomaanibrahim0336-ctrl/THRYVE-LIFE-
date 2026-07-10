import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenTitle, Subtle } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { RemindersCard } from '@/features/notifications/RemindersCard';
import { isSupabaseConfigured } from '@/lib/supabase';
import { syncNow } from '@/lib/sync';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { session, signOut } = useAuthStore();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const onSync = async () => {
    setSyncMsg('Syncing…');
    const res = await syncNow();
    setSyncMsg(
      res
        ? `Synced — pushed ${res.pushed}, pulled ${res.pulled}.`
        : 'Nothing to sync (offline mode or signed out).',
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <ScreenTitle>Profile</ScreenTitle>

        <RemindersCard />

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
          {isSupabaseConfigured ? (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              <Button label="Sync now" variant="ghost" onPress={onSync} />
              {syncMsg ? <Subtle>{syncMsg}</Subtle> : null}
            </View>
          ) : null}
        </Card>

        {session ? (
          <Card>
            <Subtle>Signed in as</Subtle>
            <Text style={{ marginTop: spacing.xs, color: theme.text }}>{session.user.email}</Text>
            <View style={{ marginTop: spacing.md }}>
              <Button label="Sign out" variant="ghost" onPress={signOut} />
            </View>
          </Card>
        ) : null}

        <Card>
          <Subtle>About</Subtle>
          <Text style={{ marginTop: spacing.sm, color: theme.text }}>Vitalis — the daily wellness loop.</Text>
          <Text style={{ marginTop: spacing.xs, color: theme.textMuted, fontSize: 13 }}>Version 0.1.0 (MVP scaffold)</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

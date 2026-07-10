import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { startSyncListener, syncNow } from '@/lib/sync';
import { useTheme } from '@/theme/useTheme';

const queryClient = new QueryClient();

/**
 * Redirects between the app and the auth stack based on session. In local-only
 * mode (no backend) auth is skipped and the app is always accessible.
 */
function useAuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, initializing } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured || initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, initializing, segments, router]);
}

function AppShell() {
  const { theme, isDark } = useTheme();
  const initAuth = useAuthStore((s) => s.init);
  useAuthGate();

  // Wire auth listener, connectivity-triggered sync, and foreground sync.
  useEffect(() => {
    const unsubAuth = initAuth();
    const unsubNet = startSyncListener();
    void syncNow();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNow();
    });
    return () => {
      unsubAuth();
      unsubNet();
      sub.remove();
    };
  }, [initAuth]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

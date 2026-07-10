import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '@/theme/useTheme';

/** Emoji tab icon keeps the scaffold dependency-free; swap for an icon set later. */
function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="mood"
        options={{ title: 'Mood', tabBarIcon: ({ color }) => <TabIcon icon="😊" color={color} /> }}
      />
      <Tabs.Screen
        name="habits"
        options={{ title: 'Habits', tabBarIcon: ({ color }) => <TabIcon icon="🔥" color={color} /> }}
      />
      <Tabs.Screen
        name="reflect"
        options={{ title: 'Reflect', tabBarIcon: ({ color }) => <TabIcon icon="✨" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tabs>
  );
}

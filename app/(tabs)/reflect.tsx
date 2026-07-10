import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenTitle, Subtle } from '@/components/ui';
import { generateReflection } from '@/features/reflect/reflect';
import { spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export default function ReflectScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [reflection, setReflection] = useState<{ text: string; source: 'ai' | 'local' } | null>(null);

  const onReflect = async () => {
    setLoading(true);
    try {
      setReflection(await generateReflection());
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <ScreenTitle>Reflect</ScreenTitle>
        <Subtle>A gentle look at your week — mood and habits together.</Subtle>

        <Card>
          {reflection ? (
            <>
              <Text style={{ fontSize: 17, lineHeight: 26, color: theme.text }}>{reflection.text}</Text>
              <Text style={{ marginTop: spacing.md, fontSize: 12, color: theme.textMuted }}>
                {reflection.source === 'ai' ? '✨ AI companion' : '📴 Offline reflection'}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 16, color: theme.textMuted }}>
              Tap below to generate this week&apos;s reflection.
            </Text>
          )}
          <View style={{ marginTop: spacing.md }}>
            <Button label={reflection ? 'Refresh reflection' : 'Reflect on my week'} onPress={onReflect} loading={loading} />
          </View>
        </Card>

        <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
          Vitalis offers wellness reflections for self-awareness. It is not a medical
          device and does not provide diagnosis or treatment. If you&apos;re in crisis,
          contact your local emergency services or a crisis line.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

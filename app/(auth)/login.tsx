import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ScreenTitle, Subtle } from '@/components/ui';
import { useAuthStore } from '@/features/auth/authStore';
import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

/** Email OTP (magic code) sign-in. Two steps: request code, then verify it. */
export default function Login() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signInWithOtp, verifyOtp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const input = {
    color: theme.text,
    backgroundColor: theme.background,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 16,
  };

  const requestCode = async () => {
    setLoading(true);
    setError(null);
    const { error } = await signInWithOtp(email);
    setLoading(false);
    if (error) return setError(error);
    setStage('code');
  };

  const verify = async () => {
    setLoading(true);
    setError(null);
    const { error } = await verifyOtp(email, code);
    setLoading(false);
    if (error) return setError(error);
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg }}
      >
        <View style={{ gap: spacing.xs }}>
          <ScreenTitle>Welcome to Vitalis</ScreenTitle>
          <Subtle>Your daily wellness loop.</Subtle>
        </View>

        <Card style={{ gap: spacing.md }}>
          {stage === 'email' ? (
            <>
              <Subtle>Enter your email — we&apos;ll send a sign-in code.</Subtle>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                style={input}
              />
              <Button label="Send code" onPress={requestCode} loading={loading} disabled={!email.includes('@')} />
            </>
          ) : (
            <>
              <Subtle>Enter the 6-digit code sent to {email}.</Subtle>
              <TextInput
                placeholder="123456"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                style={input}
              />
              <Button label="Verify & sign in" onPress={verify} loading={loading} disabled={code.length < 6} />
              <Button label="Use a different email" variant="ghost" onPress={() => setStage('email')} />
            </>
          )}
          {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

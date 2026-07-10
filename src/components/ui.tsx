import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text }}>{children}</Text>;
}

export function Subtle({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return <Text style={{ fontSize: 15, color: theme.textMuted }}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const bg = variant === 'primary' ? theme.primary : 'transparent';
  const fg = variant === 'primary' ? '#fff' : theme.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: bg,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        borderRadius: radius.md,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
        borderColor: theme.primary,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '600', fontSize: 16 }}>{label}</Text>
      )}
    </Pressable>
  );
}

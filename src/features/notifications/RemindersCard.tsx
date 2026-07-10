import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Card, Subtle } from '@/components/ui';
import { useReminderStore } from '@/features/notifications/reminderStore';
import { radius, spacing } from '@/theme/colors';
import { useTheme } from '@/theme/useTheme';

function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${period}`;
}

/** A single reminder row: label, enable switch, and an hour stepper. */
function ReminderRow({
  label,
  enabled,
  hour,
  onToggle,
  onHour,
}: {
  label: string;
  enabled: boolean;
  hour: number;
  onToggle: (v: boolean) => void;
  onHour: (h: number) => void;
}) {
  const { theme } = useTheme();
  const step = (delta: number) => onHour((hour + delta + 24) % 24);
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.text, fontSize: 16 }}>{label}</Text>
        <Switch value={enabled} onValueChange={onToggle} trackColor={{ true: theme.primary }} />
      </View>
      {enabled ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Subtle>Time</Subtle>
          <Pressable onPress={() => step(-1)} hitSlop={8}>
            <Text style={{ fontSize: 22, color: theme.primary, width: 28, textAlign: 'center' }}>−</Text>
          </Pressable>
          <Text
            style={{
              color: theme.text,
              fontVariant: ['tabular-nums'],
              minWidth: 74,
              textAlign: 'center',
              borderRadius: radius.sm,
              paddingVertical: 4,
              backgroundColor: theme.background,
            }}
          >
            {formatHour(hour)}
          </Text>
          <Pressable onPress={() => step(1)} hitSlop={8}>
            <Text style={{ fontSize: 22, color: theme.primary, width: 28, textAlign: 'center' }}>+</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function RemindersCard() {
  const { theme } = useTheme();
  const { prefs, load, update } = useReminderStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const apply = async (patch: Parameters<typeof update>[0]) => {
    const { error } = await update(patch);
    setError(error);
  };

  return (
    <Card style={{ gap: spacing.lg }}>
      <Subtle>Daily reminders</Subtle>
      <ReminderRow
        label="Morning check-in"
        enabled={prefs.morningEnabled}
        hour={prefs.morningHour}
        onToggle={(v) => apply({ morningEnabled: v })}
        onHour={(h) => apply({ morningHour: h })}
      />
      <ReminderRow
        label="Evening reflection"
        enabled={prefs.eveningEnabled}
        hour={prefs.eveningHour}
        onToggle={(v) => apply({ eveningEnabled: v })}
        onHour={(h) => apply({ eveningHour: h })}
      />
      {error ? <Text style={{ color: theme.danger, fontSize: 13 }}>{error}</Text> : null}
    </Card>
  );
}

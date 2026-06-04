import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface StatTriadProps {
  exercises: number | string;
  minutes: number | string;
  streakDays: number | string;
}

/**
 * Three big numbers, side by side, matching the reference's profile screen.
 * No icons, no surfaces — just typography over the gradient background.
 */
export default function StatTriad({ exercises, minutes, streakDays }: StatTriadProps) {
  const { t, isRTL } = useTranslation();

  // The reference visually orders: [streak] [minutes] [exercises] in RTL;
  // we render in semantic order and flip via flexDirection.
  return (
    <View
      style={[
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <Stat value={exercises} label={t('dashboard.exercises')} />
      <Stat value={minutes} label={t('dashboard.minutes')} />
      <Stat value={streakDays} label={t('dashboard.daysInARow')} />
    </View>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cell: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    ...typography.h1,
    fontSize: 30,
    color: colors.text.primary,
  },
  label: {
    ...typography.cardMeta,
    color: colors.text.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});

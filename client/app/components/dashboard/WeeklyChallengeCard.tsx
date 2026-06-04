import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface WeeklyChallengeCardProps {
  title?: string;
  current: number;
  total: number;
  onAddReminder?: () => void;
}

/**
 * Weekly challenge card with circular progress ring on the start side
 * and a "Add reminder" link on the end side.
 */
export default function WeeklyChallengeCard({
  title,

  current,
  total,
  onAddReminder,
}: WeeklyChallengeCardProps) {
  const { t, isRTL } = useTranslation();

  const size = 56;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, current / total));
  const offset = circumference * (1 - progress);

  return (
    <View style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.brand.lavenderMist}
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${circumference},${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringLabel}>
          <Text style={styles.ringText}>{current}/{total}</Text>
        </View>
      </View>

      <View style={[styles.body, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {title ?? t('dashboard.weeklyChallenge')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('dashboard.weeklyChallengeSubtitle', { count: 10 })}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onAddReminder}
        style={[styles.reminderBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.addReminder')}
      >
        <Ionicons name="notifications-outline" size={14} color={colors.primary} />
        <Text style={styles.reminderText}>{t('dashboard.addReminder')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.sm,
  },
  ringWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  body: {
    flex: 1,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.cardMeta,
    color: colors.text.muted,
    marginTop: 2,
  },
  reminderBtn: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  reminderText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
});

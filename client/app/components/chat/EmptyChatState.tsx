import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface EmptyChatStateProps {
  onSuggestionPress: (prompt: string) => void;
}

/**
 * Warm empty state shown when the chat has no messages yet. Surfaces three
 * suggestion chips so the user doesn't stare at a blank box.
 */
export default function EmptyChatState({ onSuggestionPress }: EmptyChatStateProps) {
  const { t, isRTL } = useTranslation();

  const prompts: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
    { icon: 'pulse-outline', label: t('chat.emptyPrompts.anxious') },
    { icon: 'moon-outline', label: t('chat.emptyPrompts.sleep') },
    { icon: 'ear-outline', label: t('chat.emptyPrompts.listen') },
    { icon: 'flash-outline', label: t('chat.emptyPrompts.stress') },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons name="sparkles-outline" size={44} color={colors.primary} />
      </View>
      <Text style={[styles.title, { textAlign: 'center' }]}>
        {t('chat.startConversation')}
      </Text>
      <Text style={[styles.message, { textAlign: 'center' }]}>
        {t('chat.emptyStateMessage')}
      </Text>

      <View
        style={[
          styles.chipsRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {prompts.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={[
              styles.chip,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            activeOpacity={0.85}
            onPress={() => onSuggestionPress(p.label)}
            accessibilityRole="button"
            accessibilityLabel={p.label}
          >
            <Ionicons name={p.icon} size={14} color={colors.primary} />
            <Text style={styles.chipLabel}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.disclaimer}>{t('chat.disclaimer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.brand.lavenderMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.microCopy,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  chipsRow: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    ...shadows.sm,
  },
  chipLabel: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

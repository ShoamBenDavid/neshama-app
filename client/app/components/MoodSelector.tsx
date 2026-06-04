import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useTranslation } from '../i18n';

interface MoodSelectorProps {
  selected: number | null;
  onSelect: (mood: number) => void;
  compact?: boolean;
}

export default function MoodSelector({ selected, onSelect, compact = false }: MoodSelectorProps) {
  const { t } = useTranslation();

  const MOODS = [
    { value: 1, emoji: '😔', label: t('moods.struggling') },
    { value: 2, emoji: '😕', label: t('moods.low') },
    { value: 3, emoji: '😐', label: t('moods.okay') },
    { value: 4, emoji: '🙂', label: t('moods.good') },
    { value: 5, emoji: '😊', label: t('moods.great') },
  ];

  return (
    <View style={styles.container}>
      {!compact && (
        <Text style={styles.title}>{t('moods.howAreYouFeeling')}</Text>
      )}
      <View style={styles.moodsRow}>
        {MOODS.map((mood) => {
          const isSelected = selected === mood.value;
          return (
            <TouchableOpacity
              key={mood.value}
              style={[
                styles.moodItem,
                isSelected && {
                  backgroundColor: colors.mood[mood.value] + '20',
                  borderColor: colors.mood[mood.value],
                },
              ]}
              onPress={() => onSelect(mood.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, compact && styles.emojiCompact]}>
                {mood.emoji}
              </Text>
              {!compact && (
                <Text
                  style={[
                    styles.label,
                    isSelected && { color: colors.mood[mood.value] },
                  ]}
                >
                  {mood.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  moodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodItem: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    marginHorizontal: spacing.xxs,
  },
  emoji: {
    fontSize: 32,
  },
  emojiCompact: {
    fontSize: 24,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

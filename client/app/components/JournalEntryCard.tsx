import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { JournalEntry } from '../services/api';
import { useTranslation } from '../i18n';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

interface JournalEntryCardProps {
  entry: JournalEntry;
  onPress?: () => void;
}

/**
 * Redesigned journal entry card: cream surface, mood-color side stripe,
 * RTL-aware layout, soft shadows, and emotional padding.
 */
export default function JournalEntryCard({ entry, onPress }: JournalEntryCardProps) {
  const { t, isRTL } = useTranslation();
  const moodColor = colors.mood[entry.mood] ?? colors.brand.lavender;

  const moodLabelByValue: Record<number, string> = {
    1: t('moods.struggling'),
    2: t('moods.low'),
    3: t('moods.okay'),
    4: t('moods.good'),
    5: t('moods.great'),
  };

  const getTagLabel = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase().replace(/\s+/g, '');
    const translated = t(`tags.${normalizedTag}`);
    return translated === `tags.${normalizedTag}` ? tag : translated;
  };

  const getAnxietyLabel = (label: string) => {
    const normalizedLabel = label.trim().toLowerCase();
    if (normalizedLabel === 'high') return t('journal.anxietyLevelHigh');
    if (normalizedLabel === 'moderate') return t('journal.anxietyLevelModerate');
    if (normalizedLabel === 'low') return t('journal.anxietyLevelLow');
    return label;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        isRTL
          ? { borderRightWidth: 4, borderRightColor: moodColor }
          : { borderLeftWidth: 4, borderLeftColor: moodColor },
      ]}
      accessibilityRole="button"
      accessibilityLabel={entry.title || entry.content.slice(0, 60)}
    >
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View
          style={[
            styles.moodBadge,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={styles.moodEmoji}>{MOOD_EMOJIS[entry.mood] || '😐'}</Text>
          <Text style={[styles.moodLabel, { color: moodColor }]}>
            {moodLabelByValue[entry.mood] || t('common.unknown')}
          </Text>
        </View>
        <View style={[styles.dateContainer, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
          <Text style={styles.date}>{entry.date}</Text>
          <Text style={styles.time}>{entry.time}</Text>
        </View>
      </View>

      {entry.title && (
        <Text
          style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={1}
        >
          {entry.title}
        </Text>
      )}
      <Text
        style={[styles.content, { textAlign: isRTL ? 'right' : 'left' }]}
        numberOfLines={2}
      >
        {entry.content}
      </Text>

      {entry.tags.length > 0 && (
        <View style={[styles.tagsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {entry.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{getTagLabel(tag)}</Text>
            </View>
          ))}
          {entry.tags.length > 3 && (
            <Text style={styles.moreTags}>+{entry.tags.length - 3}</Text>
          )}
        </View>
      )}

      {entry.anxietyLabel && (
        <View
          style={[styles.anxietyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <Ionicons name="pulse-outline" size={14} color={colors.text.muted} />
          <Text style={styles.anxietyText}>
            {t('journal.anxietyLabel', { label: getAnxietyLabel(entry.anxietyLabel) })}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  moodBadge: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    ...typography.captionMedium,
  },
  dateContainer: {},
  date: {
    ...typography.caption,
    color: colors.text.muted,
  },
  time: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  content: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  tagsRow: {
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.brand.lavenderMist,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
  },
  moreTags: {
    ...typography.caption,
    color: colors.text.tertiary,
    alignSelf: 'center',
  },
  anxietyRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  anxietyText: {
    ...typography.caption,
    color: colors.text.muted,
  },
});

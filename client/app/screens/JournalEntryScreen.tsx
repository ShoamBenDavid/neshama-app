import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  Screen,
  Header,
  LoadingState,
  ErrorState,
  Button,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useAppDispatch } from '../store/hooks';
import { deleteJournalEntry } from '../store/slices/journalSlice';
import { journalAPI, JournalEntry } from '../services/api';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😔',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

type RouteParams = RouteProp<RootStackParamList, 'JournalEntry'>;

export default function JournalEntryScreen() {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { entryId } = route.params;
  const { t, isRTL } = useTranslation();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getClassificationLabel = (label: string) => {
    const normalizedLabel = label.trim().toLowerCase();
    if (normalizedLabel === 'normal') return t('journal.classificationNormal');
    if (normalizedLabel === 'anxiety') return t('journal.classificationAnxiety');
    if (normalizedLabel === 'depression') return t('journal.classificationDepression');
    if (normalizedLabel === 'high') return t('journal.anxietyLevelHigh');
    if (normalizedLabel === 'moderate')
      return t('journal.anxietyLevelModerate');
    if (normalizedLabel === 'low') return t('journal.anxietyLevelLow');
    return label;
  };

  // i18n-correct mood label (replaces the legacy English-only `colors.moodLabel` map).
  const getMoodLabel = (mood: number) => {
    const key = ['', 'struggling', 'low', 'okay', 'good', 'great'][mood];
    if (!key) return t('common.unknown');
    return t(`moods.${key}`);
  };

  const getTagLabel = (tag: string) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, '');
    const translated = t(`tags.${normalized}`);
    return translated === `tags.${normalized}` ? tag : translated;
  };

  useEffect(() => {
    loadEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  const loadEntry = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await journalAPI.getEntry(entryId);
      if (response.success) {
        setEntry(response.data.entry);
      }
    } catch (err: any) {
      setError(err.message || t('journal.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('journal.deleteEntry'), t('journal.deleteConfirmation'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await dispatch(deleteJournalEntry(entryId));
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) return <LoadingState message={t('journal.loadingEntry')} />;
  if (error) return <ErrorState message={error} onRetry={loadEntry} />;
  if (!entry) return <ErrorState message={t('journal.entryNotFound')} />;

  const moodColor = colors.mood[entry.mood] ?? colors.brand.lavender;
  const moodLabel = getMoodLabel(entry.mood);
  const classificationLabel = entry.classification?.category ?? entry.anxietyLabel;

  return (
    <Screen padded={false} scrollable>
      <Header
        title={t('journal.journalEntry')}
        showBack
        rightAction={
          <Ionicons
            name="trash-outline"
            size={22}
            color={colors.brand.warmCoral}
            onPress={handleDelete}
          />
        }
      />

      <View style={styles.body}>
        <View
          style={[
            styles.moodCard,
            {
              backgroundColor: `${moodColor}22`,
              borderLeftWidth: 4,
              borderLeftColor: moodColor,
            },
            isRTL && {
              borderLeftWidth: 0,
              borderRightWidth: 4,
              borderRightColor: moodColor,
            },
          ]}
        >
          <View
            style={[
              styles.moodRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.moodEmoji}>
              {MOOD_EMOJIS[entry.mood] || '😐'}
            </Text>
            <View>
              <Text
                style={[
                  styles.moodLabel,
                  { color: moodColor, textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {moodLabel}
              </Text>
              <Text
                style={[
                  styles.moodDate,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {entry.date} · {entry.time}
              </Text>
            </View>
          </View>
          {classificationLabel && (
            <View
              style={[
                styles.anxietyBadge,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Ionicons
                name="pulse-outline"
                size={14}
                color={colors.text.muted}
              />
              <Text style={styles.anxietyText}>
                {t('journal.classificationLabel', {
                  label: getClassificationLabel(classificationLabel),
                })}
              </Text>
            </View>
          )}
        </View>

        {entry.title && (
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {entry.title}
          </Text>
        )}

        <View style={styles.contentCard}>
          <Text
            style={[styles.content, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {entry.content}
          </Text>
        </View>

        {entry.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text
              style={[
                styles.tagsLabel,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('journal.tags')}
            </Text>
            <View
              style={[
                styles.tagsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              {entry.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{getTagLabel(tag)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.deleteSection}>
          <Button
            title={t('journal.deleteEntry')}
            variant="ghost"
            size="md"
            onPress={handleDelete}
            icon={
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.brand.warmCoral}
              />
            }
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
  },
  moodCard: {
    borderRadius: borderRadius.card,
    padding: spacing.base,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  moodRow: {
    alignItems: 'center',
    gap: spacing.md,
  },
  moodEmoji: {
    fontSize: 40,
  },
  moodLabel: {
    ...typography.h4,
  },
  moodDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  anxietyBadge: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(31,34,53,0.12)',
  },
  anxietyText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.base,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  content: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
  },
  tagsSection: {
    marginBottom: spacing.xl,
  },
  tagsLabel: {
    ...typography.captionMedium,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  tagsRow: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.brand.lavenderMist,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
  },
  deleteSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
});

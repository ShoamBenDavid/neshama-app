import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Header, ActionButton } from '../components/ui';
import MoodSelector from '../components/MoodSelector';
import { PostSaveReflectionSheet } from '../components/journal';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createJournalEntry } from '../store/slices/journalSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type RouteParams = RouteProp<RootStackParamList, 'CreateJournal'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUGGESTED_TAGS = [
  'anxiety',
  'stress',
  'sadness',
  'depression',
  'anger',
  'loneliness',
  'overthinking',
  'sleep',
  'energy',
  'motivation',
  'gratitude',
  'success',
  'self-care',
  'relationships',
  'family',
  'studies',
  'work',
  'health',
  'routine',
  'general',
];

export default function CreateJournalScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteParams>();
  const dispatch = useAppDispatch();
  const { isCreating } = useAppSelector((state) => state.journal);
  const { t, isRTL } = useTranslation();

  const [mood, setMood] = useState<number | null>(route.params?.initialMood ?? null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reflection, setReflection] = useState<{ label: string | null } | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    if (!mood) {
      Alert.alert(t('journal.missingMood'), t('journal.missingMoodMessage'));
      return;
    }
    if (!content.trim()) {
      Alert.alert(t('journal.missingContent'), t('journal.missingContentMessage'));
      return;
    }

    const result = await dispatch(
      createJournalEntry({
        mood,
        title: title.trim() || undefined,
        content: content.trim(),
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      }),
    );

    if (createJournalEntry.fulfilled.match(result)) {
      // Open the post-save reflection sheet with the classification label.
      const label = (result.payload?.anxietyLabel ?? null) as string | null;
      setReflection({ label });
    } else {
      Alert.alert(t('common.error'), t('journal.saveFailed'));
    }
  };

  const handleReflectionDismiss = (next?: 'breath' | 'chat' | 'support' | 'continue') => {
    setReflection(null);
    if (next === 'breath') {
      navigation.replace('BreathingExercises');
    } else if (next === 'chat') {
      navigation.replace('Chat');
    } else if (next === 'support') {
      navigation.navigate('MainTabs', { screen: 'SupportCenter' });
    } else {
      navigation.goBack();
    }
  };

  return (
    <Screen gradient="journalSafe" padded={false} avoidKeyboard scrollable>
      <Header title={t('journal.newEntry')} showBack />

      <View style={styles.body}>
        <View style={styles.moodWrap}>
        
          <MoodSelector selected={mood} onSelect={setMood} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('journal.titleOptional')}
          </Text>
          <TextInput
            style={[styles.titleInput, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('journal.titlePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.field}> 
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('journal.whatsOnYourMind')}
          </Text>
          <TextInput
            style={[styles.contentInput, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('journal.contentPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={5000}
          />
          <Text
            style={[
              styles.charCount,
              { textAlign: isRTL ? 'left' : 'right' },
            ]}
          >
            {content.length}/5000
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('journal.tagsOptional')}
          </Text>
          <View
            style={[
              styles.tagsContainer,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {SUGGESTED_TAGS.map((tag) => {
              const isActive = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.85}
                  style={[styles.tag, isActive && styles.tagActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[styles.tagText, isActive && styles.tagTextActive]}
                  >
                    {t(`tags.${tag}` as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ActionButton
          title={t('journal.saveEntry')}
          onPress={handleSave}
          loading={isCreating}
          size="lg"
          fullWidth
          glow
          style={styles.saveButton}
        />
      </View>

      <PostSaveReflectionSheet
        visible={reflection !== null}
        anxietyLabel={reflection?.label ?? null}
        onClose={handleReflectionDismiss}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
  },
  moodWrap: {
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  titleInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 48,
    ...(Platform.OS === 'ios' ? { lineHeight: 20 } : {}),
  },
  contentInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 160,
    lineHeight: 24,
  },
  charCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: {
    backgroundColor: colors.brand.lavenderMist,
    borderColor: colors.primary,
  },
  tagText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  tagTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});

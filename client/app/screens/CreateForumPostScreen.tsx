import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Header, Button } from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createForumPost } from '../store/slices/forumSlice';
import { useTranslation } from '../i18n';

export default function CreateForumPostScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isCreating } = useAppSelector((state) => state.forum);
  const { t, isRTL } = useTranslation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const CATEGORIES = useMemo(
    () => [
      { id: 'anxiety', label: t('forum.categoryAnxiety') },
      { id: 'depression', label: t('forum.categoryDepression') },
      { id: 'relationships', label: t('forum.categoryRelationships') },
      { id: 'work-stress', label: t('forum.categoryWorkStress') },
      { id: 'success', label: t('forum.categorySuccessStories') },
      { id: 'general', label: t('forum.categoryGeneral') },
    ],
    [t],
  );

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert(t('forum.missingTitle'), t('forum.missingTitleMessage'));
      return;
    }
    if (!content.trim()) {
      Alert.alert(t('forum.missingContent'), t('forum.missingContentMessage'));
      return;
    }
    if (!categoryId) {
      Alert.alert(t('forum.missingCategory'), t('forum.missingCategoryMessage'));
      return;
    }

    const result = await dispatch(
      createForumPost({
        title: title.trim(),
        content: content.trim(),
        categoryId,
        isAnonymous,
      }),
    );

    if (createForumPost.fulfilled.match(result)) {
      navigation.goBack();
    } else {
      Alert.alert(t('common.error'), t('forum.createFailed'));
    }
  };

  return (
    <Screen scrollable avoidKeyboard padded={false}>
      <Header title={t('forum.newPost')} showBack />

      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={[styles.label, { textAlign }]}>{t('forum.category')}</Text>
          <View
            style={[
              styles.categoriesGrid,
              { flexDirection: rowDirection },
            ]}
          >
            {CATEGORIES.map((cat) => {
              const isActive = categoryId === cat.id;
              const catColor = colors.category[cat.id] || colors.primary;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    isActive && {
                      backgroundColor: catColor + '20',
                      borderColor: catColor,
                    },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { textAlign },
                      isActive && { color: catColor },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign }]}>{t('forum.postTitle')}</Text>
          <TextInput
            style={[styles.titleInput, { textAlign }]}
            placeholder={t('forum.titlePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { textAlign }]}>{t('forum.content')}</Text>
          <TextInput
            style={[styles.contentInput, { textAlign }]}
            placeholder={t('forum.contentPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={10000}
          />
        </View>

        <View style={[styles.anonymousRow, { flexDirection: rowDirection }]}>
          <View style={styles.anonymousCopy}>
            <Text style={[styles.anonymousTitle, { textAlign }]}>
              {t('forum.postAnonymously')}
            </Text>
            <Text style={[styles.anonymousDesc, { textAlign }]}>
              {t('forum.nameNotShown')}
            </Text>
          </View>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isAnonymous ? colors.primary : colors.text.tertiary}
          />
        </View>

        <Button
          title={t('forum.publishPost')}
          onPress={handleCreate}
          loading={isCreating}
          size="lg"
          style={styles.submitButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  categoriesGrid: {
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
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
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 150,
    lineHeight: 24,
    ...shadows.sm,
  },
  anonymousRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  anonymousCopy: {
    flex: 1,
  },
  anonymousTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  anonymousDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});

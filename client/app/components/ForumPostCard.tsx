import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { ForumPost } from '../services/api';
import { useTranslation } from '../i18n';

interface ForumPostCardProps {
  post: ForumPost;
  onPress?: () => void;
  onLike?: () => void;
}

/**
 * Redesigned forum post card:
 *  - RTL-aware layout
 *  - Category color used as a soft side-stripe rather than the loud badge
 *  - Pill category label using mood/lavender tones
 *  - Heart icon uses the warm coral when liked (matches the wellness palette)
 */
export default function ForumPostCard({ post, onPress, onLike }: ForumPostCardProps) {
  const { t, isRTL } = useTranslation();
  const categoryColor = colors.category[post.categoryId] || colors.primary;

  const categoryLabelById: Record<string, string> = {
    anxiety: t('forum.categoryAnxiety'),
    depression: t('forum.categoryDepression'),
    relationships: t('forum.categoryRelationships'),
    'work-stress': t('forum.categoryWorkStress'),
    success: t('forum.categorySuccess'),
    general: t('forum.categoryGeneral'),
  };
  const categoryLabel =
    categoryLabelById[post.categoryId] ?? post.categoryId.replace('-', ' ');

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        // Side stripe lives on the reading-start edge.
        isRTL
          ? { borderRightWidth: 4, borderRightColor: categoryColor }
          : { borderLeftWidth: 4, borderLeftColor: categoryColor },
      ]}
      accessibilityRole="button"
      accessibilityLabel={post.title}
    >
      <View
        style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: `${categoryColor}1F` },
          ]}
        >
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {categoryLabel}
          </Text>
        </View>
        <Text style={styles.date}>{post.date}</Text>
      </View>

      <Text
        style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}
        numberOfLines={2}
      >
        {post.title}
      </Text>
      <Text
        style={[styles.content, { textAlign: isRTL ? 'right' : 'left' }]}
        numberOfLines={3}
      >
        {post.content}
      </Text>

      <View
        style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        <View
          style={[
            styles.authorRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <View style={styles.avatarDot}>
            <Ionicons
              name={post.isAnonymous ? 'person-outline' : 'person'}
              size={12}
              color={colors.primary}
            />
          </View>
          <Text style={styles.author}>
            {post.isAnonymous ? t('common.anonymous') : post.author || t('common.user')}
          </Text>
        </View>

        <View
          style={[
            styles.actions,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.actionButton,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              onLike?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${post.likes} likes`}
          >
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={16}
              color={post.isLiked ? colors.brand.warmCoral : colors.text.muted}
            />
            <Text style={styles.actionText}>{post.likes}</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.actionButton,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={colors.text.muted}
            />
            <Text style={styles.actionText}>{post.comments}</Text>
          </View>
        </View>
      </View>
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
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryText: {
    ...typography.caption,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
    color: colors.text.muted,
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
  footer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  authorRow: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarDot: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.brand.lavenderMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    ...typography.captionMedium,
    color: colors.text.muted,
  },
  actions: {
    alignItems: 'center',
    gap: spacing.base,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    color: colors.text.muted,
  },
});

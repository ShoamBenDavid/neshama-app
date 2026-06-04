import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  LoadingState,
  ErrorState,
  Card,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchForumPost,
  togglePostLike,
  addPostComment,
} from '../store/slices/forumSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type RouteParams = RouteProp<RootStackParamList, 'ForumPost'>;

export default function ForumPostScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteParams>();
  const dispatch = useAppDispatch();
  const { selectedPost, isLoading, error } = useAppSelector(
    (state) => state.forum,
  );
  const { postId } = route.params;
  const { t, isRTL } = useTranslation();

  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    dispatch(fetchForumPost(postId));
  }, [dispatch, postId]);

  const handleComment = async () => {
    if (!comment.trim()) return;
    await dispatch(
      addPostComment({ id: postId, content: comment.trim(), isAnonymous }),
    );
    setComment('');
    dispatch(fetchForumPost(postId));
  };

  if (isLoading && !selectedPost)
    return <LoadingState message={t('forum.loadingPost')} />;
  if (error && !selectedPost) return <ErrorState message={error} />;
  if (!selectedPost) return <ErrorState message={t('forum.postNotFound')} />;

  const categoryColor =
    colors.category[selectedPost.categoryId] || colors.primary;
  const commentsCount = (selectedPost.comments || []).length;
  const categoryLabelById: Record<string, string> = {
    anxiety: t('forum.categoryAnxiety'),
    depression: t('forum.categoryDepression'),
    relationships: t('forum.categoryRelationships'),
    'work-stress': t('forum.categoryWorkStress'),
    success: t('forum.categorySuccess'),
    general: t('forum.categoryGeneral'),
  };
  const categoryLabel =
    categoryLabelById[selectedPost.categoryId] ??
    selectedPost.categoryId.replace('-', ' ');

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <Screen scrollable={false} padded={false}>
      <Header title={t('forum.post')} showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={selectedPost.comments || []}
          keyExtractor={(_, index) => `comment-${index}`}
          ListHeaderComponent={
            <View style={styles.postContent}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: categoryColor + '18',
                    alignSelf: isRTL ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: categoryColor, textAlign },
                  ]}
                >
                  {categoryLabel}
                </Text>
              </View>

              <Text style={[styles.title, { textAlign }]}>
                {selectedPost.title}
              </Text>
              <Text style={[styles.body, { textAlign }]}>
                {selectedPost.content}
              </Text>

              <View style={[styles.metaRow, { flexDirection: rowDirection }]}>
                <Text style={[styles.author, { textAlign }]}>
                  {selectedPost.isAnonymous
                    ? t('common.anonymous')
                    : selectedPost.author || t('common.user')}
                </Text>
                <Text
                  style={[styles.date, { textAlign: isRTL ? 'left' : 'right' }]}
                >
                  {selectedPost.date}
                </Text>
              </View>

              <View
                style={[styles.actionsRow, { flexDirection: rowDirection }]}
              >
                <TouchableOpacity
                  style={[styles.action, { flexDirection: rowDirection }]}
                  onPress={() => dispatch(togglePostLike(postId))}
                >
                  <Ionicons
                    name={selectedPost.isLiked ? 'heart' : 'heart-outline'}
                    size={22}
                    color={
                      selectedPost.isLiked
                        ? colors.status.error
                        : colors.text.tertiary
                    }
                  />
                  <Text style={styles.actionText}>{selectedPost.likes}</Text>
                </TouchableOpacity>
                <View style={[styles.action, { flexDirection: rowDirection }]}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={20}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.actionText}>
                    {t('common.comments', { count: commentsCount })}
                  </Text>
                </View>
              </View>

              <Text style={[styles.commentsTitle, { textAlign }]}>
                {t('forum.commentsSection')}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <Card style={styles.commentCard} variant="outlined">
              <Text style={[styles.commentAuthor, { textAlign }]}>
                {item.isAnonymous
                  ? t('common.anonymous')
                  : item.author || t('common.user')}
              </Text>
              <Text style={[styles.commentBody, { textAlign }]}>
                {item.content}
              </Text>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.noComments}>{t('forum.noComments')}</Text>
          }
        />

        <View
          style={[
            styles.commentInput,
            { paddingBottom: insets.bottom || spacing.md },
          ]}
        >
          <View style={[styles.anonymousRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.anonymousLabel, { textAlign }]}>
              {t('forum.postAnonymously')}
            </Text>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isAnonymous ? colors.primary : colors.text.tertiary}
            />
          </View>
          <View style={[styles.inputRow, { flexDirection: rowDirection }]}>
            <TextInput
              style={[styles.textInput, { textAlign }]}
              placeholder={t('forum.writeComment')}
              placeholderTextColor={colors.text.tertiary}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !comment.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleComment}
              disabled={!comment.trim()}
            >
              <Ionicons
                name={isRTL ? 'arrow-back' : 'arrow-forward'}
                size={18}
                color={colors.text.inverse}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  postContent: {
    paddingBottom: spacing.md,
  },
  categoryBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryText: {
    ...typography.captionMedium,
    textTransform: 'capitalize',
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
    marginBottom: spacing.base,
  },
  metaRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  author: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  date: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  actionsRow: {
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  action: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  commentsTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  commentCard: {
    marginBottom: spacing.sm,
  },
  commentAuthor: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  commentBody: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  noComments: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  anonymousRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  anonymousLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  inputRow: {
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    maxHeight: 80,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.text.tertiary,
  },
});

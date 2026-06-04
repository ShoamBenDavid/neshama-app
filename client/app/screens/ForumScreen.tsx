import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,
  AppHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  FloatingButton,
} from '../components/ui';
import ForumPostCard from '../components/ForumPostCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchForumPosts, togglePostLike } from '../store/slices/forumSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ForumScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { posts, isLoading, error } = useAppSelector((state) => state.forum);
  const [activeCategory, setActiveCategory] = useState('all');
  const { t, isRTL } = useTranslation();
  const chipsScrollRef = useRef<ScrollView>(null);
  const rtlChipsScrolled = useRef(false);

  const categories = useMemo(
    () => [
      {
        id: 'all',
        label: t('forum.categoryAll'),
        icon: 'grid-outline' as const,
      },
      {
        id: 'anxiety',
        label: t('forum.categoryAnxiety'),
        icon: 'pulse-outline' as const,
      },
      {
        id: 'depression',
        label: t('forum.categoryDepression'),
        icon: 'rainy-outline' as const,
      },
      {
        id: 'relationships',
        label: t('forum.categoryRelationships'),
        icon: 'people-outline' as const,
      },
      {
        id: 'work-stress',
        label: t('forum.categoryWorkStress'),
        icon: 'briefcase-outline' as const,
      },
      {
        id: 'success',
        label: t('forum.categorySuccess'),
        icon: 'sparkles-outline' as const,
      },
      {
        id: 'general',
        label: t('forum.categoryGeneral'),
        icon: 'chatbox-ellipses-outline' as const,
      },
    ],
    [t],
  );

  const chipsData = useMemo(
    () => (isRTL ? [...categories].reverse() : categories),
    [categories, isRTL],
  );

  useEffect(() => {
    rtlChipsScrolled.current = false;
  }, [isRTL]);

  const scrollChipsToRtlStart = useCallback(() => {
    if (!isRTL || rtlChipsScrolled.current) return;
    chipsScrollRef.current?.scrollToEnd({ animated: false });
    rtlChipsScrolled.current = true;
  }, [isRTL]);

  const loadPosts = useCallback(() => {
    const params = activeCategory === 'all' ? {} : { category: activeCategory };
    dispatch(fetchForumPosts(params));
  }, [dispatch, activeCategory]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  if (isLoading && posts.length === 0) {
    return <LoadingState message={t('forum.loadingCommunity')} />;
  }

  if (error && posts.length === 0) {
    return <ErrorState message={error} onRetry={loadPosts} />;
  }

  return (
    <Screen
      scrollable={false}
      padded={false}
      header={
        <AppHeader
          title={t('forum.communityWarmTitle')}
          subtitle={t('forum.communityWarmSubtitle')}
          endIcons={[
            {
              icon: 'create-outline',
              onPress: () => navigation.navigate('CreateForumPost'),
              accessibilityLabel: t('forum.createPost'),
            },
          ]}
        />
      }
    >
      <ScrollView
        ref={chipsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={scrollChipsToRtlStart}
        contentContainerStyle={[
          styles.chipsList,
          isRTL ? styles.chipsListRTL : styles.chipsListLTR,
        ]}
        style={styles.chipsContainer}
      >
        {chipsData.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
              onPress={() => setActiveCategory(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              {item.id !== 'all' && (
                <View
                  style={[
                    styles.chipDot,
                    {
                      backgroundColor: isActive
                        ? 'rgba(255,255,255,0.25)'
                        : colors.brand.lavenderMist,
                    },
                  ]}
                />
              )}
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ForumPostCard
            post={item}
            onPress={() =>
              navigation.navigate('ForumPost', { postId: item.id })
            }
            onLike={() => dispatch(togglePostLike(item.id))}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={t('forum.noPosts')}
            message={t('forum.noPostsSubtitle')}
            actionLabel={t('forum.createPost')}
            onAction={() => navigation.navigate('CreateForumPost')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pulseRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  pulseChip: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
  },
  pulseText: {
    ...typography.captionMedium,
    color: colors.text.muted,
  },
  chipsContainer: {
    maxHeight: 48,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  chipsList: {
    minWidth: '100%',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chipsListLTR: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  chipsListRTL: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  chip: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['5xl'],
  },
  fabWrap: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing['4xl'], // or 80
  },
});

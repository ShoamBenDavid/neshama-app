import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { getWellnessArticleById } from '../content/localizedContent';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../i18n';

type RouteParams = RouteProp<RootStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen() {
  const { t, language, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteParams>();
  const article = getWellnessArticleById(route.params.articleId, language);
  const [readProgress, setReadProgress] = useState(0);

  if (!article) return null;

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const writingDirection = isRTL ? 'rtl' : 'ltr';

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollableHeight = contentSize.height - layoutMeasurement.height;
    if (scrollableHeight > 0) {
      setReadProgress(Math.min(contentOffset.y / scrollableHeight, 1));
    }
  };

  const paragraphs = article.content.split('\n\n').filter(Boolean);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${readProgress * 100}%`, alignSelf: isRTL ? 'flex-end' : 'flex-start' },
          ]}
        />
      </View>

      <Header title={t('articles.articleScreenTitle')} showBack />

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={article.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={[styles.heroCategory, { textAlign, writingDirection }]}>
            {article.category}
          </Text>
          <Text style={[styles.heroTitle, { textAlign, writingDirection }]}>
            {article.title}
          </Text>
          <View style={[styles.heroMeta, { flexDirection: rowDirection }]}>
            <Text style={[styles.heroMetaText, { textAlign }]}>
              {t('common.minRead', { time: article.readTime })}
            </Text>
            <View style={styles.dot} />
            <Text style={[styles.heroMetaText, { textAlign }]}>{article.author}</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {paragraphs.map((paragraph, index) => {
            if (paragraph.startsWith('## ')) {
              return (
                <Text
                  key={index}
                  style={[styles.heading, { textAlign, writingDirection }]}
                >
                  {paragraph.replace('## ', '')}
                </Text>
              );
            }
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <Text
                  key={index}
                  style={[styles.boldParagraph, { textAlign, writingDirection }]}
                >
                  {paragraph.replace(/\*\*/g, '')}
                </Text>
              );
            }
            if (paragraph.startsWith('- ')) {
              const items = paragraph.split('\n').filter(Boolean);
              return (
                <View key={index} style={styles.listContainer}>
                  {items.map((item, i) => (
                    <View key={i} style={[styles.listItem, { flexDirection: rowDirection }]}>
                      <View style={styles.bullet} />
                      <Text style={[styles.listText, { textAlign, writingDirection }]}>
                        {item.replace(/^- \*\*(.+?)\*\*:?\s*/, '').trim() || item.replace('- ', '')}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }
            if (paragraph.startsWith('*') && paragraph.endsWith('*')) {
              return (
                <Text
                  key={index}
                  style={[styles.italicText, { textAlign, writingDirection }]}
                >
                  {paragraph.replace(/\*/g, '')}
                </Text>
              );
            }
            return (
              <Text
                key={index}
                style={[styles.paragraph, { textAlign, writingDirection }]}
              >
                {paragraph.replace(/\*\*(.+?)\*\*/g, '$1')}
              </Text>
            );
          })}
        </View>

        <View style={[styles.tagsSection, { flexDirection: rowDirection }]}>
          {article.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={[styles.tagText, { textAlign }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: colors.borderLight,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
  heroGradient: {
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
  },
  heroCategory: {
    ...typography.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    ...typography.h2,
    color: '#fff',
    lineHeight: 34,
  },
  heroMeta: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroMetaText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
  heading: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  paragraph: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
    marginBottom: spacing.base,
  },
  boldParagraph: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    lineHeight: 26,
    marginBottom: spacing.base,
  },
  italicText: {
    ...typography.body,
    fontStyle: 'italic',
    color: colors.text.secondary,
    lineHeight: 26,
    marginBottom: spacing.base,
  },
  listContainer: {
    marginBottom: spacing.base,
  },
  listItem: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 8,
    marginEnd: spacing.md,
  },
  listText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
    flex: 1,
  },
  tagsSection: {
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  tag: {
    backgroundColor: colors.primaryLight + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.primary,
  },
});

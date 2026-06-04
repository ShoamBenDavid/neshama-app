import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper, Header, Card } from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { getYogaSessionById } from '../content/localizedContent';
import type { YogaPose } from '../content/types';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type RouteParams = RouteProp<RootStackParamList, 'YogaDetail'>;

function PoseCard({ pose, index }: { pose: YogaPose; index: number }) {
  const { t, isRTL } = useTranslation();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const writingDirection = isRTL ? 'rtl' : 'ltr';

  return (
    <Card style={styles.poseCard}>
      <View style={[styles.poseHeader, { flexDirection: rowDirection }]}>
        <View style={styles.poseNumber}>
          <Text style={styles.poseNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.poseInfo}>
          <Text style={[styles.poseName, { textAlign, writingDirection }]}>{pose.name}</Text>
          <Text style={[styles.poseDuration, { textAlign, writingDirection }]}>
            {t('yoga.holdDuration', { seconds: pose.duration })}
          </Text>
        </View>
      </View>
      <Text style={[styles.poseInstruction, { textAlign, writingDirection }]}>
        {pose.instruction}
      </Text>
      <View style={[styles.benefitRow, { flexDirection: rowDirection }]}>
        <Ionicons name="sparkles-outline" size={14} color={colors.secondary} />
        <Text style={[styles.benefitText, { textAlign, writingDirection }]}>{pose.benefits}</Text>
      </View>
    </Card>
  );
}

export default function YogaDetailScreen() {
  const { t, language, isRTL } = useTranslation();
  const route = useRoute<RouteParams>();
  const session = getYogaSessionById(route.params.sessionId, language);
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const writingDirection = isRTL ? 'rtl' : 'ltr';
  const getDifficultyLabel = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    if (difficulty === 'intermediate') return t('yoga.difficultyIntermediate');
    if (difficulty === 'advanced') return t('yoga.difficultyAdvanced');
    return t('yoga.difficultyBeginner');
  };

  if (!session) return null;

  const openYouTube = () => {
    if (session.youtubeId) {
      Linking.openURL(`https://www.youtube.com/watch?v=${session.youtubeId}`);
    }
  };

  return (
    <ScreenWrapper scrollable={false} padded={false}>
      <Header title={session.title} showBack />

      <FlatList
        data={session.poses}
        keyExtractor={(_, i) => `pose-${i}`}
        renderItem={({ item, index }) => <PoseCard pose={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <LinearGradient
              colors={session.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.headerContent}>
                <Ionicons name={session.icon as any} size={36} color="rgba(255,255,255,0.9)" />
                <Text style={[styles.headerTitle, { writingDirection }]}>{session.title}</Text>
                <Text style={[styles.headerDesc, { textAlign, writingDirection }]}>
                  {session.description}
                </Text>
                <View style={[styles.headerMeta, { flexDirection: rowDirection }]}>
                  <Text style={[styles.metaText, { textAlign }]}>
                    {session.duration} {t('common.min')}
                  </Text>
                  <View style={styles.dot} />
                  <Text style={[styles.metaText, { textAlign }]}>
                    {getDifficultyLabel(session.difficulty)}
                  </Text>
                  <View style={styles.dot} />
                  <Text style={[styles.metaText, { textAlign }]}>
                    {t('common.poses', { count: session.poses.length })}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {session.youtubeId && (
              <TouchableOpacity
                style={[styles.videoBtn, { flexDirection: rowDirection }]}
                onPress={openYouTube}
              >
                <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                <Text style={[styles.videoBtnText, { textAlign, writingDirection }]}>
                  {t('yoga.watchVideoGuide')}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}

            <Text style={[styles.posesTitle, { textAlign, writingDirection }]}>
              {t('yoga.poseSequence')}
            </Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  headerSection: {
    marginBottom: spacing.md,
  },
  headerGradient: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.base,
  },
  headerContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: '#fff',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  headerDesc: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  headerMeta: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaText: {
    ...typography.captionMedium,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'capitalize',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  videoBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    gap: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  videoBtnText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  posesTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  poseCard: {
    marginBottom: spacing.md,
  },
  poseHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  poseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  poseNumberText: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  poseInfo: {
    flex: 1,
  },
  poseName: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  poseDuration: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  poseInstruction: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  benefitRow: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  benefitText: {
    ...typography.caption,
    color: colors.secondary,
    flex: 1,
  },
});

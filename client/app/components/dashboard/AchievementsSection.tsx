import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import type { Achievement } from '../../types/progress';
import AchievementBadge from './AchievementBadge';

interface AchievementsSectionProps {
  achievements: Achievement[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Horizontal achievements row.
 * Locked achievements stay gray.
 * Unlocked achievements become white.
 */
export default function AchievementsSection({
  achievements,
  isLoading = false,
  error = null,
}: AchievementsSectionProps) {
  const { t, isRTL } = useTranslation();
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign }]}>
        {t('dashboard.myAchievements')}
      </Text>

      {isLoading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.stateText}>
            {t('dashboard.loadingAchievements')}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>
            {t('dashboard.achievementsError')}
          </Text>
        </View>
      ) : achievements.length === 0 ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>{t('dashboard.noAchievements')}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isRTL ? styles.scrollContentRTL : styles.scrollContentLTR,
          ]}
        >
          {achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.base,
  },

  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  scrollContent: {
    minWidth: '100%',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },

  scrollContentLTR: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  scrollContentRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },

  stateWrap: {
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  stateText: {
    ...typography.bodySm,
    color: colors.text.muted,
    textAlign: 'center',
  },
});

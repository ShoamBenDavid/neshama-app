import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import {
  Screen,
  AppHeader,
  LoadingState,
  ErrorState,
  SectionHeader,
} from '../components/ui';
import AnxietyChart from '../components/AnxietyChart';
import {
  ProgressBadge,
  StreakCalendar,
  AchievementsSection,
} from '../components/dashboard';
import { borderRadius, shadows, spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchJournalStats,
  fetchJournalEntries,
} from '../store/slices/journalSlice';
import { useTranslation } from '../i18n';
import { useAnxietyTrend } from '../hooks/useAnxietyTrend';
import { authAPI } from '../services/api';
import type { Achievement } from '../types/progress';
import {
  buildStreakDays,
  calculateCurrentStreak,
  parseEntryDate,
  toIsoDate,
} from '../utils/streakProgress';

import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DISPLAY_ACHIEVEMENT_TARGETS = [7, 14, 30] as const;

const ACHIEVEMENT_LABEL_KEYS = {
  7: 'dashboard.achievementStreak7',
  14: 'dashboard.achievementStreak14',
  30: 'dashboard.achievementStreak30',
} as const;

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const stats = useAppSelector((state) => state.journal.stats);
  const isStatsLoading = useAppSelector(
    (state) => state.journal.isStatsLoading,
  );
  const error = useAppSelector((state) => state.journal.error);
  const entries = useAppSelector((state) => state.journal.entries);
  const { t, isRTL } = useTranslation();
  const trend = useAnxietyTrend(30);
  const refreshTrendRef = useRef(trend.refresh);
  refreshTrendRef.current = trend.refresh;

  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(false);
  const [achievementsError, setAchievementsError] = useState<string | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchJournalStats());
      dispatch(fetchJournalEntries({ limit: 365 }));
      refreshTrendRef.current();

      let active = true;
      setIsAchievementsLoading(true);
      setAchievementsError(null);
      authAPI
        .getAchievements()
        .then((response) => {
          if (!active) return;
          setAchievements(response.data?.achievements ?? []);
        })
        .catch((err: Error) => {
          if (!active) return;
          setAchievements([]);
          setAchievementsError(err.message);
        })
        .finally(() => {
          if (active) setIsAchievementsLoading(false);
        });

      return () => {
        active = false;
      };
    }, [dispatch]),
  );

  const completedIsoDays = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((entry) => {
      const iso =
        parseEntryDate(entry.date as string) ?? parseEntryDate(entry.createdAt);
      if (iso) set.add(iso);
    });
    return Array.from(set).sort();
  }, [entries]);

  const achievementLabels = useMemo(
    (): Record<number, string> => ({
      7: t(ACHIEVEMENT_LABEL_KEYS[7]),
      14: t(ACHIEVEMENT_LABEL_KEYS[14]),
      30: t(ACHIEVEMENT_LABEL_KEYS[30]),
    }),
    [t],
  );

  const streakDays = useMemo(
    () => buildStreakDays(completedIsoDays, achievementLabels),
    [completedIsoDays, achievementLabels],
  );

  const currentStreak = useMemo(
    () => calculateCurrentStreak(completedIsoDays),
    [completedIsoDays],
  );

  const nextStreakTarget = useMemo(() => {
    if (currentStreak < 7) return 7;
    if (currentStreak < 14) return 14;
    return 30;
  }, [currentStreak]);

  useEffect(() => {
    const id = setTimeout(() => refreshTrendRef.current(), 1500);
    return () => clearTimeout(id);
  }, [entries.length]);

  const displayAchievements = useMemo<Achievement[]>(() => {
    const byTarget = new Map<number, Achievement>();
    achievements.forEach((a) => {
      if (typeof a.target === 'number') byTarget.set(a.target, a);
    });

    const base: Achievement[] = DISPLAY_ACHIEVEMENT_TARGETS.map((target) => {
      const server = byTarget.get(target);
      const computedUnlocked = currentStreak >= target;

      return {
        id: server?.id ?? `local-streak-${target}`,
        title: server?.title ?? achievementLabels[target] ?? `${target} day streak`,
        description:
          server?.description ??
          (target === 7
            ? t('dashboard.achievementStreak7Desc')
            : target === 14
              ? t('dashboard.achievementStreak14Desc')
              : t('dashboard.achievementStreak30Desc')),
        icon:
          server?.icon ??
          (target === 7
            ? 'calendar-outline'
            : target === 14
              ? 'sparkles-outline'
              : 'trophy-outline'),
        unlockedAt: server?.unlockedAt ?? (computedUnlocked ? new Date().toISOString() : null),
        progress: Math.min(target, Math.max(server?.progress ?? currentStreak, 0)),
        target,
        isUnlocked: server?.isUnlocked === true || computedUnlocked,
        color: server?.color,
      };
    });

    return base.sort((a, b) => (a.target ?? 0) - (b.target ?? 0));
  }, [achievements, achievementLabels, currentStreak, t]);

  if (isStatsLoading && !stats) {
    return <LoadingState message={t('dashboard.loadingDashboard')} />;
  }

  if (error && !stats) {
    return (
      <ErrorState
        message={error}
        onRetry={() => dispatch(fetchJournalStats())}
      />
    );
  }

 

  return (
    <Screen
      gradient="moodCalm"
      scrollable
      padded={false}
      header={
        <AppHeader
          title={t('dashboard.encouragingTitle')}
          subtitle={t('dashboard.encouragingSubtitle')}
        
        />
      }
    >
      <ProgressBadge
        streak={currentStreak}
        hasHistory={completedIsoDays.length > 0}
      />

      <View style={styles.profileActionWrap}>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={[
            styles.profileAction,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.profileActionTitle')}
        >
          <View style={styles.profileIcon}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.profileCopy}>
            <Text
              style={[
                styles.profileTitle,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('dashboard.profileActionTitle')}
            </Text>
            <Text
              style={[
                styles.profileSubtitle,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('dashboard.profileActionSubtitle')}
            </Text>
          </View>
          <Ionicons
            name={isRTL ? 'chevron-back' : 'chevron-forward'}
            size={20}
            color={colors.text.tertiary}
          />
        </Pressable>
      </View>

     

      <View style={styles.sectionHeaderWrap}>
        <SectionHeader title={t('dashboard.myPath')} />
      </View>

      <View style={styles.cardWrap}>
        <StreakCalendar
          completedDays={streakDays}
          selectedDate={selectedDate}
          onDatePress={setSelectedDate}
          weeklyCurrent={Math.min(currentStreak, nextStreakTarget)}
          weeklyTotal={nextStreakTarget}
          onAddReminder={() => navigation.navigate('NotificationOptions')}
        />
      </View>

      <AchievementsSection
        achievements={displayAchievements}
        isLoading={isAchievementsLoading}
        error={achievementsError}
      />

      <View style={styles.sectionHeaderWrap}>
        <SectionHeader
          title={t('dashboard.sensitivityShifts')}
          subtitle={t('dashboard.sensitivitySubtitle')}
        />
      </View>

      <View style={styles.chartWrap}>
        <AnxietyChart
          points={trend.points}
          summary={trend.summary}
          range={trend.range}
          onRangeChange={trend.setRange}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeaderWrap: {
    paddingHorizontal: spacing.lg,
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  chartWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileActionWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  profileAction: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.base,
    ...shadows.sm,
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.lavenderMist,
  },
  profileCopy: {
    flex: 1,
  },
  profileTitle: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  profileSubtitle: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
});

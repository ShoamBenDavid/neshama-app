import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import {
  useTranslation,
  getChevronBackName,
  getChevronForwardName,
} from '../../i18n';
import type { Achievement, StreakDay } from '../../types/progress';
import {
  completedDaySet,
  normalizeCompletedDays,
  streakDayMap,
  toIsoDate,
} from '../../utils/streakProgress';

interface StreakCalendarProps {
  completedDays: string[] | StreakDay[];
  selectedDate?: string;
  onDatePress?: (date: string) => void;
  weeklyCurrent?: number;
  weeklyTotal?: number;
  onAddReminder?: () => void;
  title?: string;
  subtitle?: string;
  achievementLabels?: Record<number, string>;
  achievements?: Achievement[];
}

const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_HE = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function buildMonthGrid(year: number, month: number): number[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay();
  const weeks: number[][] = [];
  let week: number[] = new Array(startDay).fill(0);

  for (let day = 1; day <= daysInMonth; day += 1) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }
  return weeks;
}

function isoForDay(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isFutureDate(iso: string): boolean {
  return iso > toIsoDate(new Date());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildAchievementPlan(
  achievements: Achievement[],
  normalizedDays: StreakDay[],
  today: Date,
  fallbackProgress: number,
  fallbackTarget: number,
): Map<string, 'needed' | 'reward'> {
  const lockedTargets = achievements
    .filter(
      (achievement) =>
        achievement.isUnlocked !== true && achievement.target != null,
    )
    .sort((a, b) => (a.target ?? 0) - (b.target ?? 0));
  const nextAchievement = lockedTargets[0];
  const target = nextAchievement?.target ?? fallbackTarget;

  if (target <= 0) {
    return new Map();
  }

  const todayIso = toIsoDate(today);
  const currentStreakCount = normalizedDays.filter(
    (day) => day.isCurrentStreak,
  ).length;
  const progress = Math.max(
    0,
    nextAchievement?.progress ?? fallbackProgress ?? currentStreakCount,
  );
  const remaining = Math.max(0, target - progress);

  if (remaining === 0) {
    return new Map();
  }

  const completed = completedDaySet(normalizedDays);
  const firstOffset = completed.has(todayIso) ? 1 : 0;
  const plan = new Map<string, 'needed' | 'reward'>();

  for (let offset = 0; offset < remaining; offset += 1) {
    const iso = toIsoDate(addDays(today, firstOffset + offset));
    plan.set(iso, offset === remaining - 1 ? 'reward' : 'needed');
  }

  return plan;
}

/**
 * Monthly streak calendar with achievement milestone highlighting, weekly-challenge
 * header, progress ring, and RTL-aware layout.
 */
export default function StreakCalendar({
  completedDays,
  selectedDate,
  onDatePress,
  weeklyCurrent = 0,
  weeklyTotal = 3,
  onAddReminder,
  title,
  subtitle,
  achievementLabels = {},
  achievements = [],
}: StreakCalendarProps) {
  const { t, language, isRTL } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const todayIso = toIsoDate(today);

  const normalized = useMemo(
    () => normalizeCompletedDays(completedDays, achievementLabels),
    [completedDays, achievementLabels],
  );
  const dayByDate = useMemo(() => streakDayMap(normalized), [normalized]);
  const completedSet = useMemo(() => completedDaySet(normalized), [normalized]);
  const achievementPlan = useMemo(
    () =>
      buildAchievementPlan(
        achievements,
        normalized,
        today,
        weeklyCurrent,
        weeklyTotal,
      ),
    [achievements, normalized, today, weeklyCurrent, weeklyTotal],
  );

  const initialCursor = useMemo(() => {
    const anchor = selectedDate ? new Date(`${selectedDate}T12:00:00`) : today;
    return { year: anchor.getFullYear(), month: anchor.getMonth() };
  }, [selectedDate, today]);

  const [cursor, setCursor] = useState(initialCursor);

  const months = language === 'he' ? MONTHS_HE : MONTHS_EN;
  const weekdays = language === 'he' ? WEEKDAYS_HE : WEEKDAYS_EN;
  const monthLabel = `${months[cursor.month]} ${cursor.year}`;
  const grid = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const ringSize = 52;
  const stroke = 5;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProgress = Math.min(
    1,
    Math.max(0, weeklyCurrent / Math.max(weeklyTotal, 1)),
  );
  const ringOffset = circumference * (1 - ringProgress);

  const goPrev = () => {
    setCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  };

  const goNext = () => {
    setCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  };

  return (
    <View style={styles.card}>
      <View style={[styles.topRow, { flexDirection: rowDirection }]}>
        <View
          style={[
            styles.headerCopy,
            { alignItems: isRTL ? 'flex-end' : 'flex-start' },
          ]}
        >
          <Text style={[styles.title, { textAlign }]}>
            {title ?? t('dashboard.weeklyChallenge')}
          </Text>
          <Text style={[styles.subtitle, { textAlign }]}>
            {subtitle ?? t('dashboard.weeklyChallengeSubtitle', { count: 10 })}
          </Text>
        </View>

        <View style={styles.ringWrap}>
          <Svg width={ringSize} height={ringSize}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={colors.brand.lavenderMist}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              stroke={colors.primary}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${circumference},${circumference}`}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </Svg>
          <View style={styles.ringLabel}>
            <Text style={styles.ringText}>
              {weeklyCurrent}/{weeklyTotal}
            </Text>
          </View>
        </View>
      </View>

      {onAddReminder && (
        <Pressable
          onPress={onAddReminder}
          style={[
            styles.reminderBtn,
            {
              flexDirection: rowDirection,
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.addReminder')}
        >
          <Ionicons
            name="notifications-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.reminderText}>{t('dashboard.addReminder')}</Text>
        </Pressable>
      )}

      <View style={[styles.monthNav, { flexDirection: rowDirection }]}>
        <Pressable
          onPress={goPrev}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons
            name={getChevronBackName(isRTL)}
            size={20}
            color={colors.primary}
          />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={goNext} hitSlop={12} accessibilityRole="button">
          <Ionicons
            name={getChevronForwardName(isRTL)}
            size={20}
            color={colors.primary}
          />
        </Pressable>
      </View>

      <View style={[styles.weekdayRow, { flexDirection: rowDirection }]}>
        {weekdays.map((label, index) => (
          <Text key={`wd-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {grid.map((week, weekIndex) => (
        <WeekRow
          key={`week-${weekIndex}`}
          week={week}
          year={cursor.year}
          month={cursor.month}
          completedSet={completedSet}
          dayByDate={dayByDate}
          achievementPlan={achievementPlan}
          selectedDate={selectedDate ?? todayIso}
          isRTL={isRTL}
          onDatePress={onDatePress}
        />
      ))}
    </View>
  );
}

function WeekRow({
  week,
  year,
  month,
  completedSet,
  dayByDate,
  achievementPlan,
  selectedDate,
  isRTL,
  onDatePress,
}: {
  week: number[];
  year: number;
  month: number;
  completedSet: Set<string>;
  dayByDate: Map<string, StreakDay>;
  achievementPlan: Map<string, 'needed' | 'reward'>;
  selectedDate: string;
  isRTL: boolean;
  onDatePress?: (date: string) => void;
}) {
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const planSegments = useMemo(() => {
    const segments: { startVisualIndex: number; endVisualIndex: number }[] = [];
    let runStart: number | null = null;

    const toVisualIndex = (index: number) => (isRTL ? 6 - index : index);
    const flushRun = (runEnd: number) => {
      if (runStart == null || runEnd < runStart) return;
      const start = runStart;
      const indexes = Array.from({ length: runEnd - start + 1 }, (_, offset) =>
        toVisualIndex(start + offset),
      );

      segments.push({
        startVisualIndex: Math.min(...indexes),
        endVisualIndex: Math.max(...indexes),
      });
    };

    for (let i = 0; i < week.length; i += 1) {
      const day = week[i];
      const iso = day === 0 ? null : isoForDay(year, month, day);
      const hasPlan = iso ? achievementPlan.has(iso) : false;

      if (hasPlan && runStart == null) {
        runStart = i;
      }

      if ((!hasPlan || i === week.length - 1) && runStart != null) {
        flushRun(hasPlan && i === week.length - 1 ? i : i - 1);
        runStart = null;
      }
    }

    return segments;
  }, [achievementPlan, isRTL, month, week, year]);

  return (
    <View style={styles.weekRow}>
      <View style={styles.planLayer} pointerEvents="none">
        {planSegments.map((segment) => (
          <View
            key={`${segment.startVisualIndex}-${segment.endVisualIndex}`}
            style={[
              styles.achievementPill,
              {
                left: `${(segment.startVisualIndex + 0.16) * (100 / 7)}%`,
                width: `${(segment.endVisualIndex - segment.startVisualIndex + 0.68) * (100 / 7)}%`,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.weekCells, { flexDirection: rowDirection }]}>
        {week.map((day, index) => {
          if (day === 0) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const iso = isoForDay(year, month, day);
          const streakDay = dayByDate.get(iso);
          const completed = completedSet.has(iso);
          const selected = iso === selectedDate;
          const future = isFutureDate(iso);
          const achievementPlanState = achievementPlan.get(iso);

          return (
            <CalendarDayCell
              key={iso}
              day={day}
              streakDay={streakDay}
              completed={completed}
              selected={selected}
              future={future}
              achievementPlanState={achievementPlanState}
              onPress={() => onDatePress?.(iso)}
            />
          );
        })}
      </View>
    </View>
  );
}

function CalendarDayCell({
  day,
  streakDay,
  completed,
  selected,
  future,
  achievementPlanState,
  onPress,
}: {
  day: number;
  streakDay?: StreakDay;
  completed: boolean;
  selected: boolean;
  future: boolean;
  achievementPlanState?: 'needed' | 'reward';
  onPress: () => void;
}) {
  const isMilestone = Boolean(streakDay?.achievementUnlocked);
  const isCurrentStreak = Boolean(streakDay?.isCurrentStreak);
  const isCurrentStreakEnd = Boolean(streakDay?.isCurrentStreakEnd);
  const isPlanned = achievementPlanState != null;
  const target = streakDay?.achievementTarget;

  const accessibilityLabel = isMilestone
    ? `${day}, ${streakDay?.achievementLabel ?? `${target}X`}`
    : achievementPlanState === 'reward'
      ? `${day}, achievement reward`
      : achievementPlanState === 'needed'
        ? `${day}, needed for achievement`
        : isCurrentStreakEnd
          ? `${day}, current streak`
          : `${day}`;

  return (
    <Pressable
      style={styles.dayCell}
      onPress={onPress}
      disabled={future}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.dayCircle,
          selected && !isCurrentStreak && styles.dayCircleSelected,
          completed &&
            !selected &&
            !isCurrentStreak &&
            styles.dayCircleCompleted,
          isCurrentStreak && !isCurrentStreakEnd && styles.dayCircleCurrent,
          isCurrentStreakEnd && styles.dayCircleCurrentEnd,
          achievementPlanState === 'needed' &&
            !selected &&
            styles.dayCircleAchievementNeeded,
          achievementPlanState === 'needed' &&
            selected &&
            styles.dayCircleAchievementSelected,
          achievementPlanState === 'reward' &&
            styles.dayCircleAchievementReward,
        ]}
      >
        {achievementPlanState === 'reward' ? (
          <Ionicons name="gift-outline" size={18} color={colors.primary} />
        ) : (
          <Text
            style={[
              styles.dayText,
              future && styles.dayTextFuture,
              selected && !isCurrentStreak && styles.dayTextSelected,
              completed &&
                !selected &&
                !isCurrentStreak &&
                styles.dayTextCompleted,
              isCurrentStreak && styles.dayTextCurrent,
              isCurrentStreakEnd && styles.dayTextCurrentEnd,
              isPlanned && styles.dayTextAchievementNeeded,
              achievementPlanState === 'needed' &&
                selected &&
                styles.dayTextAchievementSelected,
            ]}
          >
            {day}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaces.cardSoft,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  topRow: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.cardMeta,
    color: colors.text.muted,
    marginTop: 2,
  },
  ringWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  reminderBtn: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  reminderText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  monthNav: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthLabel: {
    ...typography.cardTitle,
    color: colors.text.muted,
    flex: 1,
    textAlign: 'center',
  },
  weekdayRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.cardMeta,
    color: colors.text.tertiary,
  },
  weekRow: {
    position: 'relative',
    minHeight: 56,
    marginBottom: spacing.xs,
  },
  planLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  achievementPill: {
    position: 'absolute',
    top: 8,
    height: 36,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surfaces.cardSoft,
  },
  weekCells: {
    justifyContent: 'space-between',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 2,
    minHeight: 52,
    position: 'relative',
  },
  dayCircle: {
    padding: 2,
    width: 34,
    height: 34,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dayCircleCompleted: {
    backgroundColor: 'rgba(91, 102, 229, 0.08)',
  },
  dayCircleCurrent: {
    backgroundColor: colors.surfaces.cardSoft,
    borderWidth: 0,
    borderColor: colors.primary,
  },
  dayCircleSelected: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.lavenderMist,
  },
  dayCircleCurrentEnd: {
    backgroundColor: colors.primary,
  },
  dayCircleAchievementNeeded: {
    backgroundColor: 'transparent',
  },
  dayCircleAchievementReward: {
    backgroundColor: 'transparent',
  },
  dayCircleAchievementSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.h4,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  dayTextFuture: {
    color: '#DDD9D1',
  },
  dayTextSelected: {
    color: colors.text.muted,
    fontWeight: '400',
  },
  dayTextCompleted: {
    color: colors.primary,
    fontWeight: '500',
  },
  dayTextCurrent: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayTextCurrentEnd: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  dayTextAchievementNeeded: {
    color: colors.primary,
    fontWeight: '600',
  },
  dayTextAchievementSelected: {
    color: colors.text.inverse,
  },
});

import type { StreakDay } from '../types/progress';
import { colors } from '../theme/colors';

/** Milestone targets that unlock achievements and calendar highlights. */
export const REWARD_MILESTONES = [7, 14, 30] as const;

/** Default weekly challenge target (days). Replace via API when available. */
export const WEEKLY_CHALLENGE_TARGET = 3;

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Coerce journal entry date strings into YYYY-MM-DD when possible. */
export function parseEntryDate(raw: string): string | null {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return toIsoDate(d);
}

function isConsecutiveDay(isoA: string, isoB: string): boolean {
  const next = new Date(`${isoA}T12:00:00`);
  next.setDate(next.getDate() + 1);
  return toIsoDate(next) === isoB;
}

function currentStreakDates(sortedIsoDays: string[]): Set<string> {
  const set = new Set(sortedIsoDays);
  if (set.size === 0) return new Set();

  const today = new Date();
  const todayIso = toIsoDate(today);
  let cursor = new Date(today);

  if (!set.has(todayIso)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = toIsoDate(yesterday);
    if (!set.has(yesterdayIso)) return new Set();
    cursor = yesterday;
  }

  const dates = new Set<string>();
  while (set.has(toIsoDate(cursor))) {
    dates.add(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
}

/**
 * Walk every consecutive run in the user's history. When the in-run day count
 * equals a milestone target, mark that calendar date as an achievement day.
 */
export function buildStreakDays(
  completedIsoDays: string[],
  achievementLabels: Record<number, string> = {},
): StreakDay[] {
  const sorted = [...new Set(completedIsoDays)].sort();
  const activeDates = currentStreakDates(sorted);
  const activeSorted = Array.from(activeDates).sort();
  const activeEnd = activeSorted[activeSorted.length - 1];
  const achievementByDate = new Map<
    string,
    { target: number; label: string }
  >();

  let runStart = 0;
  while (runStart < sorted.length) {
    let runEnd = runStart;
    while (
      runEnd + 1 < sorted.length &&
      isConsecutiveDay(sorted[runEnd], sorted[runEnd + 1])
    ) {
      runEnd += 1;
    }

    for (let i = runStart; i <= runEnd; i += 1) {
      const positionInRun = i - runStart + 1;
      if ((REWARD_MILESTONES as readonly number[]).includes(positionInRun)) {
        achievementByDate.set(sorted[i], {
          target: positionInRun,
          label:
            achievementLabels[positionInRun] ??
            `${positionInRun} day streak`,
        });
      }
    }

    runStart = runEnd + 1;
  }

  return sorted.map((date) => {
    const achievement = achievementByDate.get(date);
    const isMilestone = achievement != null;

    return {
      date,
      completed: true,
      reward: isMilestone,
      isCurrentStreak: activeDates.has(date),
      isCurrentStreakEnd: activeEnd === date,
      achievementUnlocked: isMilestone,
      achievementTarget: achievement?.target,
      achievementLabel: achievement?.label,
    };
  });
}

/**
 * Count consecutive completed days ending today (or yesterday if today is not done).
 * Wire `completedIsoDays` from journal entries or daily check-ins.
 */
export function calculateCurrentStreak(completedIsoDays: string[]): number {
  const set = new Set(completedIsoDays);
  if (set.size === 0) return 0;

  const today = new Date();
  const todayIso = toIsoDate(today);

  let cursor = new Date(today);
  if (!set.has(todayIso)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = toIsoDate(yesterday);
    if (!set.has(yesterdayIso)) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (set.has(toIsoDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Normalize calendar input: accept ISO strings or fully-built StreakDay objects. */
export function normalizeCompletedDays(
  input: string[] | StreakDay[],
  achievementLabels: Record<number, string> = {},
): StreakDay[] {
  if (input.length === 0) return [];
  if (typeof input[0] === 'string') {
    return buildStreakDays(input as string[], achievementLabels);
  }
  return input as StreakDay[];
}

export function streakDayMap(days: StreakDay[]): Map<string, StreakDay> {
  return new Map(days.map((day) => [day.date, day]));
}

export function completedDaySet(days: StreakDay[]): Set<string> {
  return new Set(days.filter((d) => d.completed).map((d) => d.date));
}

/** Calendar milestone colors by achievement target. */
export function getMilestoneTheme(target: number): {
  border: string;
  background: string;
  glow: string;
  icon: string;
} {
  if (target === 3) {
    return {
      border: colors.status.success,
      background: 'rgba(111, 207, 163, 0.22)',
      glow: 'rgba(111, 207, 163, 0.45)',
      icon: colors.status.successDark,
    };
  }
  if (target === 7) {
    return {
      border: colors.primary,
      background: 'rgba(91, 102, 229, 0.18)',
      glow: 'rgba(91, 102, 229, 0.35)',
      icon: colors.primary,
    };
  }
  if (target === 21) {
    return {
      border: colors.brand.lavender,
      background: 'rgba(181, 168, 232, 0.24)',
      glow: 'rgba(181, 168, 232, 0.4)',
      icon: '#8B7CC9',
    };
  }
  return {
    border: colors.status.warning,
    background: 'rgba(242, 185, 104, 0.24)',
    glow: 'rgba(242, 185, 104, 0.42)',
    icon: colors.status.warningDark,
  };
}

/** Count how many milestone dates exist in built streak days (for debugging / analytics). */
export function countMilestoneDays(days: StreakDay[]): number {
  return days.filter((d) => d.achievementUnlocked).length;
}

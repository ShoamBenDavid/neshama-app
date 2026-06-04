/** A single day in the streak calendar. Connect to journal/check-in API later. */
export type StreakDay = {
  date: string; // YYYY-MM-DD
  completed: boolean;
  reward?: boolean;
  isCurrentStreak?: boolean;
  isCurrentStreakEnd?: boolean;
  achievementUnlocked?: boolean;
  achievementTarget?: number; // 3, 7, 21, 60, 90, 180
  achievementLabel?: string;
};

/** Achievement badge definition synced from the backend user profile. */
export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt?: string | null;
  progress?: number;
  target?: number;
  isUnlocked: boolean;
  color?: string;
};

export type AchievementTarget = 7 | 14 | 30;

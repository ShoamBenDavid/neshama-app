import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import type { Achievement } from '../../types/progress';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
}

export default function AchievementBadge({
  achievement,
  onPress,
}: AchievementBadgeProps) {
  const unlocked = achievement.isUnlocked === true;

  const accent = achievement.color ?? colors.primary;
  const target = Math.max(achievement.target ?? 1, 1);

  const iconName = achievement.icon as
    | React.ComponentProps<typeof Ionicons>['name']
    | undefined;
  const badgeText = achievement.target != null ? `${target}X` : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityState={{ disabled: !unlocked }}
      accessibilityLabel={achievement.title}
    >
      <View
        style={[
          styles.medal,
          unlocked
            ? [styles.medalUnlocked, { borderColor: accent }]
            : styles.medalLocked,
        ]}
      >
        <View
          style={[
            styles.medalNotch,
            styles.notchTop,
            { backgroundColor: unlocked ? colors.surface : '#D7D8DA' },
          ]}
        />
        <View
          style={[
            styles.medalNotch,
            styles.notchRight,
            { backgroundColor: unlocked ? colors.surface : '#D7D8DA' },
          ]}
        />
        <View
          style={[
            styles.medalNotch,
            styles.notchBottom,
            { backgroundColor: unlocked ? colors.surface : '#D7D8DA' },
          ]}
        />
        <View
          style={[
            styles.medalNotch,
            styles.notchLeft,
            { backgroundColor: unlocked ? colors.surface : '#D7D8DA' },
          ]}
        />

        <View
          style={[
            styles.innerRing,
            unlocked ? styles.innerRingUnlocked : styles.innerRingLocked,
          ]}
        >
          {badgeText ? (
            <Text
              style={[
                styles.multiplier,
                { color: unlocked ? accent : colors.text.tertiary },
              ]}
            >
              {badgeText}
            </Text>
          ) : iconName ? (
            <Ionicons
              name={iconName}
              size={34}
              color={unlocked ? accent : colors.text.tertiary}
            />
          ) : (
            <Text
              style={[
                styles.multiplier,
                { color: unlocked ? accent : colors.text.tertiary },
              ]}
            >
              X
            </Text>
          )}
        </View>
      </View>

      <Text
        style={[styles.label, !unlocked && styles.labelLocked]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
    </Pressable>
  );
}

const BADGE_WIDTH = 124;

const styles = StyleSheet.create({
  wrap: {
    width: BADGE_WIDTH,
    alignItems: 'center',
  },

  medal: {
    width: 112,
    height: 112,
    borderRadius: borderRadius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  medalUnlocked: {
    backgroundColor: colors.surface, // white
    ...shadows.md,
  },

  medalLocked: {
    backgroundColor: '#D7D8DA', // light gray
    borderColor: '#D7D8DA',
  },

  medalNotch: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  notchTop: {
    top: -6,
  },

  notchRight: {
    right: -6,
  },

  notchBottom: {
    bottom: -6,
  },

  notchLeft: {
    left: -6,
  },

  innerRing: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  innerRingUnlocked: {
    backgroundColor: '#FFFDF8',
    borderWidth: 2,
    borderColor: colors.brand.creamWarm,
  },

  innerRingLocked: {
    backgroundColor: '#ECEDEE',
  },

  multiplier: {
    ...typography.h1,
    fontWeight: '700',
  },

  label: {
    ...typography.captionMedium,
    color: colors.text.primary,
    marginTop: spacing.sm,
    minHeight: 34,
    textAlign: 'center',
  },

  labelLocked: {
    color: colors.text.tertiary,
  },
});

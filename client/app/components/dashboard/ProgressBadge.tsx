import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface ProgressBadgeProps {
  streak: number;
  label?: string;
  hasHistory?: boolean;
}

/**
 * Illustrated streak badge: a trophy/medal on a cloudy sky background.
 * Built from SVG primitives so it scales crisply and stays bundle-light.
 */
export default function ProgressBadge({
  streak,
  label,
  hasHistory = false,
}: ProgressBadgeProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t('dashboard.streakDays');
  const showResetHint = hasHistory && streak === 0;

  return (
    <View style={styles.container}>
      {/* Soft cloud illustration in the background */}
      <View style={styles.cloudsLayer} pointerEvents="none">
        <Svg width={260} height={120} viewBox="0 0 260 120">
          <Path
            d="M30 80 Q50 50 90 70 Q120 40 160 70 Q200 50 230 80 Q230 110 200 105 Q160 115 120 105 Q80 115 30 105 Z"
            fill={colors.brand.lavenderMist}
            opacity={0.85}
          />
          <Path
            d="M50 90 Q80 65 120 85 Q150 60 190 85 Q220 70 240 95 Q220 110 190 105 Q150 110 120 105 Q80 115 50 105 Z"
            fill="#FFFFFF"
            opacity={0.7}
          />
        </Svg>
      </View>

      {/* The trophy / medal */}
      <View style={styles.badge}>
        <Svg width={92} height={92} viewBox="0 0 92 92">
          <Circle cx={46} cy={42} r={32} fill="#F2C566" />
          <Circle cx={46} cy={42} r={28} fill="#F5D793" />
          <Path
            d="M30 76 L46 70 L62 76 L58 90 L34 90 Z"
            fill={colors.primary}
          />
        </Svg>
        <View style={styles.streakLabelWrap}>
          <Text style={styles.streakNumber}>{streak}</Text>
        </View>
      </View>

      <View style={styles.ribbon}>
        <Text style={styles.ribbonText}>{displayLabel}</Text>
      </View>

      {showResetHint && (
        <Text style={styles.resetHint}>{t('dashboard.startNewStreak')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  cloudsLayer: {
    position: 'absolute',
    top: 30,
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakLabelWrap: {
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  streakNumber: {
    ...typography.h1,
    color: colors.text.primary,
    fontSize: 34,
  },
  ribbon: {
    marginTop: -spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  ribbonText: {
    ...typography.eyebrow,
    color: colors.text.inverse,
    fontSize: 13,
  },
  resetHint: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

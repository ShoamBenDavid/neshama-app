import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import type { DashboardSummary, TrendDirection } from '../../services/api';

interface WellnessHeroCardProps {
  summary: DashboardSummary | null;
}

const GAUGE_SIZE = 132;
const STROKE = 12;
const RADIUS = (GAUGE_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number): string {
  if (score >= 70) return colors.status.success;
  if (score >= 40) return colors.status.warning;
  return colors.brand.lavender;
}

function scoreToGaugePercent(score: number): number {
  return Math.max(0, Math.min(100, score));
}

const TREND_META: Record<
  TrendDirection,
  { icon: keyof typeof Ionicons.glyphMap; color: string; labelKey: string }
> = {
  improving: { icon: 'trending-up', color: colors.status.success, labelKey: 'dashboard.wellness.trendImproving' },
  stable: { icon: 'remove', color: colors.text.tertiary, labelKey: 'dashboard.wellness.trendStable' },
  worsening: { icon: 'heart-circle-outline', color: colors.brand.lavender, labelKey: 'dashboard.wellness.trendWorsening' },
};

const MESSAGE_KEYS: Record<string, string> = {
  improving: 'dashboard.wellness.msgImproving',
  worsening: 'dashboard.wellness.msgWorsening',
  slightlyBetter: 'dashboard.wellness.msgSlightlyBetter',
  steady: 'dashboard.wellness.msgSteady',
  keepJournaling: 'dashboard.wellness.msgKeepJournaling',
};

export default function WellnessHeroCard({ summary }: WellnessHeroCardProps) {
  const { t, isRTL } = useTranslation();

  const score = summary?.wellnessScore ?? 0;
  const direction: TrendDirection = summary?.trend.direction ?? 'stable';
  const trend = TREND_META[direction];
  const color = scoreColor(score);

  const dashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - scoreToGaugePercent(score) / 100),
    [score],
  );

  const messageKey =
    MESSAGE_KEYS[summary?.summaryMessageKey ?? 'keepJournaling'] ??
    'dashboard.wellness.msgKeepJournaling';

  const wow = summary?.trend.weekOverWeek ?? null;

  return (
    <View style={styles.card}>
      <Text style={[styles.eyebrow, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('dashboard.wellness.sectionTitle')}
      </Text>

      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.gaugeWrap}>
          <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
            <Defs>
              <SvgLinearGradient id="wellnessArc" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={color} stopOpacity={1} />
                <Stop offset="100%" stopColor={color} stopOpacity={0.65} />
              </SvgLinearGradient>
            </Defs>
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke={colors.borderLight}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={GAUGE_SIZE / 2}
              cy={GAUGE_SIZE / 2}
              r={RADIUS}
              stroke="url(#wellnessArc)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
              transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.gaugeCenter}>
            <Text style={[styles.scoreValue, { color }]}>{score}</Text>
            <Text style={styles.scoreLabel}>{t('dashboard.wellness.scoreLabel')}</Text>
          </View>
        </View>

        <View style={styles.sideCol}>
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trend.color + '1A', flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Ionicons name={trend.icon} size={15} color={trend.color} />
            <Text style={[styles.trendText, { color: trend.color }]}>{t(trend.labelKey)}</Text>
          </View>

          {wow != null && wow !== 0 && (
            <Text style={[styles.wow, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('dashboard.wellness.weekOverWeek', {
                value: `${wow > 0 ? '+' : ''}${wow}`,
              })}
            </Text>
          )}

          <View style={[styles.streakRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="flame" size={16} color={colors.status.warning} />
            <Text style={styles.streakText}>
              {t('dashboard.wellness.streakLabel', { count: summary?.positiveStreak ?? 0 })}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.message, { textAlign: isRTL ? 'right' : 'left' }]}>{t(messageKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.hero,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.md,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  row: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  gaugeWrap: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    ...typography.display,
    fontSize: 40,
  },
  scoreLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  sideCol: {
    flex: 1,
    gap: spacing.sm,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trendText: {
    ...typography.captionMedium,
  },
  wow: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  streakRow: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  message: {
    ...typography.microCopy,
    color: colors.text.secondary,
    marginTop: spacing.base,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import type { WellnessDistribution, WellnessCategory } from '../../services/api';

interface EmotionalDistributionCardProps {
  distribution: WellnessDistribution | null;
}

const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CATEGORY_COLORS: Record<WellnessCategory, string> = {
  normal: colors.status.success,
  anxiety: colors.category.anxiety,
  depression: colors.category.depression,
};

const CATEGORY_LABEL_KEYS: Record<WellnessCategory, string> = {
  normal: 'dashboard.wellness.categoryNormal',
  anxiety: 'dashboard.wellness.categoryAnxiety',
  depression: 'dashboard.wellness.categoryDepression',
};

const ORDER: WellnessCategory[] = ['normal', 'anxiety', 'depression'];

export default function EmotionalDistributionCard({
  distribution,
}: EmotionalDistributionCardProps) {
  const { t, isRTL } = useTranslation();

  const hasData = !!distribution && distribution.classifiedEntries > 0;

  // Build cumulative arc segments for the donut.
  let offsetAcc = 0;
  const segments = ORDER.map((cat) => {
    const fraction = distribution ? distribution[cat] : 0;
    const seg = {
      cat,
      fraction,
      dasharray: `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`,
      dashoffset: -offsetAcc * CIRCUMFERENCE,
    };
    offsetAcc += fraction;
    return seg;
  });

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('dashboard.wellness.distributionTitle')}
      </Text>
      <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('dashboard.wellness.distributionSubtitle')}
      </Text>

      {!hasData ? (
        <Text style={styles.empty}>{t('dashboard.wellness.noData')}</Text>
      ) : (
        <View style={[styles.body, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.donutWrap}>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={colors.borderLight}
                strokeWidth={STROKE}
                fill="none"
              />
              {segments.map((seg) =>
                seg.fraction > 0 ? (
                  <Circle
                    key={seg.cat}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    stroke={CATEGORY_COLORS[seg.cat]}
                    strokeWidth={STROKE}
                    fill="none"
                    strokeDasharray={seg.dasharray}
                    strokeDashoffset={seg.dashoffset}
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  />
                ) : null,
              )}
            </Svg>
            <View style={styles.donutCenter}>
              <Text style={styles.donutValue}>
                {Math.round((distribution?.normal ?? 0) * 100)}%
              </Text>
              <Text style={styles.donutHint}>{t('dashboard.wellness.categoryNormal')}</Text>
            </View>
          </View>

          <View style={styles.legend}>
            {ORDER.map((cat) => (
              <View
                key={cat}
                style={[styles.legendRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
                <Text style={styles.legendLabel}>{t(CATEGORY_LABEL_KEYS[cat])}</Text>
                <Text style={styles.legendValue}>
                  {Math.round((distribution ? distribution[cat] : 0) * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  title: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    marginBottom: spacing.base,
  },
  empty: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  body: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  donutWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    ...typography.h3,
    color: colors.text.primary,
  },
  donutHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  legend: {
    flex: 1,
    gap: spacing.md,
  },
  legendRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  legendValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});

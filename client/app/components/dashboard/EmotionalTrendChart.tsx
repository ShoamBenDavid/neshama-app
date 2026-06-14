import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, {
  Circle,
  Path,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import type {
  DashboardTrends,
  DashboardTrendPoint,
  DashboardRange,
} from '../../services/api';

interface EmotionalTrendChartProps {
  series: DashboardTrendPoint[];
  trends?: DashboardTrends | null;
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 16;
const CHART_HEIGHT = 210;
const TOP_PAD = 16;
const BOT_PAD = 34;
const USABLE = CHART_HEIGHT - TOP_PAD - BOT_PAD;

const RANGES: DashboardRange[] = [1, 7, 30, 90];

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) return d;
  return new Date(`${dateStr}T12:00:00`);
}

function formatLabel(dateStr: string, range: DashboardRange): string {
  const d = parseDate(dateStr);
  if (range <= 1) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function yForScore(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  const ratio = clamped / 100;
  return CHART_HEIGHT - BOT_PAD - ratio * USABLE;
}

function getWellnessScore(point: DashboardTrendPoint): number {
  if (typeof point.wellnessScore === 'number' && !Number.isNaN(point.wellnessScore)) {
    return point.wellnessScore;
  }

  // Backward-compatible fallback for API responses generated before the server
  // was restarted with the normalized wellnessScore field.
  const rawScore = (point.normal - point.anxiety - point.depression) * 100;
  return Math.round((rawScore + 100) / 2);
}

function buildLinePath(points: DashboardTrendPoint[], xFor: (i: number) => number): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const y = yForScore(getWellnessScore(points[0]));
    return `M${PADDING_LEFT},${y} L${PADDING_LEFT + 1},${y}`;
  }
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${xFor(index)},${yForScore(getWellnessScore(point))}`;
    })
    .join(' ');
}

export default function EmotionalTrendChart({
  series,
  trends,
  range,
  onRangeChange,
}: EmotionalTrendChartProps) {
  const { t, isRTL } = useTranslation();
  const textAlign = isRTL ? 'right' : 'left';
  const containerWidth = SCREEN_WIDTH - spacing.lg * 2 - spacing.lg * 2;
  const chartWidth = containerWidth - PADDING_LEFT - PADDING_RIGHT;

  const rangeLabels: Partial<Record<DashboardRange, string>> = {
    1: t('dashboard.wellness.range1'),
    7: t('dashboard.wellness.range7'),
    30: t('dashboard.wellness.range30'),
    90: t('dashboard.wellness.range90'),
  };

  const xFor = useMemo(() => {
    const n = series.length;
    return (i: number) => {
      if (n <= 1) return PADDING_LEFT + chartWidth / 2;
      return PADDING_LEFT + (i / (n - 1)) * chartWidth;
    };
  }, [series.length, chartWidth]);

  const linePath = useMemo(() => buildLinePath(series, xFor), [series, xFor]);

  const xLabels = useMemo(() => {
    if (series.length === 0) return [];
    if (series.length === 1) return [{ label: formatLabel(series[0].date, range), x: xFor(0) }];
    const step = Math.max(1, Math.floor(series.length / 4));
    const labels: { label: string; x: number }[] = [];
    for (let i = 0; i < series.length; i += step) {
      labels.push({ label: formatLabel(series[i].date, range), x: xFor(i) });
    }
    return labels;
  }, [series, xFor, range]);

  return (
    <View style={styles.card}>
      <Text style={[styles.title, { textAlign }]}>
        {t('dashboard.wellness.trendChartTitle')}
      </Text>
      <Text style={[styles.subtitle, { textAlign }]}>
        {t('dashboard.wellness.trendChartSubtitle')}
      </Text>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <Pressable
            key={r}
            onPress={() => onRangeChange(r)}
            style={[styles.rangeChip, range === r && styles.rangeChipActive]}
          >
            <Text style={[styles.rangeChipText, range === r && styles.rangeChipTextActive]}>
              {rangeLabels[r]}
            </Text>
          </Pressable>
        ))}
      </View>

      {series.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('dashboard.wellness.noData')}</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.axisTitle, { textAlign }]}>
            {t('dashboard.wellness.yAxisLabel')}
          </Text>
          <Svg
            width={containerWidth}
            height={CHART_HEIGHT}
            style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          >
            {[0, 25, 50, 75, 100].map((score) => (
              <React.Fragment key={score}>
                <Line
                  x1={PADDING_LEFT}
                  y1={yForScore(score)}
                  x2={PADDING_LEFT + chartWidth}
                  y2={yForScore(score)}
                  stroke={score === 50 ? colors.border : colors.borderLight}
                  strokeWidth={score === 50 ? 1.5 : 1}
                  strokeDasharray={score === 50 ? undefined : '4 4'}
                />
                <SvgText
                  x={isRTL ? containerWidth - 4 : 4}
                  y={yForScore(score) + 4}
                  fontSize={10}
                  fill={colors.text.tertiary}
                  textAnchor={isRTL ? 'end' : 'start'}
                  transform={isRTL ? `scale(-1,1) translate(${-containerWidth}, 0)` : undefined}
                >
                  {score}
                </SvgText>
              </React.Fragment>
            ))}

            <Line
              x1={PADDING_LEFT}
              y1={TOP_PAD}
              x2={PADDING_LEFT}
              y2={CHART_HEIGHT - BOT_PAD}
              stroke={colors.border}
              strokeWidth={1}
            />
            <Line
              x1={PADDING_LEFT}
              y1={CHART_HEIGHT - BOT_PAD}
              x2={PADDING_LEFT + chartWidth}
              y2={CHART_HEIGHT - BOT_PAD}
              stroke={colors.border}
              strokeWidth={1}
            />

            {linePath ? (
              <Path
                d={
                  series.length === 1
                    ? `M${PADDING_LEFT},${yForScore(getWellnessScore(series[0]))} L${PADDING_LEFT + chartWidth},${yForScore(getWellnessScore(series[0]))}`
                    : linePath
                }
                fill="none"
                stroke={colors.primary}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {series.map((point, pointIndex) => (
              <Circle
                key={point.date}
                cx={xFor(pointIndex)}
                cy={yForScore(getWellnessScore(point))}
                r={4.5}
                fill={colors.primary}
                stroke={colors.surface}
                strokeWidth={1.5}
              />
            ))}

            {xLabels.map((xl, i) => (
              <SvgText
                key={`x-${i}`}
                x={xl.x}
                y={CHART_HEIGHT - 6}
                fontSize={10}
                fill={colors.text.tertiary}
                textAnchor="middle"
                transform={isRTL ? `scale(-1,1) translate(${-xl.x * 2}, 0)` : undefined}
              >
                {xl.label}
              </SvgText>
            ))}
          </Svg>

          <Text style={[styles.xAxisTitle, { textAlign: 'center' }]}>
            {t('dashboard.wellness.xAxisLabel')}
          </Text>

          <View style={[styles.legend, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>{t('dashboard.wellness.wellnessScore')}</Text>
            </View>
          </View>
        </>
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
    marginBottom: spacing.md,
  },
  rangeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  rangeChip: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.borderLight,
  },
  rangeChipActive: {
    backgroundColor: colors.primary,
  },
  rangeChipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rangeChipTextActive: {
    color: colors.text.inverse,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  axisTitle: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  xAxisTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
  },
  legend: {
    justifyContent: 'center',
    gap: spacing.base,
    marginTop: spacing.md,
  },
  legendItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

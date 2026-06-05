import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useTranslation } from '../i18n';
import type { AnxietyTrendPoint, AnxietyTrendSummary } from '../services/api';
import type { TimeRange } from '../hooks/useAnxietyTrend';
 const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING_LEFT = 36;
const CHART_PADDING_RIGHT = 16;
const CHART_HEIGHT = 200;
const DOT_RADIUS = 5;
const HIT_SLOP = 18;

const Y_MIN = 1;
const Y_MAX = 10;
const Y_RANGE = Y_MAX - Y_MIN;
const CHART_TOP_PAD = 16;
const CHART_BOT_PAD = 12;
const CHART_USABLE = CHART_HEIGHT - CHART_TOP_PAD - CHART_BOT_PAD;

const Y_LABELS = [1, 3, 5, 7, 10];

export interface AnxietyChartProps {
  points: AnxietyTrendPoint[];
  summary: AnxietyTrendSummary | null;
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

/** Map server 0-1 anxiety to a 1-10 display value. */
function toDisplayScale(raw: number): number {
  const clamped = Math.max(0, Math.min(1, raw));
  return Y_MIN + clamped * Y_RANGE;
}

/** Map a 1-10 display value to a Y pixel coordinate. */
function valueToY(v: number): number {
  const ratio = (v - Y_MIN) / Y_RANGE;
  return CHART_HEIGHT - CHART_BOT_PAD - ratio * CHART_USABLE;
}

function parseDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return new Date(`${dateStr}T12:00:00`);
}

function formatDateLabel(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Daily chart points have no time — show date only. */
function formatTooltipDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function buildLinearPath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return '';
  let d = `M${coords[0].x},${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    d += ` L${coords[i].x},${coords[i].y}`;
  }
  return d;
}

export default function AnxietyChart({
  points,
  summary,
  range,
  onRangeChange,
}: AnxietyChartProps) {
  const { t, isRTL } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const textAlign = isRTL ? 'right' : 'left';
  const containerWidth = SCREEN_WIDTH - spacing.lg * 2;
  const chartWidth = containerWidth - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;

  const displayPoints = useMemo(
    () =>
      points
        .filter((p) => p.anxiety != null && !isNaN(p.anxiety))
        .map((p) => ({ ...p, display: toDisplayScale(p.anxiety) })),
    [points],
  );

  const coords = useMemo(() => {
    if (displayPoints.length === 0) return [];
    if (displayPoints.length === 1) {
      return [{ x: CHART_PADDING_LEFT + chartWidth / 2, y: valueToY(displayPoints[0].display) }];
    }
    return displayPoints.map((p, i) => ({
      x: CHART_PADDING_LEFT + (i / (displayPoints.length - 1)) * chartWidth,
      y: valueToY(p.display),
    }));
  }, [displayPoints, chartWidth]);

  const linePath = useMemo(() => buildLinearPath(coords), [coords]);

  const areaPath = useMemo(() => {
    if (coords.length === 0) return '';
    const bottomY = valueToY(Y_MIN);
    return `${linePath} L${coords[coords.length - 1].x},${bottomY} L${coords[0].x},${bottomY} Z`;
  }, [linePath, coords]);

  const yAxisLabels = useMemo(
    () =>
      Y_LABELS.map((v) => ({
        value: v,
        y: valueToY(v),
        label: String(v),
      })),
    [],
  );

  const xLabels = useMemo(() => {
    if (displayPoints.length <= 1) {
      return displayPoints.map((p, i) => ({
        label: formatDateLabel(p.date),
        x: coords[i]?.x ?? CHART_PADDING_LEFT,
      }));
    }
    const step = Math.max(1, Math.floor(displayPoints.length / 5));
    const labels: { label: string; x: number }[] = [];
    for (let i = 0; i < displayPoints.length; i += step) {
      labels.push({ label: formatDateLabel(displayPoints[i].date), x: coords[i].x });
    }
    const lastIdx = displayPoints.length - 1;
    if (labels.length > 0 && Math.abs(coords[lastIdx].x - labels[labels.length - 1].x) > 30) {
      labels.push({ label: formatDateLabel(displayPoints[lastIdx].date), x: coords[lastIdx].x });
    }
    return labels;
  }, [displayPoints, coords]);

  const trendIcon =
    summary?.trendDirection === 'improving'
      ? '↓'
      : summary?.trendDirection === 'increasing'
        ? '↑'
        : '→';
  const trendColor =
    summary?.trendDirection === 'improving'
      ? '#43E97B'
      : summary?.trendDirection === 'increasing'
        ? '#FD746C'
        : colors.text.tertiary;

  const RANGES: TimeRange[] = [7, 14, 30];
  const rangeLabels: Record<TimeRange, string> = {
    7: t('dashboard.chart.week'),
    14: t('dashboard.chart.twoWeeks'),
    30: t('dashboard.chart.month'),
  };

  const avgDisplay = summary
    ? toDisplayScale(summary.averageAnxiety).toFixed(1)
    : null;

  const selected = selectedIndex != null ? displayPoints[selectedIndex] : null;

  return (
    <View style={styles.container}>
     <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
  <View style={styles.headerTextBlock}>
    <Text style={[styles.title, { textAlign }]}>
      {t('dashboard.chart.title')}
    </Text>

    <Text style={[styles.subtitle, { textAlign }]}>
      {t('dashboard.chart.subtitle')}
    </Text>
  </View>

  {summary && (
    <View style={[styles.trendBadge, { backgroundColor: trendColor + '18' }]}>
      <Text style={[styles.trendText, { color: trendColor }]}>
        {trendIcon} {summary.trendPercent}%
      </Text>
    </View>
  )}
</View>

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

      {displayPoints.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('dashboard.chart.noData')}</Text>
        </View>
      ) : (
        <View>
          <Svg
            width={containerWidth}
            height={CHART_HEIGHT + 28}
            style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          >
            <Defs>
              <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#667EEA" stopOpacity={0.3} />
                <Stop offset="100%" stopColor="#667EEA" stopOpacity={0.02} />
              </SvgLinearGradient>
            </Defs>

            {/* Horizontal grid lines + Y labels */}
            {yAxisLabels.map((yl) => (
              <React.Fragment key={yl.value}>
                <Line
                  x1={CHART_PADDING_LEFT}
                  y1={yl.y}
                  x2={CHART_PADDING_LEFT + chartWidth}
                  y2={yl.y}
                  stroke={colors.borderLight}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={isRTL ? containerWidth - 4 : 4}
                  y={yl.y + 4}
                  fontSize={10}
                  fill={colors.text.tertiary}
                  textAnchor={isRTL ? 'end' : 'start'}
                  transform={isRTL ? `scale(-1,1) translate(${-containerWidth}, 0)` : undefined}
                >
                  {yl.label}
                </SvgText>
              </React.Fragment>
            ))}

            {/* Filled area under the line */}
            {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}

            {/* Trend line */}
            {linePath ? (
              <Path
                d={linePath}
                fill="none"
                stroke="#667EEA"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Data point dots */}
            {coords.map((c, i) => (
              <Circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={selectedIndex === i ? DOT_RADIUS + 2 : DOT_RADIUS}
                fill={selectedIndex === i ? '#667EEA' : '#fff'}
                stroke="#667EEA"
                strokeWidth={2}
              />
            ))}

            {/* X-axis date labels */}
            {xLabels.map((xl, i) => (
              <SvgText
                key={`x-${i}`}
                x={xl.x}
                y={CHART_HEIGHT + 18}
                fontSize={10}
                fill={colors.text.tertiary}
                textAnchor="middle"
                transform={isRTL ? `scale(-1,1) translate(${-xl.x * 2}, 0)` : undefined}
              >
                {xl.label}
              </SvgText>
            ))}
          </Svg>

          {/* Tap targets for data points */}
          <View style={[StyleSheet.absoluteFill, styles.hitLayer]} pointerEvents="box-none">
            {coords.map((c, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedIndex(selectedIndex === i ? null : i)}
                style={[
                  styles.hitArea,
                  {
                    left: (isRTL ? containerWidth - c.x : c.x) - HIT_SLOP,
                    top: c.y - HIT_SLOP,
                    width: HIT_SLOP * 2,
                    height: HIT_SLOP * 2,
                  },
                ]}
              />
            ))}
          </View>

          {/* Tooltip for selected point */}
          {selected && selectedIndex != null && coords[selectedIndex] && (
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.min(
                    Math.max(8, (isRTL ? containerWidth - coords[selectedIndex].x : coords[selectedIndex].x) - 55),
                    containerWidth - 120,
                  ),
                  top: coords[selectedIndex].y - 58,
                },
              ]}
            >
              <Text style={styles.tooltipDate}>{formatTooltipDate(selected.date)}</Text>
              <Text style={styles.tooltipValue}>
                {t('dashboard.chart.anxiety')}: {selected.display.toFixed(1)}/10
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Summary insight row */}
      {summary && displayPoints.length > 0 ? (
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>{t('dashboard.chart.avg')}</Text>
          <Text style={styles.insightValue}>{avgDisplay}/10</Text>
          <View style={styles.insightDivider} />
          <Text style={styles.insightLabel}>{t('dashboard.chart.entries')}</Text>
          <Text style={styles.insightValue}>{summary.totalEntries}</Text>
          <View style={styles.insightDivider} />
          <Text style={styles.insightLabel}>{t('dashboard.chart.days')}</Text>
          <Text style={styles.insightValue}>{summary.totalDays}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerTextBlock: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  trendBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  trendText: {
    ...typography.captionMedium,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  rangeChip: {
    borderRadius: borderRadius.full,
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
    color: '#fff',
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
  hitLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  hitArea: {
    position: 'absolute',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 110,
  },
  tooltipDate: {
    ...typography.captionMedium,
    color: '#fff',
    marginBottom: 2,
  },
  tooltipValue: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.85)',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.base,
    gap: spacing.sm,
  },
  insightLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  insightValue: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
  insightDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.xs,
  },
});

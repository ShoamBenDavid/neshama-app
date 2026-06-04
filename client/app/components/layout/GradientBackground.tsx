import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

type GradientKey = keyof typeof colors.gradients;

interface GradientBackgroundProps {
  /** A named gradient from `colors.gradients`. */
  gradient?: GradientKey;
  /** Explicit color stops (overrides `gradient`). */
  colorsStops?: readonly string[];
  /** Direction shorthand. */
  direction?: 'vertical' | 'diagonal' | 'horizontal';
  /** Render gradient only over the top portion of the container (0–1). */
  topPortion?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const directionPoints: Record<
  NonNullable<GradientBackgroundProps['direction']>,
  { start: { x: number; y: number }; end: { x: number; y: number } }
> = {
  vertical: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  horizontal: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
};

export default function GradientBackground({
  gradient = 'dawn',
  colorsStops,
  direction = 'vertical',
  topPortion,
  style,
  children,
}: GradientBackgroundProps) {
  const stops = (colorsStops ?? colors.gradients[gradient]) as readonly string[];
  const { start, end } = directionPoints[direction];

  if (topPortion && topPortion > 0 && topPortion < 1) {
    return (
      <View style={[styles.flex, style]}>
        <LinearGradient
          colors={stops as unknown as readonly [string, string, ...string[]]}
          start={start}
          end={end}
          style={[StyleSheet.absoluteFillObject, { bottom: `${(1 - topPortion) * 100}%` }]}
        />
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={stops as unknown as readonly [string, string, ...string[]]}
      start={start}
      end={end}
      style={[styles.flex, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

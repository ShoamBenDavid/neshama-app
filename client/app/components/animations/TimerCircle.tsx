import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface TimerCircleProps {
  elapsed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showTime?: boolean;
}

export default function TimerCircle({
  elapsed,
  total,
  size = 120,
  strokeWidth = 6,
  color = colors.primary,
  showTime = true,
}: TimerCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(elapsed / total, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const remaining = Math.max(0, total - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color + '20'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showTime && (
        <View style={styles.textContainer}>
          <Text style={[styles.time, { color }]}>{timeString}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    ...typography.h3,
  },
});

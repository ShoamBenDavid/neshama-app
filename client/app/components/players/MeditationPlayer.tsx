import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PulseAnimation, TimerCircle } from '../animations';
import { speakText, stopSpeaking, splitScriptIntoSegments } from '../../services/tts';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface MeditationPlayerProps {
  script: string;
  durationMinutes: number;
  color?: string;
  onComplete?: () => void;
}

export default function MeditationPlayer({
  script,
  durationMinutes,
  color = colors.accent,
  onComplete,
}: MeditationPlayerProps) {
  const { t, isRTL } = useTranslation();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const writingDirection = isRTL ? 'rtl' : 'ltr';
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentSegment, setCurrentSegment] = useState(0);
  const totalSeconds = durationMinutes * 60;
  const segments = splitScriptIntoSegments(script);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            stopSpeaking();
            onComplete?.();
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSeconds, onComplete]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (segments.length > 0) {
      playSegment(currentSegment);
    }
  }, [currentSegment, segments]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopSpeaking();
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setElapsed(0);
    setCurrentSegment(0);
    stopSpeaking();
  }, []);

  const playSegment = (index: number) => {
    if (index >= segments.length) {
      onComplete?.();
      return;
    }

    speakText(segments[index], {
      rate: 0.8,
      onDone: () => {
        const nextIndex = index + 1;
        setCurrentSegment(nextIndex);
        if (nextIndex < segments.length && isPlaying) {
          setTimeout(() => playSegment(nextIndex), 2000);
        }
      },
    });
  };

  const progressPercent = Math.min((elapsed / totalSeconds) * 100, 100);
  const currentText =
    segments[Math.min(currentSegment, segments.length - 1)] || '';

  return (
    <View style={styles.container}>
      <PulseAnimation
        size={80}
        color={color + '30'}
        isActive={isPlaying}
      >
        <TimerCircle
          elapsed={elapsed}
          total={totalSeconds}
          size={140}
          color={color}
        />
      </PulseAnimation>

      <Text
        style={[styles.currentText, { textAlign, writingDirection }]}
        numberOfLines={3}
      >
        {isPlaying || elapsed > 0
          ? currentText
          : t('common.pressPlayToBegin')}
      </Text>

      <View style={[styles.controls, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleStop}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="stop" size={24} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: color }]}
          onPress={isPlaying ? handlePause : handlePlay}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color={colors.text.inverse}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (currentSegment < segments.length - 1) {
              stopSpeaking();
              const next = currentSegment + 1;
              setCurrentSegment(next);
              if (isPlaying) playSegment(next);
            }
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons
            name={isRTL ? 'play-skip-back' : 'play-skip-forward'}
            size={24}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor: color,
                alignSelf: isRTL ? 'flex-end' : 'flex-start',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  currentText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing['2xl'],
    marginHorizontal: spacing.lg,
    lineHeight: 24,
    minHeight: 72,
  },
  controls: {
    alignItems: 'center',
    gap: spacing['2xl'],
    marginTop: spacing.xl,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  progressContainer: {
    width: '80%',
    marginTop: spacing.xl,
  },
  progressBg: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

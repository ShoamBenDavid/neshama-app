import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PulseAnimation, TimerCircle } from '../animations';
import { speakText, stopSpeaking, splitScriptIntoSegments } from '../../services/tts';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, shadows } from '../../theme/spacing';
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
  const isPlayingRef = useRef(false);
  const segmentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackSessionRef = useRef(0);
  const totalSeconds = durationMinutes * 60;
  const segments = splitScriptIntoSegments(script);

  const clearSegmentTimeout = useCallback(() => {
    if (segmentTimeoutRef.current) {
      clearTimeout(segmentTimeoutRef.current);
      segmentTimeoutRef.current = null;
    }
  }, []);

  const invalidatePlayback = useCallback(() => {
    playbackSessionRef.current += 1;
    clearSegmentTimeout();
    stopSpeaking();
  }, [clearSegmentTimeout]);

  const playSegment = useCallback(
    (index: number, session: number) => {
      if (session !== playbackSessionRef.current) return;
      if (index >= segments.length) {
        onComplete?.();
        return;
      }

      speakText(segments[index], {
        rate: 0.8,
        onDone: () => {
          if (session !== playbackSessionRef.current) return;
          const nextIndex = index + 1;
          setCurrentSegment(nextIndex);
          if (nextIndex < segments.length && isPlayingRef.current) {
            segmentTimeoutRef.current = setTimeout(() => {
              segmentTimeoutRef.current = null;
              playSegment(nextIndex, session);
            }, 2000);
          }
        },
      });
    },
    [segments, onComplete],
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= totalSeconds) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            invalidatePlayback();
            onComplete?.();
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalSeconds, onComplete, invalidatePlayback]);

  useEffect(() => {
    return () => {
      playbackSessionRef.current += 1;
      clearSegmentTimeout();
      stopSpeaking();
    };
  }, [clearSegmentTimeout]);

  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    if (segments.length > 0) {
      playSegment(currentSegment, playbackSessionRef.current);
    }
  }, [currentSegment, segments.length, playSegment]);

  const handlePause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    invalidatePlayback();
  }, [invalidatePlayback]);

  const handleStop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setElapsed(0);
    setCurrentSegment(0);
    invalidatePlayback();
  }, [invalidatePlayback]);

  const handleSkip = useCallback(() => {
    if (currentSegment >= segments.length - 1) return;
    invalidatePlayback();
    const next = currentSegment + 1;
    setCurrentSegment(next);
    if (isPlayingRef.current) {
      playSegment(next, playbackSessionRef.current);
    }
  }, [currentSegment, segments.length, invalidatePlayback, playSegment]);

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
          onPress={handleSkip}
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

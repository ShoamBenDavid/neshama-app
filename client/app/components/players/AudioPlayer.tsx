import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speakText, stopSpeaking } from '../../services/tts';
import { TimerCircle } from '../animations';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, shadows } from '../../theme/spacing';
import type { AudioTrack } from '../../content/types';
import { useTranslation } from '../../i18n';

interface AudioPlayerProps {
  track: AudioTrack;
  color?: string;
  onComplete?: () => void;
}

export default function AudioPlayer({
  track,
  color = colors.primary,
  onComplete,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= track.duration) {
          setIsPlaying(false);
          if (timerRef.current) clearInterval(timerRef.current);
          onComplete?.();
          return track.duration;
        }
        return prev + 1;
      });
    }, 1000);

    if (track.sourceType === 'tts' && track.ttsScript) {
      speakText(track.ttsScript, {
        rate: 0.75,
        onDone: () => {},
      });
    }
  }, [track, onComplete]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
  }, []);

  const remaining = Math.max(0, track.duration - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);

  return (
    <View style={styles.container}>
      <TimerCircle
        elapsed={elapsed}
        total={track.duration}
        size={180}
        strokeWidth={8}
        color={color}
      />

      <Text style={styles.trackTitle}>{track.title}</Text>
      <Text style={styles.trackDesc}>{track.description}</Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleStop}
        >
          <Ionicons name="stop" size={22} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: color }]}
          onPress={isPlaying ? handlePause : handlePlay}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn}>
          <Ionicons name="repeat-outline" size={22} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.timerLabel}>
        {minutes}:{seconds.toString().padStart(2, '0')} {t('common.remaining')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  trackTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.xl,
  },
  trackDesc: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginHorizontal: spacing.xl,
    lineHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xl'],
    marginTop: spacing.xl,
  },
  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  timerLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.base,
  },
});

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { speakText, stopSpeaking } from '../../services/tts';
import { audioAssets } from '../../assets/audio';
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

const AUDIO_MODE = {
  playsInSilentMode: true,
  allowsRecording: false,
  interruptionMode: 'duckOthers' as const,
  shouldPlayInBackground: false,
  shouldRouteThroughEarpiece: false,
};

function LocalAudioPlayer({
  track,
  color = colors.primary,
  onComplete,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const [pendingPlay, setPendingPlay] = useState(false);
  const finishHandledRef = useRef(false);

  const source = track.localAssetId ? audioAssets[track.localAssetId] : null;
  const player = useAudioPlayer(source, {
    updateInterval: 250,
    downloadFirst: true,
  });
  const status = useAudioPlayerStatus(player);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    setAudioModeAsync(AUDIO_MODE).catch(() => {});
  }, []);

  useEffect(() => {
    finishHandledRef.current = false;
    setPendingPlay(false);
  }, [track.id]);

  useEffect(() => {
    if (status.didJustFinish && !finishHandledRef.current) {
      finishHandledRef.current = true;
      onComplete?.();
    }
  }, [status.didJustFinish, onComplete]);

  useEffect(() => {
    if (!pendingPlay || !status.isLoaded) return;
    setPendingPlay(false);
    player.play();
  }, [pendingPlay, status.isLoaded, player]);

  const handlePlay = useCallback(async () => {
    await setAudioModeAsync(AUDIO_MODE).catch(() => {});

    const current = statusRef.current;
    const atEnd =
      current.duration > 0 &&
      current.currentTime >= Math.max(0, current.duration - 0.25);

    if (atEnd || current.didJustFinish) {
      await player.seekTo(0);
    }

    if (!statusRef.current.isLoaded) {
      setPendingPlay(true);
      return;
    }

    player.play();
  }, [player]);

  const handlePause = useCallback(() => {
    setPendingPlay(false);
    player.pause();
  }, [player]);

  const handleStop = useCallback(async () => {
    setPendingPlay(false);
    player.pause();
    await player.seekTo(0);
  }, [player]);

  const isPlaying = status.playing || pendingPlay;
  const isLoading = !status.isLoaded && (status.isBuffering || pendingPlay);
  const elapsed = Math.floor(status.currentTime);
  const totalDuration =
    status.duration > 0
      ? Math.max(1, Math.round(status.duration))
      : track.duration;
  const remaining = Math.max(0, totalDuration - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);

  return (
    <View style={styles.container}>
      <TimerCircle
        elapsed={elapsed}
        total={totalDuration}
        size={180}
        strokeWidth={8}
        color={color}
      />

      <Text style={styles.trackTitle}>{track.title}</Text>
      <Text style={styles.trackDesc}>{track.description}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleStop}>
          <Ionicons name="stop" size={22} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: color }]}
          onPress={isPlaying ? handlePause : handlePlay}
          disabled={isLoading && !isPlaying}
        >
          {isLoading && !isPlaying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.timerLabel}>
        {minutes}:{seconds.toString().padStart(2, '0')} {t('common.remaining')}
      </Text>
    </View>
  );
}

function TtsAudioPlayer({
  track,
  color = colors.primary,
  onComplete,
}: AudioPlayerProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTtsTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTtsTimer();
      stopSpeaking();
    };
  }, [clearTtsTimer]);

  useEffect(() => {
    setIsPlaying(false);
    setElapsed(0);
    clearTtsTimer();
    stopSpeaking();
  }, [track.id, clearTtsTimer]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= track.duration) {
          setIsPlaying(false);
          clearTtsTimer();
          onComplete?.();
          return track.duration;
        }
        return prev + 1;
      });
    }, 1000);

    if (track.ttsScript) {
      speakText(track.ttsScript, { rate: 0.75, onDone: () => {} });
    }
  }, [track.duration, track.ttsScript, clearTtsTimer, onComplete]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    clearTtsTimer();
    stopSpeaking();
  }, [clearTtsTimer]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setElapsed(0);
    clearTtsTimer();
    stopSpeaking();
  }, [clearTtsTimer]);

  const totalDuration = track.duration;
  const remaining = Math.max(0, totalDuration - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);

  return (
    <View style={styles.container}>
      <TimerCircle
        elapsed={elapsed}
        total={totalDuration}
        size={180}
        strokeWidth={8}
        color={color}
      />

      <Text style={styles.trackTitle}>{track.title}</Text>
      <Text style={styles.trackDesc}>{track.description}</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleStop}>
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
      </View>

      <Text style={styles.timerLabel}>
        {minutes}:{seconds.toString().padStart(2, '0')} {t('common.remaining')}
      </Text>
    </View>
  );
}

export default function AudioPlayer(props: AudioPlayerProps) {
  if (props.track.sourceType === 'local' && props.track.localAssetId) {
    return <LocalAudioPlayer {...props} />;
  }
  return <TtsAudioPlayer {...props} />;
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
    justifyContent: 'center',
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

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { BreathingPhase } from '../../content/types';
import { useTranslation } from '../../i18n';
import { speakText, stopSpeaking } from '../../services/tts';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.0;

interface BreathingCircleProps {
  phases: BreathingPhase[];
  isActive: boolean;
  currentPhaseIndex: number;
  color?: string;
  /** Set to false to mute TTS announcements during breathing. */
  speakPhases?: boolean;
}

export default function BreathingCircle({
  phases,
  isActive,
  currentPhaseIndex,
  color = colors.primary,
  speakPhases = true,
}: BreathingCircleProps) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(MIN_SCALE)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const outerScale = useRef(new Animated.Value(MIN_SCALE)).current;
  const lastScale = useRef(MIN_SCALE);

  useEffect(() => {
    const id = scale.addListener(({ value }) => {
      lastScale.current = value;
    });
    return () => scale.removeListener(id);
  }, [scale]);

  useEffect(() => {
    if (!isActive) {
      stopSpeaking();
      return;
    }
    if (!phases[currentPhaseIndex]) return;

    const phase = phases[currentPhaseIndex];
    const duration = phase.duration * 1000;

    // Announce phase label via TTS (auto-detects Hebrew)
    if (speakPhases) {
      const label =
        phase.type === 'inhale' ? t('breathing.breatheIn')
        : phase.type === 'hold' ? t('breathing.hold')
        : phase.type === 'exhale' ? t('breathing.breatheOut')
        : t('breathing.rest');
      speakText(label, { rate: 0.7 });
    }

    let targetScale = MIN_SCALE;
    let targetOpacity = 0.6;

    switch (phase.type) {
      case 'inhale':
        targetScale = MAX_SCALE;
        targetOpacity = 1;
        break;
      case 'hold':
        targetScale = lastScale.current;
        targetOpacity = 0.9;
        break;
      case 'exhale':
        targetScale = MIN_SCALE;
        targetOpacity = 0.6;
        break;
      case 'rest':
        targetScale = MIN_SCALE;
        targetOpacity = 0.5;
        break;
    }

    Animated.parallel([
      Animated.timing(scale, {
        toValue: targetScale,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: targetOpacity,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(outerScale, {
        toValue: targetScale * 1.15,
        duration: duration + 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentPhaseIndex, isActive, phases]);

  const phase = phases[currentPhaseIndex];

  const phaseLabel =
    phase?.type === 'inhale'
      ? t('breathing.breatheIn')
      : phase?.type === 'hold'
        ? t('breathing.hold')
        : phase?.type === 'exhale'
          ? t('breathing.breatheOut')
          : t('breathing.rest');

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.outerCircle,
          {
            backgroundColor: color + '08',
            borderColor: color + '15',
            transform: [{ scale: outerScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: color + '20',
            borderColor: color + '40',
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Text style={[styles.phaseLabel, { color }]}>{phaseLabel}</Text>
        {phase && (
          <Text style={styles.instruction}>{phase.instruction}</Text>
        )}
        <Text style={[styles.timer, { color }]}>{phase?.duration}s</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CIRCLE_SIZE * 1.3,
    height: CIRCLE_SIZE * 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  outerCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  phaseLabel: {
    ...typography.h2,
    marginBottom: 8,
  },
  instruction: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  timer: {
    ...typography.h3,
    marginTop: 12,
    opacity: 0.7,
  },
});

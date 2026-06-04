import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BreathingCircle, CalmBackground, FloatingParticles } from '../components/animations';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, shadows } from '../theme/spacing';
import { getBreathingExerciseById } from '../content/localizedContent';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type RouteParams = RouteProp<RootStackParamList, 'BreathingSession'>;

export default function BreathingSessionScreen() {
  const { t, language, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { exerciseId } = route.params;

  const exercise = getBreathingExerciseById(exerciseId, language);
  if (!exercise) return null;

  const [isActive, setIsActive] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentPhase = exercise.phases[currentPhaseIndex];

  const advancePhase = useCallback(() => {
    setCurrentPhaseIndex((prev) => {
      const next = prev + 1;
      if (next >= exercise.phases.length) {
        setCurrentRound((round) => {
          if (round >= exercise.rounds) {
            setIsActive(false);
            setIsComplete(true);
            return round;
          }
          return round + 1;
        });
        return 0;
      }
      return next;
    });
  }, [exercise]);

  useEffect(() => {
    if (!isActive || !currentPhase) return;

    setCountdown(currentPhase.duration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, currentPhaseIndex, currentRound, currentPhase, advancePhase]);

  const handleStart = () => {
    setIsActive(true);
    setIsComplete(false);
    setCurrentPhaseIndex(0);
    setCurrentRound(1);
  };

  const handleStop = () => {
    setIsActive(false);
    setCurrentPhaseIndex(0);
    setCurrentRound(1);
    setCountdown(0);
  };

  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CalmBackground colors={exercise.gradientColors as [string, string]} />
      <FloatingParticles color="rgba(255,255,255,0.15)" count={10} />

      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          onPress={() => { handleStop(); navigation.goBack(); }}
          style={styles.backBtn}
        >
          <Ionicons name="close" size={28} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>
            {t('breathing.roundOf', { current: currentRound, total: exercise.rounds })}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.center}>
        <Text style={[styles.exerciseName, { textAlign: 'center' }]}>{exercise.name}</Text>

        <BreathingCircle
          phases={exercise.phases}
          isActive={isActive}
          currentPhaseIndex={currentPhaseIndex}
          color="rgba(255,255,255,0.9)"
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {isComplete ? (
          <View style={styles.completeSection}>
            <Ionicons name="checkmark-circle" size={48} color="rgba(255,255,255,0.9)" />
            <Text style={[styles.completeText, { textAlign: 'center' }]}>
              {t('breathing.sessionComplete')}
            </Text>
            <Text style={[styles.completeSubtext, { textAlign: 'center' }]}>
              {t('breathing.sessionCompleteMessage', { count: exercise.rounds })}
            </Text>
            <TouchableOpacity style={[styles.mainBtn, { flexDirection: rowDirection }]} onPress={handleStart}>
              <Text style={styles.mainBtnText}>{t('breathing.repeat')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.controlsRow}>
            {isActive ? (
              <TouchableOpacity style={[styles.mainBtn, { flexDirection: rowDirection }]} onPress={handleStop}>
                <Ionicons name="stop" size={24} color={exercise.gradientColors[0]} />
                <Text style={[styles.mainBtnText, { color: exercise.gradientColors[0] }]}>{t('breathing.stop')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.mainBtn, { flexDirection: rowDirection }]} onPress={handleStart}>
                <Ionicons name="play" size={24} color={exercise.gradientColors[0]} />
                <Text style={[styles.mainBtnText, { color: exercise.gradientColors[0] }]}>
                  {t('breathing.beginSession')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundInfo: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  roundText: {
    ...typography.captionMedium,
    color: 'rgba(255,255,255,0.9)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  exerciseName: {
    ...typography.h2,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  controlsRow: {
    alignItems: 'center',
  },
  mainBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 28,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.base,
    gap: spacing.sm,
    ...shadows.md,
    alignSelf: 'center',
  },
  mainBtnText: {
    ...typography.button,
    fontSize: 17,
  },
  completeSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  completeText: {
    ...typography.h3,
    color: 'rgba(255,255,255,0.95)',
  },
  completeSubtext: {
    ...typography.body,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.md,
  },
});

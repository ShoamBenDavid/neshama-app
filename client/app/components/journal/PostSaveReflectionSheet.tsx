import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import { ActionButton } from '../ui';
import AnxietyFeedbackCard from './AnxietyFeedbackCard';

export type ReflectionAction = 'breath' | 'chat' | 'support' | 'continue';

interface PostSaveReflectionSheetProps {
  visible: boolean;
  /** anxietyLabel from the server: 'low' | 'moderate' | 'high' | null. */
  anxietyLabel: string | null;
  onClose: (next?: ReflectionAction) => void;
}

type Tone = 'low' | 'moderate' | 'high' | 'neutral';

const toneForLabel = (label: string | null): Tone => {
  if (!label) return 'neutral';
  const normalized = label.trim().toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'moderate') return 'moderate';
  if (normalized === 'low') return 'low';
  return 'neutral';
};

const toneGradient: Record<Tone, keyof typeof colors.gradients> = {
  low: 'lavenderWash',
  moderate: 'moodCalm',
  high: 'crisisSoft',
  neutral: 'lavenderWash',
};

const toneIcon: Record<Tone, React.ComponentProps<typeof Ionicons>['name']> = {
  low: 'leaf-outline',
  moderate: 'sunny-outline',
  high: 'heart-circle-outline',
  neutral: 'sparkles-outline',
};

/**
 * Post-save reflection sheet. Reveals the anxiety classification gently
 * with supportive microcopy and three tonal variants (low / moderate /
 * high). Never diagnoses — always offers a non-action exit.
 */
export default function PostSaveReflectionSheet({
  visible,
  anxietyLabel,
  onClose,
}: PostSaveReflectionSheetProps) {
  const { t, isRTL } = useTranslation();
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const tone = toneForLabel(anxietyLabel);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(400);
      opacity.setValue(0);
    }
  }, [visible, translateY, opacity]);

  const animateOutAnd = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 400,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(cb);
  };

  const close = (next?: ReflectionAction) => {
    animateOutAnd(() => onClose(next));
  };

  const titleKey =
    tone === 'low'
      ? 'journal.reflection.lowTitle'
      : tone === 'moderate'
        ? 'journal.reflection.moderateTitle'
        : tone === 'high'
          ? 'journal.reflection.highTitle'
          : 'journal.reflection.saved';

  const messageKey =
    tone === 'low'
      ? 'journal.reflection.lowMessage'
      : tone === 'moderate'
        ? 'journal.reflection.moderateMessage'
        : tone === 'high'
          ? 'journal.reflection.highMessage'
          : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => close('continue')}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close('continue')} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY }] },
        ]}
      >
        <LinearGradient
          colors={
            colors.gradients[toneGradient[tone]] as unknown as readonly [string, string, ...string[]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBand}
        >
          <View style={styles.handle} />
          <View
            style={[
              styles.iconCircle,
              tone === 'high' && { backgroundColor: 'rgba(255,255,255,0.7)' },
            ]}
          >
            <Ionicons
              name={toneIcon[tone]}
              size={28}
              color={tone === 'high' ? colors.brand.warmCoral : colors.primary}
            />
          </View>
          <Text style={[styles.savedLabel, { textAlign: 'center' }]}>
            {t('journal.reflection.saved')}
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t(titleKey)}
          </Text>
          {messageKey && (
            <Text style={[styles.message, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t(messageKey)}
            </Text>
          )}

          {tone === 'high' && (
            <View style={{ marginTop: spacing.md }}>
              <AnxietyFeedbackCard label="high" />
            </View>
          )}

          <View style={styles.actions}>
            {(tone === 'moderate' || tone === 'high') && (
              <ActionButton
                title={t('journal.reflection.tryBreathing')}
                icon="leaf-outline"
                variant="filled"
                size="lg"
                fullWidth
                glow
                onPress={() => close('breath')}
              />
            )}
            {tone === 'high' && (
              <ActionButton
                title={t('journal.reflection.seeSupport')}
                icon="heart-outline"
                variant="outline"
                size="lg"
                fullWidth
                onPress={() => close('support')}
              />
            )}
            {(tone === 'moderate' || tone === 'low' || tone === 'neutral') && (
              <ActionButton
                title={t('journal.reflection.talkToCompanion')}
                icon="chatbubble-ellipses-outline"
                variant={tone === 'moderate' ? 'outline' : 'filled'}
                size="lg"
                fullWidth
                glow={tone === 'low' || tone === 'neutral'}
                onPress={() => close('chat')}
              />
            )}
            <TouchableOpacity
              onPress={() => close('continue')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
            >
              <Text style={styles.skipLabel}>
                {tone === 'high'
                  ? t('journal.reflection.continueLabel')
                  : t('journal.reflection.skipLabel')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.disclaimer, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('journal.reflection.disclaimer')}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.hero,
    borderTopRightRadius: borderRadius.hero,
    overflow: 'hidden',
    ...shadows.xl,
  },
  heroBand: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(31,34,53,0.18)',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  savedLabel: {
    ...typography.eyebrow,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.microCopy,
    color: colors.text.secondary,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
  },
  skipLabel: {
    ...typography.captionMedium,
    color: colors.text.muted,
    paddingVertical: spacing.sm,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
});

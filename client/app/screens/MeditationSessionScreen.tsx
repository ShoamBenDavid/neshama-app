import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalmBackground, FloatingParticles } from '../components/animations';
import { MeditationPlayer } from '../components/players';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { getMeditationSessionById } from '../content/localizedContent';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type RouteParams = RouteProp<RootStackParamList, 'MeditationSession'>;

export default function MeditationSessionScreen() {
  const { t, language, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const session = getMeditationSessionById(route.params.sessionId, language);

  if (!session) return null;

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const writingDirection = isRTL ? 'rtl' : 'ltr';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CalmBackground
        colors={[session.gradientColors[0] + '30', session.gradientColors[1] + '20']}
      />
      <FloatingParticles
        color={session.gradientColors[0] + '15'}
        count={8}
      />

      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={26} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.category, { textAlign, writingDirection }]}>
          {session.category}
        </Text>
        <Text style={[styles.title, { textAlign, writingDirection }]}>
          {session.title}
        </Text>
        <Text style={[styles.description, { textAlign, writingDirection }]}>
          {session.description}
        </Text>

        <View style={[styles.infoPills, { flexDirection: rowDirection }]}>
          <View style={[styles.pill, { flexDirection: rowDirection }]}>
            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={[styles.pillText, { textAlign }]}>
              {t('common.minutes', { count: session.duration })}
            </Text>
          </View>
          <View style={[styles.pill, { flexDirection: rowDirection }]}>
            <Ionicons name="headset-outline" size={14} color={colors.text.secondary} />
            <Text style={[styles.pillText, { textAlign }]}>{t('common.guidedVoice')}</Text>
          </View>
        </View>

        <MeditationPlayer
          script={session.script}
          durationMinutes={session.duration}
          color={session.gradientColors[0]}
          onComplete={() => {}}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
    zIndex: 10,
  },
  category: {
    ...typography.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  infoPills: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  pill: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pillText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

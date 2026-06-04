import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import { wellnessImages } from '../../assets/images';

interface JournalHeroCardProps {
  onPress: () => void;
}

/**
 * Today's reflection prompt card shown at the top of the journal list.
 * Soft cushion photography + warm "How are you, really?" prompt + CTA pill.
 */
export default function JournalHeroCard({ onPress }: JournalHeroCardProps) {
  const { t, isRTL } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={t('journal.heroTitle')}
    >
      <ImageBackground
        source={wellnessImages.journalDesk}
        style={styles.image}
        imageStyle={styles.imageInner}
      >
        <LinearGradient
          colors={['rgba(14,17,35,0.05)', 'rgba(14,17,35,0.55)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.body, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text
            style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {t('journal.heroTitle')}
          </Text>
          <Text
            style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}
          >
            {t('journal.heroSubtitle')}
          </Text>
          <View
            style={[
              styles.cta,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.ctaLabel}>{t('journal.heroCTA')}</Text>
            <Ionicons name="create-outline" size={16} color={colors.text.inverse} />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.hero,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    height: 170,
    ...shadows.md,
  },
  image: { flex: 1, justifyContent: 'flex-end' },
  imageInner: { borderRadius: borderRadius.hero },
  body: {
    padding: spacing.base,
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    color: colors.text.onPhoto,
  },
  subtitle: {
    ...typography.microCopy,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.sm,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    gap: spacing.xs,
  },
  ctaLabel: {
    ...typography.buttonSm,
    color: colors.text.inverse,
  },
});

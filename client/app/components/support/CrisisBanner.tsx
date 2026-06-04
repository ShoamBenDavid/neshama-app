import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

/**
 * Soft crisis banner. Uses the `crisisSoft` gradient (warm coral, not pure
 * red) so it's visible but not visually aggressive — important for a
 * wellness app context.
 */
export default function CrisisBanner() {
  const { t, isRTL } = useTranslation();

  return (
    <LinearGradient
      colors={colors.gradients.crisisSoft as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.banner,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <View style={styles.iconCircle}>
        <Ionicons name="heart" size={22} color={colors.brand.warmCoral} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('support.crisisBannerWarm')}
        </Text>
        <Text style={[styles.message, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('support.crisisMessage')}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: borderRadius.card,
    gap: spacing.md,
    ...shadows.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.text.onPhoto,
  },
  message: {
    ...typography.microCopy,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
});

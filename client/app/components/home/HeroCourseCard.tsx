import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { wellnessImages } from '../../assets/images';
import { useTranslation } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroCourseCardProps {
  eyebrow: string;
  title: string;
  onPress: () => void;
  image?: typeof wellnessImages.homeHeroDahlia;
  buttonLabel?: string;
}

export default function HeroCourseCard({
  title,
  eyebrow,
  onPress,
  image,
  buttonLabel = 'לצ׳אט עם נשמה',
}: HeroCourseCardProps) {
  const { isRTL } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#FDF1DE', '#F7EEF7', '#F1E9FF']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.card}
      >
        <View style={styles.mascotCircle}>
          <Image
            source={image ?? wellnessImages.homeHeroDahlia}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.eyebrow, isRTL ? styles.textRTL : styles.textLTR]}>
            {eyebrow}
          </Text>
          <Text style={[styles.title, isRTL ? styles.textRTL : styles.textLTR]}>
            {title}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <Text style={[styles.buttonText, isRTL ? styles.textRTL : styles.textLTR]}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    alignSelf: 'center',
    borderRadius: 32,
    overflow: 'hidden',
    ...shadows.md,
  },

  card: {
    minHeight: 300,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  mascotCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },

  mascot: {
    width: 68,
    height: 68,
  },

  textBlock: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },

  title: {
    ...typography.h2,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 42,
  },

  eyebrow: {
    ...typography.h2,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 42,
  },

  button: {
    marginTop: spacing['2xl'],
    minWidth: 220,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  buttonText: {
    ...typography.h3,
    color: '#444',
    textAlign: 'center',
  },
  textLTR: {
    writingDirection: 'ltr',
  },
  textRTL: {
    writingDirection: 'rtl',
  },
});
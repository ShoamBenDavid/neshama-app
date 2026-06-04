import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import type { RegistryItem } from '../../content/contentRegistry';

interface ContentCardProps {
  item: RegistryItem;
  onPress: () => void;
  variant?: 'carousel' | 'full';
}

export default function ContentCard({ item, onPress, variant = 'carousel' }: ContentCardProps) {
  const isCarousel = variant === 'carousel';

  if (isCarousel) {
    return (
      <TouchableOpacity
        style={styles.carouselCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.carouselGradient}
        >
          <View style={styles.carouselIconBadge}>
            <Ionicons name={item.icon} size={22} color="rgba(255,255,255,0.95)" />
          </View>
          <Text style={styles.carouselTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.carouselMeta}>
            <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.75)" />
            <Text style={styles.carouselDuration}>{item.durationLabel}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.fullCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={item.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fullGradient}
      >
        <View style={styles.fullIconBadge}>
          <Ionicons name={item.icon} size={28} color="rgba(255,255,255,0.95)" />
        </View>
        <View style={styles.fullContent}>
          <Text style={styles.fullType}>{item.type}</Text>
          <Text style={styles.fullTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.fullDescription} numberOfLines={2}>{item.description}</Text>
          <View style={styles.fullMeta}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.fullDuration}>{item.durationLabel}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const CAROUSEL_WIDTH = 160;
const CAROUSEL_HEIGHT = 180;

const styles = StyleSheet.create({
  // Carousel variant (horizontal scroll cards)
  carouselCard: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  carouselGradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  carouselIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14,
  },
  carouselMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  carouselDuration: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },

  // Full-width variant (vertical list cards)
  fullCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  fullGradient: {
    padding: spacing.lg,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  fullIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  fullContent: {} as ViewStyle,
  fullType: {
    ...typography.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  fullTitle: {
    ...typography.h4,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  fullDescription: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
  },
  fullMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fullDuration: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
});

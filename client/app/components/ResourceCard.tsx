import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { ContentItem } from '../services/api';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  meditation: 'flower-outline',
  breathing: 'leaf-outline',
  yoga: 'body-outline',
  article: 'document-text-outline',
  video: 'play-circle-outline',
  audio: 'headset-outline',
};

interface ResourceCardProps {
  item: ContentItem;
  onPress?: () => void;
  compact?: boolean;
}

export default function ResourceCard({ item, onPress, compact = false }: ResourceCardProps) {
  const gradientColors = item.gradientColors?.length >= 2
    ? item.gradientColors
    : ['#667EEA', '#764BA2'];

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.compactGradient}
        >
          <Ionicons
            name={TYPE_ICONS[item.type] || 'star-outline'}
            size={24}
            color="rgba(255,255,255,0.9)"
          />
        </LinearGradient>
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.compactMeta}>{item.duration} · {item.type}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconBadge}>
          <Ionicons
            name={TYPE_ICONS[item.type] || 'star-outline'}
            size={28}
            color="rgba(255,255,255,0.95)"
          />
        </View>
        <View style={styles.gradientContent}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.duration}>{item.duration}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  gradient: {
    padding: spacing.lg,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  gradientContent: {},
  category: {
    ...typography.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h4,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  duration: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  compactGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  compactTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  compactMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

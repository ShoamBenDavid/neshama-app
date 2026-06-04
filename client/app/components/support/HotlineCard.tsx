import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import type { CrisisResource } from '../../content/supportServices';

interface HotlineCardProps {
  resource: CrisisResource;
}

function toWebsiteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default function HotlineCard({ resource }: HotlineCardProps) {
  const { isRTL } = useTranslation();
  const isPressable = resource.callable || !!resource.url;

  const onPress = () => {
    if (resource.callable) {
      const cleaned = resource.number.replace(/[^0-9*#+]/g, '');
      Linking.openURL(`tel:${cleaned}`).catch(() => {});
      return;
    }
    if (resource.url) {
      Linking.openURL(toWebsiteUrl(resource.url)).catch(() => {});
    }
  };

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    { flexDirection: isRTL ? 'row-reverse' : 'row' },
  ];

  const content = (
    <>
      <View style={styles.iconWrap}>
        <Ionicons name={resource.icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]}>
          {resource.name}
        </Text>
        <Text style={[styles.number, { textAlign: isRTL ? 'right' : 'left' }]}>
          {resource.number}
        </Text>
        <Text style={[styles.desc, { textAlign: isRTL ? 'right' : 'left' }]}>
          {resource.description}
        </Text>
      </View>
      {resource.callable && (
        <View style={styles.callPill}>
          <Ionicons name="call" size={14} color={colors.text.inverse} />
        </View>
      )}
      {resource.url && !resource.callable && (
        <View style={styles.callPill}>
          <Ionicons name="open-outline" size={14} color={colors.text.inverse} />
        </View>
      )}
    </>
  );

  if (!isPressable) {
    return <View style={cardStyle}>{content}</View>;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={cardStyle}
      accessibilityRole="button"
      accessibilityLabel={resource.name}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.brand.lavenderMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  name: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  number: {
    ...typography.h4,
    color: colors.primary,
    marginTop: 2,
  },
  desc: {
    ...typography.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  callPill: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

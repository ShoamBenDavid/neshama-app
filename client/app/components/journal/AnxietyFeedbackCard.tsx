import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import { getSupportServices } from '../../content/supportServices';

interface AnxietyFeedbackCardProps {
  label: 'low' | 'moderate' | 'high';
}

/**
 * A small, supportive informational card that lists locale-aware crisis
 * resources. Shown inside the high-anxiety state of the reflection sheet.
 * Wording is deliberately gentle — no diagnostic claims.
 */
export default function AnxietyFeedbackCard({ label }: AnxietyFeedbackCardProps) {
  const { t, language, isRTL } = useTranslation();
  const services = getSupportServices(language);

  if (label !== 'high') {
    return null;
  }

  const handleCall = (number: string) => {
    const cleaned = number.replace(/[^\d+*]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {});
  };

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.titleRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <Ionicons name="heart-circle" size={20} color={colors.primary} />
        <Text style={styles.title}>{t('journal.reflection.youAreNotAlone')}</Text>
      </View>
      <View style={{ marginTop: spacing.sm }}>
        {services.crisisResources.slice(0, 2).map((resource, idx) => (
          <View
            key={`${resource.name}-${idx}`}
            style={[
              styles.row,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
            onTouchEnd={resource.callable ? () => handleCall(resource.number) : undefined}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={resource.icon} size={16} color={colors.primary} />
            </View>
            <View style={styles.body}>
              <Text style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]}>
                {resource.name}
              </Text>
              <Text style={[styles.number, { textAlign: isRTL ? 'right' : 'left' }]}>
                {resource.number}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.lavenderMist,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  titleRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h4,
    color: colors.primary,
  },
  row: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  name: {
    ...typography.cardMeta,
    color: colors.text.primary,
  },
  number: {
    ...typography.captionMedium,
    color: colors.primary,
    marginTop: 2,
  },
});

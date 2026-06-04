import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

export interface QuickAction {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
}

interface QuickActionPillsProps {
  actions: QuickAction[];
}

/**
 * Horizontal row of pill-shaped quick actions (saved / radio / timer /
 * breaths). The reference renders 4 pills that scroll horizontally on
 * narrow devices. In RTL the row starts from the right edge; avoid manually
 * scrolling to the end because it can fight the user's scroll position.
 */
export default function QuickActionPills({ actions }: QuickActionPillsProps) {
  const { isRTL } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        isRTL ? styles.containerRTL : styles.containerLTR,
      ]}
    >
      {actions.map((action, idx) => (
        <TouchableOpacity
          key={`${action.label}-${idx}`}
          style={styles.pill}
          activeOpacity={0.85}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <View
            style={[
              styles.pillContent,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.label}>{action.label}</Text>
            <Ionicons name={action.icon} size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: '100%',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  containerLTR: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  containerRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    ...shadows.sm,
  },
  pillContent: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.captionMedium,
    color: colors.text.primary,
  },
});

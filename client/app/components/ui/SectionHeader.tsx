import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface SectionHeaderProps {
  title: string;
  /** Optional eyebrow above the title. */
  eyebrow?: string;
  /** Render a tappable link on the opposite side of the title. */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Text color override (for dark backgrounds). */
  tintColor?: string;
  /** Subtitle directly below the title. */
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Section header with the reference pattern:
 *  - Hebrew/RTL: title on the right, "Show all" link on the left
 *  - English/LTR: title on the left, "Show all" link on the right
 */
export default function SectionHeader({
  title,
  eyebrow,
  actionLabel,
  onActionPress,
  tintColor,
  subtitle,
  style,
}: SectionHeaderProps) {
  const { isRTL } = useTranslation();
  const titleColor = tintColor ?? colors.text.primary;
  const linkColor = tintColor ? `${tintColor}DD` : colors.primary;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          {eyebrow && (
            <Text
              style={[
                styles.eyebrow,
                { color: tintColor ? `${tintColor}AA` : colors.text.muted, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {eyebrow}
            </Text>
          )}
          <Text
            style={[
              styles.title,
              { color: titleColor, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: tintColor ? `${tintColor}AA` : colors.text.muted, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {actionLabel && (
          <TouchableOpacity
            onPress={onActionPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={[styles.actionLabel, { color: linkColor }]}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 4,
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    ...typography.cardMeta,
    marginTop: 2,
  },
  actionLabel: {
    ...typography.captionMedium,
  },
});

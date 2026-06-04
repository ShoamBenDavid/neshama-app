import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface IconButton {
  /** Ionicons name */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  /** Color override; defaults to text.primary. */
  color?: string;
  accessibilityLabel?: string;
}

interface AppHeaderProps {
  /** Main title — bold, large, RTL-aware alignment. */
  title?: string;
  /** Small muted line under the title. */
  subtitle?: string;
  /** Eyebrow line above title (e.g. greeting "בוקר טוב"). */
  eyebrow?: string;
  /** Icon button(s) on the start side (visually left in LTR / right in RTL). */
  startIcons?: IconButton[];
  /** Icon button(s) on the end side (visually right in LTR / left in RTL). */
  endIcons?: IconButton[];
  /** Render a circular trailing avatar (e.g. user initial). */
  avatar?: React.ReactNode;
  /** Text color override — useful on dark backgrounds. */
  tintColor?: string;
  /** Centered (e.g. for screen titles). Default false: title aligns to the reading-start. */
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Redesign app header — a soft, RTL-aware top bar with optional icon clusters
 * on each side and an eyebrow line for warm greetings.
 *
 * In RTL languages the title text aligns to the right; the visual "start" of
 * the row remains the reading start (right side), so iconographic positions
 * stay consistent with the reading direction.
 */
export default function AppHeader({
  title,
  subtitle,
  eyebrow,
  startIcons = [],
  endIcons = [],
  avatar,
  tintColor,
  centered = false,
  style,
}: AppHeaderProps) {
  const { isRTL } = useTranslation();
  const titleColor = tintColor ?? colors.text.primary;
  const subtitleColor = tintColor ? `${tintColor}CC` : colors.text.muted;

  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.row, { flexDirection }]}>
        <View style={[styles.iconCluster, { flexDirection }]}>
          {startIcons.map((btn, idx) => (
            <IconCircle key={`s-${idx}`} {...btn} />
          ))}
        </View>

        {!centered && <View style={styles.spacer} />}

        <View style={[styles.iconCluster, { flexDirection }]}>
          {endIcons.map((btn, idx) => (
            <IconCircle key={`e-${idx}`} {...btn} />
          ))}
          {avatar}
        </View>
      </View>

      {(eyebrow || title || subtitle) && (
        <View
          style={[styles.titleBlock, centered && styles.titleBlockCentered]}
        >
          {eyebrow && (
            <Text
              style={[
                styles.eyebrow,
                { color: subtitleColor, textAlign: isRTL ? 'right' : 'left' },
                centered && { textAlign: 'center' },
              ]}
            >
              {eyebrow}
            </Text>
          )}
          {title && (
            <Text
              style={[
                styles.title,
                { color: titleColor, textAlign: isRTL ? 'right' : 'left' },
                centered && { textAlign: 'center' },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: subtitleColor, textAlign: isRTL ? 'right' : 'left' },
                centered && { textAlign: 'center' },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function IconCircle({ icon, onPress, color, accessibilityLabel }: IconButton) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.iconCircle}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={20} color={color ?? colors.text.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: { flex: 1 },
  iconCluster: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginTop: spacing.md,
  },
  titleBlockCentered: {
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 4,
  },
  title: {
    ...typography.h2,
    marginBottom: 2,
  },
  subtitle: {
    ...typography.microCopy,
  },
});

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

type Variant = 'filled' | 'soft' | 'ghost' | 'floating' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ActionButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Add the soft indigo glow shadow. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/**
 * Pill-style call-to-action button used throughout the redesign. Wraps a
 * subset of variants and sizes; for the legacy variants (`secondary`,
 * `danger` etc.) keep using the existing `Button` component.
 */
export default function ActionButton({
  title,
  onPress,
  variant = 'filled',
  size = 'md',
  icon,
  iconPosition = 'start',
  loading = false,
  disabled = false,
  fullWidth = false,
  glow = false,
  style,
  textStyle,
  accessibilityLabel,
}: ActionButtonProps) {
  const { isRTL } = useTranslation();
  const isDisabled = disabled || loading;

  // In RTL the visual "start" is the right side. We honor `iconPosition`
  // semantically (start vs end) by flipping the flex direction.
  const flexDirection: ViewStyle['flexDirection'] =
    iconPosition === 'start'
      ? isRTL
        ? 'row-reverse'
        : 'row'
      : isRTL
        ? 'row'
        : 'row-reverse';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        glow && shadows.glow,
        isDisabled && styles.disabled,
        { flexDirection },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'filled' ? colors.text.inverse : colors.primary}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'lg' ? 20 : size === 'sm' ? 14 : 16}
              color={
                variant === 'filled'
                  ? colors.text.inverse
                  : variant === 'outline'
                    ? colors.primary
                    : colors.text.primary
              }
            />
          )}
          <Text
            style={[
              styles.text,
              sizeTextStyles[size],
              variantTextStyles[variant],
              icon ? { marginHorizontal: spacing.xs } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Convenience floating-action variant — circular, icon-only.
 */
export function FloatingButton({
  icon,
  onPress,
  glow = true,
  accessibilityLabel,
  style,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  glow?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.fab, glow && shadows.glow, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={24} color={colors.text.inverse} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: {
    ...typography.button,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  md: { paddingHorizontal: spacing.lg, paddingVertical: 12 },
  lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
};

const sizeTextStyles: Record<Size, TextStyle> = {
  sm: typography.buttonSm as TextStyle,
  md: typography.button as TextStyle,
  lg: { ...(typography.button as TextStyle), fontSize: 17 },
};

const variantStyles: Record<Variant, ViewStyle> = {
  filled: { backgroundColor: colors.primary },
  soft: { backgroundColor: colors.brand.lavenderMist },
  ghost: { backgroundColor: 'transparent' },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  floating: { backgroundColor: colors.primary, ...shadows.lg },
};

const variantTextStyles: Record<Variant, TextStyle> = {
  filled: { color: colors.text.inverse },
  soft: { color: colors.primary },
  ghost: { color: colors.primary },
  outline: { color: colors.primary },
  floating: { color: colors.text.inverse },
};

// Export a helper-only view so consumers can wrap rows of buttons in flex.
export const ActionRow = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', gap: spacing.sm }, style]}>{children}</View>
);

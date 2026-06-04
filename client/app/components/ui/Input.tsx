import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { borderRadius, spacing, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export default function Input({
  label,
  error,
  hint,
  icon,
  containerStyle,
  isPassword,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  
  const { isRTL } = useTranslation();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
          focused && styles.inputWrapperFocused,
          error ? styles.inputWrapperError : undefined,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.text.tertiary}
            style={styles.icon}
          />
        )}
        <TextInput
  style={[
    styles.input,
    {
      textAlign: isRTL ? 'right' : 'left',

      // Important fix:
      // Password characters should stay LTR, even inside Hebrew UI.
      writingDirection: isPassword ? 'ltr' : isRTL ? 'rtl' : 'ltr',
    },
    style,
  ]}
  placeholderTextColor={colors.text.tertiary}
  onFocus={(e) => {
    setFocused(true);
    props.onFocus?.(e);
  }}
  onBlur={(e) => {
    setFocused(false);
    props.onBlur?.(e);
  }}
  secureTextEntry={isPassword && !showPassword}
  {...props}
/>
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { textAlign: isRTL ? 'right' : 'left' }]}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text style={[styles.hint, { textAlign: isRTL ? 'right' : 'left' }]}>
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'none',
    letterSpacing: 0,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    ...shadows.sm,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    ...shadows.md,
  },
  inputWrapperError: {
    borderColor: colors.status.error,
  },
  icon: {},
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.md + 2,
  },
  error: {
    ...typography.caption,
    color: colors.status.errorDark,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
});

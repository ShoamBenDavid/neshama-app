import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface SettingToggleRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

export default function SettingToggleRow({
  icon,
  iconColor = colors.text.secondary,
  label,
  description,
  value,
  onToggle,
  disabled = false,
}: SettingToggleRowProps) {
  const { isRTL } = useTranslation();
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <View
      style={[
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        disabled && styles.disabled,
      ]}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '12' }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.label, { textAlign }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { textAlign }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.text.tertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  info: {
    flex: 1,
    marginEnd: spacing.md,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

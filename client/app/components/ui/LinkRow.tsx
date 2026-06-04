import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useTranslation, getChevronForwardName } from '../../i18n';

interface LinkRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
  showChevron?: boolean;
  rightText?: string;
}

export default function LinkRow({
  icon,
  iconColor,
  label,
  description,
  onPress,
  danger = false,
  showChevron = true,
  rightText,
}: LinkRowProps) {
  const { isRTL } = useTranslation();
  const resolvedIconColor = iconColor ?? (danger ? colors.status.errorDark : colors.text.secondary);
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <TouchableOpacity
      style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: resolvedIconColor + '12' }]}>
          <Ionicons name={icon} size={18} color={resolvedIconColor} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.label, { textAlign }, danger && styles.dangerLabel]}>{label}</Text>
        {description ? (
          <Text
            style={[
              styles.description,
              { textAlign },
              danger && styles.dangerDescription,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {rightText ? (
        <Text style={styles.rightText}>{rightText}</Text>
      ) : null}
      {showChevron && (
        <Ionicons
          name={getChevronForwardName(isRTL)}
          size={18}
          color={danger ? colors.status.error : colors.text.tertiary}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: spacing.md,
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
    marginEnd: spacing.sm,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  dangerLabel: {
    color: colors.status.errorDark,
  },
  description: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dangerDescription: {
    color: colors.status.error,
  },
  rightText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginEnd: spacing.xs,
  },
});

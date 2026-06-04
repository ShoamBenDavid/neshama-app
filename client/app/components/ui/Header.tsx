import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTranslation, getChevronBackName } from '../../i18n';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  large?: boolean;
  /** Text/icon tint override (e.g. for dark backgrounds). */
  tintColor?: string;
}

/**
 * Detail-screen header. Restyled with a circular back button that matches the
 * redesigned tab bar's softer aesthetics.
 */
export default function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  large = false,
  tintColor,
}: HeaderProps) {
  const navigation = useNavigation();
  const { isRTL } = useTranslation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const textColor = tintColor ?? colors.text.primary;
  const subtitleColor = tintColor ? `${tintColor}CC` : colors.text.muted;

  return (
    <View style={styles.container}>
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconCircle}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name={getChevronBackName(isRTL)} size={22} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconCircle} />
        )}

        <View style={styles.titleContainer}>
          <Text style={[large ? styles.titleLarge : styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightAction}>{rightAction}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
  },
  titleLarge: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  rightAction: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

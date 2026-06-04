import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import Button from './Button';
import { useTranslation } from '../../i18n';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorState({
  message,
  onRetry,
  fullScreen = true,
}: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline-outline" size={44} color={colors.status.error} />
      </View>
      <Text style={styles.title}>{t('common.oops')}</Text>
      <Text style={styles.message}>{message ?? t('common.somethingWentWrong')}</Text>
      {onRetry && (
        <View style={styles.buttonContainer}>
          <Button
            title={t('common.tryAgain')}
            onPress={onRetry}
            variant="outline"
            size="sm"
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.status.error + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
});

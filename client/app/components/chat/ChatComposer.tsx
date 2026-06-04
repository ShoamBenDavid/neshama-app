import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface ChatComposerProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onBreathShortcut?: () => void;
  isLoading?: boolean;
  bottomInset?: number;
}

export default function ChatComposer({
  value,
  onChange,
  onSend,
  onBreathShortcut,
  isLoading,
  bottomInset = 0,
}: ChatComposerProps) {
  const { t, isRTL } = useTranslation();
  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(bottomInset, spacing.md) },
      ]}
    >
      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {onBreathShortcut && (
          <TouchableOpacity
            onPress={onBreathShortcut}
            style={styles.shortcut}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('chat.breathShortcut')}
          >
            <Ionicons name="leaf-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.inputWrap}>
          <TextInput
            style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.text.tertiary}
            value={value}
            onChangeText={onChange}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={onSend}
            blurOnSubmit={false}
          />
        </View>

        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            !canSend && styles.sendBtnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Ionicons
            name={isRTL ? 'arrow-back' : 'arrow-forward'}
            size={20}
            color={colors.text.inverse}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  row: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  shortcut: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.brand.lavenderMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.surfaces.cardMuted,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: colors.text.tertiary,
  },
});

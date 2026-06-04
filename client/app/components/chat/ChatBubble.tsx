import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Refactored chat bubble. The previous implementation forced
 * `direction: 'ltr'` on the row which broke Hebrew alignment. We now derive
 * row direction from the active language so user messages always appear on
 * the reading-end side and assistant messages on the reading-start side.
 */
export default function ChatBubble({ role, content }: ChatBubbleProps) {
  const { t, isRTL } = useTranslation();
  const isUser = role === 'user';

  // In LTR: user on the right (flex-end), assistant on the left (flex-start).
  // In RTL: user on the left visually but right semantically — flex-end stays.
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <View
      style={[
        styles.container,
        { flexDirection: rowDirection },
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{t('chat.avatarLetter')}</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isUser
            ? isRTL
              ? styles.userTailRTL
              : styles.userTailLTR
            : isRTL
              ? styles.assistantTailRTL
              : styles.assistantTailLTR,
        ]}
      >
        <Text
          style={[
            styles.text,
            isUser ? styles.userText : styles.assistantText,
            { writingDirection: 'auto', textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.brand.lavenderMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  avatarText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
  bubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
  },
  userTailLTR: { borderBottomRightRadius: borderRadius.xs },
  userTailRTL: { borderBottomLeftRadius: borderRadius.xs },
  assistantTailLTR: { borderBottomLeftRadius: borderRadius.xs },
  assistantTailRTL: { borderBottomRightRadius: borderRadius.xs },
  text: {
    ...typography.body,
    lineHeight: 22,
  },
  userText: {
    color: colors.text.inverse,
  },
  assistantText: {
    color: colors.text.primary,
  },
});

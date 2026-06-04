import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Header } from '../components/ui';
import GradientBackground from '../components/layout/GradientBackground';
import { ChatBubble, EmptyChatState, ChatComposer } from '../components/chat';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { sendChatMessage, clearChat } from '../store/slices/chatSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<Nav>();
  const { messages, isLoading } = useAppSelector((state) => state.chat);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { t } = useTranslation();

  const submitMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    dispatch(sendChatMessage({ message: trimmed, history }));
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = () => submitMessage(input);
  const handleSuggestion = (prompt: string) => submitMessage(prompt);

  return (
    <GradientBackground gradient="dawn" style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Header
          title={t('chat.title')}
          subtitle={t('chat.subtitle')}
          showBack
          rightAction={
            messages.length > 0 ? (
              <TouchableOpacity
                onPress={() => dispatch(clearChat())}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            ) : undefined
          }
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble role={item.role} content={item.content} />
            )}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <EmptyChatState onSuggestionPress={handleSuggestion} />
            }
          />

          {isLoading && (
            <View style={styles.typingIndicator}>
              <View style={styles.typingPill}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>{t('chat.typing')}</Text>
              </View>
            </View>
          )}

          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onBreathShortcut={() => navigation.navigate('BreathingExercises')}
            isLoading={isLoading}
            bottomInset={insets.bottom}
          />
        </KeyboardAvoidingView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  typingIndicator: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brand.lavenderMist,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  typingText: {
    ...typography.captionMedium,
    color: colors.primary,
  },
});

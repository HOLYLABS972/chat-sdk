import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useOrderChat, getConfig } from '@holylabs/chat-sdk';
import type { WidgetTheme } from '../theme';
import type { WidgetLabels } from '../i18n';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

export interface OrderChatViewProps {
  theme: WidgetTheme;
  orderId: string;
  receiverId?: string;
  labels?: WidgetLabels;
}

export const OrderChatView: React.FC<OrderChatViewProps> = ({ theme, orderId, receiverId, labels }) => {
  const L = labels;
  const { messages, sendMessage, loading, error } = useOrderChat(orderId);
  const listRef = useRef<FlatList<unknown> | null>(null);
  const currentUserId = (() => {
    try {
      return getConfig().currentUser.id;
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    if (!messages.length) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            {L?.couldNotLoadMessages ?? "Couldn't load messages."}
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
            {L?.startConversationTitle ?? 'Start the conversation'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {L?.startConversationBody ?? 'Send a message to coordinate the delivery.'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef as unknown as React.RefObject<FlatList<unknown>>}
          data={messages}
          keyExtractor={(m) => (m as { id: string }).id}
          renderItem={({ item }) => {
            const m = item as {
              id: string;
              senderId: string;
              message: string;
              createdAt?: number;
            };
            return (
              <MessageBubble
                text={m.message}
                isSelf={m.senderId === currentUserId}
                timestamp={m.createdAt}
                theme={theme}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <MessageInput
        theme={theme}
        onSend={async (text) => {
          await sendMessage(text, receiverId ? { receiverId } : undefined);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorText: { fontSize: 14, textAlign: 'center' },
  listContent: { paddingVertical: 12 },
});

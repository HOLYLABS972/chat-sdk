import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Keyboard,
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
  /** Display name of the person on the other side of the chat. When
   *  provided, surfaces as a header strip so the user knows who they're
   *  talking to. Optional — empty header bar when omitted. */
  counterpartName?: string;
  counterpartPhone?: string;
}

export const OrderChatView: React.FC<OrderChatViewProps> = ({
  theme,
  orderId,
  receiverId,
  labels,
  counterpartName,
  counterpartPhone,
}) => {
  const L = labels;
  const { messages, sendMessage, loading, error } = useOrderChat(orderId);
  const listRef = useRef<FlatList<unknown> | null>(null);
  const [kbH, setKbH] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKbH(e?.endCoordinates?.height ?? 0));
    const h = Keyboard.addListener(hideEvt, () => setKbH(0));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);
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
    <View style={{ flex: 1, paddingBottom: kbH > 0 ? kbH : 320 }}>
      {(counterpartName || counterpartPhone) && (
        <View
          style={[
            styles.counterpartBar,
            { backgroundColor: theme.surface, borderBottomColor: theme.border },
          ]}
        >
          {counterpartName ? (
            <Text style={[styles.counterpartName, { color: theme.textPrimary }]} numberOfLines={1}>
              {counterpartName}
            </Text>
          ) : null}
          {counterpartPhone ? (
            <Text style={[styles.counterpartPhone, { color: theme.textSecondary }]} numberOfLines={1}>
              {counterpartPhone}
            </Text>
          ) : null}
        </View>
      )}
      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : messages.length === 0 && error ? (
        // Only blank the list when we truly have nothing to show.
        // Once messages are loaded a transient poll/realtime failure
        // shouldn't hide them — the next refresh will catch up.
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
        autoFocus
        onSend={async (text) => {
          await sendMessage(text, receiverId ? { receiverId } : undefined);
        }}
      />
    </View>
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
  counterpartBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  counterpartName: {
    fontSize: 16,
    fontWeight: '700',
  },
  counterpartPhone: {
    fontSize: 13,
    marginTop: 2,
  },
});

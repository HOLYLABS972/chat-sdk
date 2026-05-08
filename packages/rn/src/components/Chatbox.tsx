import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAdminChat, getConfig } from '@holylabs/chat-sdk';
import type { WidgetTheme } from '../theme';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

export interface ChatboxProps {
  visible: boolean;
  onClose: () => void;
  theme: WidgetTheme;
  brand: { name: string; greeting?: string };
}

/**
 * The chatbox shown when the floating button is tapped.
 * Currently wires to admin/support chat (one-on-one with admin).
 * v0.2 will add the help-center landing screen with FAQ + multiple conversations.
 */
export const Chatbox: React.FC<ChatboxProps> = ({ visible, onClose, theme, brand }) => {
  const { messages, sendMessage, loading, error, adminId } = useAdminChat();
  const listRef = useRef<FlatList<unknown> | null>(null);
  const currentUserId = (() => {
    try {
      return getConfig().currentUser.id;
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    if (!visible || !messages.length) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [visible, messages.length]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.brand, { color: theme.primaryText }]} numberOfLines={1}>
              {brand.name}
            </Text>
            {brand.greeting && (
              <Text style={[styles.greeting, { color: theme.primaryText, opacity: 0.85 }]} numberOfLines={1}>
                {brand.greeting}
              </Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close support chat"
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: 'rgba(255,255,255,0.18)', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.closeIcon, { color: theme.primaryText }]}>×</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {loading && messages.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                Couldn't load messages. Pull to retry.
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>How can we help?</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Send us a message — we usually reply within a few minutes.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef as unknown as React.RefObject<FlatList<unknown>>}
              data={messages}
              keyExtractor={(m) => (m as { id: string }).id}
              renderItem={({ item }) => {
                const m = item as { id: string; senderId?: string; senderUid?: string; message: string; createdAt?: unknown };
                const isSelf = (m.senderUid ?? m.senderId) === currentUserId;
                const ts =
                  typeof m.createdAt === 'number'
                    ? m.createdAt
                    : (m.createdAt as { toMillis?: () => number })?.toMillis?.() ?? undefined;
                return <MessageBubble text={m.message} isSelf={isSelf} timestamp={ts} theme={theme} />;
              }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          <MessageInput
            theme={theme}
            onSend={async (text) => {
              await sendMessage(text);
            }}
            disabled={!adminId && !loading}
            disabledReason={!adminId && !loading ? 'Support is unavailable right now.' : undefined}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brand: {
    fontSize: 17,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
});

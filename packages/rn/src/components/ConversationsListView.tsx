import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useOrderConversations, type OrderConversationRow } from '@holylabs/chat-sdk';
import type { WidgetTheme } from '../theme';
import type { WidgetLabels } from '../i18n';

export interface ConversationsListViewProps {
  theme: WidgetTheme;
  labels?: WidgetLabels;
  onOpenOrderChat: (orderId: string) => void;
  onSendNewMessage: () => void;
}

function formatTime(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export const ConversationsListView: React.FC<ConversationsListViewProps> = ({
  theme,
  labels,
  onOpenOrderChat,
  onSendNewMessage,
}) => {
  const { conversations, loading, error } = useOrderConversations();
  const L = labels;

  // Conversation rows missing both a counterpart name and a last message
  // are uninteresting placeholders (typically created when an order
  // conversation was provisioned but no one's spoken). Filter them out
  // so the user doesn't see "?" / "Tap to open chat" empty rows.
  const visibleConversations = useMemo(
    () =>
      conversations.filter(
        (c) =>
          (c.counterpartName && c.counterpartName.trim().length > 0) ||
          (c.lastMessage && c.lastMessage.trim().length > 0),
      ),
    [conversations],
  );

  // If exactly one real conversation remains after filtering, open it
  // directly so the user lands on the actual chat instead of a list-of-one.
  const autoOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (loading || error) return;
    if (visibleConversations.length !== 1) return;
    const only = visibleConversations[0];
    if (autoOpenedRef.current === only.orderId) return;
    autoOpenedRef.current = only.orderId;
    onOpenOrderChat(only.orderId);
  }, [loading, error, visibleConversations, onOpenOrderChat]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surface }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surface }]}>
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>
          {L?.conversationsError ?? "Couldn't load conversations."}
        </Text>
      </View>
    );
  }
  if (visibleConversations.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.surface }]}>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
          {L?.noConversationsTitle ?? 'No conversations yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {L?.noConversationsBody ??
            "Order chats appear here once you've placed or accepted a delivery."}
        </Text>
        <Pressable
          onPress={onSendNewMessage}
          accessibilityLabel={L?.emptyCta ?? 'Send us a message'}
          style={({ pressed }) => [
            styles.emptyCta,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.emptyCtaText, { color: theme.primaryText }]}>
            {L?.emptyCta ?? 'Send us a message'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={visibleConversations}
      keyExtractor={(c) => c.orderId}
      style={{ flex: 1, backgroundColor: theme.surface }}
      contentContainerStyle={{ paddingVertical: 8 }}
      renderItem={({ item }) => <Row item={item} theme={theme} onPress={() => onOpenOrderChat(item.orderId)} />}
      ItemSeparatorComponent={() => (
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      )}
    />
  );
};

const Row: React.FC<{ item: OrderConversationRow; theme: WidgetTheme; onPress: () => void }> = ({
  item,
  theme,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Open conversation with ${item.counterpartName}`}
      style={({ pressed }) => [styles.row, { backgroundColor: theme.background, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Text style={[styles.avatarText, { color: theme.primaryText }]}>
          {initials(item.counterpartName)}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.counterpartName}
          </Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {item.lastAtMs ? formatTime(item.lastAtMs) : ''}
          </Text>
        </View>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.preview,
              { color: item.unread ? theme.textPrimary : theme.textSecondary },
              item.unread ? { fontWeight: '600' as const } : null,
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Tap to open chat'}
          </Text>
          {item.unread ? (
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  preview: {
    flex: 1,
    fontSize: 13,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
});

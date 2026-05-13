import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type ApiMessage } from '../../api/client';
import { subscribeToConversation } from '../../api/realtime';
import { getConfig, subscribeToConfigChanges } from '../config';
import type { OrderChatMessage, OrderMessageReplyRef, TypingUser } from '../services/OrderMessageService';

export interface UseOrderChatResult {
  messages: OrderChatMessage[];
  loading: boolean;
  error: Error | null;
  typingUsers: TypingUser[];
  sendMessage: (
    text: string,
    opts?: { receiverId?: string; photoUrl?: string; replyTo?: OrderMessageReplyRef },
  ) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  markAsRead: () => Promise<void>;
}

/**
 * Translate the REST API's `messages` row into the legacy
 * OrderChatMessage shape the UI components consume. Most fields map
 * 1:1; we only need to translate message_type and the timestamp.
 */
function toOrderChatMessage(m: ApiMessage): OrderChatMessage {
  return {
    id: m.id,
    senderId: m.sender_id,
    receiverId: m.receiver_id ?? '',
    message: m.body ?? '',
    messageType: m.message_type === 'image' ? 'IMAGE' : 'TEXT',
    photoUrl: m.media_url ?? undefined,
    isMessageRead: false, // best-effort — REST doesn't surface read receipts yet
    createdAt: new Date(m.created_at).getTime(),
  };
}

/**
 * Subscribe to a per-order chat. Idempotent on (orderId, currentUser):
 * the hook opens/creates a `kind='order'` conversation keyed by
 * `external_ref=orderId`, fetches history, and subscribes to Realtime
 * broadcasts for live appends.
 *
 * Typing indicators and read receipts are no-ops in v1 — Realtime
 * broadcasts of those events come back in a follow-up minor.
 */
export function useOrderChat(orderId: string | null | undefined): UseOrderChatResult {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cfgVersion, setCfgVersion] = useState(0);

  useEffect(() => subscribeToConfigChanges(() => setCfgVersion((v) => v + 1)), []);

  const convIdRef = useRef<string | null>(null);
  convIdRef.current = conversationId;

  useEffect(() => {
    let cancelled = false;
    let unsubRealtime: (() => void) | undefined;

    if (!orderId) {
      setLoading(false);
      setMessages([]);
      setConversationId(null);
      return;
    }

    (async () => {
      try {
        const cfg = getConfig();
        const userId = cfg.currentUser.id;
        if (!userId) {
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);

        // Make sure the current user is registered so they can be a
        // participant. Idempotent on (tenant_id, user_id).
        await api
          .upsertUser({
            user_id: userId,
            name: cfg.currentUser.name,
            email: cfg.currentUser.email,
            role: cfg.currentUser.role ?? 'customer',
          })
          .catch(() => {
            /* non-fatal */
          });

        // Get-or-create the conversation. Both driver and customer
        // will land here independently; whoever calls first creates
        // the row, the other side reuses it.
        const { conversation } = await api.getOrCreateConversation({
          kind: 'order',
          external_ref: orderId,
          participants: [userId],
        });
        if (cancelled) return;
        setConversationId(conversation.id);

        const { messages: history } = await api.listMessages(conversation.id, {
          limit: 100,
        });
        if (cancelled) return;
        setMessages(history.map(toOrderChatMessage));
        setLoading(false);

        unsubRealtime = subscribeToConversation(
          conversation.id,
          (msg) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, toOrderChatMessage(msg)];
            });
          },
          (err) => setError(err),
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubRealtime?.();
    };
  }, [orderId, cfgVersion]);

  const sendMessage = useCallback<UseOrderChatResult['sendMessage']>(
    async (text, opts) => {
      const convId = convIdRef.current;
      if (!convId) throw new Error('order conversation not ready yet');
      const cfg = getConfig();
      const userId = cfg.currentUser.id;
      if (!userId) throw new Error('no current user');
      const { message } = await api.sendMessage(convId, {
        sender_id: userId,
        body: text,
        receiver_id: opts?.receiverId,
        message_type: opts?.photoUrl ? 'image' : 'text',
        media_url: opts?.photoUrl,
        reply_to: opts?.replyTo?.id,
      });
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, toOrderChatMessage(message)],
      );
    },
    [],
  );

  return {
    messages,
    loading,
    error,
    typingUsers: [], // not supported in v1
    sendMessage,
    setTyping: () => {
      /* no-op; typing broadcasts coming in a follow-up */
    },
    markAsRead: async () => {
      /* no-op; read receipts coming in a follow-up */
    },
  };
}

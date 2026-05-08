import { useEffect, useRef, useState, useCallback } from 'react';
import {
  subscribeToOrderMessages,
  addOrderMessage,
  markOrderMessagesAsRead,
  setOrderTyping,
  subscribeToOrderTyping,
  type OrderChatMessage,
  type TypingUser,
} from '../services/OrderMessageService';
import { getConfig } from '../config';

export interface UseOrderChatResult {
  messages: OrderChatMessage[];
  loading: boolean;
  error: Error | null;
  typingUsers: TypingUser[];
  sendMessage: (text: string, opts?: { receiverId?: string; photoUrl?: string }) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  markAsRead: () => Promise<void>;
}

/**
 * Subscribe to an order's chat. Returns messages, typing users, and helpers
 * for sending / read receipts. Caller is responsible for rendering UI.
 */
export function useOrderChat(orderId: string | null | undefined): UseOrderChatResult {
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    const unsubMsg = subscribeToOrderMessages(
      orderId,
      (m) => {
        setMessages(m);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    const cfg = getConfig();
    const unsubTyping = subscribeToOrderTyping(orderId, cfg.currentUser.id, setTypingUsers);

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [orderId]);

  const sendMessage = useCallback<UseOrderChatResult['sendMessage']>(
    async (text, opts) => {
      if (!orderId) throw new Error('useOrderChat: orderId required');
      const cfg = getConfig();
      const receiverId = opts?.receiverId ?? '';
      await addOrderMessage(orderId, {
        senderId: cfg.currentUser.id,
        receiverId,
        message: text,
        messageType: opts?.photoUrl ? 'IMAGE' : 'TEXT',
        photoUrl: opts?.photoUrl,
      });
    },
    [orderId],
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!orderId) return;
      const cfg = getConfig();
      void setOrderTyping(orderId, cfg.currentUser.id, isTyping, cfg.currentUser.name);
      if (isTyping) {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          void setOrderTyping(orderId, cfg.currentUser.id, false);
        }, 4000);
      }
    },
    [orderId],
  );

  const markAsRead = useCallback(async () => {
    if (!orderId) return;
    const cfg = getConfig();
    await markOrderMessagesAsRead(orderId, cfg.currentUser.id);
  }, [orderId]);

  return { messages, loading, error, typingUsers, sendMessage, setTyping, markAsRead };
}

/**
 * STUB — v1.0.0 of @holylabs/chat-sdk dropped the Firebase-backed order
 * chat in favor of the REST-based support chat. Order chats (multi-
 * participant, per-resource) will return in a future minor with a
 * REST + Realtime implementation. Until then, the hook returns a
 * permanent loading/empty state so existing UI components compile
 * but never render messages.
 */
import { useState } from 'react';
import type { OrderChatMessage, TypingUser } from '../services/OrderMessageService';

export interface UseOrderChatResult {
  messages: OrderChatMessage[];
  loading: boolean;
  error: Error | null;
  typingUsers: TypingUser[];
  sendMessage: (text: string, opts?: { receiverId?: string; photoUrl?: string }) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  markAsRead: () => Promise<void>;
}

const NOT_IMPLEMENTED = new Error(
  '[chat-sdk] order chat is not available in v1.0.0 — use support chat instead.',
);

export function useOrderChat(_orderId: string | null | undefined): UseOrderChatResult {
  const [error] = useState<Error | null>(null);
  return {
    messages: [],
    loading: false,
    error,
    typingUsers: [],
    sendMessage: async () => {
      throw NOT_IMPLEMENTED;
    },
    setTyping: () => {
      /* no-op */
    },
    markAsRead: async () => {
      /* no-op */
    },
  };
}

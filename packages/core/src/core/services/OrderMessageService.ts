/**
 * STUB — Firebase-backed order message service replaced in v1.0.0.
 * Type exports preserved so the RN package's OrderChatView still
 * compiles; functions throw a clear error if anyone calls them.
 */

export interface OrderMessageReplyRef {
  id: string;
  senderId: string;
  preview: string;
}

export interface OrderChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE';
  photoUrl?: string;
  isMessageRead?: boolean;
  createdAt: number;
  replyTo?: OrderMessageReplyRef;
}

export interface TypingUser {
  userId: string;
  startedAt: number;
}

export const TYPING_STALE_MS = 5000;

const NOT_IMPLEMENTED = new Error(
  '[chat-sdk] order chat is not available in v1.0.0. Use support chat (useAdminChat) instead.',
);

export function subscribeToOrderMessages(): () => void {
  return () => {
    /* no-op */
  };
}
export function addOrderMessage(): Promise<string> {
  return Promise.reject(NOT_IMPLEMENTED);
}
export function editOrderMessage(): Promise<void> {
  return Promise.reject(NOT_IMPLEMENTED);
}
export function deleteOrderMessage(): Promise<void> {
  return Promise.reject(NOT_IMPLEMENTED);
}
export function markOrderMessagesAsRead(): Promise<void> {
  return Promise.resolve();
}
export function setOrderTyping(): void {
  /* no-op */
}
export function subscribeToOrderTyping(): () => void {
  return () => {
    /* no-op */
  };
}

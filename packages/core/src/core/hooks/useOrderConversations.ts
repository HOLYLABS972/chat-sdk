/**
 * STUB — see useOrderChat.ts. Per-order conversation listing is paused
 * in v1.0.0 pending the REST rewrite of the order-chat hooks.
 */

export interface OrderConversationRow {
  orderId: string;
  participantIds: string[];
  lastMessage?: string;
  lastAt?: number;
  /** Alias of lastAt — legacy field name from the Firestore era. */
  lastAtMs?: number;
  /** Display name of the other party (driver for customers, customer
   *  for drivers). Optional — kept for UI compat with v0.x. */
  counterpartName?: string;
  unread?: number;
}

export interface UseOrderConversationsResult {
  /** Legacy alias — preserved for UI compat with v0.x. */
  conversations: OrderConversationRow[];
  /** New canonical name. Identical contents to `conversations`. */
  rows: OrderConversationRow[];
  loading: boolean;
  error: Error | null;
}

export function useOrderConversations(): UseOrderConversationsResult {
  return { conversations: [], rows: [], loading: false, error: null };
}

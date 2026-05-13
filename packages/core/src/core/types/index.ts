export type ChatRole = 'customer' | 'driver' | 'admin' | 'support';

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  role?: ChatRole;
  avatarUrl?: string;
  /** FCM registration tokens for this user's device(s). Forwarded to
   *  chat-admin on upsert so the backend can fan out push
   *  notifications without needing to look up tokens elsewhere
   *  (Firestore, etc.). Multiple entries are fine — chat-admin
   *  de-dupes on insert. */
  fcmTokens?: string[];
}

export interface TicketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: ChatRole;
  text?: string;
  imageUrl?: string;
  createdAt: Date | number;
  readBy?: string[];
}

export interface OrderChatAccess {
  canRead: boolean;
  canWrite: boolean;
  reason?: string;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'pickedUp'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface OrderRef {
  id: string;
  status: OrderStatus;
  customerId: string;
  driverId?: string;
  createdAt: Date | number;
}

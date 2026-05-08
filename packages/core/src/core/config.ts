import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { ChatUser } from './types';
import type { BillingConfig } from '../billing/types';

export interface ChatSDKConfig {
  firestore: Firestore;
  storage?: FirebaseStorage;
  tenantId: string;
  currentUser: ChatUser;
  billing?: BillingConfig;
  collections?: Partial<CollectionPaths>;
  onSendNotification?: (params: { toUserId: string; title: string; body: string; data?: Record<string, string> }) => void | Promise<void>;
  onSendWebhook?: (event: 'message_sent' | 'conversation_started', payload: Record<string, unknown>) => void | Promise<void>;
}

export interface CollectionPaths {
  orders: string;
  orderMessages: string;
  supportTickets: string;
  supportMessages: string;
  adminConversations: string;
  adminMessages: string;
  billing: string;
}

export const DEFAULT_COLLECTIONS: CollectionPaths = {
  orders: 'orders',
  orderMessages: 'orderMessages',
  supportTickets: 'supportTickets',
  supportMessages: 'supportMessages',
  adminConversations: 'adminConversations',
  adminMessages: 'adminMessages',
  billing: 'chatBilling',
};

let _config: ChatSDKConfig | null = null;

export function initChatSDK(config: ChatSDKConfig): void {
  _config = config;
}

/**
 * Update the current user without re-initializing the whole SDK.
 * Use after login/logout when Firestore + tenantId stay the same.
 */
export function setCurrentUser(user: ChatUser): void {
  if (!_config) {
    throw new Error('[chat-sdk] setCurrentUser called before initChatSDK');
  }
  _config = { ..._config, currentUser: user };
}

export function getConfig(): ChatSDKConfig {
  if (!_config) {
    throw new Error(
      '[chat-sdk] SDK not initialized. Call initChatSDK({ firestore, tenantId, currentUser }) before using hooks or services.',
    );
  }
  return _config;
}

export function getCollections(): CollectionPaths {
  const cfg = getConfig();
  return { ...DEFAULT_COLLECTIONS, ...cfg.collections };
}

export function isInitialized(): boolean {
  return _config !== null;
}

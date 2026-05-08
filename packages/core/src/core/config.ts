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
const _listeners = new Set<() => void>();

export function initChatSDK(config: ChatSDKConfig): void {
  _config = config;
  _listeners.forEach((l) => l());
}

/**
 * Update the current user without re-initializing the whole SDK.
 * Use after login/logout when Firestore + tenantId stay the same. Hooks that
 * depend on currentUser.id will re-subscribe automatically.
 */
export function setCurrentUser(user: ChatUser): void {
  if (!_config) {
    throw new Error('[chat-sdk] setCurrentUser called before initChatSDK');
  }
  _config = { ..._config, currentUser: user };
  _listeners.forEach((l) => l());
}

/**
 * Subscribe to config changes (init / setCurrentUser). Used internally by
 * hooks to re-run their effects when the current user is set after mount.
 */
export function subscribeToConfigChanges(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
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

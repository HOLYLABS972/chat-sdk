import type { ChatUser } from './types';

/**
 * Public SDK configuration. v1.0.0 dropped Firebase and now talks to a
 * chat-admin REST API + Supabase Realtime broadcasts. Consumers only
 * need an api_key (from chat-admin → Settings → API keys); the SDK
 * fetches the rest from /api/v1/config on init.
 */
export interface ChatSDKConfig {
  /** Tenant api_key — `pk_live_…` or `pk_test_…`. Required. */
  apiKey: string;
  /** Override the chat-admin host. Defaults to the production URL.
   *  Useful for self-hosters and for pointing local dev at staging. */
  baseUrl?: string;
  /** Identity of the user this SDK instance represents. Mutable —
   *  hot-swap via setCurrentUser() when the app's auth state changes. */
  currentUser: ChatUser;
}

let _config: ChatSDKConfig | null = null;
const _listeners = new Set<() => void>();

export const DEFAULT_BASE_URL = "https://chat-admin-theta.vercel.app";

export function initChatSDK(config: ChatSDKConfig): void {
  if (!config.apiKey) {
    throw new Error('[chat-sdk] initChatSDK called without apiKey');
  }
  _config = config;
  _listeners.forEach((l) => l());
}

/**
 * Update the current user without re-initializing the whole SDK.
 * Use after login/logout. Hooks that depend on currentUser.id will
 * re-subscribe automatically.
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
      '[chat-sdk] SDK not initialized. Call initChatSDK({ apiKey, currentUser }) before using hooks or services.',
    );
  }
  return _config;
}

export function getBaseUrl(): string {
  return (_config?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export function isInitialized(): boolean {
  return _config !== null;
}

// ---------------------------------------------------------------------
// Legacy compatibility — preserved at the type level so imports don't
// break across the major upgrade. v1 ignores these fields entirely.
// ---------------------------------------------------------------------
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
export function getCollections(): CollectionPaths {
  return DEFAULT_COLLECTIONS;
}

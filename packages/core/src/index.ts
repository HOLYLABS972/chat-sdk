// Public API for @holylabs/chat-sdk v1.0.0
//
// Architecture: SDK talks to chat-admin REST + Supabase Realtime.
// Firebase is no longer required on the consumer side. Order chats
// are paused until the REST rewrite of those hooks lands.

// Init / config
export {
  initChatSDK,
  setCurrentUser,
  getConfig,
  getBaseUrl,
  isInitialized,
  DEFAULT_COLLECTIONS,
} from './core/config';
export type { ChatSDKConfig, CollectionPaths } from './core/config';

// REST + Realtime under the hood — exported for advanced consumers
// who want to call the API directly instead of via hooks.
export { api, ApiError } from './api/client';
export type {
  ApiUser,
  ApiConversation,
  ApiMessage,
  ApiConfig,
} from './api/client';
export { subscribeToConversation } from './api/realtime';

// Types
export type {
  ChatRole,
  ChatUser,
  TicketMessage,
  OrderChatAccess as OrderChatAccessType,
  OrderRef,
  OrderStatus,
} from './core/types';

// Order chat
export {
  subscribeToOrderMessages,
  addOrderMessage,
  editOrderMessage,
  deleteOrderMessage,
  markOrderMessagesAsRead,
  setOrderTyping,
  subscribeToOrderTyping,
  TYPING_STALE_MS,
} from './core/services/OrderMessageService';
export type {
  OrderChatMessage,
  OrderMessageReplyRef,
  TypingUser,
} from './core/services/OrderMessageService';

// Admin chat
export {
  getAdminChatUid,
  sendAdminMessage,
  subscribeToAdminMessages,
} from './core/services/AdminMessageService';
export type { AdminChatMessage } from './core/services/AdminMessageService';

// Access rules
export {
  getOrderChatAccess,
  getChatRole,
  POST_COMPLETION_WINDOW_MS,
} from './core/chatAccess';
export type { OrderShape, ParticipantRole, OrderChatAccess } from './core/chatAccess';

// Hooks
export { useOrderChat } from './core/hooks/useOrderChat';
export type { UseOrderChatResult } from './core/hooks/useOrderChat';
export { useAdminChat } from './core/hooks/useAdminChat';
export type { UseAdminChatResult } from './core/hooks/useAdminChat';
export { useOrderConversations } from './core/hooks/useOrderConversations';
export type {
  UseOrderConversationsResult,
  OrderConversationRow,
} from './core/hooks/useOrderConversations';

// Billing
export {
  getBillingState,
  getPlanLimits,
  recordConversationStart,
  canStartNewConversation,
  canSendMessageInExistingConversation,
  DEFAULT_PLAN_LIMITS,
} from './billing';
export type {
  BillingPlan,
  BillingConfig,
  BillingState,
  PlanLimits,
  GateDecision,
} from './billing';

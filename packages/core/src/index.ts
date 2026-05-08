// Public API for @holylabs/chat-sdk

// Init / config
export { initChatSDK, setCurrentUser, getConfig, isInitialized, DEFAULT_COLLECTIONS } from './core/config';
export type { ChatSDKConfig, CollectionPaths } from './core/config';

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

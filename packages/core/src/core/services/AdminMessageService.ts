/**
 * STUB — Firebase-backed admin chat service replaced in v1.0.0.
 * All real implementations now live behind the REST API and are
 * surfaced through the `useAdminChat` hook. The legacy export shape
 * is preserved so external callers that imported the service
 * directly fail loudly with a clear message rather than silently
 * loading no-op Firestore code.
 */

export interface AdminChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  title?: string;
  attachments?: string[];
  createdAt: unknown;
  senderUid?: string;
}

const NOT_IMPLEMENTED = new Error(
  '[chat-sdk] AdminMessageService is deprecated in v1.0.0. Use the useAdminChat hook instead — it talks to chat-admin REST + Realtime under the hood.',
);

export function getAdminChatUid(): Promise<string | null> {
  return Promise.resolve(null);
}
export function sendAdminMessage(): Promise<string> {
  return Promise.reject(NOT_IMPLEMENTED);
}
export function subscribeToAdminMessages(): () => void {
  return () => {
    /* no-op */
  };
}

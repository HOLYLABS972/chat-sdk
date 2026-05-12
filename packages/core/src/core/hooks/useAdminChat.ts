import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type ApiMessage } from '../../api/client';
import { subscribeToConversation } from '../../api/realtime';
import { getConfig, subscribeToConfigChanges } from '../config';

/**
 * Public shape preserved from the pre-1.0 Firestore implementation so
 * existing UI components don't need to change. `adminId` is now the
 * conversation id (we route support chats through `kind='support'`
 * conversations, not through `messages/{driver}/{admin}` paths).
 *
 * `messages` are returned in chronological order (oldest first).
 */
export interface AdminChatMessage {
  id: string;
  senderId: string;
  senderUid: string;
  receiverId: string | null;
  message: string;
  createdAt: number; // ms since epoch — matches the old SDK's shape
}

export interface UseAdminChatResult {
  adminId: string | null;
  messages: AdminChatMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<void>;
}

function toAdminMessage(m: ApiMessage): AdminChatMessage {
  return {
    id: m.id,
    senderId: m.sender_id,
    senderUid: m.sender_id,
    receiverId: m.receiver_id,
    message: m.body ?? '',
    createdAt: new Date(m.created_at).getTime(),
  };
}

/**
 * Subscribe to the current user's chat with admins. Backed by the
 * chat-admin REST API for history + send, and Supabase Realtime for
 * live updates. Auto re-subscribes when setCurrentUser is called.
 */
export function useAdminChat(): UseAdminChatResult {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cfgVersion, setCfgVersion] = useState(0);

  // Bump cfgVersion whenever initChatSDK or setCurrentUser fires so
  // the subscription effect re-runs with the new identity.
  useEffect(() => subscribeToConfigChanges(() => setCfgVersion((v) => v + 1)), []);

  // Stable conversation id ref so sendMessage doesn't capture a stale one.
  const convIdRef = useRef<string | null>(null);
  convIdRef.current = conversationId;

  useEffect(() => {
    let cancelled = false;
    let unsubRealtime: (() => void) | undefined;

    (async () => {
      try {
        const cfg = getConfig();
        const userId = cfg.currentUser.id;
        if (!userId) {
          // No user yet — wait for setCurrentUser, which bumps cfgVersion.
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // Make sure the user is registered (idempotent) before we open
        // a support conversation. Skips the round-trip when the SDK
        // user is anonymous — but the typical flow has setCurrentUser
        // called from the app on login.
        await api
          .upsertUser({
            user_id: userId,
            name: cfg.currentUser.name,
            email: cfg.currentUser.email,
            role: cfg.currentUser.role ?? 'customer',
          })
          .catch(() => {
            /* non-fatal — conversation create still works server-side */
          });
        if (cancelled) return;

        // One support conversation per user. `external_ref = userId`
        // makes the get-or-create idempotent across app reinstalls.
        const { conversation } = await api.getOrCreateConversation({
          kind: 'support',
          external_ref: userId,
          participants: [userId],
        });
        if (cancelled) return;
        setConversationId(conversation.id);

        // Fetch initial history.
        const { messages: history } = await api.listMessages(conversation.id, {
          limit: 50,
        });
        if (cancelled) return;
        setMessages(history.map(toAdminMessage));
        setLoading(false);

        // Subscribe for real-time appends.
        unsubRealtime = subscribeToConversation(
          conversation.id,
          (msg) => {
            setMessages((prev) => {
              // De-dup against the optimistic / history copy.
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, toAdminMessage(msg)];
            });
          },
          (err) => setError(err),
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubRealtime?.();
    };
  }, [cfgVersion]);

  const sendMessage = useCallback(async (text: string) => {
    const convId = convIdRef.current;
    if (!convId) throw new Error('support conversation not ready yet');
    const cfg = getConfig();
    const userId = cfg.currentUser.id;
    if (!userId) throw new Error('no current user');
    const { message } = await api.sendMessage(convId, {
      sender_id: userId,
      body: text,
    });
    // Append the just-sent message immediately. Realtime will echo
    // the same row back; the dedup in the subscribe handler keeps us
    // at exactly one copy.
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, toAdminMessage(message)],
    );
  }, []);

  return {
    adminId: conversationId,
    messages,
    loading,
    error,
    sendMessage,
  };
}

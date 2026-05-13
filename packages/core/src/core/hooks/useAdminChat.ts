import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type ApiMessage } from '../../api/client';
import { getConfig, subscribeToConfigChanges } from '../config';

// AppState is React Native only. Lazy-require so this SDK file still works
// when imported in web or test environments.
type AppStateLike = {
  currentState: string;
  addEventListener: (
    event: 'change',
    cb: (state: string) => void,
  ) => { remove: () => void };
};
function loadAppState(): AppStateLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require('react-native');
    return RN?.AppState ?? null;
  } catch {
    return null;
  }
}

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
  /** Refetch message history. Safe to call any time. */
  refresh: () => Promise<void>;
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

/** How often we re-fetch history while the chat is mounted and the app
 *  is in the foreground. The backend reads from HubSpot Conversations
 *  on each call (no Supabase mirror) so this directly translates to
 *  HubSpot API usage per chat session. Bump cautiously — HubSpot's
 *  rate limit is 100 calls / 10s for private apps. */
const POLL_INTERVAL_MS = 5_000;

/**
 * Subscribe to the current user's chat with admins. Backed by the
 * chat-admin REST API for history + send. Live updates come from
 * polling at POLL_INTERVAL_MS while the chat is mounted and the app
 * is in the foreground — the chat-admin backend reads from HubSpot
 * Conversations as the source of truth, so polling reflects whatever
 * the agent has done in the HubSpot UI as of the last fetch.
 *
 * Realtime websocket subscriptions were removed in this version; they
 * coupled the SDK to Supabase and silently overrode successful loads
 * when the websocket failed transiently. Polling is simpler and lets
 * the backend swap data sources (Supabase ↔ HubSpot) transparently.
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
            // Forward FCM tokens so chat-admin can send push notifications
            // directly without needing to look the token up elsewhere.
            fcm_tokens: cfg.currentUser.fcmTokens,
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
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cfgVersion]);

  // Refresh on demand: re-fetch history for the current conversation.
  // Used by the foreground-resume hook + the poll loop. Errors from a
  // single failed poll are intentionally NOT promoted to the public
  // `error` state — the next poll will retry, and we don't want a
  // transient failure to wipe out an already-loaded message list.
  const refresh = useCallback(async () => {
    const convId = convIdRef.current;
    if (!convId) return;
    try {
      const { messages: history } = await api.listMessages(convId, { limit: 50 });
      setMessages(history.map(toAdminMessage));
      // A successful refresh clears any stale error so the UI can recover.
      setError(null);
    } catch (err) {
      // Only set error if we have nothing else to show. Once messages
      // are on screen the user is better served by silent retry.
      if (convIdRef.current === convId) {
        setMessages((current) => {
          if (current.length === 0) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
          return current;
        });
      }
    }
  }, []);

  // Poll while the chat is mounted. Pauses while the app is
  // backgrounded; resumes (and does an immediate refresh) on return.
  useEffect(() => {
    if (!conversationId) return;
    const AppState = loadAppState();
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let appStateSub: { remove: () => void } | null = null;

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        void refresh();
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Initial state: active by default in non-RN environments.
    const currentState = AppState?.currentState ?? 'active';
    if (currentState === 'active') start();

    if (AppState) {
      appStateSub = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          // Immediate catch-up on resume, then resume the cadence.
          void refresh();
          start();
        } else {
          stop();
        }
      });
    }

    return () => {
      stop();
      appStateSub?.remove();
    };
  }, [conversationId, refresh]);

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
    // Append the just-sent message immediately so the UI feels snappy.
    // The next poll will reconcile against HubSpot's canonical copy;
    // we de-dup by id so no double-rendering.
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
    refresh,
  };
}

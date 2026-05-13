import { useEffect, useState } from 'react';
import { api, type ApiConversation } from '../../api/client';
import { getConfig, subscribeToConfigChanges } from '../config';

export interface OrderConversationRow {
  orderId: string;
  participantIds: string[];
  lastMessage?: string;
  lastAt?: number;
  /** Alias of lastAt — kept for UI compat with v0.x. */
  lastAtMs?: number;
  /** Display name of the other participant. Filled in best-effort
   *  client-side; empty when we don't have their profile cached. */
  counterpartName?: string;
  unread?: number;
}

export interface UseOrderConversationsResult {
  /** Legacy alias preserved for UI compat with v0.x. */
  conversations: OrderConversationRow[];
  /** Canonical name for the same list. */
  rows: OrderConversationRow[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

function toRow(conv: ApiConversation, currentUserId: string): OrderConversationRow {
  const lastAt = conv.last_at ? new Date(conv.last_at).getTime() : undefined;
  const counterpart = conv.participants.find((p) => p !== currentUserId);
  return {
    orderId: conv.external_ref ?? conv.id,
    participantIds: conv.participants,
    lastMessage: conv.last_message ?? undefined,
    lastAt,
    lastAtMs: lastAt,
    counterpartName: counterpart, // raw user id; UI can replace once it has profile data
    unread: 0,
  };
}

/**
 * List order conversations the current user participates in.
 * Re-fetches on setCurrentUser. Caller can manually `refresh()` —
 * useful after sending a new message or after navigation focus.
 *
 * Realtime updates aren't subscribed here yet (each conversation
 * already has its own broadcast channel; this hook just shows the
 * list). For now, callers can poll or refresh on screen focus.
 */
export function useOrderConversations(): UseOrderConversationsResult {
  const [rows, setRows] = useState<OrderConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cfgVersion, setCfgVersion] = useState(0);

  useEffect(() => subscribeToConfigChanges(() => setCfgVersion((v) => v + 1)), []);

  const load = async () => {
    try {
      const cfg = getConfig();
      const userId = cfg.currentUser.id;
      if (!userId) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { conversations } = await api.listConversations({ user_id: userId, kind: 'order' });
      setRows(conversations.map((c) => toRow(c, userId)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgVersion]);

  return {
    conversations: rows,
    rows,
    loading,
    error,
    refresh: load,
  };
}

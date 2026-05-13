import { api, type ApiConfig, type ApiMessage } from './client';

/**
 * Realtime: subscribe to per-conversation broadcast channels from
 * chat-admin's Supabase backend. The first subscriber lazily fetches
 * /api/v1/config to get the Supabase URL + anon key, then creates a
 * shared Supabase client cached for the rest of the session.
 *
 * `@supabase/supabase-js` is a peer dep. We lazy-require it so apps
 * that never open a chat don't pay the bundle cost — and so the SDK
 * still imports cleanly in environments where the dep happens to be
 * missing (the subscribe call just resolves to a no-op unsubscribe).
 */

type SupabaseClientLike = {
  channel: (name: string) => {
    on: (event: string, filter: object, cb: (msg: { payload: unknown }) => void) => {
      subscribe: () => unknown;
    };
    unsubscribe: () => Promise<unknown>;
  };
  removeChannel: (channel: unknown) => Promise<unknown>;
};

let _client: SupabaseClientLike | null = null;
let _configPromise: Promise<ApiConfig> | null = null;

function loadSupabaseModule():
  | typeof import('@supabase/supabase-js')
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@supabase/supabase-js');
  } catch {
    return null;
  }
}

async function getOrCreateClient(): Promise<SupabaseClientLike | null> {
  if (_client) return _client;
  const mod = loadSupabaseModule();
  if (!mod) {
    // Peer dep missing — log once, then act as if Realtime is disabled.
    if (typeof console !== 'undefined') {
      console.warn(
        '[chat-sdk] @supabase/supabase-js is not installed. Realtime updates disabled; messages will only appear after re-fetching.',
      );
    }
    return null;
  }
  if (!_configPromise) _configPromise = api.config();
  const cfg = await _configPromise;
  _client = mod.createClient(cfg.realtime.supabase_url, cfg.realtime.supabase_anon_key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  }) as unknown as SupabaseClientLike;
  return _client;
}

/**
 * Subscribe to new-message broadcasts for a single conversation.
 * Returns an unsubscribe fn. Safe to call before the SDK has received
 * its initial config — the subscription kicks in once the client is
 * ready and stays active until the unsubscribe fires.
 */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (msg: ApiMessage) => void,
  onError?: (err: Error) => void,
): () => void {
  let unsubscribed = false;
  let channel: ReturnType<SupabaseClientLike['channel']> | null = null;

  (async () => {
    const client = await getOrCreateClient();
    if (!client || unsubscribed) return;
    channel = client.channel(`conv:${conversationId}`);
    try {
      channel
        .on('broadcast', { event: 'message' }, ({ payload }) => {
          const msg = (payload as { message?: ApiMessage })?.message;
          if (msg) onMessage(msg);
        })
        .subscribe();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    unsubscribed = true;
    if (channel && _client) {
      // Fire-and-forget cleanup. removeChannel is idempotent.
      _client.removeChannel(channel).catch(() => {});
    }
  };
}

/**
 * Subscribe to `typing` broadcasts on a conversation. onTyping fires
 * each time someone sends a typing signal. Caller is responsible for
 * timing out stale typers (recommended: clear ~3s after the last
 * event for a given senderId).
 */
export interface TypingEvent {
  senderId: string;
  senderName: string | null;
  at: number;
}

export function subscribeToTyping(
  conversationId: string,
  onTyping: (ev: TypingEvent) => void,
): () => void {
  let unsubscribed = false;
  let channel: ReturnType<SupabaseClientLike['channel']> | null = null;

  (async () => {
    const client = await getOrCreateClient();
    if (!client || unsubscribed) return;
    channel = client.channel(`conv:${conversationId}`);
    try {
      channel
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          const p = payload as Partial<TypingEvent> | undefined;
          if (!p?.senderId) return;
          onTyping({
            senderId: p.senderId,
            senderName: p.senderName ?? null,
            at: p.at ?? Date.now(),
          });
        })
        .subscribe();
    } catch {
      // Typing is non-critical; silently degrade.
    }
  })();

  return () => {
    unsubscribed = true;
    if (channel && _client) {
      _client.removeChannel(channel).catch(() => {});
    }
  };
}

/** Reset cached state — useful in tests, and after a tenant switch. */
export function _resetRealtimeForTests(): void {
  _client = null;
  _configPromise = null;
}

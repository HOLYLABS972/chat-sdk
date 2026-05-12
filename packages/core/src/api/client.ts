import { getBaseUrl, getConfig } from '../core/config';

/**
 * Thin REST client for the chat-admin /api/v1 surface. Every request
 * carries the tenant's api_key in `x-tinychat-api-key`. JSON in / JSON
 * out; non-2xx responses throw with the server's error message.
 */

interface RequestOpts {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
}

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(opts: RequestOpts): Promise<T> {
  const cfg = getConfig();
  const base = getBaseUrl();
  const url = new URL(`${base}${opts.path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method: opts.method ?? 'GET',
    headers: {
      'x-tinychat-api-key': cfg.apiKey,
      'content-type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    /* allow empty body */
  }
  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : `request failed: ${res.status}`;
    throw new ApiError(res.status, msg, parsed);
  }
  return parsed as T;
}

// ---------------------------------------------------------------------
// Typed endpoints — names match chat-admin routes 1:1.
// ---------------------------------------------------------------------

export interface ApiUser {
  tenant_id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: 'customer' | 'driver' | 'admin' | 'support';
  fcm_tokens: string[];
  notification_prefs: Record<string, unknown>;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiConversation {
  id: string;
  tenant_id: string;
  kind: 'order' | 'support' | 'direct';
  external_ref: string | null;
  participants: string[];
  last_message: string | null;
  last_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiMessage {
  id: string;
  tenant_id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string | null;
  body: string | null;
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url: string | null;
  read_by: string[];
  reply_to: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface ApiConfig {
  tenant: { id: string; name: string; integration_type: 'native' | 'hubspot' };
  realtime: { supabase_url: string; supabase_anon_key: string; channel_prefix: string };
}

export const api = {
  config: () => request<ApiConfig>({ path: '/api/v1/config' }),

  upsertUser: (user: {
    user_id: string;
    name?: string;
    email?: string;
    role?: ApiUser['role'];
    fcm_tokens?: string[];
    notification_prefs?: Record<string, unknown>;
  }) =>
    request<{ user: ApiUser }>({
      method: 'POST',
      path: '/api/v1/users',
      body: user,
    }),

  getOrCreateConversation: (args: {
    kind: ApiConversation['kind'];
    external_ref?: string;
    participants: string[];
  }) =>
    request<{ conversation: ApiConversation }>({
      method: 'POST',
      path: '/api/v1/conversations',
      body: args,
    }),

  listConversations: (args: { user_id: string; kind?: ApiConversation['kind'] }) =>
    request<{ conversations: ApiConversation[] }>({
      path: '/api/v1/conversations',
      query: args,
    }),

  listMessages: (conversationId: string, args?: { before?: string; limit?: number }) =>
    request<{ messages: ApiMessage[] }>({
      path: `/api/v1/conversations/${conversationId}/messages`,
      query: args,
    }),

  sendMessage: (
    conversationId: string,
    args: {
      sender_id: string;
      body?: string;
      message_type?: ApiMessage['message_type'];
      media_url?: string;
      reply_to?: string;
      receiver_id?: string;
    },
  ) =>
    request<{ message: ApiMessage; hubspot_error?: string }>({
      method: 'POST',
      path: `/api/v1/conversations/${conversationId}/messages`,
      body: args,
    }),
};

export { ApiError };

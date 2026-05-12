/**
 * STUB — Firestore-backed billing meter replaced in v1.0.0. Billing
 * accounting now happens server-side inside chat-admin (per-message
 * counter on the tenant row), so the client SDK doesn't need to
 * maintain its own meter. The hooks below preserve the legacy export
 * shape for any consumer that's wired into them.
 */
import { DEFAULT_PLAN_LIMITS, type BillingState, type PlanLimits } from './types';
import { getConfig } from '../core/config';

function periodKey(now = new Date()): { start: number; end: number; key: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { start, end, key };
}

export function getPlanLimits(): PlanLimits {
  // v1.0.0 doesn't carry a per-call billing config on the client.
  // Server is authoritative; this returns a safe default for any
  // local guards a consumer might still call.
  return DEFAULT_PLAN_LIMITS.starter;
}

export async function getBillingState(): Promise<BillingState> {
  const { start, end } = periodKey();
  // We don't have tenant id on the client anymore (just the api_key);
  // return an inert state.
  let tenantId = '';
  try {
    tenantId = (getConfig() as unknown as { apiKey: string }).apiKey ?? '';
  } catch {
    /* not initialized — that's fine for this stub */
  }
  return {
    tenantId,
    plan: 'starter',
    periodStart: start,
    periodEnd: end,
    conversationsUsed: 0,
    adminSeatsUsed: 0,
    status: 'active',
  };
}

export async function recordConversationStart(_conversationId: string): Promise<void> {
  // No-op — chat-admin counts conversations server-side via the
  // POST /api/v1/conversations endpoint.
}

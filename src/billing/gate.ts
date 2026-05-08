import { getBillingState, getPlanLimits } from './meter';

export interface GateDecision {
  allowed: boolean;
  reason?: 'quota_exceeded_new_conversation' | 'tenant_suspended';
  used: number;
  limit: number;
}

/**
 * Decide whether to allow a NEW conversation to start.
 *
 * Existing conversations always continue — we never break active orders mid-flight.
 * Only the start of a brand-new conversation is gated when the tenant is over quota.
 */
export async function canStartNewConversation(): Promise<GateDecision> {
  const state = await getBillingState();
  const limits = getPlanLimits();
  if (state.status === 'suspended') {
    return { allowed: false, reason: 'tenant_suspended', used: state.conversationsUsed, limit: limits.conversationsPerMonth };
  }
  if (state.conversationsUsed >= limits.conversationsPerMonth) {
    return {
      allowed: false,
      reason: 'quota_exceeded_new_conversation',
      used: state.conversationsUsed,
      limit: limits.conversationsPerMonth,
    };
  }
  return { allowed: true, used: state.conversationsUsed, limit: limits.conversationsPerMonth };
}

/**
 * Always allowed for in-flight conversations. Exposed for symmetry; consumers can call this
 * to log the check, but the answer is always `true`.
 */
export function canSendMessageInExistingConversation(): GateDecision {
  return { allowed: true, used: 0, limit: 0 };
}

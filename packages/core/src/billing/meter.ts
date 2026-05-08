import { doc, getDoc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getCollections, getConfig } from '../core/config';
import { DEFAULT_PLAN_LIMITS, type BillingState, type PlanLimits } from './types';

function periodKey(now = new Date()): { start: number; end: number; key: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { start, end, key };
}

export function getPlanLimits(): PlanLimits {
  const { billing } = getConfig();
  if (!billing) return DEFAULT_PLAN_LIMITS.starter;
  const base = DEFAULT_PLAN_LIMITS[billing.plan];
  return { ...base, ...(billing.customLimits ?? {}) };
}

export async function getBillingState(): Promise<BillingState> {
  const { firestore, tenantId, billing } = getConfig();
  const cols = getCollections();
  const { start, end, key } = periodKey();
  const ref = doc(firestore, cols.billing, `${tenantId}_${key}`);
  const snap = await getDoc(ref);
  const plan = billing?.plan ?? 'starter';
  if (!snap.exists()) {
    return {
      tenantId,
      plan,
      periodStart: start,
      periodEnd: end,
      conversationsUsed: 0,
      adminSeatsUsed: 0,
      status: 'active',
    };
  }
  const data = snap.data() as Partial<BillingState>;
  return {
    tenantId,
    plan,
    periodStart: start,
    periodEnd: end,
    conversationsUsed: data.conversationsUsed ?? 0,
    adminSeatsUsed: data.adminSeatsUsed ?? 0,
    status: data.status ?? 'active',
  };
}

export async function recordConversationStart(conversationId: string): Promise<void> {
  const { firestore, tenantId, billing } = getConfig();
  const cols = getCollections();
  const { start, end, key } = periodKey();
  const ref = doc(firestore, cols.billing, `${tenantId}_${key}`);
  const limits = getPlanLimits();
  const warnPct = billing?.warnAtPercent ?? 0.8;

  const result = await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(ref);
    const prev = snap.exists() ? (snap.data() as Partial<BillingState>) : {};
    const seenIds: string[] = (prev as { seenConversations?: string[] }).seenConversations ?? [];
    if (seenIds.includes(conversationId)) {
      return { used: prev.conversationsUsed ?? 0, alreadyCounted: true };
    }
    const used = (prev.conversationsUsed ?? 0) + 1;
    const status: BillingState['status'] = used > limits.conversationsPerMonth ? 'overage' : 'active';
    tx.set(
      ref,
      {
        tenantId,
        plan: billing?.plan ?? 'starter',
        periodStart: Timestamp.fromMillis(start),
        periodEnd: Timestamp.fromMillis(end),
        conversationsUsed: used,
        seenConversations: [...seenIds, conversationId],
        status,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return { used, alreadyCounted: false };
  });

  if (result.alreadyCounted) return;
  if (billing?.onApproachingQuota && result.used >= limits.conversationsPerMonth * warnPct && result.used <= limits.conversationsPerMonth) {
    billing.onApproachingQuota(result.used, limits.conversationsPerMonth, warnPct);
  }
  if (billing?.onQuotaExceeded && result.used > limits.conversationsPerMonth) {
    billing.onQuotaExceeded(result.used, limits.conversationsPerMonth);
  }
}

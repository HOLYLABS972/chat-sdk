export type BillingPlan = 'free' | 'starter' | 'growth' | 'scale' | 'custom';

export interface PlanLimits {
  conversationsPerMonth: number;
  adminSeats: number;
}

export interface BillingConfig {
  plan: BillingPlan;
  customLimits?: Partial<PlanLimits>;
  onQuotaExceeded?: (used: number, limit: number) => void;
  onApproachingQuota?: (used: number, limit: number, threshold: number) => void;
  warnAtPercent?: number;
}

export interface BillingState {
  tenantId: string;
  plan: BillingPlan;
  periodStart: number;
  periodEnd: number;
  conversationsUsed: number;
  adminSeatsUsed: number;
  status: 'active' | 'overage' | 'suspended';
}

export const DEFAULT_PLAN_LIMITS: Record<BillingPlan, PlanLimits> = {
  free: { conversationsPerMonth: 100, adminSeats: 1 },
  starter: { conversationsPerMonth: 1_000, adminSeats: 3 },
  growth: { conversationsPerMonth: 10_000, adminSeats: 10 },
  scale: { conversationsPerMonth: 100_000, adminSeats: 999 },
  custom: { conversationsPerMonth: Number.MAX_SAFE_INTEGER, adminSeats: 999 },
};

/**
 * Order chat access rules — who can read/send and when.
 *
 * Layer 1: caller role (CLIENT vs DRIVER, anyone else: 'none').
 * Layer 2: order lifecycle — pre-pickup, active, delivered (with 2h grace), cancelled.
 *
 * Chat is OPEN at every state except: order is missing, user is not a participant,
 * support flipped chatBlocked, or it's been >2h since delivery.
 */

export const POST_COMPLETION_WINDOW_MS = 2 * 60 * 60 * 1000;

const DONE = new Set<string>(['delivered', 'completed', 'done', 'fulfilled']);

function canonicalStatus(status: string | null | undefined): string {
  return (status || '').toLowerCase().replace(/^order_/, '');
}

function toMillis(ts: unknown): number | null {
  if (!ts) return null;
  const anyTs = ts as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof anyTs.toMillis === 'function') return anyTs.toMillis();
  if (typeof anyTs.seconds === 'number') {
    return anyTs.seconds * 1000 + Math.floor((anyTs.nanoseconds ?? 0) / 1e6);
  }
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') {
    const n = Date.parse(ts);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof ts === 'number') return ts;
  return null;
}

export type ParticipantRole = 'driver' | 'client' | 'none';

export interface OrderShape {
  status?: string | null;
  clientId?: string | null;
  deliveryManId?: string | null;
  completedAt?: unknown;
  deliveredAt?: unknown;
  updatedAt?: unknown;
  chatBlocked?: boolean;
}

export function getChatRole(
  order: Pick<OrderShape, 'clientId' | 'deliveryManId'> | null | undefined,
  userUid: string | null | undefined,
): ParticipantRole {
  if (!order || !userUid) return 'none';
  if (order.deliveryManId === userUid) return 'driver';
  if (order.clientId === userUid) return 'client';
  return 'none';
}

export interface OrderChatAccess {
  canRead: boolean;
  canSend: boolean;
  reason?: string;
}

export function getOrderChatAccess(
  order: OrderShape | null | undefined,
  userUid: string | null | undefined,
  now: number = Date.now(),
): OrderChatAccess {
  if (!order) return { canRead: true, canSend: false, reason: 'loading' };
  const role = getChatRole(order, userUid);
  if (role === 'none') return { canRead: false, canSend: false, reason: 'Not a participant' };
  const status = canonicalStatus(order.status);

  if (order.chatBlocked === true) {
    return { canRead: true, canSend: false, reason: 'Chat closed by support' };
  }

  if (DONE.has(status)) {
    const doneAt = toMillis(order.completedAt) ?? toMillis(order.deliveredAt) ?? toMillis(order.updatedAt) ?? null;
    if (doneAt != null && now - doneAt > POST_COMPLETION_WINDOW_MS) {
      return { canRead: true, canSend: false, reason: 'Chat closed 2 hours after delivery' };
    }
  }
  return { canRead: true, canSend: true };
}

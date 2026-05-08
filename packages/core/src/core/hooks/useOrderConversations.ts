import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { getCollections, getConfig, subscribeToConfigChanges } from '../config';

export interface OrderConversationRow {
  orderId: string;
  trackingId?: string;
  counterpartId: string | null;
  counterpartName: string;
  counterpartAvatar?: string | null;
  lastMessage: string;
  lastAtMs: number;
  unread: boolean;
}

function tsToMillis(ts: unknown): number {
  if (!ts) return 0;
  const t = ts as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.seconds === 'number') return t.seconds * 1000 + Math.floor((t.nanoseconds ?? 0) / 1e6);
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const n = Date.parse(ts);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export interface UseOrderConversationsResult {
  conversations: OrderConversationRow[];
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to the current user's order chats. Resolves orders where the
 * user is either the customer or the driver, then peeks at the latest
 * message in each. Updates in real-time.
 */
export function useOrderConversations(): UseOrderConversationsResult {
  const [conversations, setConversations] = useState<OrderConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cfgVersion, setCfgVersion] = useState(0);
  useEffect(() => subscribeToConfigChanges(() => setCfgVersion((v) => v + 1)), []);

  useEffect(() => {
    let cancelled = false;
    const unsubs: Unsubscribe[] = [];

    (async () => {
      try {
        const cfg = getConfig();
        const userId = cfg.currentUser.id;
        if (!userId) {
          setLoading(false);
          return;
        }
        const cols = getCollections();
        const ordersRef = collection(cfg.firestore, cols.orders);

        // Try multiple participant fields. Different schemas use different
        // names; the union of these covers customer + driver sides.
        const participantFields = ['clientId', 'deliveryManId', 'customerId', 'driverId'];
        const orderDocs = new Map<string, Record<string, unknown>>();
        for (const f of participantFields) {
          try {
            const snap = await getDocs(query(ordersRef, where(f, '==', userId)));
            snap.forEach((d) => orderDocs.set(d.id, d.data() as Record<string, unknown>));
          } catch {
            // Field missing on some orders — Firestore throws; skip.
          }
        }
        if (cancelled) return;

        // Subscribe to the latest message per order.
        const rowMap = new Map<string, OrderConversationRow>();
        const emit = () => {
          const rows = Array.from(rowMap.values()).sort((a, b) => b.lastAtMs - a.lastAtMs);
          setConversations(rows);
          setLoading(false);
        };

        for (const [orderId, orderData] of orderDocs) {
          const counterpartId =
            (orderData.deliveryManId as string | undefined) === userId
              ? (orderData.clientId as string | undefined) ?? null
              : (orderData.deliveryManId as string | undefined) ?? null;
          const counterpartName =
            (orderData.clientName as string | undefined) ??
            (orderData.customerName as string | undefined) ??
            (orderData.driverName as string | undefined) ??
            'Order chat';

          const messagesRef = collection(cfg.firestore, cols.orders, orderId, cols.orderMessages);
          unsubs.push(
            onSnapshot(
              query(messagesRef, orderBy('createdAt', 'desc'), limit(1)),
              (snap) => {
                const last = snap.docs[0]?.data();
                rowMap.set(orderId, {
                  orderId,
                  trackingId: orderData.trackingId as string | undefined,
                  counterpartId,
                  counterpartName,
                  counterpartAvatar:
                    (orderData.clientImage as string | undefined) ??
                    (orderData.customerImage as string | undefined) ??
                    null,
                  lastMessage: (last?.message as string | undefined) ?? '',
                  lastAtMs: tsToMillis(last?.createdAt),
                  unread: !!last && last.receiverId === userId && !last.isMessageRead,
                });
                emit();
              },
              (err) => {
                console.warn('[chat-sdk] order conv listener error:', err);
              },
            ),
          );
        }

        // No orders → empty list, not loading.
        if (orderDocs.size === 0) {
          setLoading(false);
        }
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => u());
    };
  }, [cfgVersion]);

  return { conversations, loading, error };
}

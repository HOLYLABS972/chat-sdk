import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  updateDoc,
  deleteField,
  getDocs,
  writeBatch,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getCollections, getConfig } from '../config';
import { serializeTimestamps } from '../../utils/serializeTimestamps';
import { canStartNewConversation, recordConversationStart } from '../../billing';

export interface OrderMessageReplyRef {
  id: string;
  senderId: string;
  preview: string;
}

export interface OrderChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'TEXT' | 'IMAGE';
  photoUrl?: string;
  isMessageRead?: boolean;
  createdAt: number;
  clientMsgId?: string;
  replyTo?: OrderMessageReplyRef;
  editedAt?: number | null;
  deletedAt?: number | null;
}

function db() {
  return getConfig().firestore;
}

export function getOrderMessagesRef(orderId: string) {
  const cols = getCollections();
  return collection(db(), cols.orders, orderId, cols.orderMessages);
}

export function subscribeToOrderMessages(
  orderId: string,
  onUpdate: (messages: OrderChatMessage[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const messagesRef = getOrderMessagesRef(orderId);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const parsed = serializeTimestamps({ id: docSnap.id, ...data }) as Record<string, unknown>;
        const rawTs = parsed.createdAt as number | { toMillis?: () => number } | undefined;
        const createdAt =
          typeof rawTs === 'number'
            ? rawTs
            : rawTs && typeof rawTs.toMillis === 'function'
              ? rawTs.toMillis()
              : Date.now();
        return { ...parsed, createdAt } as OrderChatMessage;
      });
      onUpdate(messages);
    },
    (err) => {
      console.error('[chat-sdk] order messages listener error:', err);
      onError?.(err);
    },
  );
}

export async function addOrderMessage(
  orderId: string,
  data: Omit<OrderChatMessage, 'id' | 'createdAt'> & { createdAt?: number },
): Promise<string> {
  const existing = await getDocs(query(getOrderMessagesRef(orderId)));
  const isFirstMessage = existing.empty;

  if (isFirstMessage) {
    const decision = await canStartNewConversation();
    if (!decision.allowed) {
      throw new Error(
        `[chat-sdk] cannot start new conversation: ${decision.reason} (used ${decision.used}/${decision.limit})`,
      );
    }
  }

  const messagesRef = getOrderMessagesRef(orderId);
  const raw: Record<string, unknown> = {
    ...data,
    createdAt: data.createdAt ?? Date.now(),
  };
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined) cleaned[k] = v;
  }
  const docRef = await addDoc(messagesRef, cleaned);
  await updateDoc(docRef, { id: docRef.id });

  if (isFirstMessage) {
    await recordConversationStart(orderId).catch((err) =>
      console.error('[chat-sdk] failed to record conversation start:', err),
    );
    const cfgInner = getConfig();
    void Promise.resolve(
      cfgInner.onSendWebhook?.('conversation_started', { orderId, senderId: data.senderId }),
    ).catch((err: unknown) => console.error('[chat-sdk] webhook error:', err));
  }

  const cfg = getConfig();
  void Promise.resolve(
    cfg.onSendWebhook?.('message_sent', { orderId, messageId: docRef.id, senderId: data.senderId }),
  ).catch((err: unknown) => console.error('[chat-sdk] webhook error:', err));

  return docRef.id;
}

export async function editOrderMessage(orderId: string, messageId: string, newText: string): Promise<void> {
  const cols = getCollections();
  const ref = doc(db(), cols.orders, orderId, cols.orderMessages, messageId);
  await updateDoc(ref, { message: newText, editedAt: Date.now() });
}

export async function deleteOrderMessage(orderId: string, messageId: string): Promise<void> {
  const cols = getCollections();
  const ref = doc(db(), cols.orders, orderId, cols.orderMessages, messageId);
  await updateDoc(ref, { deletedAt: Date.now(), message: '', photoUrl: deleteField() });
}

export const TYPING_STALE_MS = 5000;

export interface TypingUser {
  userId: string;
  userName?: string;
  updatedAtMs: number;
}

function getTypingCollectionRef(orderId: string) {
  const cols = getCollections();
  return collection(db(), cols.orders, orderId, 'typing');
}

function getTypingDocRef(orderId: string, userId: string) {
  const cols = getCollections();
  return doc(db(), cols.orders, orderId, 'typing', userId);
}

export async function setOrderTyping(
  orderId: string,
  userId: string,
  isTyping: boolean,
  userName?: string,
): Promise<void> {
  const ref = getTypingDocRef(orderId, userId);
  if (isTyping) {
    await setDoc(ref, { userId, userName: userName || null, updatedAt: serverTimestamp() }, { merge: true });
    return;
  }
  try {
    await deleteDoc(ref);
  } catch {
    /* doc may not exist yet — fine */
  }
}

export function subscribeToOrderTyping(
  orderId: string,
  selfUserId: string,
  onUpdate: (users: TypingUser[]) => void,
): Unsubscribe {
  const q = query(getTypingCollectionRef(orderId));
  return onSnapshot(q, (snap) => {
    const now = Date.now();
    const users: TypingUser[] = [];
    snap.forEach((d) => {
      if (d.id === selfUserId) return;
      const data = d.data() as { userId?: string; userName?: string | null; updatedAt?: { toMillis?: () => number } };
      const ts = data.updatedAt?.toMillis?.() ?? 0;
      if (!ts || now - ts > TYPING_STALE_MS) return;
      users.push({ userId: data.userId || d.id, userName: data.userName || undefined, updatedAtMs: ts });
    });
    onUpdate(users);
  });
}

export async function markOrderMessagesAsRead(orderId: string, currentUserId: string): Promise<void> {
  const messagesRef = getOrderMessagesRef(orderId);
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  const batch = writeBatch(db());
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.receiverId === currentUserId && !data.isMessageRead) {
      batch.update(docSnap.ref, { isMessageRead: true });
    }
  });
  await batch.commit();
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { getCollections, getConfig } from '../config';
import { serializeTimestamps } from '../../utils/serializeTimestamps';

export interface AdminChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  title?: string;
  attachments?: string[];
  createdAt: unknown;
  senderUid?: string;
}

function db() {
  return getConfig().firestore;
}

const APP_SETTINGS = 'app_settings';
const USERS = 'users';

export async function getAdminChatUid(): Promise<string | null> {
  const settingsRef = doc(db(), APP_SETTINGS, 'admin_chat');
  const snap = await getDoc(settingsRef);
  const data = snap.data();
  const fromSettings = data?.adminUid || data?.admin_uid || null;
  if (fromSettings) return fromSettings;

  const usersRef = collection(db(), USERS);
  const q = query(usersRef, where('role', 'in', ['super_admin', 'store_admin']), limit(1));
  const usersSnap = await getDocs(q);
  const first = usersSnap.docs[0];
  return first?.id ?? null;
}

export function subscribeToAdminMessages(
  pinnedAdminId: string,
  driverId: string,
  onUpdate: (messages: AdminChatMessage[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  let cancelled = false;
  const unsubs: (() => void)[] = [];
  const snaps = new Map<string, AdminChatMessage[]>();

  const toMsg = (d: { id: string; data: () => Record<string, unknown> }, keyPrefix: string) => {
    const data = d.data() || {};
    const parsed = serializeTimestamps({ id: `${keyPrefix}-${d.id}`, ...data }) as Record<string, unknown>;
    return {
      ...parsed,
      senderUid: parsed.senderUid ?? parsed.senderId,
    } as AdminChatMessage;
  };

  const toMillis = (v: unknown): number => {
    if (v == null) return Number.POSITIVE_INFINITY;
    if (typeof v === 'number') return v;
    const obj = v as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
    if (typeof obj.toMillis === 'function') return obj.toMillis();
    if (typeof obj.seconds === 'number') return obj.seconds * 1000 + Math.floor((obj.nanoseconds ?? 0) / 1e6);
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'string') {
      const n = Date.parse(v);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    }
    return Number.POSITIVE_INFINITY;
  };

  const mergeAndNotify = () => {
    const all: AdminChatMessage[] = [];
    snaps.forEach((list) => all.push(...list));
    all.sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
    onUpdate(all);
  };

  const subscribePair = (adminUid: string) => {
    const outgoing = collection(db(), 'messages', adminUid, driverId);
    const incoming = collection(db(), 'messages', driverId, adminUid);
    const outKey = `o:${adminUid}`;
    const inKey = `i:${adminUid}`;

    unsubs.push(
      onSnapshot(
        query(outgoing, orderBy('createdAt', 'asc')),
        (snapshot) => {
          snaps.set(outKey, snapshot.docs.map((d) => toMsg(d, outKey)));
          mergeAndNotify();
        },
        (err) => console.warn('[chat-sdk] admin outgoing subscription error:', err),
      ),
    );

    unsubs.push(
      onSnapshot(
        query(incoming, orderBy('createdAt', 'asc')),
        (snapshot) => {
          snaps.set(inKey, snapshot.docs.map((d) => toMsg(d, inKey)));
          mergeAndNotify();
        },
        (err) => console.warn('[chat-sdk] admin incoming subscription error:', err),
      ),
    );
  };

  (async () => {
    try {
      const adminsSnap = await getDocs(
        query(collection(db(), USERS), where('role', 'in', ['super_admin', 'store_admin'])),
      );
      if (cancelled) return;
      const adminUids = adminsSnap.docs.map((d) => d.id);
      if (adminUids.length === 0) adminUids.push(pinnedAdminId);
      else if (!adminUids.includes(pinnedAdminId)) adminUids.push(pinnedAdminId);
      adminUids.forEach(subscribePair);
    } catch (err) {
      console.error('[chat-sdk] list admins failed, falling back:', err);
      onError?.(err as Error);
      subscribePair(pinnedAdminId);
    }
  })();

  return () => {
    cancelled = true;
    unsubs.forEach((u) => u());
  };
}

export async function sendAdminMessage(
  adminId: string,
  driverId: string,
  message: string,
  attachments: string[] = [],
): Promise<string> {
  const chatRef = collection(db(), 'messages', driverId, adminId);
  const docRef = await addDoc(chatRef, {
    senderId: driverId,
    receiverId: adminId,
    message,
    attachments,
    isMessageRead: false,
    messageType: attachments.length > 0 ? 'IMAGE' : 'TEXT',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

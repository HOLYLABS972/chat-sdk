import { useCallback, useEffect, useState } from 'react';
import {
  getAdminChatUid,
  sendAdminMessage,
  subscribeToAdminMessages,
  type AdminChatMessage,
} from '../services/AdminMessageService';
import { getConfig, subscribeToConfigChanges } from '../config';

export interface UseAdminChatResult {
  adminId: string | null;
  messages: AdminChatMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (text: string, attachments?: string[]) => Promise<void>;
}

/**
 * Subscribe to the current user's chat with admins. Resolves the admin uid
 * automatically from app_settings/admin_chat or the first admin user.
 */
export function useAdminChat(): UseAdminChatResult {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Bumped whenever the SDK config (especially currentUser) changes — forces
  // the subscription effect to re-run with the new user identity. Avoids the
  // race where the widget mounts before setCurrentUser has propagated the
  // logged-in user into the SDK, which produced an empty driverId and a
  // 2-segment Firestore path.
  const [cfgVersion, setCfgVersion] = useState(0);
  useEffect(() => subscribeToConfigChanges(() => setCfgVersion((v) => v + 1)), []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const cfg = getConfig();
        const userId = cfg.currentUser.id;
        if (!userId) {
          // No user yet — wait for setCurrentUser, which bumps cfgVersion.
          setLoading(false);
          return;
        }
        const uid = await getAdminChatUid();
        if (cancelled) return;
        setAdminId(uid);
        if (!uid) {
          setLoading(false);
          return;
        }
        setLoading(true);
        unsub = subscribeToAdminMessages(
          uid,
          userId,
          (m) => {
            setMessages(m);
            setLoading(false);
          },
          (err) => {
            setError(err);
            setLoading(false);
          },
        );
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [cfgVersion]);

  const sendMessage = useCallback(
    async (text: string, attachments: string[] = []) => {
      const cfg = getConfig();
      if (!adminId) throw new Error('useAdminChat: no admin uid resolved yet');
      await sendAdminMessage(adminId, cfg.currentUser.id, text, attachments);
    },
    [adminId],
  );

  return { adminId, messages, loading, error, sendMessage };
}

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAdminChat, getConfig } from '@holylabs/chat-sdk';
import type { WidgetTheme } from '../theme';
import type { Brand, FaqItem, QuickLink } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { HelpHeader } from './HelpHeader';
import { LandingView } from './LandingView';
import { FaqArticleView } from './FaqArticleView';
import { ConversationsListView } from './ConversationsListView';
import { OrderChatView } from './OrderChatView';
import { defaultFaq, getLabels, type Lang, type WidgetLabels } from '../i18n';

export interface ChatboxProps {
  visible: boolean;
  onClose: () => void;
  theme: WidgetTheme;
  brand: Brand;
  faq?: FaqItem[];
  quickLinks?: QuickLink[];
  language?: Lang;
  labels?: Partial<WidgetLabels>;
  isRTL?: boolean;
}

type ViewState =
  | { kind: 'landing' }
  | { kind: 'conversations' } // list of order chats
  | { kind: 'order-chat'; orderId: string } // single order chat
  | { kind: 'support' } // admin / support chat
  | { kind: 'faq'; item: FaqItem };

/**
 * Multi-view support modal (Trustee/Intercom-style).
 *
 *   landing
 *     ↓ Messages card        ↓ Send-us-a-message CTA       ↓ FAQ row
 *   conversations           support (admin chat)            faq article
 *     ↓ tap a row
 *   order-chat
 */
export const Chatbox: React.FC<ChatboxProps> = ({
  visible,
  onClose,
  theme,
  brand,
  faq,
  quickLinks,
  language = 'en',
  labels: labelOverrides,
  isRTL = language === 'he',
}) => {
  const [view, setView] = useState<ViewState>({ kind: 'landing' });
  const labels = getLabels(language, labelOverrides);
  // Role-aware default FAQ in the active language. Consumer-supplied `faq`
  // always wins.
  const role = (() => {
    try {
      return getConfig().currentUser.role;
    } catch {
      return 'customer' as const;
    }
  })();
  const effectiveFaq = faq && faq.length ? faq : defaultFaq(role, language);

  // Hero header takes over rendering the greeting H1, so suppress the
  // duplicate one in LandingView.
  const heroHeader = Boolean(
    brand.logo || (brand.agents && brand.agents.length) || theme.primaryGradient,
  );

  // Reset to landing each time the modal opens.
  useEffect(() => {
    if (visible) setView({ kind: 'landing' });
  }, [visible]);

  const goBack = () => {
    if (view.kind === 'order-chat') {
      setView({ kind: 'conversations' });
    } else {
      setView({ kind: 'landing' });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
    >
      <SafeAreaView
        style={{
          flex: 1,
          // In hero mode, paint the safe-area top band with the gradient's
          // start color so the status-bar area blends into the header
          // instead of showing a white strip above it.
          backgroundColor:
            heroHeader && view.kind === 'landing'
              ? theme.primaryGradient?.[0] ?? theme.primary
              : theme.background,
        }}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <HelpHeader
            theme={theme}
            brand={brand}
            onClose={onClose}
            onBack={view.kind === 'landing' ? undefined : goBack}
          />

        {view.kind === 'landing' && (
          <LandingView
            theme={theme}
            greeting={brand.greeting}
            hideGreeting={heroHeader}
            faq={effectiveFaq}
            // Wrap each quick link so tapping closes the modal first; otherwise
            // the destination screen renders behind the still-open chatbox and
            // looks like nothing happened.
            quickLinks={quickLinks?.map((link) => ({
              ...link,
              onPress: () => {
                onClose();
                // Defer so the modal is fully dismissed before nav fires —
                // some routers swallow pushes during a presentation transition.
                setTimeout(() => link.onPress(), 0);
              },
            }))}
            labels={labels}
            isRTL={isRTL}
            onOpenMessages={() => setView({ kind: 'conversations' })}
            onOpenFaq={(item) => setView({ kind: 'faq', item })}
            onSendNewMessage={() => setView({ kind: 'support' })}
          />
        )}

        {view.kind === 'conversations' && (
          <ConversationsListView
            theme={theme}
            labels={labels}
            onOpenOrderChat={(orderId) => setView({ kind: 'order-chat', orderId })}
            onSendNewMessage={() => setView({ kind: 'support' })}
          />
        )}

        {view.kind === 'order-chat' && (
          <OrderChatView theme={theme} orderId={view.orderId} labels={labels} />
        )}

        {view.kind === 'support' && <SupportChat theme={theme} labels={labels} />}

        {view.kind === 'faq' && <FaqArticleView theme={theme} item={view.item} />}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const SupportChat: React.FC<{ theme: WidgetTheme; labels: WidgetLabels }> = ({ theme, labels }) => {
  const { messages, sendMessage, loading, error, adminId } = useAdminChat();
  const listRef = useRef<FlatList<unknown> | null>(null);
  const currentUserId = (() => {
    try {
      return getConfig().currentUser.id;
    } catch {
      return '';
    }
  })();

  useEffect(() => {
    if (!messages.length) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [messages.length]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>
            {labels.couldNotLoadMessages}
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{labels.howCanWeHelp}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {labels.supportReplyTime}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef as unknown as React.RefObject<FlatList<unknown>>}
          data={messages}
          keyExtractor={(m) => (m as { id: string }).id}
          renderItem={({ item }) => {
            const m = item as {
              id: string;
              senderId?: string;
              senderUid?: string;
              message: string;
              createdAt?: unknown;
            };
            const isSelf = (m.senderUid ?? m.senderId) === currentUserId;
            const ts =
              typeof m.createdAt === 'number'
                ? m.createdAt
                : (m.createdAt as { toMillis?: () => number })?.toMillis?.() ?? undefined;
            return <MessageBubble text={m.message} isSelf={isSelf} timestamp={ts} theme={theme} />;
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <MessageInput
        theme={theme}
        labels={labels}
        onSend={async (text) => {
          await sendMessage(text);
        }}
      />
    </KeyboardAvoidingView>
  );
};

// FAQ defaults moved to ../i18n.ts (role + language aware).

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
});

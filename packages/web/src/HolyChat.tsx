import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useAdminChat, useOrderConversations, getConfig } from '@holylabs/chat-sdk';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, mergeTheme, type WebWidgetTheme } from './theme';
import type { FaqItem, QuickLink } from './types';
import { defaultFaq, getLabels, type Lang, type WidgetLabels } from './i18n';

export interface HolyChatProps {
  brand: {
    name: string;
    greeting?: string;
    /** Optional brand logo shown next to the name in the header. URL string. */
    logo?: string;
  };
  faq?: FaqItem[];
  quickLinks?: QuickLink[];
  language?: Lang;
  labels?: Partial<WidgetLabels>;
  isRTL?: boolean;
  isDark?: boolean;
  theme?: Partial<WebWidgetTheme>;
  /** Bottom offset of the FAB in px. Default 24. */
  bottom?: number;
  /** Right offset of the FAB. Default 24. Mutually exclusive with `left`. */
  right?: number;
  left?: number;
  /** Hide widget on specific screens by passing `hidden`. */
  hidden?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

type ViewKind =
  | { kind: 'landing' }
  | { kind: 'conversations' }
  | { kind: 'order'; orderId: string }
  | { kind: 'support' }
  | { kind: 'faq'; item: FaqItem };

/**
 * Floating support widget for the web. Drop into any React tree (Next.js
 * pages, Vite, CRA) — renders a FAB and an Intercom-style drawer.
 *
 * Same UX as @holylabs/chat-sdk-rn: landing → Messages list / Send-us-a-
 * message / FAQ / quick links. Reads chat data from chat-sdk core.
 */
export const HolyChat: React.FC<HolyChatProps> = ({
  brand,
  faq,
  quickLinks,
  language = 'en',
  labels: labelOverrides,
  isRTL,
  isDark = false,
  theme,
  bottom = 24,
  right,
  left,
  hidden = false,
  onOpen,
  onClose,
}) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewKind>({ kind: 'landing' });

  useEffect(() => {
    if (open) setView({ kind: 'landing' });
  }, [open]);

  if (hidden) return null;

  const merged = mergeTheme(isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME, theme);
  const dir = (isRTL ?? language === 'he') ? 'rtl' : 'ltr';
  const labels = getLabels(language, labelOverrides);
  const effectiveFaq = faq && faq.length ? faq : defaultFaq(language);

  const handleOpen = () => {
    setOpen(true);
    onOpen?.();
  };
  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const horizontal = left !== undefined ? { left } : { right: right ?? 24 };

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label={labels.openChat}
          onClick={handleOpen}
          style={{
            position: 'fixed',
            bottom,
            ...horizontal,
            width: 56,
            height: 56,
            borderRadius: 28,
            border: 'none',
            backgroundColor: merged.primary,
            color: merged.primaryText,
            fontSize: 24,
            cursor: 'pointer',
            boxShadow: `0 6px 16px ${merged.shadow}`,
            zIndex: 2147483645,
            transition: 'transform 120ms ease',
          } as CSSProperties}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <span aria-hidden style={{ lineHeight: 1 }}>💬</span>
        </button>
      )}

      {open && (
        <div
          dir={dir}
          role="dialog"
          aria-modal="true"
          aria-label={brand.name}
          style={{
            position: 'fixed',
            bottom,
            ...horizontal,
            width: 380,
            maxWidth: 'calc(100vw - 32px)',
            height: 600,
            maxHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: merged.background,
            color: merged.textPrimary,
            border: `1px solid ${merged.border}`,
            borderRadius: 18,
            boxShadow: `0 24px 64px ${merged.shadow}`,
            zIndex: 2147483646,
            overflow: 'hidden',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <Header
            theme={merged}
            brand={brand}
            onClose={handleClose}
            onBack={view.kind === 'landing' ? undefined : () => setView({ kind: 'landing' })}
            labels={labels}
          />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {view.kind === 'landing' && (
              <Landing
                theme={merged}
                greeting={brand.greeting}
                faq={effectiveFaq}
                quickLinks={quickLinks?.map((link) => ({
                  ...link,
                  onClick: () => {
                    handleClose();
                    setTimeout(() => link.onClick(), 0);
                  },
                }))}
                labels={labels}
                onOpenMessages={() => setView({ kind: 'conversations' })}
                onSendNew={() => setView({ kind: 'support' })}
                onOpenFaq={(item) => setView({ kind: 'faq', item })}
              />
            )}
            {view.kind === 'conversations' && (
              <ConversationsList
                theme={merged}
                labels={labels}
                onPick={(orderId) => setView({ kind: 'order', orderId })}
                onSendNew={() => setView({ kind: 'support' })}
              />
            )}
            {view.kind === 'support' && <SupportChat theme={merged} labels={labels} />}
            {view.kind === 'faq' && <FaqArticle theme={merged} item={view.item} />}
            {view.kind === 'order' && (
              <div style={empty(merged)}>
                <span style={{ color: merged.textSecondary }}>
                  Order chat view (web): use the mobile app for now.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ---------- subviews ----------

const Header: React.FC<{
  theme: WebWidgetTheme;
  brand: { name: string; logo?: string };
  onClose: () => void;
  onBack?: () => void;
  labels: WidgetLabels;
}> = ({ theme, brand, onClose, onBack, labels }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderBottom: `1px solid ${theme.border}`,
    }}
  >
    {onBack ? (
      <IconButton theme={theme} ariaLabel={labels.back} onClick={onBack}>
        ‹
      </IconButton>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        {brand.logo && (
          <img
            src={brand.logo}
            alt=""
            style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }}
          />
        )}
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {brand.name}
        </span>
      </div>
    )}
    {onBack && <span style={{ flex: 1 }} />}
    <IconButton theme={theme} ariaLabel={labels.close} onClick={onClose}>
      ×
    </IconButton>
  </div>
);

const IconButton: React.FC<{
  theme: WebWidgetTheme;
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ theme, ariaLabel, onClick, children }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      border: 'none',
      cursor: 'pointer',
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      fontSize: 22,
      lineHeight: '22px',
    }}
  >
    {children}
  </button>
);

const Landing: React.FC<{
  theme: WebWidgetTheme;
  greeting?: string;
  faq: FaqItem[];
  quickLinks?: QuickLink[];
  labels: WidgetLabels;
  onOpenMessages: () => void;
  onSendNew: () => void;
  onOpenFaq: (item: FaqItem) => void;
}> = ({ theme, greeting, faq, quickLinks, labels, onOpenMessages, onSendNew, onOpenFaq }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faq;
    return faq.filter(
      (item) => item.q.toLowerCase().includes(q) || (item.a ?? '').toLowerCase().includes(q),
    );
  }, [faq, search]);

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: theme.surface,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {greeting && (
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{greeting}</h2>
      )}

      <Card theme={theme}>
        <Row theme={theme} onClick={onOpenMessages} ariaLabel={labels.messagesCard}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{labels.messagesCard}</span>
          <Chev theme={theme} />
        </Row>
      </Card>

      <button
        type="button"
        onClick={onSendNew}
        aria-label={labels.sendUsAMessage}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 16px',
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.background,
          color: theme.textPrimary,
          cursor: 'pointer',
          textAlign: 'inherit',
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600 }}>{labels.sendUsAMessage}</span>
        <span style={{ fontSize: 24, color: theme.primary }}>›</span>
      </button>

      {quickLinks && quickLinks.length > 0 && (
        <Card theme={theme}>
          {quickLinks.map((link, i) => (
            <Row
              key={link.id}
              theme={theme}
              onClick={link.onClick}
              ariaLabel={link.label}
              first={i === 0}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15 }}>{link.label}</div>
                {link.hint && (
                  <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                    {link.hint}
                  </div>
                )}
              </div>
              <Chev theme={theme} />
            </Row>
          ))}
        </Card>
      )}

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          opacity: 0.6,
          padding: '4px 4px',
          marginTop: 4,
        }}
      >
        {labels.helpSection}
      </div>
      <Card theme={theme}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            margin: 12,
            padding: '0 12px',
            backgroundColor: theme.surface,
            borderRadius: 10,
          }}
        >
          <span style={{ color: theme.textSecondary, fontSize: 18 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={labels.searchForHelp}
            style={{
              flex: 1,
              height: 38,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: theme.textPrimary,
              fontSize: 15,
            }}
          />
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '0 16px 16px', color: theme.textSecondary, fontSize: 14 }}>
            {faq.length === 0 ? labels.noHelpArticles : labels.noMatchingArticles}
          </div>
        ) : (
          filtered.map((item, i) => (
            <Row
              key={item.id}
              theme={theme}
              onClick={() => (item.onClick ? item.onClick() : onOpenFaq(item))}
              ariaLabel={item.q}
              first={i === 0}
            >
              <span style={{ flex: 1, fontSize: 15, lineHeight: 1.3 }}>{item.q}</span>
              <Chev theme={theme} />
            </Row>
          ))
        )}
      </Card>
    </div>
  );
};

const ConversationsList: React.FC<{
  theme: WebWidgetTheme;
  labels: WidgetLabels;
  onPick: (orderId: string) => void;
  onSendNew: () => void;
}> = ({ theme, labels, onPick, onSendNew }) => {
  const { conversations, loading, error } = useOrderConversations();
  if (loading) return <div style={center(theme)}>{labels.loadingConversations}</div>;
  if (error) return <div style={center(theme)}>{labels.conversationsError}</div>;
  if (conversations.length === 0) {
    return (
      <div style={{ ...center(theme), gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>
          {labels.noConversationsTitle}
        </div>
        <div style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', maxWidth: 280 }}>
          {labels.noConversationsBody}
        </div>
        <button
          type="button"
          onClick={onSendNew}
          style={{
            padding: '10px 20px',
            borderRadius: 22,
            border: 'none',
            backgroundColor: theme.primary,
            color: theme.primaryText,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {labels.emptyCta}
        </button>
      </div>
    );
  }
  return (
    <div style={{ flex: 1, overflow: 'auto', backgroundColor: theme.surface }}>
      {conversations.map((c) => (
        <button
          key={c.orderId}
          type="button"
          onClick={() => onPick(c.orderId)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            border: 'none',
            background: theme.background,
            borderBottom: `1px solid ${theme.border}`,
            cursor: 'pointer',
            color: theme.textPrimary,
            textAlign: 'inherit',
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.primary,
              color: theme.primaryText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            {(c.counterpartName || '?').charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.counterpartName}
            </div>
            <div style={{ color: theme.textSecondary, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.lastMessage || '—'}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const SupportChat: React.FC<{ theme: WebWidgetTheme; labels: WidgetLabels }> = ({ theme, labels }) => {
  const { messages, sendMessage, loading, error } = useAdminChat();
  const currentUserId = (() => {
    try {
      return getConfig().currentUser.id;
    } catch {
      return '';
    }
  })();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await sendMessage(text);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          backgroundColor: theme.surface,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {loading && messages.length === 0 ? (
          <div style={center(theme)}>…</div>
        ) : error ? (
          <div style={center(theme)}>{labels.couldNotLoadMessages}</div>
        ) : messages.length === 0 ? (
          <div style={{ ...center(theme), textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary }}>
              {labels.howCanWeHelp}
            </div>
            <div style={{ fontSize: 14, color: theme.textSecondary, marginTop: 8, maxWidth: 280 }}>
              {labels.supportReplyTime}
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const mm = m as { id: string; senderId?: string; senderUid?: string; message: string; createdAt?: unknown };
            const isSelf = (mm.senderUid ?? mm.senderId) === currentUserId;
            return (
              <div
                key={mm.id}
                style={{
                  alignSelf: isSelf ? 'flex-end' : 'flex-start',
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: 18,
                  backgroundColor: isSelf ? theme.bubbleSelf : theme.bubbleOther,
                  color: isSelf ? theme.bubbleSelfText : theme.bubbleOtherText,
                  fontSize: 15,
                  lineHeight: 1.35,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {mm.message}
              </div>
            );
          })
        )}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 8,
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.background,
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder={labels.typeMessage}
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            padding: '10px 14px',
            borderRadius: 20,
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: 15,
          }}
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!draft.trim() || sending}
          style={{
            padding: '0 16px',
            height: 40,
            borderRadius: 20,
            border: 'none',
            backgroundColor: theme.primary,
            color: theme.primaryText,
            fontWeight: 600,
            cursor: !draft.trim() || sending ? 'default' : 'pointer',
            opacity: !draft.trim() || sending ? 0.5 : 1,
          }}
        >
          {labels.send}
        </button>
      </div>
    </div>
  );
};

const FaqArticle: React.FC<{ theme: WebWidgetTheme; item: FaqItem }> = ({ theme, item }) => (
  <div style={{ flex: 1, overflow: 'auto', padding: 20, backgroundColor: theme.background }}>
    <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: theme.textPrimary }}>
      {item.q}
    </h3>
    <p style={{ fontSize: 16, lineHeight: 1.5, color: theme.textSecondary, margin: 0 }}>
      {item.a ?? ''}
    </p>
  </div>
);

// ---------- helpers ----------

const Card: React.FC<{ theme: WebWidgetTheme; children: React.ReactNode }> = ({ theme, children }) => (
  <div
    style={{
      backgroundColor: theme.background,
      border: `1px solid ${theme.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{
  theme: WebWidgetTheme;
  onClick: () => void;
  ariaLabel: string;
  first?: boolean;
  children: React.ReactNode;
}> = ({ theme, onClick, ariaLabel, first, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 16px',
      backgroundColor: 'transparent',
      borderTop: first ? 'none' : `1px solid ${theme.border}`,
      borderBottom: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      cursor: 'pointer',
      color: theme.textPrimary,
      textAlign: 'inherit',
      fontFamily: 'inherit',
    }}
  >
    {children}
  </button>
);

const Chev: React.FC<{ theme: WebWidgetTheme }> = ({ theme }) => (
  <span style={{ color: theme.textSecondary, fontSize: 22 }}>›</span>
);

const empty = (theme: WebWidgetTheme): CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.surface,
});

const center = (theme: WebWidgetTheme): CSSProperties => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  color: theme.textSecondary,
});

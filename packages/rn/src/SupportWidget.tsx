import React, { useEffect, useState } from 'react';
import { FloatingButton } from './components/FloatingButton';
import { Chatbox } from './components/Chatbox';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, mergeTheme, type WidgetTheme } from './theme';
import type { Brand, FaqItem, QuickLink } from './types';
import type { Lang, WidgetLabels } from './i18n';

export interface SupportWidgetProps {
  brand: Brand;
  /** FAQ items shown on the landing screen. Defaults to a built-in role-aware list (driver / customer) in the active language. */
  faq?: FaqItem[];
  /** Quick navigation links shown above the FAQ (e.g. Change bank, Change vehicle, Delete data). */
  quickLinks?: QuickLink[];
  /** UI language. 'en' (default) or 'he'. Affects built-in FAQ + UI strings. */
  language?: Lang;
  /** Override individual UI strings while keeping the built-ins for the rest. */
  labels?: Partial<WidgetLabels>;
  /** When true, lays out for right-to-left languages. Default: derived from `language` (he → true). */
  isRTL?: boolean;
  theme?: Partial<WidgetTheme>;
  isDark?: boolean;
  /** Distance from bottom edge. Default 24. Mutually exclusive with `top`. */
  bottom?: number;
  /** Distance from top edge. When set, overrides `bottom` (top-pinned button). */
  top?: number;
  /** Distance from right edge. Default 24. Mutually exclusive with `left`. */
  right?: number;
  /** Distance from left edge. When set, overrides `right`. */
  left?: number;
  hidden?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** When set, "Send new message" closes the widget and fires this
   *  callback instead of opening the built-in admin chat. Use this to
   *  hand off to a native chat SDK, an external deep link, etc. */
  onSendNewMessageOverride?: () => void;
  /** Imperative "open now" trigger. Increment this number from outside
   *  the widget (e.g. from a notification handler) to force the panel
   *  open without the user tapping the FAB. Each unique increment opens
   *  the widget once. */
  openSignal?: number;
  /** When opening via openSignal, jump straight to this view instead
   *  of the FAQ/landing screen. Useful for notification taps where the
   *  user expects to see their conversations, not browse help.
   *  `'conversations'` shows the messages list,
   *  `'support'` jumps into the admin/support chat directly,
   *  `'landing'` (default) keeps the FAQ landing screen. */
  openTarget?: 'landing' | 'conversations' | 'support';
}

/**
 * Drop-in floating support widget. Mount once at the root of your app
 * (inside ChatProvider / after initChatSDK) and it renders a FAB on every
 * screen plus the chatbox modal when tapped.
 *
 * Pass `hidden` to suppress on specific screens (login, splash, etc.).
 */
export const SupportWidget: React.FC<SupportWidgetProps> = ({
  brand,
  faq,
  quickLinks,
  language = 'en',
  labels,
  isRTL,
  theme,
  isDark = false,
  bottom,
  top,
  right,
  left,
  hidden = false,
  onOpen,
  onClose,
  onSendNewMessageOverride,
  openSignal,
  openTarget,
}) => {
  const [open, setOpen] = useState(false);
  // Capture which view the host asked us to open on. Increments alongside
  // openSignal so Chatbox can read it on its next visible→true transition
  // without us threading openTarget through as part of internal state.
  const [externalOpenTarget, setExternalOpenTarget] = useState<
    'landing' | 'conversations' | 'support' | undefined
  >(undefined);

  // External "open now" trigger. Watch openSignal — any change opens
  // the widget. We don't auto-close on change-back so the user can
  // dismiss with the normal close affordance.
  useEffect(() => {
    if (openSignal === undefined) return;
    setExternalOpenTarget(openTarget);
    setOpen(true);
    onOpen?.();
    // openTarget intentionally not in deps — we read its current value
    // at the moment a signal fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal, onOpen]);
  const merged = mergeTheme(isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME, theme);

  if (hidden) return null;

  const handleOpen = () => {
    // Manual FAB tap — always reset to the default landing.
    setExternalOpenTarget(undefined);
    setOpen(true);
    onOpen?.();
  };
  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <>
      <FloatingButton
        onPress={handleOpen}
        theme={merged}
        bottom={bottom}
        top={top}
        right={right}
        left={left}
      />
      <Chatbox
        visible={open}
        onClose={handleClose}
        theme={merged}
        brand={brand}
        faq={faq}
        quickLinks={quickLinks}
        language={language}
        labels={labels}
        isRTL={isRTL ?? language === 'he'}
        onSendNewMessageOverride={onSendNewMessageOverride}
        openTarget={externalOpenTarget}
      />
    </>
  );
};

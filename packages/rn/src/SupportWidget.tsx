import React, { useState } from 'react';
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
}) => {
  const [open, setOpen] = useState(false);
  const merged = mergeTheme(isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME, theme);

  if (hidden) return null;

  const handleOpen = () => {
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
      />
    </>
  );
};

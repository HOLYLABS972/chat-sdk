import React, { useState } from 'react';
import { FloatingButton } from './components/FloatingButton';
import { Chatbox } from './components/Chatbox';
import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, mergeTheme, type WidgetTheme } from './theme';

export interface SupportWidgetProps {
  brand: { name: string; greeting?: string };
  theme?: Partial<WidgetTheme>;
  isDark?: boolean;
  bottom?: number;
  right?: number;
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
  theme,
  isDark = false,
  bottom,
  right,
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
      <FloatingButton onPress={handleOpen} theme={merged} bottom={bottom} right={right} />
      <Chatbox visible={open} onClose={handleClose} theme={merged} brand={brand} />
    </>
  );
};

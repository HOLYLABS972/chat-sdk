import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator, InteractionManager } from 'react-native';
import type { WidgetTheme } from '../theme';
import type { WidgetLabels } from '../i18n';

export interface MessageInputProps {
  theme: WidgetTheme;
  onSend: (text: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: string;
  labels?: WidgetLabels;
  /** Focus the input on mount so the keyboard opens immediately. */
  autoFocus?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  theme,
  onSend,
  placeholder,
  disabled = false,
  disabledReason,
  labels,
  autoFocus = false,
}) => {
  const inputRef = useRef<TextInput | null>(null);
  const hasAutoFocusedRef = useRef(false);
  // iOS won't honor autoFocus / focus() on a multiline TextInput until it
  // is actually laid out (and the parent modal animation has settled). We
  // hook into onLayout to trigger focus exactly once, plus add a delayed
  // safety net in case onLayout fires too early.
  const handleAutoFocus = () => {
    if (!autoFocus || disabled || hasAutoFocusedRef.current) return;
    hasAutoFocusedRef.current = true;
    const doFocus = () => inputRef.current?.focus();
    setTimeout(doFocus, 50);
    setTimeout(doFocus, 350);
    setTimeout(doFocus, 800);
  };
  const placeholderText = placeholder ?? labels?.typeMessage ?? 'Type a message…';
  const sendText = labels?.send ?? 'Send';
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const trimmed = value.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue('');
    } catch (err) {
      console.warn('[chat-sdk-rn] send failed:', err);
    } finally {
      setSending(false);
    }
  };

  if (disabled && disabledReason) {
    return (
      <View style={[styles.disabled, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
        <Text style={[styles.disabledText, { color: theme.textSecondary }]}>{disabledReason}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={setValue}
        placeholder={placeholderText}
        placeholderTextColor={theme.textSecondary}
        multiline
        autoFocus={autoFocus && !disabled}
        editable={!disabled}
        onLayout={handleAutoFocus}
        style={[
          styles.input,
          { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      />
      <Pressable
        onPress={submit}
        // Pressables steal first-responder on iOS by default which blurs the
        // TextInput and dismisses the keyboard. We block that here.
        onPressIn={() => inputRef.current?.focus()}
        disabled={!value.trim() || sending || disabled}
        accessibilityLabel="Send message"
        style={({ pressed }) => [
          styles.sendBtn,
          {
            backgroundColor: theme.primary,
            opacity: !value.trim() || sending || disabled ? 0.5 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {sending ? (
          <ActivityIndicator size="small" color={theme.primaryText} />
        ) : (
          // Direction-neutral up-arrow — same glyph iMessage / WhatsApp /
          // Telegram use for the send affordance. Keeps the SDK
          // icon-library-free (no react-native-vector-icons peer dep).
          <Text
            accessibilityLabel={sendText}
            style={[styles.sendIcon, { color: theme.primaryText }]}
          >
            ↑
          </Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendIcon: {
    fontSize: 22,
    fontWeight: '700',
    // Glyph sits a hair below center in most fonts — lift it by a pixel
    // for visual balance against the input's vertical midline.
    lineHeight: 22,
    marginTop: -1,
  },
  disabled: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { WidgetTheme } from '../theme';
import type { WidgetLabels } from '../i18n';

export interface MessageInputProps {
  theme: WidgetTheme;
  onSend: (text: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: string;
  labels?: WidgetLabels;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  theme,
  onSend,
  placeholder,
  disabled = false,
  disabledReason,
  labels,
}) => {
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
        value={value}
        onChangeText={setValue}
        placeholder={placeholderText}
        placeholderTextColor={theme.textSecondary}
        multiline
        editable={!disabled && !sending}
        style={[
          styles.input,
          { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      />
      <Pressable
        onPress={submit}
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
          <Text style={[styles.sendText, { color: theme.primaryText }]}>{sendText}</Text>
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
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
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

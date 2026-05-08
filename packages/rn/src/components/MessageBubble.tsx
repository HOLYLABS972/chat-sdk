import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WidgetTheme } from '../theme';

export interface MessageBubbleProps {
  text: string;
  isSelf: boolean;
  timestamp?: number;
  theme: WidgetTheme;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ text, isSelf, timestamp, theme }) => {
  return (
    <View style={[styles.row, { justifyContent: isSelf ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isSelf ? theme.bubbleSelf : theme.bubbleOther,
            borderTopRightRadius: isSelf ? 4 : 18,
            borderTopLeftRadius: isSelf ? 18 : 4,
          },
        ]}
      >
        <Text style={[styles.text, { color: isSelf ? theme.bubbleSelfText : theme.bubbleOtherText }]}>{text}</Text>
        {timestamp !== undefined && (
          <Text
            style={[
              styles.time,
              { color: isSelf ? theme.bubbleSelfText : theme.textSecondary, opacity: 0.7 },
            ]}
          >
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

function formatTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

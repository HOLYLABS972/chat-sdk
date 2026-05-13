import React from 'react';
import { View, Text, StyleSheet, Image, Linking, Pressable } from 'react-native';
import type { WidgetTheme } from '../theme';

export interface MessageBubbleProps {
  text: string;
  isSelf: boolean;
  timestamp?: number;
  theme: WidgetTheme;
  /** When set, renders as an image bubble. Tap opens the full image
   *  in the user's default image viewer/browser. */
  mediaUrl?: string | null;
  /** Long-press to surface edit/delete actions; only meaningful for
   *  the caller's own messages. The widget wires this to a menu. */
  onLongPress?: () => void;
  /** Shown subtly under the bubble when an edit happened. */
  edited?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isSelf,
  timestamp,
  theme,
  mediaUrl,
  onLongPress,
  edited,
}) => {
  const hasImage = !!mediaUrl;
  return (
    <View style={[styles.row, { justifyContent: isSelf ? 'flex-end' : 'flex-start' }]}>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.bubble,
          hasImage && styles.bubbleImage,
          {
            backgroundColor: isSelf ? theme.bubbleSelf : theme.bubbleOther,
            borderTopRightRadius: isSelf ? 4 : 18,
            borderTopLeftRadius: isSelf ? 18 : 4,
            opacity: pressed && onLongPress ? 0.85 : 1,
          },
        ]}
      >
        {hasImage && (
          <Pressable
            onPress={() => mediaUrl && Linking.openURL(mediaUrl)}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: mediaUrl! }}
              style={styles.image}
              resizeMode="cover"
            />
          </Pressable>
        )}
        {text ? (
          <Text
            style={[
              styles.text,
              hasImage && styles.textWithImage,
              { color: isSelf ? theme.bubbleSelfText : theme.bubbleOtherText },
            ]}
          >
            {text}
          </Text>
        ) : null}
        {(timestamp !== undefined || edited) && (
          <Text
            style={[
              styles.time,
              hasImage && styles.timeWithImage,
              { color: isSelf ? theme.bubbleSelfText : theme.textSecondary, opacity: 0.7 },
            ]}
          >
            {edited ? 'edited' : ''}
            {edited && timestamp !== undefined ? ' · ' : ''}
            {timestamp !== undefined ? formatTime(timestamp) : ''}
          </Text>
        )}
      </Pressable>
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
  // When the bubble carries an image we drop the inner padding so the
  // image bleeds to the rounded edges; the text/timestamp below get
  // padding back via textWithImage / timeWithImage.
  bubbleImage: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: 220,
    height: 220,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textWithImage: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeWithImage: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    marginTop: 0,
  },
});

import React from 'react';
import { Pressable, View, Text, StyleSheet, Platform } from 'react-native';
import type { WidgetTheme } from '../theme';

export interface FloatingButtonProps {
  onPress: () => void;
  theme: WidgetTheme;
  badgeCount?: number;
  size?: number;
  /** Distance from bottom edge. Mutually exclusive with `top`. */
  bottom?: number;
  /** Distance from top edge. When set, overrides `bottom`. */
  top?: number;
  /** Distance from right edge. Mutually exclusive with `left`. */
  right?: number;
  /** Distance from left edge. When set, overrides `right`. */
  left?: number;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * Floating action button anchored to a corner of the screen.
 * Defaults to bottom-right; pass `top` for top-pinned, `left` for left-pinned.
 * Tap toggles the support chatbox.
 */
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  theme,
  badgeCount,
  size = 56,
  bottom,
  top,
  right,
  left,
  icon,
  accessibilityLabel = 'Open support chat',
}) => {
  // Default to bottom-right when neither vertical nor horizontal anchor given.
  const verticalStyle =
    top !== undefined ? { top } : { bottom: bottom ?? 24 };
  const horizontalStyle =
    left !== undefined ? { left } : { right: right ?? 24 };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primary,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        verticalStyle,
        horizontalStyle,
      ]}
    >
      {icon ?? <DefaultChatIcon color={theme.primaryText} size={size * 0.45} />}
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.primaryText }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]} numberOfLines={1}>
            {badgeCount > 99 ? '99+' : String(badgeCount)}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const DefaultChatIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Pure-RN chat bubble glyph — no external icon dependency. */}
    <Text style={{ color, fontSize: size, lineHeight: size * 1.05 }}>{'\u{1F4AC}'}</Text>
  </View>
);

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { WidgetTheme } from '../theme';

export interface HelpHeaderProps {
  theme: WidgetTheme;
  brand: { name: string; greeting?: string };
  onClose: () => void;
  onBack?: () => void;
}

export const HelpHeader: React.FC<HelpHeaderProps> = ({ theme, brand, onClose, onBack }) => {
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.background, borderBottomColor: theme.border },
      ]}
    >
      {onBack ? (
        <>
          <Pressable
            onPress={onBack}
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.iconGlyph, { color: theme.textPrimary }]}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
        </>
      ) : (
        // Header shows ONLY the brand name on the landing screen — the
        // greeting (e.g. "How can we help?") is rendered as the big H1
        // in LandingView, so showing it here too is duplicate.
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: theme.textPrimary }]} numberOfLines={1}>
            {brand.name}
          </Text>
        </View>
      )}
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close support"
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.iconGlyph, { color: theme.textPrimary }]}>×</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brand: {
    fontSize: 17,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '500',
  },
});

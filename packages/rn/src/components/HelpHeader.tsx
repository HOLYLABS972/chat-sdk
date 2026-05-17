import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import type { WidgetTheme } from '../theme';
import type { Brand } from '../types';

// Lazy-load expo-linear-gradient — it's only needed when the consumer opts
// into a gradient header. If the dep isn't installed, we silently fall back
// to a flat fill of theme.primary so the SDK keeps working.
let LinearGradient: React.ComponentType<{
  colors: readonly string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: object;
  children?: React.ReactNode;
}> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
  LinearGradient = null;
}

export interface HelpHeaderProps {
  theme: WidgetTheme;
  brand: Brand;
  onClose: () => void;
  onBack?: () => void;
  /** When true, render the tall Intercom-style hero (gradient + logo +
   *  agents + greeting). When false, render the flat one-line bar.
   *  Auto-detected from brand/theme by Chatbox; exposed here for callers
   *  that mount HelpHeader standalone. */
  hero?: boolean;
}

export const HelpHeader: React.FC<HelpHeaderProps> = ({
  theme,
  brand,
  onClose,
  onBack,
  hero,
}) => {
  const heroEnabled =
    hero ?? Boolean(brand.logo || (brand.agents && brand.agents.length) || theme.primaryGradient);

  if (heroEnabled) {
    return (
      <HeroHeader
        theme={theme}
        brand={brand}
        onClose={onClose}
        onBack={onBack}
      />
    );
  }

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

const HeroHeader: React.FC<{
  theme: WidgetTheme;
  brand: Brand;
  onClose: () => void;
  onBack?: () => void;
}> = ({ theme, brand, onClose, onBack }) => {
  const gradientColors =
    theme.primaryGradient && theme.primaryGradient.length >= 2
      ? theme.primaryGradient
      : ([theme.primary, theme.primary] as const);

  const Background: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (LinearGradient) {
      return (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBg}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.heroBg, { backgroundColor: gradientColors[0] }]}>{children}</View>
    );
  };

  const fg = theme.primaryText;
  const dimFg = withAlpha(fg, 0.85);
  const agents = brand.agents ?? [];

  return (
    <Background>
      <View style={styles.heroTopRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.heroIconBtn,
              { backgroundColor: withAlpha(fg, 0.18), opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.heroIconGlyph, { color: fg }]}>‹</Text>
          </Pressable>
        ) : brand.logo || brand.name ? (
          <View style={styles.heroBrandRow}>
            {brand.logo ? (
              <Image source={brand.logo} style={styles.heroLogo} resizeMode="contain" />
            ) : null}
            {brand.name ? (
              <Text style={[styles.heroBrandName, { color: fg }]} numberOfLines={1}>
                {brand.name}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <View style={{ flex: 1 }} />

        {!onBack && agents.length > 0 && <AgentStack agents={agents} ringColor={fg} />}

        <Pressable
          onPress={onClose}
          accessibilityLabel="Close support"
          style={({ pressed }) => [
            styles.heroIconBtn,
            { marginLeft: 10, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.heroIconGlyph, { color: fg }]}>×</Text>
        </Pressable>
      </View>

      {!onBack && (
        <View style={styles.heroTextBlock}>
          {brand.tagline ? (
            <Text style={[styles.heroTagline, { color: dimFg }]} numberOfLines={1}>
              {brand.tagline}
            </Text>
          ) : null}
          {brand.greeting ? (
            <Text style={[styles.heroGreeting, { color: fg }]} numberOfLines={2}>
              {brand.greeting}
            </Text>
          ) : (
            <Text style={[styles.heroGreeting, { color: fg }]} numberOfLines={1}>
              {brand.name}
            </Text>
          )}
        </View>
      )}
    </Background>
  );
};

const AgentStack: React.FC<{
  agents: NonNullable<Brand['agents']>;
  ringColor: string;
}> = ({ agents, ringColor }) => {
  // Cap at 4 to avoid an unbounded row pushing the close button off-screen.
  const visible = agents.slice(0, 4);
  return (
    <View style={styles.agentRow}>
      {visible.map((agent, i) => (
        <View
          key={i}
          style={[
            styles.agentCircle,
            {
              backgroundColor: agent.bgColor ?? '#FFFFFF',
              borderColor: ringColor,
              marginLeft: i === 0 ? 0 : -8,
              zIndex: visible.length - i,
            },
          ]}
        >
          {agent.icon ? (
            // Custom-rendered avatar (vector icon, emoji, etc.) — center it
            // inside the circle. Caller controls size + color of their icon.
            <View style={styles.agentIconWrap}>{agent.icon}</View>
          ) : agent.source ? (
            <Image source={agent.source} style={styles.agentImage} resizeMode="cover" />
          ) : null}
        </View>
      ))}
    </View>
  );
};

/** Convert a hex color to rgba with the given alpha. Falls back to the
 *  original color string if it isn't a recognized hex form. */
function withAlpha(color: string, alpha: number): string {
  const hex = color.replace('#', '').trim();
  if (hex.length !== 3 && hex.length !== 6) return color;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return color;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

  heroBg: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  heroBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  heroBrandName: {
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  heroIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconGlyph: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '500',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentImage: {
    width: '100%',
    height: '100%',
  },
  agentIconWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    marginTop: 24,
  },
  heroTagline: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 6,
  },
  heroGreeting: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
});

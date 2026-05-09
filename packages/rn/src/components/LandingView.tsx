import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import type { WidgetTheme } from '../theme';
import type { FaqItem, QuickLink } from '../types';
import type { WidgetLabels } from '../i18n';

export interface LandingViewProps {
  theme: WidgetTheme;
  greeting?: string;
  /** When true, the H1 greeting is hidden because the parent header is
   *  already rendering it (hero mode). Default false. */
  hideGreeting?: boolean;
  faq: FaqItem[];
  /** Optional action shortcuts (e.g. Change bank, Change vehicle). */
  quickLinks?: QuickLink[];
  labels: WidgetLabels;
  isRTL?: boolean;
  unreadMessages?: number;
  /** Tap on the Messages card → list of order conversations. */
  onOpenMessages: () => void;
  /** Tap on a FAQ row → article view. */
  onOpenFaq: (item: FaqItem) => void;
  /** Tap on the "Send us a message" CTA → 1:1 admin/support chat. */
  onSendNewMessage: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  theme,
  greeting,
  hideGreeting,
  faq,
  quickLinks,
  labels,
  unreadMessages,
  onOpenMessages,
  onOpenFaq,
  onSendNewMessage,
}) => {
  const [search, setSearch] = useState('');

  const filteredFaq = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faq;
    return faq.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        (item.a ?? '').toLowerCase().includes(q),
    );
  }, [faq, search]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.surface }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {greeting && !hideGreeting && (
        <Text style={[styles.greeting, { color: theme.textPrimary }]} numberOfLines={2}>
          {greeting}
        </Text>
      )}

      {/* Action cards: Messages + Help */}
      <View style={[styles.actionCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Pressable
          onPress={onOpenMessages}
          accessibilityLabel={labels.messagesCard}
          style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.actionLabel, { color: theme.textPrimary }]}>{labels.messagesCard}</Text>
          <View style={styles.actionRight}>
            {unreadMessages !== undefined && unreadMessages > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.badgeText, { color: theme.primaryText }]}>
                  {unreadMessages > 99 ? '99+' : String(unreadMessages)}
                </Text>
              </View>
            )}
            <Text style={[styles.chev, { color: theme.textSecondary }]}>›</Text>
          </View>
        </Pressable>
      </View>

      {/* CTA: starts a fresh support conversation (admin/support chat) */}
      <Pressable
        onPress={onSendNewMessage}
        accessibilityLabel={labels.sendUsAMessage}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: theme.background, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={[styles.ctaText, { color: theme.textPrimary }]}>{labels.sendUsAMessage}</Text>
        <Text style={[styles.ctaArrow, { color: theme.primary }]}>›</Text>
      </Pressable>

      {/* Quick action links — direct deep-links to profile screens
          (change bank, change vehicle, delete data, etc). */}
      {quickLinks && quickLinks.length > 0 && (
        <View style={[styles.helpBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
          {quickLinks.map((link, i) => (
            <Pressable
              key={link.id}
              onPress={link.onPress}
              accessibilityLabel={link.label}
              style={({ pressed }) => [
                styles.faqRow,
                {
                  borderTopColor: theme.border,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.faqText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {link.label}
                </Text>
                {link.hint && (
                  <Text style={[styles.linkHint, { color: theme.textSecondary }]} numberOfLines={1}>
                    {link.hint}
                  </Text>
                )}
              </View>
              <Text style={[styles.chev, { color: theme.textSecondary }]}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Help search + FAQ. Items with onPress jump to a screen; items
          with `a` text show an article view. */}
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {labels.helpSection}
      </Text>
      <View style={[styles.helpBlock, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={[styles.searchRow, { backgroundColor: theme.surface }]}>
          <Text style={[styles.searchIcon, { color: theme.textSecondary }]}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={labels.searchForHelp}
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>
        {filteredFaq.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            {faq.length === 0 ? labels.noHelpArticles : labels.noMatchingArticles}
          </Text>
        ) : (
          filteredFaq.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => (item.onPress ? item.onPress() : onOpenFaq(item))}
              accessibilityLabel={item.q}
              style={({ pressed }) => [
                styles.faqRow,
                {
                  borderTopColor: theme.border,
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.faqText, { color: theme.textPrimary }]} numberOfLines={2}>
                {item.q}
              </Text>
              <Text style={[styles.chev, { color: theme.textSecondary }]}>›</Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  actionCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chev: {
    fontSize: 22,
    fontWeight: '300',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaArrow: {
    fontSize: 24,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: -4,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  helpBlock: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    margin: 12,
    borderRadius: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 15,
    padding: 0,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  faqText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  linkHint: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
});

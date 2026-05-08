import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import type { WidgetTheme } from '../theme';
import type { FaqItem } from '../types';

export interface FaqArticleViewProps {
  theme: WidgetTheme;
  item: FaqItem;
}

export const FaqArticleView: React.FC<FaqArticleViewProps> = ({ theme, item }) => {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>{item.q}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{item.a}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});

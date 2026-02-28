import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReadMore } from '@/components/shared/ReadMore';
import { CollapsibleCard } from './CollapsibleCard';

interface Test {
  title: string;
  description: string;
  importance: 'high' | 'low';
  source?: string;
}

interface TestsSectionProps {
  tests: Test[];
}

export function TestsSection({ tests }: TestsSectionProps) {
  if (!tests || tests.length === 0) return null;

  const sorted = [...tests].sort((a, b) => {
    if (a.importance === b.importance) return 0;
    return a.importance === 'high' ? -1 : 1;
  });

  const allLow = tests.every((t) => t.importance === 'low');
  const highItems = sorted.filter((t) => t.importance === 'high');
  const lowItems = sorted.filter((t) => t.importance === 'low');

  const renderItem = (test: Test, index: number) => (
    <View key={index} style={styles.item}>
      <Text style={styles.itemTitle}>{test.title}</Text>
      {test.description ? <Text style={styles.itemDesc}>{test.description}</Text> : null}
    </View>
  );

  return (
    <CollapsibleCard
      icon="flask-outline"
      iconColor="#22C55E"
      heading="Tests"
      collapsible
      defaultCollapsed={allLow}
    >
      <View style={styles.list}>
        {highItems.map((t, i) => renderItem(t, i))}
        {lowItems.length > 0 && (
          <ReadMore
            items={lowItems.map((t, i) => renderItem(t, highItems.length + i))}
            initialCount={highItems.length > 0 ? 0 : 2}
          />
        )}
      </View>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  item: {
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    paddingLeft: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
});

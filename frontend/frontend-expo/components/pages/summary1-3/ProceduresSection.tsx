import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReadMore } from '@/components/shared/ReadMore';
import { CollapsibleCard } from './CollapsibleCard';

interface Procedure {
  title: string;
  description: string;
  timeframe?: string;
  importance: 'high' | 'low';
  source?: string;
}

interface ProceduresSectionProps {
  procedures: Procedure[];
}

export function ProceduresSection({ procedures }: ProceduresSectionProps) {
  if (!procedures || procedures.length === 0) return null;

  const sorted = [...procedures].sort((a, b) => {
    if (a.importance === b.importance) return 0;
    return a.importance === 'high' ? -1 : 1;
  });

  const allLow = procedures.every((p) => p.importance === 'low');
  const highItems = sorted.filter((p) => p.importance === 'high');
  const lowItems = sorted.filter((p) => p.importance === 'low');

  const renderItem = (proc: Procedure, index: number) => (
    <View key={index} style={styles.item}>
      <Text style={styles.itemTitle}>{proc.title}</Text>
      {proc.description ? <Text style={styles.itemDesc}>{proc.description}</Text> : null}
      {proc.timeframe ? <Text style={styles.detailText}>📅 {proc.timeframe}</Text> : null}
    </View>
  );

  return (
    <CollapsibleCard
      icon="pulse-outline"
      iconColor="#A855F7"
      heading="Procedures"
      collapsible
      defaultCollapsed={allLow}
    >
      <View style={styles.list}>
        {highItems.map((p, i) => renderItem(p, i))}
        {lowItems.length > 0 && (
          <ReadMore
            items={lowItems.map((p, i) => renderItem(p, highItems.length + i))}
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
    borderLeftColor: '#A855F7',
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
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
  },
});

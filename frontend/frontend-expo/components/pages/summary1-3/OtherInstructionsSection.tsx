import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReadMore } from '@/components/shared/ReadMore';
import { CollapsibleCard } from './CollapsibleCard';

interface OtherInstruction {
  title: string;
  description: string;
  dosage?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
  importance: 'high' | 'low';
  source?: string;
}

interface OtherInstructionsSectionProps {
  other: OtherInstruction[];
}

export function OtherInstructionsSection({ other }: OtherInstructionsSectionProps) {
  if (!other || other.length === 0) return null;

  const sorted = [...other].sort((a, b) => {
    if (a.importance === b.importance) return 0;
    return a.importance === 'high' ? -1 : 1;
  });

  const allLow = other.every((o) => o.importance === 'low');
  const highItems = sorted.filter((o) => o.importance === 'high');
  const lowItems = sorted.filter((o) => o.importance === 'low');

  const renderItem = (item: OtherInstruction, index: number) => (
    <View key={index} style={styles.item}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
      {(item.dosage || item.frequency || item.timing || item.duration) && (
        <View style={styles.detailsRow}>
          {item.dosage ? <Text style={styles.detailText}>💊 {item.dosage}</Text> : null}
          {item.frequency ? <Text style={styles.detailText}>⏱️ {item.frequency}</Text> : null}
          {item.timing ? <Text style={styles.detailText}>🕐 {item.timing}</Text> : null}
          {item.duration ? <Text style={styles.detailText}>📅 {item.duration}</Text> : null}
        </View>
      )}
    </View>
  );

  return (
    <CollapsibleCard
      icon="clipboard-outline"
      iconColor="#F97316"
      heading="Other Instructions"
      collapsible
      defaultCollapsed={allLow}
    >
      <View style={styles.list}>
        {highItems.map((o, i) => renderItem(o, i))}
        {lowItems.length > 0 && (
          <ReadMore
            items={lowItems.map((o, i) => renderItem(o, highItems.length + i))}
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
    borderLeftColor: '#F97316',
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
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReadMore } from '@/components/shared/ReadMore';
import { CollapsibleCard } from './CollapsibleCard';

interface Medication {
  title: string;
  dosage?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
  instructions?: string;
  importance: 'high' | 'low';
  source?: string;
  change?: boolean;
}

interface MedicationsSectionProps {
  medications: Medication[];
}

export function MedicationsSection({ medications }: MedicationsSectionProps) {
  if (!medications || medications.length === 0) return null;

  const sorted = [...medications].sort((a, b) => {
    if (a.importance === b.importance) return 0;
    return a.importance === 'high' ? -1 : 1;
  });

  const allLow = medications.every((m) => m.importance === 'low');
  const highItems = sorted.filter((m) => m.importance === 'high');
  const lowItems = sorted.filter((m) => m.importance === 'low');

  const renderItem = (med: Medication, index: number) => (
    <View key={index} style={styles.item}>
      <View style={styles.titleRow}>
        <Text style={styles.itemTitle}>{med.title}</Text>
        {med.change && (
          <View style={styles.changeBadge}>
            <Text style={styles.changeBadgeText}>Changed</Text>
          </View>
        )}
      </View>
      {med.instructions ? <Text style={styles.itemDesc}>{med.instructions}</Text> : null}
      {(med.dosage || med.frequency || med.timing || med.duration) && (
        <View style={styles.detailsRow}>
          {med.dosage ? <Text style={styles.detailText}>💊 {med.dosage}</Text> : null}
          {med.frequency ? <Text style={styles.detailText}>⏱️ {med.frequency}</Text> : null}
          {med.timing ? <Text style={styles.detailText}>🕐 {med.timing}</Text> : null}
          {med.duration ? <Text style={styles.detailText}>📅 {med.duration}</Text> : null}
        </View>
      )}
    </View>
  );

  return (
    <CollapsibleCard
      icon="medkit-outline"
      iconColor="#3B82F6"
      heading="Medications"
      collapsible
      defaultCollapsed={allLow}
    >
      <View style={styles.list}>
        {highItems.map((m, i) => renderItem(m, i))}
        {lowItems.length > 0 && (
          <ReadMore
            items={lowItems.map((m, i) => renderItem(m, highItems.length + i))}
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
    borderLeftColor: '#3B82F6',
    paddingLeft: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
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
  changeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeBadgeText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500',
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

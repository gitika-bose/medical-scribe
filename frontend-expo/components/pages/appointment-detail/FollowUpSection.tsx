import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReadMore } from '@/components/shared/ReadMore';

interface FollowUpItem {
  description: string;
  time_frame: string;
}

interface FollowUpSectionProps {
  followUp: FollowUpItem[];
}

export function FollowUpSection({ followUp }: FollowUpSectionProps) {
  if (!followUp || followUp.length === 0) return null;

  const followUpItems = followUp.map((item, index) => (
    <View key={index} style={styles.item}>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.timeFrame}>📅 {item.time_frame}</Text>
    </View>
  ));

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Follow-up</Text>
      <ReadMore items={followUpItems} initialCount={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  item: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  timeFrame: {
    fontSize: 15,
    color: '#1D4ED8',
    fontWeight: '500',
    marginTop: 8,
  },
});

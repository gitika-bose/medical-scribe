import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummarySectionProps {
  summary: string;
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Summary</Text>
      <Text style={styles.body}>{summary}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});

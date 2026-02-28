import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface SummarySectionProps {
  summary: string;
}

export function SummarySection({ summary }: SummarySectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
        <Text style={styles.heading}>Summary</Text>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  body: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});

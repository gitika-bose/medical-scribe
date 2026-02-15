import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReadMore } from '@/components/shared/ReadMore';

interface DiagnosisDetail {
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
}

interface DiagnosisSectionProps {
  diagnosis: {
    details: DiagnosisDetail[];
  };
}

export function DiagnosisSection({ diagnosis }: DiagnosisSectionProps) {
  if (!diagnosis || !diagnosis.details || diagnosis.details.length === 0) return null;

  // Sort by severity: high -> medium -> low
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const sortedDetails = [...diagnosis.details].sort((a, b) => {
    const aSev = a.severity ? severityOrder[a.severity] ?? 3 : 3;
    const bSev = b.severity ? severityOrder[b.severity] ?? 3 : 3;
    return aSev - bSev;
  });

  const diagnosisItems = sortedDetails.map((detail, index) => (
    <View key={index} style={styles.item}>
      <View style={styles.borderAccent} />
      <View style={styles.content}>
        <Text style={styles.title}>{detail.title}</Text>
        <Text style={styles.description}>{detail.description}</Text>
      </View>
    </View>
  ));

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Diagnosis</Text>
      <ReadMore items={diagnosisItems} initialCount={3} />
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
    flexDirection: 'row',
  },
  borderAccent: {
    width: 4,
    backgroundColor: '#EF4444',
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
});

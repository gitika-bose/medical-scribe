import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ReasonForVisit {
  reason: string;
  description: string;
}

interface ReasonForVisitSectionProps {
  reasonForVisit: ReasonForVisit[];
}

export function ReasonForVisitSection({ reasonForVisit }: ReasonForVisitSectionProps) {
  if (!reasonForVisit || reasonForVisit.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Reason for Visit</Text>
      <View style={styles.list}>
        {reasonForVisit.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.borderAccent} />
            <View style={styles.content}>
              <Text style={styles.reason}>{item.reason}</Text>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
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
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
  },
  borderAccent: {
    width: 4,
    backgroundColor: '#A855F7',
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingVertical: 4,
  },
  reason: {
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

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ReasonForVisit {
  reason: string;
  description: string;
}

interface ReasonForVisitSectionProps {
  reasonForVisit: ReasonForVisit[];
}

export function ReasonForVisitSection({ reasonForVisit }: ReasonForVisitSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  if (!reasonForVisit || reasonForVisit.length === 0) return null;

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)} activeOpacity={0.7}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Reason for Visit</Text>
          <Text style={[styles.toggleArrow, !collapsed && styles.toggleArrowExpanded]}>▸</Text>
        </View>
      </TouchableOpacity>
      {!collapsed && (
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
      )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
    flex: 1,
  },
  toggleArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  toggleArrowExpanded: {
    transform: [{ rotate: '90deg' }],
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

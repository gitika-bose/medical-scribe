import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadMore } from '@/components/shared/ReadMore';

interface Learning {
  title: string;
  description: string;
}

interface LearningsSectionProps {
  learnings: Learning[];
}

export function LearningsSection({ learnings }: LearningsSectionProps) {
  if (!learnings || learnings.length === 0) return null;

  const learningItems = learnings.map((learning, index) => (
    <View key={index} style={styles.item}>
      <Ionicons
        name="bulb-outline"
        size={20}
        color="#2563EB"
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{learning.title}</Text>
        <Text style={styles.description}>{learning.description}</Text>
      </View>
    </View>
  ));

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Key Learnings</Text>
      <ReadMore items={learningItems} initialCount={2} />
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
  item: {
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    paddingLeft: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  icon: {
    marginTop: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
});

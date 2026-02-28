import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadMore } from '@/components/shared/ReadMore';
import { Colors } from '@/constants/Colors';

interface ActionTodo {
  title: string;
  importance: 'high' | 'low';
  source?: string;
}

interface ActionTodoSectionProps {
  actionTodos: ActionTodo[];
}

export function ActionTodoSection({ actionTodos }: ActionTodoSectionProps) {
  if (!actionTodos || actionTodos.length === 0) return null;

  const sorted = [...actionTodos].sort((a, b) => {
    if (a.importance === b.importance) return 0;
    return a.importance === 'high' ? -1 : 1;
  });

  const items = sorted.map((todo, index) => (
    <View key={index} style={styles.actionItem}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.itemTitle}>{todo.title}</Text>
    </View>
  ));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle-outline" size={20} color={Colors.teal[600]} />
        <Text style={styles.heading}>Action Items</Text>
      </View>
      <ReadMore items={items} initialCount={5} />
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  bullet: {
    fontSize: 18,
    color: Colors.teal[600],
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
});

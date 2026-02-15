import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReadMore } from '@/components/shared/ReadMore';

interface Todo {
  type: string;
  title: string;
  description: string;
  recommended: boolean;
  verified: boolean;
  dosage?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
  timeframe?: string;
}

interface TodosSectionProps {
  todos: Todo[];
}

function getTodoIcon(type: string): { name: keyof typeof Ionicons.glyphMap; color: string } {
  const t = type.toLowerCase();
  if (t === 'medication') return { name: 'medkit-outline', color: '#3B82F6' };
  if (t === 'tests' || t === 'test') return { name: 'flask-outline', color: '#22C55E' };
  if (t === 'procedure') return { name: 'pulse-outline', color: '#A855F7' };
  return { name: 'clipboard-outline', color: '#F97316' };
}

function getTodoBorderColor(type: string): string {
  const t = type.toLowerCase();
  if (t === 'medication') return '#3B82F6';
  if (t === 'tests' || t === 'test') return '#22C55E';
  if (t === 'procedure') return '#A855F7';
  return '#F97316';
}

export function TodosSection({ todos }: TodosSectionProps) {
  if (!todos || todos.length === 0) return null;

  const todoItems = todos.map((todo, index) => {
    const icon = getTodoIcon(todo.type);
    const borderColor = getTodoBorderColor(todo.type);
    const isMedication = todo.type.toLowerCase() === 'medication';
    const isProcedure = todo.type.toLowerCase() === 'procedure';

    return (
      <View key={index} style={[styles.item, { borderLeftColor: borderColor }]}>
        <View style={styles.itemHeader}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
          <View style={styles.itemHeaderContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{todo.title}</Text>
              {todo.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            {todo.description ? (
              <Text style={styles.description}>{todo.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Medication details */}
        {isMedication && (todo.dosage || todo.frequency || todo.timing || todo.duration) && (
          <View style={styles.detailsRow}>
            {todo.dosage ? <Text style={styles.detailText}>💊 {todo.dosage}</Text> : null}
            {todo.frequency ? <Text style={styles.detailText}>⏱️ {todo.frequency}</Text> : null}
            {todo.timing ? <Text style={styles.detailText}>🕐 {todo.timing}</Text> : null}
            {todo.duration ? <Text style={styles.detailText}>📅 {todo.duration}</Text> : null}
          </View>
        )}

        {/* Procedure details */}
        {isProcedure && todo.timeframe && (
          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>📅 {todo.timeframe}</Text>
          </View>
        )}
      </View>
    );
  });

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Action Items</Text>
      <ReadMore items={todoItems} initialCount={5} />
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
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  itemHeaderContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingLeft: 32,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
});

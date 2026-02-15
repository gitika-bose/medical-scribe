import React, { useState, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReadMoreProps {
  /** Array of pre-rendered React Native elements to display. */
  items: ReactNode[];
  /** How many items to show before collapsing. */
  initialCount?: number;
}

/**
 * Collapsible list that shows `initialCount` items and a "Read More" toggle.
 * Mirrors the web ReadMore component.
 */
export function ReadMore({ items, initialCount = 3 }: ReadMoreProps) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) return null;

  const showAll = expanded || items.length <= initialCount;
  const displayItems = showAll ? items : items.slice(0, initialCount);

  return (
    <View>
      <View style={styles.list}>
        {displayItems.map((item, index) => (
          <View key={index}>{item}</View>
        ))}
      </View>

      {items.length > initialCount && (
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setExpanded(!expanded)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#2563EB"
            />
            <Text style={styles.toggleText}>
              {expanded
                ? 'Read Less'
                : `Read More (${items.length - initialCount} more)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  toggleRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2563EB',
  },
});

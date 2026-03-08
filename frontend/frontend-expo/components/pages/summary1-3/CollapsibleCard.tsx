import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface CollapsibleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  heading: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function CollapsibleCard({
  icon,
  iconColor,
  heading,
  children,
  collapsible = false,
  defaultCollapsed = false,
}: CollapsibleCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const header = (
    <View style={styles.headerRow}>
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.heading}>{heading}</Text>
      </View>
      {collapsible && (
        <Text style={[styles.toggleArrow, !collapsed && styles.toggleArrowExpanded]}>▸</Text>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      {collapsible ? (
        <TouchableOpacity onPress={() => setCollapsed(!collapsed)} activeOpacity={0.7}>
          {header}
        </TouchableOpacity>
      ) : (
        header
      )}
      {!collapsed && children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flex: 1,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.foreground,
  },
  toggleArrow: {
    fontSize: 18,
    color: Colors.gray[400],
    marginBottom: 12,
  },
  toggleArrowExpanded: {
    transform: [{ rotate: '90deg' }],
  },
});

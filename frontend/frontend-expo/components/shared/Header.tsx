import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/constants/Colors';

interface HeaderProps {
  /** Optional content rendered on the right side of the header (e.g. buttons) */
  rightContent?: React.ReactNode;
}

export function Header({ rightContent }: HeaderProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 600;

  return (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, isPhone && styles.headerTitlePhone]}>Juno</Text>
      {rightContent && <View>{rightContent}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerTitlePhone: {
    fontSize: 20,
  },
});

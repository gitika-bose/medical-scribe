import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Colors } from '@/constants/Colors';

interface HeaderProps {
  /** Optional content rendered on the right side of the header (e.g. buttons) */
  rightContent?: React.ReactNode;
}

export function Header({ rightContent }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { isPhone, isDesktop } = useResponsiveLayout();

  // On desktop the sidebar already shows the brand — skip the full header
  // but still render rightContent if provided
  if (isDesktop) {
    return rightContent ? (
      <View style={styles.desktopBar}>
        <View style={{ flex: 1 }} />
        <View>{rightContent}</View>
      </View>
    ) : null;
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.lightBackground,
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
  desktopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.lightBackground,
    zIndex: 20,
  },
});

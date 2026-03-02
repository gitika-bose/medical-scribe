import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface NavItem {
  key: string;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'index', label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  { key: 'appointments', label: 'Appointments', iconActive: 'calendar', iconInactive: 'calendar-outline' },
  { key: 'account', label: 'Account', iconActive: 'person', iconInactive: 'person-outline' },
];

interface DesktopSidebarProps {
  activeTab: string;
  onNavigate: (key: string) => void;
}

export function DesktopSidebar({ activeTab, onNavigate }: DesktopSidebarProps) {
  return (
    <View style={styles.sidebar}>
      {/* Brand */}
      <View style={styles.brand}>
        <Text style={styles.brandText}>Juno</Text>
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? item.iconActive : item.iconInactive}
                size={22}
                color={isActive ? Colors.primary : Colors.mutedForeground}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Juno v1.0</Text>
      </View>
    </View>
  );
}

const SIDEBAR_WIDTH = 240;

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.background,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 24,
    justifyContent: 'flex-start',
  },
  brand: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
  },
  nav: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: Colors.primaryMuted,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
});

export { SIDEBAR_WIDTH };

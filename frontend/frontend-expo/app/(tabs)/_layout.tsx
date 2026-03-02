import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, useSegments, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { DesktopSidebar } from '@/components/shared/DesktopSidebar';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsiveLayout();
  const segments = useSegments();
  const router = useRouter();

  // Determine active tab from segments
  const activeSegment = (segments[1] as string) || 'index';
  const activeTab = activeSegment === '(tabs)' ? 'index' : activeSegment;

  const handleNavigate = (key: string) => {
    if (key === 'index') {
      router.push('/(tabs)/' as any);
    } else {
      router.push(`/(tabs)/${key}` as any);
    }
  };

  // Always render a single <Tabs> instance. On desktop, hide the tab bar
  // and wrap the whole thing with the sidebar.
  const tabsElement = (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        headerShown: false,
        tabBarStyle: isDesktop
          ? { display: 'none' }
          : {
              borderTopWidth: 1,
              borderTopColor: Colors.border,
              backgroundColor: Colors.background,
              paddingBottom: Math.max(insets.bottom, 12),
              height: 60 + Math.max(insets.bottom, 12),
            },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <DesktopSidebar activeTab={activeTab} onNavigate={handleNavigate} />
        <View style={styles.desktopContent}>{tabsElement}</View>
      </View>
    );
  }

  return tabsElement;
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
  },
});

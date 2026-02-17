import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.blue[600],
        tabBarInactiveTintColor: Colors.gray[500],
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          backgroundColor: Colors.background,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: Platform.OS === 'ios' ? 50 + insets.bottom : 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSync } from '@/hooks/useSync';
import SyncStatusBanner from '@/components/SyncStatusBanner';
import { View } from 'react-native';

export default function TabsLayout() {
  const { status, pendingCount } = useSync();

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBanner status={status} pendingCount={pendingCount} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2d6a4f',
          tabBarInactiveTintColor: '#adb5bd',
          tabBarStyle: { backgroundColor: '#fff' },
          headerStyle: { backgroundColor: '#2d6a4f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="pets"
          options={{
            title: 'Pets',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="paw" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="owners"
          options={{
            title: 'People',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-group" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

/**
 * Tabs Layout for KhodroYar Application
 * 
 * This layout handles the bottom tab navigation for the main application.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../../src/theme';

// Tab configuration with Persian labels
const TAB_CONFIG = {
  home: {
    label: 'خانه',
    icon: 'home',
  },
  services: {
    label: 'سرویس‌ها',
    icon: 'wrench',
  },
  expenses: {
    label: 'هزینه‌ها',
    icon: 'cash',
  },
  calendar: {
    label: 'تقویم',
    icon: 'calendar',
  },
  more: {
    label: 'بیشتر',
    icon: 'dots-horizontal',
  },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: TAB_CONFIG.home.label,
          tabBarLabel: TAB_CONFIG.home.label,
        }}
      />
      <Tabs.Screen
        name="services/index"
        options={{
          title: TAB_CONFIG.services.label,
          tabBarLabel: TAB_CONFIG.services.label,
        }}
      />
      <Tabs.Screen
        name="expenses/index"
        options={{
          title: TAB_CONFIG.expenses.label,
          tabBarLabel: TAB_CONFIG.expenses.label,
        }}
      />
      <Tabs.Screen
        name="calendar/index"
        options={{
          title: TAB_CONFIG.calendar.label,
          tabBarLabel: TAB_CONFIG.calendar.label,
        }}
      />
      <Tabs.Screen
        name="more/index"
        options={{
          title: TAB_CONFIG.more.label,
          tabBarLabel: TAB_CONFIG.more.label,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

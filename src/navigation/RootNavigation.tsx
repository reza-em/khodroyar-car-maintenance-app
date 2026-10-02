/**
 * Root Navigation for KhodroYar Application
 * 
 * This component provides the main navigation structure using Expo Router.
 * It handles the bottom tab navigation and nested stack navigation.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { colors } from '../theme';

// Import PDF report screen for the more tab
import PDFReportScreen from '../../app/(tabs)/pdf-report';

// Tab configuration with Persian labels
export const TAB_CONFIG = {
  home: {
    label: 'خانه',
    icon: 'home',
    path: '(tabs)/home',
  },
  services: {
    label: 'سرویس‌ها',
    icon: 'wrench',
    path: '(tabs)/services',
  },
  expenses: {
    label: 'هزینه‌ها',
    icon: 'cash',
    path: '(tabs)/expenses',
  },
  calendar: {
    label: 'تقویم',
    icon: 'calendar',
    path: '(tabs)/calendar',
  },
  more: {
    label: 'بیشتر',
    icon: 'dots-horizontal',
    path: '(tabs)/more',
  },
};

// Tab icon component
function TabIcon({ icon, focused, color, size }: { icon: string; focused: boolean; color: string; size: number }) {
  return (
    <View style={styles.iconContainer}>
      <Icon
        source={icon}
        size={size}
        color={focused ? colors.primary : color}
      />
    </View>
  );
}

// Custom tab bar label
function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.labelContainer}>
      {/* We'll add Persian text here - for now using default Text */}
    </View>
  );
}

// Main navigation component
export function RootNavigation() {
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
          direction: 'rtl', // RTL support
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'System', // Will be replaced with Persian font
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        headerShown: false,
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="(tabs)/home/index"
        options={{
          title: TAB_CONFIG.home.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={TAB_CONFIG.home.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.home.label,
        }}
      />

      {/* Services Tab */}
      <Tabs.Screen
        name="(tabs)/services/index"
        options={{
          title: TAB_CONFIG.services.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={TAB_CONFIG.services.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.services.label,
        }}
      />

      {/* Expenses Tab */}
      <Tabs.Screen
        name="(tabs)/expenses/index"
        options={{
          title: TAB_CONFIG.expenses.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={TAB_CONFIG.expenses.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.expenses.label,
        }}
      />

      {/* Calendar Tab */}
      <Tabs.Screen
        name="(tabs)/calendar/index"
        options={{
          title: TAB_CONFIG.calendar.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={TAB_CONFIG.calendar.icon} focused={focused} color={color} size={size} />
          ),
          tabBarLabel: TAB_CONFIG.calendar.label,
        }}
      />

      {/* More Tab with nested screens */}
      <Tabs.Screen
        name="(tabs)/more/index"
        options={{
          title: TAB_CONFIG.more.label,
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon icon={TAB_CONFIG.more.icon} focused={focused} color={color} size={size} />
          ),
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
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RootNavigation;

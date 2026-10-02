/**
 * Root Layout for KhodroYar Application
 * 
 * This is the main layout component that wraps the entire application.
 * It provides the base UI structure, theme, and navigation context.
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Stack } from 'expo-router';

// Import theme
import { theme } from '../src/theme';

// Import notification handler configuration
import { configureNotificationHandler } from '../src/stores/useNotificationStore';

// Initialize database on app start
import { initializeDatabase } from '../src/lib/database';

// Initialize database
initializeDatabase();

// Configure notification handler at startup
configureNotificationHandler().catch(console.error);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={styles.innerContainer}>
            <StatusBar style="auto" />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            </Stack>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
});

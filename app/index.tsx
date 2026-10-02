/**
 * Main Entry Point for KhodroYar Application
 * 
 * This component handles the initial app loading, onboarding check,
 * and redirects to the appropriate screen.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';

// Import stores
import { useVehicleStore } from '../src/stores/useVehicleStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';

// Initialize stores
import { initializeStores } from '../src/stores';

export default function App() {
  const navigation = useNavigation();
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  
  // Initialize stores
  useEffect(() => {
    async function init() {
      try {
        // Initialize all stores
        await initializeStores();
        
        // Check onboarding status (temporary: always go to onboarding for now)
        // In production, check from settings
        const settingsStore = useSettingsStore.getState();
        const onboardingCompleted = settingsStore.onboarding?.completed || false;
        setIsOnboarded(onboardingCompleted);
        
        // Check if we have vehicles
        const vehicleStore = useVehicleStore.getState();
        await vehicleStore.initialize();
        
        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true); // Continue even with error
      }
    }
    
    init();
  }, []);

  // Redirect based on state
  useEffect(() => {
    if (!isReady) return;
    
    // For now, redirect to onboarding if no vehicles exist
    // In production, check onboarding status from settings
    const vehicleStore = useVehicleStore.getState();
    const hasVehicles = vehicleStore.hasVehicles();
    
    if (!hasVehicles) {
      // Redirect to onboarding
      router.replace('/onboarding');
    } else if (!isOnboarded) {
      // Redirect to onboarding
      router.replace('/onboarding');
    } else {
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [isReady, isOnboarded]);

  // Show loading while initializing
  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  // This should redirect before rendering anything
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1e3a8a" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1a2a',
  },
});

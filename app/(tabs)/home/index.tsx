/**
 * Home Screen for KhodroYar Application
 * 
 * Dashboard showing vehicle summary, upcoming services, and quick actions.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useVehicleStore } from '../../../src/stores/useVehicleStore';
import { colors } from '../../../src/theme';
import { useServiceStore } from '../../../src/stores/useServiceStore';
import { useOdometerStore } from '../../../src/stores/useOdometerStore';

export default function HomeScreen() {
  const { currentVehicle, hasVehicles } = useVehicleStore();
  const { getUpcomingServices } = useServiceStore();
  const { getLatestOdometer } = useOdometerStore();

  const upcomingServices = currentVehicle ? getUpcomingServices(currentVehicle.id) : [];
  const latestOdometer = currentVehicle ? getLatestOdometer(currentVehicle.id) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>خانه</Text>
        {currentVehicle && (
          <Text style={styles.vehicleName}>{currentVehicle.manufacturer} {currentVehicle.model}</Text>
        )}
      </View>

      {/* Dashboard Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>خلاصه خودرو</Text>
        
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>کارکرد فعلی</Text>
            {latestOdometer ? (
              <Text style={styles.summaryValue}>{latestOdometer.value.toLocaleString('fa-IR')} کیلومتر</Text>
            ) : (
              <Text style={styles.summaryValue}>ثبت نشده</Text>
            )}
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>سرویس‌های باقیمانده</Text>
            <Text style={styles.summaryValue}>{upcomingServices.length}</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>actions سریع</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>ثبت سرویس</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>ثبت هزینه</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>ثبت کارکرد</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>فعالیت‌های اخیر</Text>
        {!hasVehicles() && (
          <Text style={styles.emptyText}>هیچ خودروای ثبت نشده است</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
  },
  vehicleName: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 15,
  },
  summarySection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 5,
  },
  quickActionsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activitySection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});

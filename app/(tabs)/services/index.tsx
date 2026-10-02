/**
 * Services Screen for KhodroYar Application
 * 
 * Shows maintenance service history and allows adding new services.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useServiceStore } from '../../../src/stores/useServiceStore';
import { useVehicleStore } from '../../../src/stores/useVehicleStore';
import { colors } from '../../../src/theme';
import { formatJalaliDate } from '../../../src/lib/jalaliDate';

export default function ServicesScreen() {
  const { currentVehicle } = useVehicleStore();
  const { getServicesByVehicle } = useServiceStore();

  const services = currentVehicle ? getServicesByVehicle(currentVehicle.id) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سرویس‌ها</Text>
        {currentVehicle && (
          <Text style={styles.vehicleName}>{currentVehicle.manufacturer} {currentVehicle.model}</Text>
        )}
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>هیچ سرویسی ثبت نشده است</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>افزودن سرویس جدید</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceStatus}>{item.status}</Text>
              </View>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceDetailText}>
                  تاریخ: {formatJalaliDate(item.jalaliDate)}
                </Text>
                <Text style={styles.serviceDetailText}>
                  کارکرد: {item.odometer.toLocaleString('fa-IR')} کیلومتر
                </Text>
                {item.nextServiceOdometer && (
                  <Text style={styles.serviceDetailText}>
                    سرویس بعدی: {item.nextServiceOdometer.toLocaleString('fa-IR')} کیلومتر
                  </Text>
                )}
              </View>
              <Text style={styles.serviceCost}>
                هزینه: {item.cost?.toLocaleString('fa-IR')} تومان
              </Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
  },
  serviceStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  serviceDetails: {
    marginBottom: 10,
  },
  serviceDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 5,
  },
  serviceCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

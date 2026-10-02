/**
 * Expenses Screen for KhodroYar Application
 * 
 * Shows expense history and allows adding new expenses.
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useExpenseStore } from '../../../src/stores/useExpenseStore';
import { useVehicleStore } from '../../../src/stores/useVehicleStore';
import { colors } from '../../../src/theme';
import { formatJalaliDate } from '../../../src/lib/jalaliDate';
import { EXPENSE_CATEGORY_LABELS } from '../../../src/types/expense';

export default function ExpensesScreen() {
  const { currentVehicle } = useVehicleStore();
  const { getExpensesByVehicle } = useExpenseStore();

  const expenses = currentVehicle ? getExpensesByVehicle(currentVehicle.id) : [];
  
  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORY_LABELS[category as keyof typeof EXPENSE_CATEGORY_LABELS] || category;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>هزینه‌ها</Text>
        {currentVehicle && (
          <Text style={styles.vehicleName}>{currentVehicle.manufacturer} {currentVehicle.model}</Text>
        )}
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>هیچ هزینه‌ای ثبت نشده است</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>افزودن هزینه جدید</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseTitle}>{getCategoryLabel(item.category)}</Text>
                <Text style={styles.expenseAmount}>{item.amount.toLocaleString('fa-IR')} تومان</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseDetailText}>
                  تاریخ: {formatJalaliDate(item.jalaliDate)}
                </Text>
                {item.description && (
                  <Text style={styles.expenseDetailText}>
                    توضیحات: {item.description}
                  </Text>
                )}
              </View>
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
    backgroundColor: colors.secondary,
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
  expenseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.error,
    textAlign: 'left',
  },
  expenseDetails: {
    marginBottom: 10,
  },
  expenseDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.secondary,
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

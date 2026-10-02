/**
 * Calendar Screen for KhodroYar Application
 * 
 * Shows maintenance schedule and reminders on a Jalali calendar.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../src/theme';
import { formatJalaliDate, getCurrentJalaliDate, addJalaliDays, subtractJalaliDays } from '../../../src/lib/jalaliDate';

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentJalaliDate());

  // This is a placeholder - in production, we'd use a proper Jalali calendar component
  // For now, we'll show a simple date display

  const goToNextMonth = () => {
    setCurrentMonth(addJalaliDays(currentMonth, 30));
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subtractJalaliDays(currentMonth, 30));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>تقویم</Text>
        
        <View style={styles.monthNavigator}>
          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.monthText}>{currentMonth}</Text>
          
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.infoText}>
          تقویم جلالی به زودی پیاده‌سازی خواهد شد
        </Text>
        <Text style={styles.infoText}>
          در حال حاضر، یادآوری‌ها بر اساس تاریخ‌های ثبت شده نمایش داده می‌شوند
        </Text>
      </View>

      <View style={styles.remindersSection}>
        <Text style={styles.sectionTitle}>یادآوری‌های نزدیک</Text>
        <Text style={styles.emptyText}>هیچ یادآوری نزدیک یافت نشد</Text>
      </View>
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
    marginBottom: 20,
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
  },
  navButtonText: {
    fontSize: 24,
    color: colors.primary,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  remindersSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});

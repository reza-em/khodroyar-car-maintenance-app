/**
 * More Screen for KhodroYar Application
 * 
 * Contains settings, reports, backup, and other app features.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '../../../src/theme';

export default function MoreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>بیشتر</Text>
      </View>

      {/* Reports Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>گزارش‌ها</Text>
        
        <Link href="/(tabs)/pdf-report" asChild>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>گزارش PDF خودرو</Text>
            <Text style={styles.menuItemIcon}>›</Text>
          </TouchableOpacity>
        </Link>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>گزارش مالی</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>گزارش سرویس‌ها</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>تنظیمات</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>تنظیمات اعلان‌ها</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>تنظیمات نمایش</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>ارز و واحدها</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Backup Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>پشتیبانی و بازیابی</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>پشتیبان‌گیری از داده‌ها</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>بازیابی از پشتیبان</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>صدور اطلاعات JSON</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>درباره برنامه</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>درباره خودرویار</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>نسخه برنامه</Text>
          <Text style={styles.menuItemIcon}>›</Text>
        </TouchableOpacity>
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
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  menuItemIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
});

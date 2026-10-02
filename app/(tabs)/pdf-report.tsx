/**
 * PDF Report Screen for KhodroYar Application
 * 
 * Allows users to configure, generate, preview, and share PDF reports.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput, Button } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors } from '../../src/theme';
import { getJalaliDaysInMonth, getJalaliYear, getJalaliMonth, isValidJalaliDate } from '../../src/lib/jalaliDate';
import { useVehicleStore } from '../../src/stores/useVehicleStore';
import { useServiceStore } from '../../src/stores/useServiceStore';
import { useExpenseStore } from '../../src/stores/useExpenseStore';
import { useRepairStore } from '../../src/stores/useRepairStore';
import { usePartStore } from '../../src/stores/usePartStore';
import { useOdometerStore } from '../../src/stores/useOdometerStore';
import { generateVehicleReportPDF, generateMaintenanceReportPDF, generateRepairReportPDF, generatePartsReportPDF, generateExpenseReportPDF, generateCombinedReportPDF, ReportType, previewPdf } from '../../src/services/pdfService';
import { formatJalaliDate, getCurrentJalaliDate } from '../../src/lib/jalaliDate';
import { EXPENSE_CATEGORY_LABELS, ExpenseCategory } from '../../src/types/expense';
import { SERVICE_CATEGORY_LABELS, ServiceCategory } from '../../src/types/service';

// Report type configuration - must match ReportType in pdfService.ts
const REPORT_TYPES: { id: ReportType; label: string; description: string }[] = [
  {
    id: 'vehicle_history',
    label: 'تاریخچه کامل خودرو',
    description: 'گزارش کامل تاریخچه خودرو شامل تمام سرویس‌ها، تعمیرات، هزینه‌ها و قطعات'
  },
  {
    id: 'maintenance_history',
    label: 'تاریخچه سرویس‌ها',
    description: 'گزارش کامل سرویس‌ها و نگهداری‌های دوره‌ای'
  },
  {
    id: 'repair_history',
    label: 'تاریخچه تعمیرات',
    description: 'گزارش کامل تعمیرات انجام شده روی خودرو'
  },
  {
    id: 'parts_purchases',
    label: 'قطعات و خریدها',
    description: 'گزارش خرید قطعات و لوازم یدکی'
  },
  {
    id: 'expense_report',
    label: 'گزارش مالی',
    description: 'گزارش هزینه‌ها و مخارج خودرو'
  },
  {
    id: 'ownership_report',
    label: 'گزارش جامع',
    description: 'گزارش کامل و جامع مالکیت خودرو'
  },
];

// Expense category options
const EXPENSE_CATEGORY_OPTIONS: { id: ExpenseCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'همه دسته‌ها' },
  { id: 'maintenance', label: EXPENSE_CATEGORY_LABELS.maintenance },
  { id: 'repair', label: EXPENSE_CATEGORY_LABELS.repair },
  { id: 'parts', label: EXPENSE_CATEGORY_LABELS.parts },
  { id: 'fuel', label: EXPENSE_CATEGORY_LABELS.fuel },
  { id: 'third_party_insurance', label: EXPENSE_CATEGORY_LABELS.third_party_insurance },
  { id: 'comprehensive_insurance', label: EXPENSE_CATEGORY_LABELS.comprehensive_insurance },
  { id: 'technical_inspection', label: EXPENSE_CATEGORY_LABELS.technical_inspection },
  { id: 'parking', label: EXPENSE_CATEGORY_LABELS.parking },
  { id: 'fines', label: EXPENSE_CATEGORY_LABELS.fines },
  { id: 'car_wash', label: EXPENSE_CATEGORY_LABELS.car_wash },
  { id: 'other', label: EXPENSE_CATEGORY_LABELS.other },
];

// Service category options
const SERVICE_CATEGORY_OPTIONS: { id: ServiceCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'همه سرویس‌ها' },
  { id: 'oil_change', label: SERVICE_CATEGORY_LABELS.oil_change },
  { id: 'oil_filter', label: SERVICE_CATEGORY_LABELS.oil_filter },
  { id: 'air_filter', label: SERVICE_CATEGORY_LABELS.air_filter },
  { id: 'cabin_filter', label: SERVICE_CATEGORY_LABELS.cabin_filter },
  { id: 'fuel_filter', label: SERVICE_CATEGORY_LABELS.fuel_filter },
  { id: 'transmission_oil', label: SERVICE_CATEGORY_LABELS.transmission_oil },
  { id: 'timing_belt', label: SERVICE_CATEGORY_LABELS.timing_belt },
  { id: 'serpentine_belt', label: SERVICE_CATEGORY_LABELS.serpentine_belt },
  { id: 'brake_pads', label: SERVICE_CATEGORY_LABELS.brake_pads },
  { id: 'brake_discs', label: SERVICE_CATEGORY_LABELS.brake_discs },
];

export default function PDFReportScreen() {
  const params = useLocalSearchParams<{ vehicleId?: string }>();
  
  const [step, setStep] = useState<'config' | 'generating' | 'preview' | 'complete'>('config');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  
  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState({ year: '', month: '', day: '' });
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  
  // Report configuration state
  const [config, setConfig] = useState({
    reportType: 'vehicle_history' as ReportType,
    vehicleId: params.vehicleId || '',
    startDate: '',
    endDate: getCurrentJalaliDate(),
    expenseCategories: ['all'] as (ExpenseCategory | 'all')[],
    serviceCategories: ['all'] as (ServiceCategory | 'all')[],
    includeAttachments: false,
    detailed: true,
  });

  const { vehicles, currentVehicle, getVehicleById } = useVehicleStore();
  const { getServicesByVehicle } = useServiceStore();
  const { getExpensesByVehicle } = useExpenseStore();
  const { getRepairsByVehicle } = useRepairStore();
  const { getPartsByVehicle } = usePartStore();
  const { getOdometerEntriesByVehicle } = useOdometerStore();

  // Jalali date picker helper functions
  const openStartDatePicker = () => {
    const date = config.startDate || getCurrentJalaliDate();
    const [year, month, day] = date.split('/');
    setDatePickerDate({ year, month, day });
    setDatePickerMode('start');
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    const date = config.endDate || getCurrentJalaliDate();
    const [year, month, day] = date.split('/');
    setDatePickerDate({ year, month, day });
    setDatePickerMode('end');
    setShowEndDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const handleDateChange = (field: 'year' | 'month' | 'day', value: string) => {
    setDatePickerDate(prev => ({ ...prev, [field]: value }));
  };

  const confirmDateSelection = () => {
    const { year, month, day } = datePickerDate;
    const dateStr = `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
    
    if (!isValidJalaliDate(dateStr)) {
      Alert.alert('خطا', 'تاریخ وارد شده معتبر نیست');
      return;
    }
    
    if (datePickerMode === 'start') {
      setConfig(prev => ({ ...prev, startDate: dateStr }));
    } else {
      setConfig(prev => ({ ...prev, endDate: dateStr }));
    }
    closeDatePicker();
  };

  // Get current Jalali date parts for default values
  const getDateParts = (date: string) => {
    const [year, month, day] = date.split('/');
    return { year, month, day };
  };

  // Auto-select current vehicle if no vehicleId in params
  useEffect(() => {
    if (!config.vehicleId && currentVehicle) {
      setConfig(prev => ({ ...prev, vehicleId: currentVehicle.id }));
    }
  }, [currentVehicle, config.vehicleId]);

  // Set default date range
  useEffect(() => {
    if (!config.startDate && config.vehicleId) {
      const vehicle = getVehicleById(config.vehicleId);
      if (vehicle && vehicle.createdAt) {
        // Set start date to 1 year ago or vehicle creation date
        const start = formatJalaliDate(new Date(vehicle.createdAt).toISOString());
        setConfig(prev => ({ ...prev, startDate: start }));
      }
    }
  }, [config.vehicleId, config.startDate, getVehicleById]);

  const selectedVehicle = config.vehicleId ? getVehicleById(config.vehicleId) : null;

  const handleGenerateReport = async () => {
    if (!selectedVehicle) {
      Alert.alert('خطا', 'لطفاً یک خودرو انتخاب کنید');
      return;
    }

    setStep('generating');
    setProgress(0);
    setError(null);
    setReportUrl(null);

    try {
      let pdfUri: string;
      const vehicle = selectedVehicle;
      
      // Generate the appropriate report based on type
      switch (config.reportType) {
        case 'vehicle_history':
          setProgress(20);
          pdfUri = await generateVehicleReportPDF({
            vehicle,
            startDate: config.startDate,
            endDate: config.endDate,
            includeAttachments: config.includeAttachments,
            includeDetails: config.detailed,
          });
          break;
          
        case 'maintenance_history':
          setProgress(20);
          const services = getServicesByVehicle(vehicle.id);
          pdfUri = await generateMaintenanceReportPDF({
            vehicle,
            services,
            startDate: config.startDate,
            endDate: config.endDate,
            includeDetails: config.detailed,
          });
          break;
          
        case 'repair_history':
          setProgress(20);
          const repairs = getRepairsByVehicle(vehicle.id);
          pdfUri = await generateRepairReportPDF({
            vehicle,
            repairs,
            startDate: config.startDate,
            endDate: config.endDate,
            includeDetails: config.detailed,
          });
          break;
          
        case 'parts_purchases':
          setProgress(20);
          const parts = getPartsByVehicle(vehicle.id);
          pdfUri = await generatePartsReportPDF({
            vehicle,
            parts,
            startDate: config.startDate,
            endDate: config.endDate,
            includeDetails: config.detailed,
          });
          break;
          
        case 'expense_report':
          setProgress(20);
          const expenses = getExpensesByVehicle(vehicle.id);
          pdfUri = await generateExpenseReportPDF({
            vehicle,
            expenses,
            startDate: config.startDate,
            endDate: config.endDate,
            includeDetails: config.detailed,
          });
          break;
          
        case 'ownership_report':
        default:
          setProgress(20);
          const odometerEntries = getOdometerEntriesByVehicle(vehicle.id);
          const maintenanceRecords = getServicesByVehicle(vehicle.id);
          const repairRecords = getRepairsByVehicle(vehicle.id);
          const expenseRecords = getExpensesByVehicle(vehicle.id);
          const partRecords = getPartsByVehicle(vehicle.id);
          pdfUri = await generateCombinedReportPDF({
            vehicle,
            odometerEntries,
            maintenanceRecords,
            repairRecords,
            expenseRecords,
            partRecords,
            startDate: config.startDate,
            endDate: config.endDate,
            includeAttachments: config.includeAttachments,
            includeDetails: config.detailed,
          });
          break;
      }

      setProgress(80);
      setReportUrl(pdfUri);
      setStep('preview');
      setProgress(100);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ایجاد گزارش';
      setError(errorMessage);
      setStep('config');
      Alert.alert('خطا', errorMessage);
    }
  };

  const handleSaveReport = async () => {
    if (!reportUrl) return;

    try {
      // Get the file info
      const fileInfo = await FileSystem.getInfoAsync(reportUrl);
      
      // Generate a meaningful filename
      const vehicle = selectedVehicle;
      const vehicleName = vehicle ? `${vehicle.manufacturer}-${vehicle.model}` : 'خودرو';
      const dateRange = config.startDate && config.endDate 
        ? `${config.startDate.replace(/\//g, '-')}-to-${config.endDate.replace(/\//g, '-')}`
        : getCurrentJalaliDate().replace(/\//g, '-');
      
      const reportTypeLabel = REPORT_TYPES.find(r => r.id === config.reportType)?.label || 'report';
      const filename = `khodroyar-${vehicleName}-${reportTypeLabel}-${dateRange}.pdf`;
      
      // On Android, use the document picker to save
      if (Platform.OS === 'android') {
        // For now, just show success - in production, we'd use DocumentPicker
        Alert.alert('موفق', `گزارش با موفقیت ایجاد شد: ${filename}`);
      } else {
        // For iOS/other platforms, we can copy to documents directory
        const documentsDir = FileSystem.documentDirectory;
        const newPath = `${documentsDir}${filename}`;
        
        await FileSystem.copyAsync({
          from: reportUrl,
          to: newPath,
        });
        
        Alert.alert('موفق', `گزارش با موفقیت ذخیره شد: ${filename}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در ذخیره گزارش';
      Alert.alert('خطا', errorMessage);
    }
  };

  const handleShareReport = async () => {
    if (!reportUrl) return;

    try {
      // Check if the file exists
      const fileInfo = await FileSystem.getInfoAsync(reportUrl);
      
      if (!fileInfo.exists) {
        Alert.alert('خطا', 'فایل گزارش یافت نشد');
        return;
      }

      // Share the report
      await Sharing.shareAsync(reportUrl, {
        mimeType: 'application/pdf',
        dialogTitle: 'به اشتراک گذاری گزارش خودرویار',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطا در اشتراک گذاری گزارش';
      if (errorMessage !== 'Canceled') {
        Alert.alert('خطا', errorMessage);
      }
    }
  };

  const handleCancelGeneration = () => {
    // In a real implementation, we'd cancel the ongoing PDF generation
    // For now, just reset to config state
    setStep('config');
    setProgress(0);
  };

  // Build filename for display
  const getReportFilename = () => {
    if (!selectedVehicle) return 'report.pdf';
    
    const vehicleName = `${selectedVehicle.manufacturer}-${selectedVehicle.model}`;
    const dateRange = config.startDate && config.endDate 
      ? `${config.startDate.replace(/\//g, '-')}-to-${config.endDate.replace(/\//g, '-')}`
      : getCurrentJalaliDate().replace(/\//g, '-');
    const reportTypeLabel = REPORT_TYPES.find(r => r.id === config.reportType)?.label || 'report';
    
    return `khodroyar-${vehicleName}-${reportTypeLabel}-${dateRange}.pdf`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>گزارش PDF خودرو</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Configuration Step */}
      {step === 'config' && (
        <View style={styles.configContainer}>
          {/* Vehicle Selection */}
          <View style={styles.configSection}>
            <Text style={styles.sectionLabel}>خودرو</Text>
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>
                {selectedVehicle 
                  ? `${selectedVehicle.manufacturer} ${selectedVehicle.model} - ${selectedVehicle.licensePlate || selectedVehicle.vin || selectedVehicle.id.substring(0, 8)}`
                  : 'یک خودرو انتخاب کنید'
                }
              </Text>
            </View>
          </View>

          {/* Report Type Selection */}
          <View style={styles.configSection}>
            <Text style={styles.sectionLabel}>نوع گزارش</Text>
            <View style={styles.radioGroup}>
              {REPORT_TYPES.map((reportType) => (
                <TouchableOpacity
                  key={reportType.id}
                  style={[
                    styles.radioButton,
                    config.reportType === reportType.id && styles.radioButtonSelected
                  ]}
                  onPress={() => setConfig(prev => ({ ...prev, reportType: reportType.id }))}
                >
                  <Text style={[
                    styles.radioButtonText,
                    config.reportType === reportType.id && styles.radioButtonTextSelected
                  ]}>
                    {reportType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.configSection}>
            <Text style={styles.sectionLabel}>بازه زمانی (جلالی)</Text>
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateInputLabel}>از تاریخ</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={openStartDatePicker}
                >
                  <Text style={styles.dateInputText}>
                    {config.startDate ? config.startDate : 'انتخاب تاریخ شروع'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateInputLabel}>تا تاریخ</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={openEndDatePicker}
                >
                  <Text style={styles.dateInputText}>
                    {config.endDate ? config.endDate : 'انتخاب تاریخ پایان'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          {/* Jalali Date Picker Modal */}
          <Modal
            visible={showStartDatePicker || showEndDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={closeDatePicker}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerTitle}>
                  {datePickerMode === 'start' ? 'تاریخ شروع' : 'تاریخ پایان'}
                </Text>
                
                <View style={styles.datePickerFields}>
                  <View style={styles.datePickerField}>
                    <Text style={styles.datePickerFieldLabel}>سال</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={datePickerDate.year}
                      onChangeText={(text) => handleDateChange('year', text)}
                      keyboardType="numeric"
                      placeholder="۱۴۰۳"
                      placeholderTextColor="#999"
                      maxLength={4}
                    />
                  </View>
                  <View style={styles.datePickerField}>
                    <Text style={styles.datePickerFieldLabel}>ماه</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={datePickerDate.month}
                      onChangeText={(text) => handleDateChange('month', text)}
                      keyboardType="numeric"
                      placeholder="۰۱"
                      placeholderTextColor="#999"
                      maxLength={2}
                    />
                  </View>
                  <View style={styles.datePickerField}>
                    <Text style={styles.datePickerFieldLabel}>روز</Text>
                    <TextInput
                      style={styles.datePickerInput}
                      value={datePickerDate.day}
                      onChangeText={(text) => handleDateChange('day', text)}
                      keyboardType="numeric"
                      placeholder="۰۱"
                      placeholderTextColor="#999"
                      maxLength={2}
                    />
                  </View>
                </View>
                
                <View style={styles.datePickerButtons}>
                  <Button title="لغو" onPress={closeDatePicker} color={colors.error} />
                  <Button title="تایید" onPress={confirmDateSelection} color={colors.primary} />
                </View>
              </View>
            </View>
          </Modal>

          {/* Filter Options Based on Report Type */}
          {config.reportType === 'expense-report' && (
            <View style={styles.configSection}>
              <Text style={styles.sectionLabel}>دسته‌بندی هزینه‌ها</Text>
              <View style={styles.checkboxGroup}>
                {EXPENSE_CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.checkboxButton,
                      config.expenseCategories.includes(category.id) && styles.checkboxButtonSelected
                    ]}
                    onPress={() => {
                      setConfig(prev => {
                        const categories = [...prev.expenseCategories];
                        if (category.id === 'all') {
                          return { ...prev, expenseCategories: ['all'] };
                        }
                        
                        const allIndex = categories.findIndex(c => c === 'all');
                        if (allIndex !== -1) {
                          categories.splice(allIndex, 1);
                        }
                        
                        const existingIndex = categories.findIndex(c => c === category.id);
                        if (existingIndex !== -1) {
                          categories.splice(existingIndex, 1);
                        } else {
                          categories.push(category.id as ExpenseCategory);
                        }
                        
                        return { ...prev, expenseCategories: categories };
                      });
                    }}
                  >
                    <Text style={styles.checkboxButtonText}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {config.reportType === 'maintenance-history' && (
            <View style={styles.configSection}>
              <Text style={styles.sectionLabel}>دسته سرویس‌ها</Text>
              <View style={styles.checkboxGroup}>
                {SERVICE_CATEGORY_OPTIONS.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.checkboxButton,
                      config.serviceCategories.includes(category.id) && styles.checkboxButtonSelected
                    ]}
                    onPress={() => {
                      setConfig(prev => {
                        const categories = [...prev.serviceCategories];
                        if (category.id === 'all') {
                          return { ...prev, serviceCategories: ['all'] };
                        }
                        
                        const allIndex = categories.findIndex(c => c === 'all');
                        if (allIndex !== -1) {
                          categories.splice(allIndex, 1);
                        }
                        
                        const existingIndex = categories.findIndex(c => c === category.id);
                        if (existingIndex !== -1) {
                          categories.splice(existingIndex, 1);
                        } else {
                          categories.push(category.id as ServiceCategory);
                        }
                        
                        return { ...prev, serviceCategories: categories };
                      });
                    }}
                  >
                    <Text style={styles.checkboxButtonText}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Additional Options */}
          <View style={styles.configSection}>
            <Text style={styles.sectionLabel}>تنظیمات گزارش</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>شامل ضمیمه‌ها (تصاویر)</Text>
              <TouchableOpacity
                style={[
                  styles.switchButton,
                  config.includeAttachments && styles.switchButtonActive
                ]}
                onPress={() => setConfig(prev => ({ 
                  ...prev, 
                  includeAttachments: !prev.includeAttachments 
                }))}
              >
                <Text style={styles.switchButtonText}>
                  {config.includeAttachments ? 'بله' : 'خیر'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>جزئیات کامل</Text>
              <TouchableOpacity
                style={[
                  styles.switchButton,
                  config.detailed && styles.switchButtonActive
                ]}
                onPress={() => setConfig(prev => ({ 
                  ...prev, 
                  detailed: !prev.detailed 
                }))}
              >
                <Text style={styles.switchButtonText}>
                  {config.detailed ? 'بله' : 'خیر'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Generate Button */}
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={handleGenerateReport}
            disabled={!selectedVehicle || !config.startDate}
          >
            <Text style={styles.generateButtonText}>ایجاد گزارش</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Generating Step */}
      {step === 'generating' && (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.generatingText}>در حال ایجاد گزارش...</Text>
          <Text style={styles.progressText}>{progress}%</Text>
          
          {progress < 100 && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelGeneration}
            >
              <Text style={styles.cancelButtonText}>لغو</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Preview Step */}
      {(step === 'preview' || step === 'complete') && reportUrl && (
        <View style={styles.previewContainer}>
          <View style={styles.previewSuccessContainer}>
            <Text style={styles.previewSuccessText}>گزارش با موفقیت ایجاد شد!</Text>
            <Text style={styles.filenameText}>{getReportFilename()}</Text>
          </View>

          <View style={styles.previewActionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.previewButton]}
              onPress={async () => {
                if (reportUrl) {
                  try {
                    const result = await previewPdf(reportUrl);
                    if (!result.success && result.error) {
                      Alert.alert('خطا', result.error);
                    }
                  } catch (err) {
                    Alert.alert('خطا', 'خطا در باز کردن پیش‌نمایش PDF');
                  }
                } else {
                  Alert.alert('خطا', 'فایل گزارش یافت نشد');
                }
              }}
            >
              <Text style={styles.actionButtonText}>پیش‌نمایش</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveReport}
            >
              <Text style={styles.actionButtonText}>ذخیره در دستگاه</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShareReport}
            >
              <Text style={styles.actionButtonText}>به اشتراک گذاری</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setStep('config');
              setReportUrl(null);
            }}
          >
            <Text style={styles.backButtonText}>بازگشت به تنظیمات</Text>
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    textAlign: 'right',
    fontSize: 14,
  },
  configContainer: {
    flex: 1,
  },
  configSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 15,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
  },
  dropdownLabel: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  radioButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  radioButtonText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  radioButtonTextSelected: {
    color: '#ffffff',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 5,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.background,
  },
  dateInputText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkboxButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  checkboxButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxButtonText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  switchButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  switchButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  switchButtonText: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  switchButtonActiveText: {
    color: '#ffffff',
  },
  generateButton: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  generatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  generatingText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  cancelButton: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
  },
  previewSuccessContainer: {
    backgroundColor: colors.successLight,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  previewSuccessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
    marginBottom: 5,
  },
  filenameText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  previewActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.secondary,
  },
  shareButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Date Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerField: {
    flex: 1,
    marginHorizontal: 5,
  },
  datePickerFieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 5,
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.text,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

/**
 * Onboarding Screen for KhodroYar Application
 * 
 * Introduces new users to the application and collects initial vehicle information.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useVehicleStore } from '../src/stores/useVehicleStore';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { colors } from '../src/theme';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../src/lib/jalaliDate';
import { FuelType, PERSIAN_MANUFACTURERS } from '../src/types/vehicle';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [vehicleInfo, setVehicleInfo] = useState({
    manufacturer: '',
    model: '',
    productionYear: '',
    trim: '',
    licensePlate: '',
    currentOdometer: '',
    fuelType: 'gasoline' as FuelType,
    vin: '',
    imageUri: '',
  });

  const { addVehicle } = useVehicleStore();
  const { settings, updateSettings } = useSettingsStore();

  const handleInputChange = (field: string, value: string) => {
    setVehicleInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Basic validation
    if (step === 1) {
      if (!vehicleInfo.manufacturer || !vehicleInfo.model) {
        Alert.alert('خطا', 'لطفاً سازنده و مدل خودرو را وارد کنید');
        return;
      }
    }

    if (step === 2) {
      if (!vehicleInfo.productionYear) {
        Alert.alert('خطا', 'لطفاً سال ساخت خودرو را وارد کنید');
        return;
      }
    }

    if (step === 3) {
      // Validate numeric fields
      if (vehicleInfo.currentOdometer && isNaN(Number(vehicleInfo.currentOdometer))) {
        Alert.alert('خطا', 'کارکرد فعلی باید یک عدد باشد');
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Create vehicle object
      const vehicleData = {
        manufacturer: vehicleInfo.manufacturer,
        model: vehicleInfo.model,
        year: parseInt(vehicleInfo.productionYear) || 0,
        trim: vehicleInfo.trim || undefined,
        licensePlate: vehicleInfo.licensePlate || undefined,
        currentOdometer: vehicleInfo.currentOdometer ? parseFloat(vehicleInfo.currentOdometer) : 0,
        fuelType: vehicleInfo.fuelType,
        vin: vehicleInfo.vin || undefined,
        imageUri: vehicleInfo.imageUri || undefined,
        createdAt: getCurrentGregorianISO(),
        updatedAt: getCurrentGregorianISO(),
        isActive: true,
        isDefault: true,
      };

      // Add vehicle
      const result = await addVehicle(vehicleData);
      
      if (result.success && result.vehicle) {
        // Mark onboarding as completed
        await updateSettings({
          onboarding: {
            completed: true,
            completedAt: getCurrentGregorianISO(),
            jalaliDate: getCurrentJalaliDate(),
          },
        });

        // Navigate to main app
        router.replace('/(tabs)');
      } else {
        Alert.alert('خطا', result.error || 'خطا در ثبت خودرو');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت خودرو';
      Alert.alert('خطا', errorMessage);
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed without adding vehicle
    await updateSettings({
      onboarding: {
        completed: true,
        completedAt: getCurrentGregorianISO(),
        jalaliDate: getCurrentJalaliDate(),
      },
    });
    
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>به خودرویار خوش آمدید</Text>
        <Text style={styles.subtitle}>همراه هوشمند نگهداری خودروی شما</Text>
        
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s <= step && styles.progressDotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>اطلاعات پایه خودرو</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>سازنده</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.manufacturer}
              onChangeText={(text) => handleInputChange('manufacturer', text)}
              placeholder="مثال: پژو"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>مدل</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.model}
              onChangeText={(text) => handleInputChange('model', text)}
              placeholder="مثال: ۲۰۷"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>
        </View>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>جزئیات خودرو</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>سال ساخت</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.productionYear}
              onChangeText={(text) => handleInputChange('productionYear', text)}
              placeholder="مثال: ۱۴۰۰"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>تریم (اختیاری)</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.trim}
              onChangeText={(text) => handleInputChange('trim', text)}
              placeholder="مثال: پانوراما"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>پلاک خودرو (اختیاری)</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.licensePlate}
              onChangeText={(text) => handleInputChange('licensePlate', text)}
              placeholder="مثال: ۱۲۳۴۵۶"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>
        </View>
      )}

      {/* Step 3: Odometer and Fuel */}
      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>کارکرد و سوخت</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>کارکرد فعلی (کیلومتر)</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.currentOdometer}
              onChangeText={(text) => handleInputChange('currentOdometer', text)}
              placeholder="مثال: ۸۵۰۰۰"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع سوخت</Text>
            <View style={styles.radioGroup}>
              {[
                { id: 'gasoline', label: 'بنزین' },
                { id: 'diesel', label: 'گازوئیل' },
                { id: 'cng', label: 'CNG' },
                { id: 'hybrid', label: 'هیبرید' },
                { id: 'electric', label: 'برقی' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.radioButton,
                    vehicleInfo.fuelType === option.id && styles.radioButtonSelected
                  ]}
                  onPress={() => handleInputChange('fuelType', option.id as FuelType)}
                >
                  <Text style={[
                    styles.radioButtonText,
                    vehicleInfo.fuelType === option.id && styles.radioButtonTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Step 4: Optional Information */}
      {step === 4 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>اطلاعات اختیاری</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>شماره شاسی VIN (اختیاری)</Text>
            <TextInput
              style={styles.input}
              value={vehicleInfo.vin}
              onChangeText={(text) => handleInputChange('vin', text)}
              placeholder="شماره شاسی خودرو"
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              اطلاعات فوق برای ایجاد یادآوری‌ها و گزارش‌های دقیق استفاده می‌شود.
            </Text>
            <Text style={styles.infoText}>
              شما می‌توانید بعدها این اطلاعات را ویرایش کنید.
            </Text>
          </View>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {step > 1 && (
          <TouchableOpacity 
            style={[styles.navButton, styles.prevButton]}
            onPress={handlePrevious}
          >
            <Text style={styles.navButtonText}>بازگشت</Text>
          </TouchableOpacity>
        )}

        {step < 4 ? (
          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
          >
            <Text style={styles.navButtonText}>ادامه</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.finalButtonsContainer}>
            <TouchableOpacity 
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={styles.navButtonText}>تکمیل</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.navButton, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={[styles.navButtonText, styles.skipButtonText]}>رد کردن</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
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
    backgroundColor: colors.surface,
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
  infoContainer: {
    backgroundColor: colors.background,
    padding: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: 5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20,
  },
  navButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  prevButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.success,
    marginRight: 5,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
    marginLeft: 5,
  },
  skipButtonText: {
    color: colors.textSecondary,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalButtonsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
});

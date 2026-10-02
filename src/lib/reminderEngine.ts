/**
 * Reminder Calculation Engine for KhodroYar Application
 * 
 * This module provides the core business logic for calculating
 * when services and reminders are due based on odometer readings
 * and date intervals.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  getCurrentGregorianISO,
  getCurrentJalaliDate,
  jalaliToGregorian,
  getJalaliYear,
  getJalaliMonth,
  getJalaliDay,
  addJalaliDays,
  addJalaliMonths,
  addJalaliYears,
  jalaliDateDiffInDays,
  isJalaliDateBefore,
  isJalaliDateAfter,
  isJalaliDateSame,
  toPersianDigits,
} from './jalaliDate';
import {
  MaintenanceRecord,
  ServiceCategory,
  ServiceStatus,
  ServiceInterval,
  DEFAULT_SERVICE_INTERVALS,
  SERVICE_CATEGORY_LABELS,
} from '../types/service';
import {
  OdometerEntry,
  OdometerThreshold,
} from '../types/odometer';
import {
  Reminder,
  ReminderType,
  ReminderStatus,
  ReminderPriority,
  CalculatedReminder,
  ReminderCalculationContext,
} from '../types/reminder';
import {
  Vehicle,
} from '../types/vehicle';

// Default thresholds
const DEFAULT_WARNING_DAYS = 7;
const DEFAULT_WARNING_KILOMETERS = 1000;

/**
 * Calculate the next service date based on current date and interval
 */
export function calculateNextServiceDate(
  currentDate: string,
  interval: ServiceInterval
): { nextDate: string; daysUntil: number } {
  const currentGregorian = jalaliToGregorian(currentDate);
  const today = new Date();
  
  // Calculate days from date-based intervals
  let daysToAdd = 0;
  
  if (interval.years) {
    daysToAdd += interval.years * 365; // Approximate
  }
  
  if (interval.months) {
    // Add months to the current date
    const tempDate = jalaliToGregorian(currentDate);
    tempDate.setMonth(tempDate.getMonth() + interval.months);
    const nextTempDate = addJalaliMonths(currentDate, interval.months);
    const nextTempGregorian = jalaliToGregorian(nextTempDate);
    daysToAdd = Math.floor(
      (nextTempGregorian.getTime() - currentGregorian.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
  
  if (interval.days) {
    daysToAdd += interval.days;
  }
  
  // Calculate the next date
  const nextDate = addJalaliDays(currentDate, daysToAdd);
  const nextDateGregorian = jalaliToGregorian(nextDate);
  const currentDateGregorian = jalaliToGregorian(currentDate);
  
  const daysUntil = Math.floor(
    (nextDateGregorian.getTime() - currentDateGregorian.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return { nextDate, daysUntil: Math.max(0, daysUntil) };
}

/**
 * Calculate next service odometer based on current odometer and interval
 */
export function calculateNextServiceOdometer(
  currentOdometer: number,
  interval: ServiceInterval
): { nextOdometer: number; kilometersUntil: number } {
  const kilometersToAdd = interval.kilometers || 0;
  const nextOdometer = currentOdometer + kilometersToAdd;
  const kilometersUntil = kilometersToAdd;
  
  return { nextOdometer, kilometersUntil: Math.max(0, kilometersUntil) };
}

/**
 * Calculate when a service will be due based on both date and odometer intervals
 * Returns the sooner of the two limits
 */
export function calculateServiceDue(
  currentDate: string,
  currentOdometer: number,
  lastServiceDate: string,
  lastServiceOdometer: number,
  interval: ServiceInterval,
  warningThresholds?: {
    days?: number;
    kilometers?: number;
  }
): {
  nextServiceDate: string;
  nextServiceOdometer: number;
  daysUntilDue: number;
  kilometersUntilDue: number;
  status: ServiceStatus;
  isOverdue: boolean;
  isWithinWarning: boolean;
  whichComesFirst: 'date' | 'odometer' | 'both';
} {
  const thresholds = {
    days: warningThresholds?.days ?? DEFAULT_WARNING_DAYS,
    kilometers: warningThresholds?.kilometers ?? DEFAULT_WARNING_KILOMETERS,
  };
  
  // Calculate next date-based service
  const { nextDate: nextServiceDate, daysUntil: daysUntilDate } = calculateNextServiceDate(
    lastServiceDate,
    interval
  );
  
  // Calculate next odometer-based service
  const { nextOdometer: nextServiceOdometer, kilometersUntil: kmUntilOdometer } = 
    calculateNextServiceOdometer(lastServiceOdometer, interval);
  
  // Calculate days from date
  const daysUntilDateDue = daysUntilDate;
  
  // Calculate kilometers from odometer
  const kmUntilOdometerDue = nextServiceOdometer - currentOdometer;
  
  // Determine which comes first
  let whichComesFirst: 'date' | 'odometer' | 'both' = 'both';
  
  if (daysUntilDateDue < (kmUntilOdometerDue / 30)) {
    whichComesFirst = 'date';
  } else if (kmUntilOdometerDue < (daysUntilDateDue * 30)) {
    whichComesFirst = 'odometer';
  }
  
  // If "whichever comes first" is enabled, we need to check which limit is reached first
  if (interval.useWhicheverComesFirst) {
    const dateReached = daysUntilDateDue <= 0;
    const odometerReached = kmUntilOdometerDue <= 0;
    
    if (dateReached && odometerReached) {
      whichComesFirst = 'both';
    } else if (dateReached) {
      whichComesFirst = 'date';
    } else if (odometerReached) {
      whichComesFirst = 'odometer';
    } else {
      // Both are in the future, determine which comes first
      const daysPerKm = 30; // Approximate days per 1000 km
      const daysEquivalentToKm = kmUntilOdometerDue / daysPerKm;
      
      if (daysUntilDateDue < daysEquivalentToKm) {
        whichComesFirst = 'date';
      } else if (daysUntilDateDue > daysEquivalentToKm) {
        whichComesFirst = 'odometer';
      } else {
        whichComesFirst = 'both';
      }
    }
  }
  
  // Determine status based on which comes first
  let isOverdue = false;
  let isWithinWarning = false;
  let daysUntilDue = daysUntilDateDue;
  let kilometersUntilDue = kmUntilOdometerDue;
  
  if (whichComesFirst === 'date' || whichComesFirst === 'both') {
    daysUntilDue = daysUntilDateDue;
    kilometersUntilDue = kmUntilOdometerDue;
    
    if (daysUntilDateDue <= 0) {
      isOverdue = true;
    } else if (daysUntilDateDue <= thresholds.days) {
      isWithinWarning = true;
    }
  }
  
  if (whichComesFirst === 'odometer' || whichComesFirst === 'both') {
    if (kmUntilOdometerDue <= 0) {
      isOverdue = true;
    } else if (kmUntilOdometerDue <= thresholds.kilometers) {
      isWithinWarning = true;
    }
  }
  
  // Determine status
  let status: ServiceStatus = 'scheduled';
  
  if (isOverdue) {
    status = 'overdue';
  } else if (isWithinWarning) {
    status = 'upcoming';
  } else if (whichComesFirst === 'date' && daysUntilDateDue <= 14) {
    status = 'upcoming';
  } else if (whichComesFirst === 'odometer' && kmUntilOdometerDue <= 2000) {
    status = 'upcoming';
  } else if (daysUntilDateDue <= 0 && kmUntilOdometerDue <= 0) {
    status = 'due';
  }
  
  return {
    nextServiceDate,
    nextServiceOdometer,
    daysUntilDue,
    kilometersUntilDue,
    status,
    isOverdue,
    isWithinWarning,
    whichComesFirst,
  };
}

/**
 * Calculate all reminders for a vehicle based on its maintenance records and current state
 */
export function calculateVehicleReminders(
  vehicle: Vehicle,
  maintenanceRecords: MaintenanceRecord[],
  currentDate: string = getCurrentJalaliDate(),
  warningThresholds: {
    days?: number;
    kilometers?: number;
  } = {}
): CalculatedReminder[] {
  const thresholds = {
    days: warningThresholds.days ?? DEFAULT_WARNING_DAYS,
    kilometers: warningThresholds.kilometers ?? DEFAULT_WARNING_KILOMETERS,
  };
  
  const reminders: CalculatedReminder[] = [];
  const currentOdometer = vehicle.currentOdometer;
  
  for (const record of maintenanceRecords) {
    // Skip if no next service interval is defined
    if (!record.nextServiceInterval) continue;
    
    // Skip completed/skipped/cancelled services
    if (['completed', 'skipped', 'cancelled'].includes(record.status)) {
      // Check if we should still remind based on the next service date
      if (!record.nextServiceDate) continue;
    }
    
    const dueResult = calculateServiceDue(
      currentDate,
      currentOdometer,
      record.jalaliDate,
      record.odometer,
      record.nextServiceInterval,
      thresholds
    );
    
    const reminder: CalculatedReminder = {
      reminder: {
        id: uuidv4(),
        vehicleId: vehicle.id,
        title: `${SERVICE_CATEGORY_LABELS[record.category]} - ${record.serviceTypeName}`,
        description: record.description,
        type: 'service',
        serviceId: record.id,
        remindAt: dueResult.nextServiceDate,
        jalaliDate: dueResult.nextServiceDate,
        frequency: 'once',
        isActive: true,
        status: dueResult.isOverdue ? 'overdue' : dueResult.isWithinWarning ? 'triggered' : 'pending',
        priority: dueResult.isOverdue ? 'critical' : dueResult.isWithinWarning ? 'high' : 'medium',
        notifyBeforeDays: thresholds.days,
        notifyBeforeKilometers: thresholds.kilometers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        snoozeCount: 0,
      },
      serviceStatus: dueResult.status,
      daysUntilDue: dueResult.daysUntilDue,
      kilometersUntilDue: dueResult.kilometersUntilDue,
      isDue: dueResult.isOverdue || dueResult.status === 'due',
      isOverdue: dueResult.isOverdue,
      progressPercent: calculateProgressPercent(dueResult, thresholds),
      message: generateReminderMessage(record, dueResult, vehicle),
      notificationTitle: `یادآوری سرویس: ${SERVICE_CATEGORY_LABELS[record.category]}`,
      notificationBody: generateNotificationBody(record, dueResult, vehicle),
    };
    
    reminders.push(reminder);
  }
  
  // Sort by urgency (overdue first, then upcoming, then scheduled)
  reminders.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    if (a.serviceStatus !== b.serviceStatus) {
      const statusOrder: Record<ServiceStatus, number> = {
        overdue: 0,
        due: 1,
        upcoming: 2,
        scheduled: 3,
        in_progress: 4,
        completed: 5,
        cancelled: 6,
        skipped: 7,
      };
      return statusOrder[a.serviceStatus] - statusOrder[b.serviceStatus];
    }
    return a.daysUntilDue - b.daysUntilDue;
  });
  
  return reminders;
}

/**
 * Calculate progress percentage for a service
 */
function calculateProgressPercent(
  dueResult: {
    daysUntilDue: number;
    kilometersUntilDue: number;
    isOverdue: boolean;
    whichComesFirst: 'date' | 'odometer' | 'both';
  },
  thresholds: {
    days: number;
    kilometers: number;
  }
): number {
  if (dueResult.isOverdue) {
    return 100; // Overdue = 100%
  }
  
  if (dueResult.whichComesFirst === 'date') {
    const totalWarningPeriod = thresholds.days;
    const progress = ((totalWarningPeriod - dueResult.daysUntilDue) / totalWarningPeriod) * 100;
    return Math.min(100, Math.max(0, progress));
  }
  
  if (dueResult.whichComesFirst === 'odometer') {
    const totalWarningPeriod = thresholds.kilometers;
    const progress = ((totalWarningPeriod - dueResult.kilometersUntilDue) / totalWarningPeriod) * 100;
    return Math.min(100, Math.max(0, progress));
  }
  
  // Both - take average
  const dateProgress = ((thresholds.days - dueResult.daysUntilDue) / thresholds.days) * 100;
  const kmProgress = ((thresholds.kilometers - dueResult.kilometersUntilDue) / thresholds.kilometers) * 100;
  return Math.min(100, Math.max(0, (dateProgress + kmProgress) / 2));
}

/**
 * Generate a human-readable reminder message
 */
function generateReminderMessage(
  record: MaintenanceRecord,
  dueResult: {
    nextServiceDate: string;
    nextServiceOdometer: number;
    daysUntilDue: number;
    kilometersUntilDue: number;
    isOverdue: boolean;
    isWithinWarning: boolean;
    whichComesFirst: 'date' | 'odometer' | 'both';
  },
  vehicle: Vehicle
): string {
  const serviceName = record.customName || record.serviceTypeName;
  const currentKm = vehicle.currentOdometer;
  
  if (dueResult.isOverdue) {
    const daysOverdue = Math.abs(dueResult.daysUntilDue);
    const kmOverdue = Math.abs(dueResult.kilometersUntilDue);
    
    if (dueResult.whichComesFirst === 'date' || dueResult.whichComesFirst === 'both') {
      return `${serviceName} ${daysOverdue} روز از موعد سررسید گذشته است`;
    }
    
    if (dueResult.whichComesFirst === 'odometer') {
      return `${serviceName} ${toPersianDigits(kmOverdue)} کیلومتر از موعد کارکرد گذشته است`;
    }
  }
  
  if (dueResult.isWithinWarning) {
    if (dueResult.whichComesFirst === 'date') {
      return `${serviceName} ${toPersianDigits(dueResult.daysUntilDue)} روز دیگر سررسید می‌شود`;
    }
    
    if (dueResult.whichComesFirst === 'odometer') {
      return `${serviceName} ${toPersianDigits(dueResult.kilometersUntilDue)} کیلومتر دیگر سررسید می‌شود`;
    }
    
    return `${serviceName} به زودی سررسید می‌شود`;
  }
  
  // Scheduled
  if (dueResult.whichComesFirst === 'date' || dueResult.whichComesFirst === 'both') {
    return `${serviceName} در تاریخ ${dueResult.nextServiceDate} سررسید می‌شود`;
  }
  
  return `${serviceName} در کارکرد ${toPersianDigits(dueResult.nextServiceOdometer)} کیلومتر سررسید می‌شود`;
}

/**
 * Generate notification body text
 */
function generateNotificationBody(
  record: MaintenanceRecord,
  dueResult: {
    nextServiceDate: string;
    nextServiceOdometer: number;
    daysUntilDue: number;
    kilometersUntilDue: number;
    isOverdue: boolean;
    isWithinWarning: boolean;
    whichComesFirst: 'date' | 'odometer' | 'both';
  },
  vehicle: Vehicle
): string {
  const serviceName = record.customName || record.serviceTypeName;
  const vehicleName = `${vehicle.manufacturer} ${vehicle.model}`;
  
  if (dueResult.isOverdue) {
    if (dueResult.whichComesFirst === 'date' || dueResult.whichComesFirst === 'both') {
      return `سرویس ${serviceName} برای ${vehicleName} سررسید گذشته است`;
    }
    return `سرویس ${serviceName} برای ${vehicleName} بر اساس کارکرد سررسید گذشته است`;
  }
  
  if (dueResult.isWithinWarning) {
    if (dueResult.whichComesFirst === 'date') {
      return `سرویس ${serviceName} برای ${vehicleName} ${toPersianDigits(dueResult.daysUntilDue)} روز دیگر سررسید می‌شود`;
    }
    return `سرویس ${serviceName} برای ${vehicleName} ${toPersianDigits(dueResult.kilometersUntilDue)} کیلومتر دیگر سررسید می‌شود`;
  }
  
  return `یادآوری سرویس ${serviceName} برای ${vehicleName}`;
}

/**
 * Calculate next service date from a service record
 */
export function calculateNextServiceFromRecord(
  record: MaintenanceRecord,
  currentDate: string = getCurrentJalaliDate(),
  currentOdometer: number
): {
  nextServiceDate: string;
  nextServiceOdometer: number;
  daysUntilDue: number;
  kilometersUntilDue: number;
  status: ServiceStatus;
  isOverdue: boolean;
} {
  const interval = record.nextServiceInterval || DEFAULT_SERVICE_INTERVALS[record.category];
  
  const dueResult = calculateServiceDue(
    currentDate,
    currentOdometer,
    record.jalaliDate,
    record.odometer,
    interval
  );
  
  return {
    nextServiceDate: dueResult.nextServiceDate,
    nextServiceOdometer: dueResult.nextServiceOdometer,
    daysUntilDue: dueResult.daysUntilDue,
    kilometersUntilDue: dueResult.kilometersUntilDue,
    status: dueResult.status,
    isOverdue: dueResult.isOverdue,
  };
}

/**
 * Check if any service is overdue for a vehicle
 */
export function hasOverdueServices(
  maintenanceRecords: MaintenanceRecord[],
  vehicle: Vehicle,
  currentDate: string = getCurrentJalaliDate()
): boolean {
  const currentOdometer = vehicle.currentOdometer;
  
  for (const record of maintenanceRecords) {
    if (!record.nextServiceInterval) continue;
    
    const dueResult = calculateServiceDue(
      currentDate,
      currentOdometer,
      record.jalaliDate,
      record.odometer,
      record.nextServiceInterval
    );
    
    if (dueResult.isOverdue) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get count of overdue services
 */
export function getOverdueServicesCount(
  maintenanceRecords: MaintenanceRecord[],
  vehicle: Vehicle,
  currentDate: string = getCurrentJalaliDate()
): number {
  const currentOdometer = vehicle.currentOdometer;
  let count = 0;
  
  for (const record of maintenanceRecords) {
    if (!record.nextServiceInterval) continue;
    
    const dueResult = calculateServiceDue(
      currentDate,
      currentOdometer,
      record.jalaliDate,
      record.odometer,
      record.nextServiceInterval
    );
    
    if (dueResult.isOverdue) {
      count++;
    }
  }
  
  return count;
}

/**
 * Get count of upcoming services (within warning threshold)
 */
export function getUpcomingServicesCount(
  maintenanceRecords: MaintenanceRecord[],
  vehicle: Vehicle,
  currentDate: string = getCurrentJalaliDate(),
  warningDays: number = DEFAULT_WARNING_DAYS
): number {
  const currentOdometer = vehicle.currentOdometer;
  let count = 0;
  
  for (const record of maintenanceRecords) {
    if (!record.nextServiceInterval) continue;
    
    const dueResult = calculateServiceDue(
      currentDate,
      currentOdometer,
      record.jalaliDate,
      record.odometer,
      record.nextServiceInterval,
      { days: warningDays }
    );
    
    if (dueResult.isWithinWarning && !dueResult.isOverdue) {
      count++;
    }
  }
  
  return count;
}

/**
 * Get the nearest upcoming service
 */
export function getNearestUpcomingService(
  maintenanceRecords: MaintenanceRecord[],
  vehicle: Vehicle,
  currentDate: string = getCurrentJalaliDate()
): MaintenanceRecord | null {
  const currentOdometer = vehicle.currentOdometer;
  let nearestRecord: MaintenanceRecord | null = null;
  let nearestDays: number | null = null;
  let nearestKm: number | null = null;
  
  for (const record of maintenanceRecords) {
    if (!record.nextServiceInterval) continue;
    
    const dueResult = calculateServiceDue(
      currentDate,
      currentOdometer,
      record.jalaliDate,
      record.odometer,
      record.nextServiceInterval
    );
    
    if (dueResult.isOverdue) continue;
    
    const isNearest = 
      nearestRecord === null ||
      (dueResult.whichComesFirst === 'date' && 
       (nearestDays === null || dueResult.daysUntilDue < nearestDays)) ||
      (dueResult.whichComesFirst === 'odometer' && 
       (nearestKm === null || dueResult.kilometersUntilDue < nearestKm));
    
    if (isNearest) {
      nearestRecord = record;
      nearestDays = dueResult.whichComesFirst === 'date' ? dueResult.daysUntilDue : null;
      nearestKm = dueResult.whichComesFirst === 'odometer' ? dueResult.kilometersUntilDue : null;
    }
  }
  
  return nearestRecord;
}

/**
 * Get service status for display
 */
export function getServiceStatusDisplay(
  record: MaintenanceRecord,
  vehicle: Vehicle,
  currentDate: string = getCurrentJalaliDate()
): {
  status: ServiceStatus;
  statusText: string;
  statusColor: string;
  progress: number;
} {
  const currentOdometer = vehicle.currentOdometer;
  const interval = record.nextServiceInterval || DEFAULT_SERVICE_INTERVALS[record.category];
  
  const dueResult = calculateServiceDue(
    currentDate,
    currentOdometer,
    record.jalaliDate,
    record.odometer,
    interval
  );
  
  // Map status to color
  const statusColors: Record<ServiceStatus, string> = {
    scheduled: '#1e3a8a', // Blue - normal
    upcoming: '#f59e0b', // Amber - warning
    due: '#f59e0b',    // Amber - warning
    overdue: '#ef4444', // Red - critical
    in_progress: '#10b981', // Green - working
    completed: '#059669', // Darker green - done
    cancelled: '#6b7280', // Gray - cancelled
    skipped: '#6b7280',  // Gray - skipped
  };
  
  const statusTexts: Record<ServiceStatus, string> = {
    scheduled: 'زمان‌بندی شده',
    upcoming: 'نزدیک به موعد',
    due: 'سررسید',
    overdue: 'سررسید گذشته',
    in_progress: 'در حال انجام',
    completed: 'انجام شده',
    cancelled: 'لغو شده',
    skipped: 'رد شده',
  };
  
  return {
    status: dueResult.status,
    statusText: statusTexts[dueResult.status] || record.status,
    statusColor: statusColors[dueResult.status] || statusColors.scheduled,
    progress: calculateProgressPercent(dueResult, {}),
  };
}

/**
 * Recalculate all service statuses after odometer update
 */
export function recalculateServiceStatusesAfterOdometerUpdate(
  maintenanceRecords: MaintenanceRecord[],
  oldOdometer: number,
  newOdometer: number,
  vehicle: Vehicle,
  currentDate: string = getCurrentJalaliDate()
): MaintenanceRecord[] {
  const updatedRecords = [...maintenanceRecords];
  
  for (const record of updatedRecords) {
    if (!record.nextServiceInterval) continue;
    
    const dueResult = calculateServiceDue(
      currentDate,
      newOdometer,
      record.jalaliDate,
      record.odometer,
      record.nextServiceInterval
    );
    
    // Update status based on new calculation
    record.status = dueResult.status;
  }
  
  return updatedRecords;
}

/**
 * Validate odometer reading against previous readings
 */
export function validateOdometerReading(
  odometerEntries: OdometerEntry[],
  newOdometer: number,
  vehicleId: string,
  thresholds: OdometerThreshold = {
    warningKilometers: 1000,
    criticalKilometers: 500,
    overdueKilometers: 0,
  }
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  requiresConfirmation: boolean;
  reason?: string;
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  let requiresConfirmation = false;
  
  // Check if reading is negative
  if (newOdometer < 0) {
    errors.push('کارکرد نمی‌تواند منفی باشد');
    return { isValid: false, warnings, errors, requiresConfirmation: true };
  }
  
  // Get previous odometer reading for this vehicle
  const vehicleEntries = odometerEntries
    .filter(e => e.vehicleId === vehicleId)
    .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  
  const previousEntry = vehicleEntries[0];
  
  if (previousEntry) {
    const previousOdometer = previousEntry.odometer;
    
    // Check if new reading is less than previous
    if (newOdometer < previousOdometer) {
      const difference = previousOdometer - newOdometer;
      
      if (difference > thresholds.warningKilometers) {
        errors.push(`کارکرد جدید (${toPersianDigits(newOdometer)}) کمتر از کارکرد قبلی (${toPersianDigits(previousOdometer)}) است`);
        requiresConfirmation = true;
      } else {
        warnings.push(`کارکرد جدید کمتر از کارکرد قبلی است. لطفاً بررسی کنید.`);
        requiresConfirmation = true;
      }
    }
    
    // Check if difference is unusually large
    const difference = newOdometer - previousOdometer;
    if (difference > 10000) {
      warnings.push(`فاصله کارکرد ثبت شده (${toPersianDigits(difference)} کیلومتر) زیاد است. آیا مطمئن هستید؟`);
      requiresConfirmation = true;
    }
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    requiresConfirmation,
  };
}

/**
 * Get service interval description in Persian
 */
export function getServiceIntervalDescription(
  interval: ServiceInterval,
  category: ServiceCategory
): string {
  const parts: string[] = [];
  
  if (interval.kilometers) {
    parts.push(`هر ${toPersianDigits(interval.kilometers)} کیلومتر`);
  }
  
  if (interval.years) {
    parts.push(`هر ${toPersianDigits(interval.years)} سال`);
  }
  
  if (interval.months) {
    parts.push(`هر ${toPersianDigits(interval.months)} ماه`);
  }
  
  if (interval.days) {
    parts.push(`هر ${toPersianDigits(interval.days)} روز`);
  }
  
  if (interval.useWhicheverComesFirst && parts.length > 1) {
    return `${SERVICE_CATEGORY_LABELS[category]} در ${parts.join(' یا ')} انجام شود`;
  }
  
  return `${SERVICE_CATEGORY_LABELS[category]} در ${parts.join(' و ')} انجام شود`;
}

export {
  DEFAULT_WARNING_DAYS,
  DEFAULT_WARNING_KILOMETERS,
};

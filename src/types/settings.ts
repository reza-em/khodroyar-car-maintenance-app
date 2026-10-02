// Settings Domain Types

import { UUID, Currency, JalaliDateString } from './common';

// App settings entity
export interface AppSettings {
  id: UUID;
  
  // Theme
  theme: ThemeMode;
  
  // Language
  language: Language;
  
  // Calendar
  calendar: CalendarType;
  
  // Currency
  currency: Currency;
  
  // Notifications
  notifications: NotificationSettings;
  
  // Odometer settings
  odometer: OdometerSettings;
  
  // Date settings
  date: DateSettings;
  
  // Backup settings
  backup: BackupSettings;
  
  // Data settings
  data: DataSettings;
  
  // Sync settings (for future backend integration)
  sync: SyncSettings;
  
  // Onboarding
  onboarding: OnboardingSettings;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Theme modes
export type ThemeMode = 'light' | 'dark' | 'system';

// Language types
export type Language = 'fa' | 'en';

// Calendar types
export type CalendarType = 'jalali' | 'gregorian' | 'both';

// Notification settings
export interface NotificationSettings {
  // Global enable/disable
  enabled: boolean;
  
  // Notification time (for daily digest)
  notificationTime?: string; // Format: "HH:MM"
  
  // Warning thresholds
  dateWarningThreshold: number; // Days before due date to warn
  odometerWarningThreshold: number; // Kilometers before due odometer to warn
  
  // Notification types
  serviceReminders: boolean;
  insuranceReminders: boolean;
  inspectionReminders: boolean;
  warrantyReminders: boolean;
  customReminders: boolean;
  
  // Sound and vibration
  playSound: boolean;
  vibrate: boolean;
  
  // Snooze settings
  snoozeDuration: number; // Minutes to snooze
  maxSnoozeCount: number; // Maximum snoozes allowed
}

// Odometer settings
export interface OdometerSettings {
  // Unit (always kilometers for now)
  unit: 'kilometers';
  
  // Default odometer warning threshold
  warningThreshold: number;
  
  // Allow manual odometer entry
  allowManualEntry: boolean;
  
  // Warn when odometer decreases
  warnOnDecrease: boolean;
  
  // Require confirmation for odometer decrease
  requireConfirmationOnDecrease: boolean;
}

// Date settings
export interface DateSettings {
  // Default calendar
  defaultCalendar: CalendarType;
  
  // Date format for display
  dateFormat: string; // e.g., "YYYY/MM/DD", "YYYY-MM-DD"
  
  // First day of week
  firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Show week numbers
  showWeekNumbers: boolean;
  
  // Jalali date settings
  jalaliDate: {
    showPersianDigits: boolean;
    showPersianMonthNames: boolean;
  };
}

// Backup settings
export interface BackupSettings {
  // Auto-backup
  autoBackup: boolean;
  
  // Backup frequency
  backupFrequency: BackupFrequency;
  
  // Backup location (for future cloud sync)
  backupLocation: BackupLocation;
  
  // Last backup info
  lastBackupDate?: string;
  lastBackupSize?: number;
  
  // Max number of local backups to keep
  maxLocalBackups: number;
  
  // Backup reminder
  remindToBackup: boolean;
  backupReminderFrequency: number; // Days
}

// Backup frequency
export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';

// Backup location
export type BackupLocation = 'local' | 'cloud' | 'both';

// Data settings
export interface DataSettings {
  // Default vehicle
  defaultVehicleId?: UUID;
  
  // Show archived items
  showArchived: boolean;
  
  // Auto-archive
  autoArchive: boolean;
  archiveAfterDays: number; // Days after which items are auto-archived
  
  // Data retention
  retainDataForDays: number; // Days to retain data (0 = forever)
  
  // Seed data
  hasSeedData: boolean;
  showSeedDataOption: boolean;
}

// Sync settings (for future backend integration)
export interface SyncSettings {
  // Enable sync
  enabled: boolean;
  
  // Sync interval
  syncInterval: number; // Minutes
  
  // Sync on app start
  syncOnStart: boolean;
  
  // Sync only on WiFi
  syncOnlyOnWifi: boolean;
  
  // Last sync info
  lastSyncDate?: string;
  lastSyncSuccess: boolean;
  
  // Conflict resolution
  conflictResolution: 'server' | 'local' | 'manual';
}

// Onboarding settings
export interface OnboardingSettings {
  // Whether onboarding is completed
  completed: boolean;
  
  // Onboarding version (for showing new features)
  version: string;
  
  // Completed steps
  completedSteps: string[];
  
  // Skip onboarding
  skipOnboarding: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default-settings',
  theme: 'system',
  language: 'fa',
  calendar: 'jalali',
  currency: 'IRT',
  notifications: {
    enabled: true,
    notificationTime: '09:00',
    dateWarningThreshold: 7,
    odometerWarningThreshold: 1000,
    serviceReminders: true,
    insuranceReminders: true,
    inspectionReminders: true,
    warrantyReminders: true,
    customReminders: true,
    playSound: true,
    vibrate: true,
    snoozeDuration: 10,
    maxSnoozeCount: 3,
  },
  odometer: {
    unit: 'kilometers',
    warningThreshold: 1000,
    allowManualEntry: true,
    warnOnDecrease: true,
    requireConfirmationOnDecrease: true,
  },
  date: {
    defaultCalendar: 'jalali',
    dateFormat: 'YYYY/MM/DD',
    firstDayOfWeek: 6, // Saturday (for Persian calendar)
    showWeekNumbers: false,
    jalaliDate: {
      showPersianDigits: true,
      showPersianMonthNames: true,
    },
  },
  backup: {
    autoBackup: false,
    backupFrequency: 'weekly',
    backupLocation: 'local',
    maxLocalBackups: 5,
    remindToBackup: true,
    backupReminderFrequency: 7,
  },
  data: {
    showArchived: true,
    autoArchive: false,
    archiveAfterDays: 365,
    retainDataForDays: 0,
    hasSeedData: false,
    showSeedDataOption: true,
  },
  sync: {
    enabled: false,
    syncInterval: 60,
    syncOnStart: true,
    syncOnlyOnWifi: true,
    lastSyncSuccess: false,
    conflictResolution: 'manual',
  },
  onboarding: {
    completed: false,
    version: '1.0.0',
    completedSteps: [],
    skipOnboarding: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Theme configuration
export interface ThemeConfig {
  mode: ThemeMode;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    border: string;
    divider: string;
  };
}

// Persian labels for theme modes
export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  light: 'روشن',
  dark: 'تاریک',
  system: 'سیستم',
};

// Persian labels for languages
export const LANGUAGE_LABELS: Record<Language, string> = {
  fa: 'فارسی',
  en: 'English',
};

// Persian labels for calendar types
export const CALENDAR_TYPE_LABELS: Record<CalendarType, string> = {
  jalali: 'شمسی',
  gregorian: 'میلادی',
  both: 'هر دو',
};

// Persian labels for currencies
export const CURRENCY_LABELS: Record<string, string> = {
  IRR: 'ریال',
  IRT: 'تومان',
  USD: 'دلار آمریکا',
  EUR: 'یورو',
  GBP: 'پوند استرلینگ',
  AED: 'درهم امارات',
  other: 'سایر',
};

// Currency symbol mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  IRR: 'ریال',
  IRT: 'تومان',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.ا',
  other: '',
};

// Settings update input
export interface UpdateSettingsInput {
  theme?: ThemeMode;
  language?: Language;
  calendar?: CalendarType;
  currency?: Currency;
  notifications?: Partial<NotificationSettings>;
  odometer?: Partial<OdometerSettings>;
  date?: Partial<DateSettings>;
  backup?: Partial<BackupSettings>;
  data?: Partial<DataSettings>;
  sync?: Partial<SyncSettings>;
  onboarding?: Partial<OnboardingSettings>;
}

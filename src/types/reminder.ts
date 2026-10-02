// Reminder Domain Types

import { UUID, ISODateString, JalaliDateString } from './common';
import { ServiceStatus } from './service';

// Reminder types
export type ReminderType = 
  | 'service'
  | 'insurance'
  | 'inspection'
  | 'warranty'
  | 'custom'
  | 'odometer';

// Reminder frequency
export type ReminderFrequency = 
  | 'once'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

// Reminder entity
export interface Reminder {
  id: UUID;
  vehicleId: UUID;
  
  // Reminder details
  title: string;
  description?: string;
  type: ReminderType;
  
  // Related entity IDs (optional)
  serviceId?: UUID;
  partId?: UUID;
  repairId?: UUID;
  expenseId?: UUID;
  
  // Timing
  remindAt: ISODateString; // When to show the reminder
  jalaliDate: JalaliDateString; // For display
  
  // Repeating
  frequency: ReminderFrequency;
  repeatInterval?: number; // e.g., 7 for weekly, 30 for monthly
  repeatEndDate?: ISODateString;
  
  // Status
  isActive: boolean;
  status: ReminderStatus;
  
  // Notification
  notificationId?: string; // Reference to scheduled notification
  notifyBeforeDays?: number; // Notify X days before
  notifyBeforeKilometers?: number; // Notify X km before
  
  // Priority
  priority: ReminderPriority;
  
  // Tracking
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt?: ISODateString;
  snoozedUntil?: ISODateString;
  snoozeCount: number;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Reminder status
export type ReminderStatus = 
  | 'pending'
  | 'triggered'
  | 'snoozed'
  | 'completed'
  | 'cancelled'
  | 'expired';

// Reminder priority
export type ReminderPriority = 'low' | 'medium' | 'high' | 'critical';

// Reminder creation input
export interface CreateReminderInput {
  vehicleId: UUID;
  title: string;
  description?: string;
  type: ReminderType;
  serviceId?: UUID;
  partId?: UUID;
  repairId?: UUID;
  expenseId?: UUID;
  jalaliDate: JalaliDateString;
  remindAt?: ISODateString;
  frequency: ReminderFrequency;
  repeatInterval?: number;
  repeatEndDate?: JalaliDateString;
  notifyBeforeDays?: number;
  notifyBeforeKilometers?: number;
  priority: ReminderPriority;
  metadata?: Record<string, unknown>;
}

// Reminder update input
export interface UpdateReminderInput extends Partial<CreateReminderInput> {
  id: UUID;
}

// Reminder filter types
export interface ReminderFilter {
  vehicleId?: UUID;
  type?: ReminderType;
  status?: ReminderStatus;
  priority?: ReminderPriority;
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
  searchTerm?: string;
}

// Reminder calculation context
export interface ReminderCalculationContext {
  vehicleId: UUID;
  currentOdometer: number;
  currentDate: ISODateString;
  warningThresholdDays: number;
  warningThresholdKilometers: number;
}

// Reminder result after calculation
export interface CalculatedReminder {
  reminder: Reminder;
  serviceStatus: ServiceStatus;
  daysUntilDue: number;
  kilometersUntilDue: number;
  isDue: boolean;
  isOverdue: boolean;
  progressPercent: number;
  message: string;
  notificationTitle: string;
  notificationBody: string;
}

// Notification schedule result
export interface NotificationScheduleResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  scheduledAt?: ISODateString;
}

// Reminder summary for dashboard
export interface ReminderSummary {
  totalReminders: number;
  pendingReminders: number;
  overdueReminders: number;
  completedReminders: number;
  nextReminder?: {
    id: UUID;
    title: string;
    dueDate: JalaliDateString;
    daysUntilDue: number;
  };
}

// Persian labels for reminder types
export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  service: 'سرویس',
  insurance: 'بیمه',
  inspection: 'معاینه فنی',
  warranty: 'گارانتی',
  custom: 'یادآوری سفارشی',
  odometer: 'کارکرد',
};

// Persian labels for reminder statuses
export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  pending: 'در انتظار',
  triggered: 'فعال شده',
  snoozed: 'تاخیر انداخته شده',
  completed: 'انجام شده',
  cancelled: 'لغو شده',
  expired: 'منقضی شده',
};

// Persian labels for reminder priorities
export const REMINDER_PRIORITY_LABELS: Record<ReminderPriority, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
  critical: 'حیاتی',
};

// Persian labels for reminder frequencies
export const REMINDER_FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  once: 'یکبار',
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  yearly: 'سالانه',
  custom: 'سفارشی',
};

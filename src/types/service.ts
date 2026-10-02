// Service and Maintenance Domain Types

import { UUID, ISODateString, JalaliDateString, Currency } from './common';

// Service category types
export type ServiceCategory = 
  | 'oil_change'
  | 'oil_filter'
  | 'air_filter'
  | 'cabin_filter'
  | 'fuel_filter'
  | 'transmission_oil'
  | 'timing_belt'
  | 'serpentine_belt'
  | 'brake_pads'
  | 'brake_discs'
  | 'spark_plugs'
  | 'engine_tuneup'
  | 'antifreeze'
  | 'ac_service'
  | 'wheel_balance'
  | 'wheel_alignment'
  | 'tire_rotation'
  | 'tire_replacement'
  | 'battery_check'
  | 'third_party_insurance'
  | 'comprehensive_insurance'
  | 'technical_inspection'
  | 'custom';

// Service interval types
export interface ServiceInterval {
  // Interval based on kilometers
  kilometers?: number;
  
  // Interval based on time
  days?: number; // Days from last service
  months?: number; // Months from last service
  years?: number; // Years from last service
  
  // Combined: whichever comes first
  useWhicheverComesFirst: boolean;
}

// Service type/definition (predefined service templates)
export interface ServiceType {
  id: UUID;
  category: ServiceCategory;
  
  // Display names
  name: string; // Persian name
  nameEn: string; // English name
  shortName?: string; // Short display name
  
  // Description
  description?: string;
  
  // Default intervals
  defaultInterval: ServiceInterval;
  
  // Recommended for vehicle types
  recommendedFor?: string[]; // e.g., ['gasoline', 'diesel']
  
  // Cost estimates (for reference)
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  estimatedDurationMin?: number; // in minutes
  estimatedDurationMax?: number;
  
  // Metadata
  isActive: boolean;
  sortOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Service status types
export type ServiceStatus = 
  | 'scheduled'
  | 'upcoming'
  | 'due'
  | 'overdue'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'skipped';

// Service record (actual service performed)
export interface MaintenanceRecord {
  id: UUID;
  vehicleId: UUID;
  serviceTypeId: UUID;
  
  // Service details
  category: ServiceCategory;
  serviceTypeName: string;
  customName?: string; // For custom services
  
  // Timing
  jalaliDate: JalaliDateString;
  gregorianDate: ISODateString;
  odometer: number;
  
  // Costs
  laborCost?: number;
  partsCost?: number;
  totalCost?: number;
  currency: Currency;
  
  // Service provider
  workshopId?: UUID;
  workshopName?: string;
  workshopContact?: string;
  workshopAddress?: string;
  
  // Parts used
  partsUsed?: MaintenancePart[];
  
  // Descriptions
  description?: string;
  notes?: string;
  
  // Next service reminder
  nextServiceInterval?: ServiceInterval;
  nextServiceOdometer?: number;
  nextServiceDate?: JalaliDateString;
  nextServiceDateISO?: ISODateString;
  
  // Warranty
  warrantyDurationDays?: number;
  warrantyExpirationDate?: JalaliDateString;
  warrantyExpirationDateISO?: ISODateString;
  
  // Attachments
  invoiceImageUrl?: string;
  attachmentUrls?: string[];
  
  // Status
  status: ServiceStatus;
  completionNotes?: string;
  
  // Tracking
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt?: ISODateString;
  
  // Navigation properties (not stored in DB)
  serviceType?: ServiceType;
  vehicle?: any; // Circular reference to Vehicle
}

// Part used in a service
export interface MaintenancePart {
  id: UUID;
  name: string;
  brand?: string;
  partNumber?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  warrantyDays?: number;
  warrantyExpiration?: JalaliDateString;
  notes?: string;
}

// Service creation input
export interface CreateMaintenanceInput {
  vehicleId: UUID;
  serviceTypeId?: UUID;
  category: ServiceCategory;
  customName?: string;
  jalaliDate: JalaliDateString;
  gregorianDate?: ISODateString;
  odometer: number;
  laborCost?: number;
  partsCost?: number;
  currency: Currency;
  workshopName?: string;
  workshopContact?: string;
  partsUsed?: Omit<MaintenancePart, 'id'>[];
  description?: string;
  notes?: string;
  nextServiceInterval?: ServiceInterval;
  nextServiceOdometer?: number;
  nextServiceDate?: JalaliDateString;
  warrantyDurationDays?: number;
  invoiceImage?: ImageInfo;
  attachmentUrls?: string[];
  status?: ServiceStatus;
}

// Service update input
export interface UpdateMaintenanceInput extends Partial<CreateMaintenanceInput> {
  id: UUID;
}

// Service filter types
export interface MaintenanceFilter {
  vehicleId?: UUID;
  category?: ServiceCategory;
  status?: ServiceStatus;
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
  minOdometer?: number;
  maxOdometer?: number;
  searchTerm?: string;
}

// Service reminder calculation result
export interface ServiceReminderResult {
  maintenanceRecord: MaintenanceRecord;
  currentOdometer: number;
  currentDate: ISODateString;
  
  // Calculated values
  nextServiceOdometer: number;
  nextServiceDate: ISODateString;
  
  // Remaining
  remainingKilometers: number;
  remainingDays: number;
  
  // Status
  status: ServiceStatus;
  progressPercent: number; // 0-100%
  
  // Human-readable messages
  statusMessage: string;
  reminderMessage: string;
  
  // Threshold flags
  isWithinWarningKilometers: boolean;
  isWithinWarningDays: boolean;
  isOverdue: boolean;
}

// Service summary for dashboard
export interface ServiceSummary {
  totalServices: number;
  completedServices: number;
  overdueServices: number;
  upcomingServices: number;
  totalCost: number;
  averageCostPerService: number;
  lastServiceDate?: JalaliDateString;
  nextServiceDate?: JalaliDateString;
  nextServiceOdometer?: number;
}

// Predefined Persian service categories with labels
export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  oil_change: 'تعویض روغن موتور',
  oil_filter: 'تعویض فیلتر روغن',
  air_filter: 'تعویض فیلتر هوا',
  cabin_filter: 'تعویض فیلتر کابین',
  fuel_filter: 'تعویض فیلتر سوخت',
  transmission_oil: 'بررسی یا تعویض روغن گیربکس',
  timing_belt: 'بررسی تسمه تایم',
  serpentine_belt: 'بررسی تسمه دینام',
  brake_pads: 'بررسی لنت ترمز',
  brake_discs: 'بررسی دیسک ترمز',
  spark_plugs: 'تعویض شمع',
  engine_tuneup: 'تنظیم موتور',
  antifreeze: 'تعویض ضدیخ',
  ac_service: 'سرویس کولر',
  wheel_balance: 'بالانس چرخ‌ها',
  wheel_alignment: 'تنظیم فرمان',
  tire_rotation: 'جابه‌جایی لاستیک‌ها',
  tire_replacement: 'تعویض لاستیک',
  battery_check: 'بررسی باتری',
  third_party_insurance: 'بیمه شخص ثالث',
  comprehensive_insurance: 'بیمه بدنه',
  technical_inspection: 'معاینه فنی',
  custom: 'سرویس سفارشی',
};

// Service status labels
export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  scheduled: 'زمان‌بندی شده',
  upcoming: 'نزدیک به موعد',
  due: 'سررسید',
  overdue: 'سررسید گذشته',
  in_progress: 'در حال انجام',
  completed: 'انجام شده',
  cancelled: 'لغو شده',
  skipped: 'رد شده',
};

// Common service intervals for different vehicle types
export const DEFAULT_SERVICE_INTERVALS: Record<ServiceCategory, ServiceInterval> = {
  oil_change: { kilometers: 10000, months: 12, useWhicheverComesFirst: true },
  oil_filter: { kilometers: 10000, months: 12, useWhicheverComesFirst: true },
  air_filter: { kilometers: 20000, months: 24, useWhicheverComesFirst: true },
  cabin_filter: { kilometers: 15000, months: 12, useWhicheverComesFirst: true },
  fuel_filter: { kilometers: 40000, months: 24, useWhicheverComesFirst: true },
  transmission_oil: { kilometers: 80000, months: 48, useWhicheverComesFirst: true },
  timing_belt: { kilometers: 100000, years: 5, useWhicheverComesFirst: true },
  serpentine_belt: { kilometers: 80000, years: 4, useWhicheverComesFirst: true },
  brake_pads: { kilometers: 50000, useWhicheverComesFirst: false },
  brake_discs: { kilometers: 80000, useWhicheverComesFirst: false },
  spark_plugs: { kilometers: 60000, months: 24, useWhicheverComesFirst: true },
  engine_tuneup: { kilometers: 30000, useWhicheverComesFirst: false },
  antifreeze: { kilometers: 60000, years: 2, useWhicheverComesFirst: true },
  ac_service: { kilometers: 30000, months: 12, useWhicheverComesFirst: true },
  wheel_balance: { kilometers: 20000, useWhicheverComesFirst: false },
  wheel_alignment: { kilometers: 50000, useWhicheverComesFirst: false },
  tire_rotation: { kilometers: 10000, useWhicheverComesFirst: false },
  tire_replacement: { kilometers: 80000, years: 4, useWhicheverComesFirst: true },
  battery_check: { months: 6, useWhicheverComesFirst: false },
  third_party_insurance: { years: 1, useWhicheverComesFirst: false },
  comprehensive_insurance: { years: 1, useWhicheverComesFirst: false },
  technical_inspection: { years: 1, useWhicheverComesFirst: false },
  custom: { kilometers: 0, months: 0, useWhicheverComesFirst: false },
};

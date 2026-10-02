// Repair Domain Types

import { UUID, ISODateString, JalaliDateString, Currency } from './common';
import { MaintenancePart } from './service';

// Repair status types
export type RepairStatus = 
  | 'pending_review'
  | 'in_progress'
  | 'needs_revisit'
  | 'completed'
  | 'cancelled';

// Repair entity
export interface Repair {
  id: UUID;
  vehicleId: UUID;
  
  // Problem details
  title: string;
  description?: string;
  symptoms?: string[];
  
  // Repair details
  repairDate: JalaliDateString;
  repairDateISO: ISODateString;
  odometer: number;
  
  // Service provider
  workshopId?: UUID;
  workshopName?: string;
  workshopContact?: string;
  workshopAddress?: string;
  
  // Costs
  laborCost?: number;
  partsCost?: number;
  diagnosticCost?: number;
  totalCost?: number;
  currency: Currency;
  
  // Parts used
  partsUsed?: MaintenancePart[];
  
  // Diagnosis
  rootCause?: string;
  repairDescription?: string;
  
  // Warranty
  warrantyDurationDays?: number;
  warrantyExpiration?: JalaliDateString;
  warrantyExpirationISO?: ISODateString;
  warrantyNotes?: string;
  
  // Follow-up
  followUpRequired: boolean;
  followUpDate?: JalaliDateString;
  followUpDateISO?: ISODateString;
  followUpNotes?: string;
  
  // Attachments
  attachmentUrls?: string[];
  invoiceImageUrl?: string;
  
  // Status
  status: RepairStatus;
  completionNotes?: string;
  
  // Tracking
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt?: ISODateString;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Repair creation input
export interface CreateRepairInput {
  vehicleId: UUID;
  title: string;
  description?: string;
  symptoms?: string[];
  jalaliDate: JalaliDateString;
  gregorianDate?: ISODateString;
  odometer: number;
  workshopName?: string;
  workshopContact?: string;
  workshopAddress?: string;
  laborCost?: number;
  partsCost?: number;
  diagnosticCost?: number;
  totalCost?: number;
  currency: Currency;
  partsUsed?: Omit<MaintenancePart, 'id'>[];
  rootCause?: string;
  repairDescription?: string;
  warrantyDurationDays?: number;
  warrantyExpiration?: JalaliDateString;
  warrantyNotes?: string;
  followUpRequired: boolean;
  followUpDate?: JalaliDateString;
  followUpNotes?: string;
  invoiceImage?: ImageInfo;
  attachmentUrls?: string[];
  status?: RepairStatus;
  completionNotes?: string;
  metadata?: Record<string, unknown>;
}

// Repair update input
export interface UpdateRepairInput extends Partial<CreateRepairInput> {
  id: UUID;
}

// Repair filter types
export interface RepairFilter {
  vehicleId?: UUID;
  status?: RepairStatus;
  workshopId?: UUID;
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
  minOdometer?: number;
  maxOdometer?: number;
  searchTerm?: string;
}

// Repair summary for dashboard
export interface RepairSummary {
  totalRepairs: number;
  completedRepairs: number;
  pendingRepairs: number;
  needsRevisitRepairs: number;
  totalRepairCost: number;
  averageRepairCost: number;
  lastRepairDate?: JalaliDateString;
}

// Persian labels for repair statuses
export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
  pending_review: 'در انتظار بررسی',
  in_progress: 'در حال تعمیر',
  needs_revisit: 'نیازمند مراجعه مجدد',
  completed: 'تعمیر شده',
  cancelled: 'لغو شده',
};

// Common repair symptoms in Persian
export const COMMON_REPAIR_SYMPTOMS = [
  'صدای غیرعادی موتور',
  'داغ کردن بیش از حد موتور',
  'ارا شروع موتور',
  'لرزش خودرو',
  'کاهش شتاب',
  'مشکل ترمز',
  'مشکل گیربکس',
  'نشت روغن',
  'نشت مایع خنک‌کننده',
  'مشکل برقauto',
  ' روشن نشدن چراغ‌ها',
  'مشکل باتری',
  'ساییدگی لاستیک‌ها',
  'مشکل سیستم تعلیق',
  'بوی سوختگی',
  'دود بیش از حد اگزوز',
  'کشش خودرو به یک طرف',
  'مشکل کولر',
  'مشکل بخاری',
  'صدای ترمز',
] as const;

export type CommonRepairSymptom = typeof COMMON_REPAIR_SYMPTOMS[number];

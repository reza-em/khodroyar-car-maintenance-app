// Database Types and Schema Definitions

import {
  UUID,
  ISODateString,
  JalaliDateString,
} from './common';
import {
  Vehicle,
  FuelType,
  TransmissionType,
} from './vehicle';
import { OdometerEntry } from './odometer';
import {
  MaintenanceRecord,
  ServiceType,
  ServiceCategory,
} from './service';
import {
  Reminder,
  ReminderType,
  ReminderStatus,
  ReminderFrequency,
  ReminderPriority,
} from './reminder';
import {
  Part,
  Purchase,
  PartCategory,
  PartInstallationStatus,
} from './part';
import {
  Repair,
  RepairStatus,
} from './repair';
import {
  Expense,
  ExpenseCategory,
  ExpenseFrequency,
} from './expense';
import { AppSettings } from './settings';

// Database table names
export type TableName = 
  | 'vehicles'
  | 'vehicle_manufacturers'
  | 'vehicle_models'
  | 'vehicle_trims'
  | 'odometer_entries'
  | 'service_types'
  | 'maintenance_records'
  | 'reminders'
  | 'parts'
  | 'purchases'
  | 'purchase_items'
  | 'repairs'
  | 'expenses'
  | 'attachments'
  | 'workshops'
  | 'settings';

// Database schema version
export interface DatabaseSchemaVersion {
  version: number;
  description: string;
  appliedAt: ISODateString;
}

// Database migration
export interface DatabaseMigration {
  id: UUID;
  version: number;
  description: string;
  sql: string;
  rollbackSql?: string;
  appliedAt: ISODateString;
}

// SQLite row types (matching database schema)

// Vehicles table
export interface VehicleRow {
  id: UUID;
  user_id: UUID | null;
  manufacturer: string;
  manufacturer_id: UUID | null;
  model: string;
  model_id: UUID | null;
  trim: string | null;
  trim_id: UUID | null;
  license_plate: string;
  vin: string | null;
  chassis_number: string | null;
  engine_number: string | null;
  production_year: number;
  color: string | null;
  fuel_type: FuelType;
  transmission_type: TransmissionType | null;
  engine_capacity: number | null;
  current_odometer: number;
  last_odometer_update: ISODateString;
  purchase_date: JalaliDateString | null;
  purchase_date_iso: ISODateString | null;
  insurance_expiration: JalaliDateString | null;
  insurance_expiration_iso: ISODateString | null;
  technical_inspection_expiration: JalaliDateString | null;
  technical_inspection_expiration_iso: ISODateString | null;
  warranty_expiration: JalaliDateString | null;
  warranty_expiration_iso: ISODateString | null;
  is_default: boolean;
  is_active: boolean;
  status: string;
  image_url: string | null;
  thumbnail_url: string | null;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  archived_at: ISODateString | null;
}

// Odometer entries table
export interface OdometerEntryRow {
  id: UUID;
  vehicle_id: UUID;
  odometer: number;
  jalali_date: JalaliDateString;
  gregorian_date: ISODateString;
  recorded_at: ISODateString;
  note: string | null;
  is_confirmed: boolean;
  confirmed_at: ISODateString | null;
  confirmed_by: UUID | null;
  is_lower_than_previous: boolean;
  lower_reading_reason: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Service types table
export interface ServiceTypeRow {
  id: UUID;
  category: ServiceCategory;
  name: string;
  name_en: string;
  short_name: string | null;
  description: string | null;
  default_interval: string; // JSON string
  recommended_for: string | null; // JSON array
  estimated_cost_min: number | null;
  estimated_cost_max: number | null;
  estimated_duration_min: number | null;
  estimated_duration_max: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Maintenance records table
export interface MaintenanceRecordRow {
  id: UUID;
  vehicle_id: UUID;
  service_type_id: UUID | null;
  category: ServiceCategory;
  service_type_name: string;
  custom_name: string | null;
  jalali_date: JalaliDateString;
  gregorian_date: ISODateString;
  odometer: number;
  labor_cost: number | null;
  parts_cost: number | null;
  total_cost: number | null;
  currency: string;
  workshop_id: UUID | null;
  workshop_name: string | null;
  workshop_contact: string | null;
  workshop_address: string | null;
  description: string | null;
  notes: string | null;
  next_service_interval: string | null; // JSON string
  next_service_odometer: number | null;
  next_service_date: JalaliDateString | null;
  next_service_date_iso: ISODateString | null;
  warranty_duration_days: number | null;
  warranty_expiration_date: JalaliDateString | null;
  warranty_expiration_date_iso: ISODateString | null;
  invoice_image_url: string | null;
  attachment_urls: string | null; // JSON array
  status: string;
  completion_notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  completed_at: ISODateString | null;
}

// Maintenance parts table (parts used in services)
export interface MaintenancePartRow {
  id: UUID;
  maintenance_record_id: UUID;
  name: string;
  brand: string | null;
  part_number: string | null;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  warranty_days: number | null;
  warranty_expiration: JalaliDateString | null;
  notes: string | null;
}

// Reminders table
export interface ReminderRow {
  id: UUID;
  vehicle_id: UUID;
  title: string;
  description: string | null;
  type: ReminderType;
  service_id: UUID | null;
  part_id: UUID | null;
  repair_id: UUID | null;
  expense_id: UUID | null;
  remind_at: ISODateString;
  jalali_date: JalaliDateString;
  frequency: ReminderFrequency;
  repeat_interval: number | null;
  repeat_end_date: ISODateString | null;
  is_active: boolean;
  status: ReminderStatus;
  notification_id: string | null;
  notify_before_days: number | null;
  notify_before_kilometers: number | null;
  priority: ReminderPriority;
  created_at: ISODateString;
  updated_at: ISODateString;
  completed_at: ISODateString | null;
  snoozed_until: ISODateString | null;
  snooze_count: number;
  metadata: string | null; // JSON string
}

// Parts table
export interface PartRow {
  id: UUID;
  vehicle_id: UUID | null;
  name: string;
  name_en: string | null;
  description: string | null;
  category: PartCategory;
  custom_category: string | null;
  brand: string | null;
  part_number: string | null;
  oem_number: string | null;
  specifications: string | null; // JSON string
  purchase_price: number | null;
  retail_price: number | null;
  currency: string;
  quantity: number;
  min_quantity: number | null;
  installation_status: PartInstallationStatus;
  installed_at: ISODateString | null;
  installed_jalali_date: JalaliDateString | null;
  installed_odometer: number | null;
  installed_vehicle_id: UUID | null;
  warranty_duration_days: number | null;
  warranty_expiration: ISODateString | null;
  warranty_expiration_jalali: JalaliDateString | null;
  supplier: string | null;
  supplier_contact: string | null;
  image_url: string | null;
  attachment_urls: string | null; // JSON array
  linked_service_ids: string | null; // JSON array of UUIDs
  linked_repair_ids: string | null; // JSON array of UUIDs
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  metadata: string | null; // JSON string
}

// Purchases table
export interface PurchaseRow {
  id: UUID;
  vehicle_id: UUID | null;
  purchase_number: string | null;
  jalali_date: JalaliDateString;
  gregorian_date: ISODateString;
  subtotal: number;
  tax: number | null;
  discount: number | null;
  total: number;
  currency: string;
  seller: string;
  seller_contact: string | null;
  seller_address: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  invoice_image_url: string | null;
  attachment_urls: string | null; // JSON array
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Purchase items table
export interface PurchaseItemRow {
  id: UUID;
  purchase_id: UUID;
  part_id: UUID | null;
  name: string;
  brand: string | null;
  part_number: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  installation_status: PartInstallationStatus;
  installed_at: ISODateString | null;
  installed_jalali_date: JalaliDateString | null;
  installed_odometer: number | null;
  installed_vehicle_id: UUID | null;
  warranty_duration_days: number | null;
  warranty_expiration: ISODateString | null;
  warranty_expiration_jalali: JalaliDateString | null;
  notes: string | null;
}

// Repairs table
export interface RepairRow {
  id: UUID;
  vehicle_id: UUID;
  title: string;
  description: string | null;
  symptoms: string | null; // JSON array
  repair_date: JalaliDateString;
  repair_date_iso: ISODateString;
  odometer: number;
  workshop_id: UUID | null;
  workshop_name: string | null;
  workshop_contact: string | null;
  workshop_address: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  diagnostic_cost: number | null;
  total_cost: number | null;
  currency: string;
  parts_used: string | null; // JSON array
  root_cause: string | null;
  repair_description: string | null;
  warranty_duration_days: number | null;
  warranty_expiration: JalaliDateString | null;
  warranty_expiration_iso: ISODateString | null;
  warranty_notes: string | null;
  follow_up_required: boolean;
  follow_up_date: JalaliDateString | null;
  follow_up_date_iso: ISODateString | null;
  follow_up_notes: string | null;
  attachment_urls: string | null; // JSON array
  invoice_image_url: string | null;
  status: RepairStatus;
  completion_notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  completed_at: ISODateString | null;
  metadata: string | null; // JSON string
}

// Expenses table
export interface ExpenseRow {
  id: UUID;
  vehicle_id: UUID;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  custom_category: string | null;
  amount: number;
  currency: string;
  expense_date: JalaliDateString;
  expense_date_iso: ISODateString;
  odometer: number | null;
  maintenance_record_id: UUID | null;
  repair_id: UUID | null;
  part_id: UUID | null;
  purchase_id: UUID | null;
  payment_method: string | null;
  payment_reference: string | null;
  paid_to: string | null;
  tax_amount: number | null;
  is_tax_deductible: boolean;
  receipt_image_url: string | null;
  attachment_urls: string | null; // JSON array
  is_recurring: boolean;
  recurring_frequency: ExpenseFrequency | null;
  recurring_interval: number | null;
  next_occurrence_date: JalaliDateString | null;
  next_occurrence_date_iso: ISODateString | null;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Workshops table
export interface WorkshopRow {
  id: UUID;
  name: string;
  name_en: string | null;
  contact_person: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  website: string | null;
  specialties: string | null; // JSON array
  rating: number | null;
  notes: string | null;
  is_favorite: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Attachments table
export interface AttachmentRow {
  id: UUID;
  url: string;
  thumbnail_url: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  related_table: TableName;
  related_id: UUID;
  created_at: ISODateString;
}

// Settings table
export interface SettingsRow {
  id: UUID;
  settings: string; // JSON string of AppSettings
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Database row to entity converters

export function rowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    manufacturer: row.manufacturer,
    manufacturerId: row.manufacturer_id || undefined,
    model: row.model,
    modelId: row.model_id || undefined,
    trim: row.trim || undefined,
    trimId: row.trim_id || undefined,
    licensePlate: row.license_plate,
    vin: row.vin || undefined,
    chassisNumber: row.chassis_number || undefined,
    engineNumber: row.engine_number || undefined,
    productionYear: row.production_year,
    color: row.color || undefined,
    fuelType: row.fuel_type,
    transmissionType: row.transmission_type || undefined,
    engineCapacity: row.engine_capacity || undefined,
    currentOdometer: row.current_odometer,
    lastOdometerUpdate: row.last_odometer_update,
    purchaseDate: row.purchase_date || undefined,
    purchaseDateISO: row.purchase_date_iso || undefined,
    insuranceExpiration: row.insurance_expiration || undefined,
    insuranceExpirationISO: row.insurance_expiration_iso || undefined,
    technicalInspectionExpiration: row.technical_inspection_expiration || undefined,
    technicalInspectionExpirationISO: row.technical_inspection_expiration_iso || undefined,
    warrantyExpiration: row.warranty_expiration || undefined,
    warrantyExpirationISO: row.warranty_expiration_iso || undefined,
    isDefault: row.is_default,
    isActive: row.is_active,
    status: row.status,
    imageUrl: row.image_url || undefined,
    thumbnailUrl: row.thumbnail_url || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at || undefined,
  };
}

export function rowToOdometerEntry(row: OdometerEntryRow): OdometerEntry {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    odometer: row.odometer,
    jalaliDate: row.jalali_date,
    gregorianDate: row.gregorian_date,
    recordedAt: row.recorded_at,
    note: row.note || undefined,
    isConfirmed: row.is_confirmed,
    confirmedAt: row.confirmed_at || undefined,
    confirmedBy: row.confirmed_by || undefined,
    isLowerThanPrevious: row.is_lower_than_previous || false,
    lowerReadingReason: row.lower_reading_reason || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Database schema definitions for Drizzle ORM (if used)
// This is a reference for the schema, actual implementation may vary

export interface TableSchema {
  name: TableName;
  columns: {
    [key: string]: {
      type: string;
      primaryKey?: boolean;
      unique?: boolean;
      notNull?: boolean;
      default?: unknown;
      references?: { table: TableName; column: string };
    };
  };
  indexes?: string[][];
}

// Database migration history
export interface MigrationHistory {
  id: UUID;
  version: number;
  description: string;
  appliedAt: ISODateString;
}

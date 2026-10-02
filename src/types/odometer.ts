// Odometer Domain Types

import { UUID, ISODateString, JalaliDateString } from './common';

// Odometer entry entity
export interface OdometerEntry {
  id: UUID;
  vehicleId: UUID;
  
  // Reading
  odometer: number; // in kilometers
  
  // Timestamps
  jalaliDate: JalaliDateString; // Display date
  gregorianDate: ISODateString; // For calculations and sorting
  recordedAt: ISODateString; // When the entry was recorded
  
  // Notes
  note?: string;
  
  // Validation flags
  isConfirmed: boolean;
  confirmedAt?: ISODateString;
  confirmedBy?: UUID; // User who confirmed
  
  // If this reading is lower than previous (requires reason)
  isLowerThanPrevious?: boolean;
  lowerReadingReason?: string;
  
  // Metadata
  createdAt: ISODateString;
  updatedAt: ISODateString;
  
  // Navigation property (not stored in DB, populated at runtime)
  previousOdometer?: OdometerEntry;
  nextOdometer?: OdometerEntry;
}

// Odometer creation input
export interface CreateOdometerInput {
  vehicleId: UUID;
  odometer: number;
  jalaliDate: JalaliDateString;
  gregorianDate?: ISODateString; // Optional, will be calculated if not provided
  note?: string;
  forceLower?: boolean; // Allow lower reading with confirmation
  lowerReadingReason?: string;
}

// Odometer update input
export interface UpdateOdometerInput extends Partial<CreateOdometerInput> {
  id: UUID;
}

// Odometer validation result
export interface OdometerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  previousOdometer?: OdometerEntry;
  difference?: number;
}

// Odometer history for a vehicle
export interface VehicleOdometerHistory {
  vehicleId: UUID;
  entries: OdometerEntry[];
  currentOdometer: number;
  lastUpdate: ISODateString;
  totalKilometers: number;
  averageDailyKilometers?: number;
}

// Odometer statistics
export interface OdometerStatistics {
  vehicleId: UUID;
  startOdometer: number;
  currentOdometer: number;
  totalKilometers: number;
  firstReadingDate: JalaliDateString;
  lastReadingDate: JalaliDateString;
  daysBetweenFirstAndLast: number;
  averageDailyKilometers: number;
  averageMonthlyKilometers: number;
  readingsCount: number;
  last30DaysKilometers: number;
  last30DaysCount: number;
}

// Odometer filter types
export interface OdometerFilter {
  vehicleId?: UUID;
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
  minOdometer?: number;
  maxOdometer?: number;
  searchTerm?: string;
}

// Odometer reminder threshold
export interface OdometerThreshold {
  // When to trigger warning before reaching service odometer
  warningKilometers: number; // e.g., 1000 km before
  
  // When to trigger critical warning
  criticalKilometers: number; // e.g., 500 km before
  
  // When to mark as overdue
  overdueKilometers: number; // e.g., 0 or negative
}

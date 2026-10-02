// Vehicle Domain Types

import { UUID, ISODateString, JalaliDateString, Status } from './common';

// Fuel types
export type FuelType = 
  | 'gasoline'
  | 'diesel'
  | 'cng'
  | 'hybrid'
  | 'electric'
  | 'hydrogen'
  | 'other';

// Transmission types
export type TransmissionType = 
  | 'manual'
  | 'automatic'
  | 'semi-automatic'
  | 'cvt'
  | 'other';

// Vehicle manufacturer types
export interface VehicleManufacturer {
  id: UUID;
  name: string; // e.g., "پژو", "ایران خودرو", "سایپا"
  nameEn?: string; // English name for internal use
  country?: string;
  logoUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Vehicle model types
export interface VehicleModel {
  id: UUID;
  manufacturerId: UUID;
  name: string; // e.g., "207", "پارس", "سمند"
  nameEn?: string;
  yearStart?: number;
  yearEnd?: number;
  bodyType?: string; // سدان، شاسی بلند، وانت، هچبک
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Vehicle trim/types
export interface VehicleTrim {
  id: UUID;
  modelId: UUID;
  name: string; // e.g., "GLX", "EX", "TURBO"
  nameEn?: string;
  engineCapacity?: number; // cc
  enginePower?: number; // horsepower
  transmission?: TransmissionType;
  fuelType?: FuelType;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Vehicle entity - Main vehicle record
export interface Vehicle {
  id: UUID;
  userId?: UUID; // For future multi-user support
  
  // Basic info
  manufacturer: string;
  manufacturerId?: UUID; // Reference to manufacturer table
  model: string;
  modelId?: UUID; // Reference to model table
  trim?: string;
  trimId?: UUID; // Reference to trim table
  
  // Identification
  licensePlate: string;
  vin?: string; // Vehicle Identification Number
  chassisNumber?: string;
  engineNumber?: string;
  
  // Specifications
  productionYear: number;
  color?: string;
  fuelType: FuelType;
  transmissionType?: TransmissionType;
  engineCapacity?: number; // in cc
  
  // Current state
  currentOdometer: number;
  lastOdometerUpdate: ISODateString;
  
  // Important dates (Jalali format for display, ISO for storage)
  purchaseDate?: JalaliDateString;
  purchaseDateISO?: ISODateString;
  insuranceExpiration?: JalaliDateString;
  insuranceExpirationISO?: ISODateString;
  technicalInspectionExpiration?: JalaliDateString;
  technicalInspectionExpirationISO?: ISODateString;
  warrantyExpiration?: JalaliDateString;
  warrantyExpirationISO?: ISODateString;
  
  // Settings
  isDefault: boolean;
  isActive: boolean;
  status: Status;
  
  // Images
  imageUrl?: string;
  thumbnailUrl?: string;
  
  // Notes
  notes?: string;
  
  // Metadata
  createdAt: ISODateString;
  updatedAt: ISODateString;
  archivedAt?: ISODateString;
}

// Vehicle creation input (for forms)
export interface CreateVehicleInput {
  manufacturer: string;
  manufacturerId?: UUID;
  model: string;
  modelId?: UUID;
  trim?: string;
  trimId?: UUID;
  licensePlate: string;
  vin?: string;
  productionYear: number;
  color?: string;
  fuelType: FuelType;
  transmissionType?: TransmissionType;
  engineCapacity?: number;
  currentOdometer: number;
  purchaseDate?: JalaliDateString;
  insuranceExpiration?: JalaliDateString;
  technicalInspectionExpiration?: JalaliDateString;
  warrantyExpiration?: JalaliDateString;
  image?: ImageInfo;
  notes?: string;
}

// Vehicle update input
export interface UpdateVehicleInput extends Partial<CreateVehicleInput> {
  id: UUID;
}

// Vehicle summary for dashboard
export interface VehicleSummary {
  id: UUID;
  displayName: string; // e.g., "پژو 207 GLX"
  licensePlate: string;
  currentOdometer: number;
  imageUrl?: string;
  isDefault: boolean;
  
  // Health indicators
  overdueServicesCount: number;
  upcomingServicesCount: number;
  
  // Important dates
  insuranceStatus: 'valid' | 'expiring' | 'expired';
  inspectionStatus: 'valid' | 'expiring' | 'expired';
  
  // Quick stats
  totalExpenses: number;
  lastServiceDate?: JalaliDateString;
}

// Vehicle list item (for vehicle selector)
export interface VehicleListItem {
  id: UUID;
  displayName: string;
  licensePlate: string;
  imageUrl?: string;
  isDefault: boolean;
  currentOdometer: number;
}

// Vehicle filter types
export interface VehicleFilter {
  manufacturerId?: UUID;
  modelId?: UUID;
  fuelType?: FuelType;
  status?: Status;
  searchTerm?: string;
}

// Common Persian vehicle manufacturers
_export const PERSIAN_MANUFACTURERS = [
  { id: 'peugeot', name: 'پژو', nameEn: 'Peugeot' },
  { id: 'iran-khodro', name: 'ایران خودرو', nameEn: 'Iran Khodro' },
  { id: 'saipa', name: 'سایپا', nameEn: 'Saipa' },
  { id: 'mvm', name: 'ام وی ام', nameEn: 'MVM' },
  { id: 'kerman-motor', name: 'کرمان موتور', nameEn: 'Kerman Motor' },
  { id: 'zamyad', name: 'زامیاد', nameEn: 'Zamyad' },
  { id: 'toyota', name: 'تویوتا', nameEn: 'Toyota' },
  { id: 'hyundai', name: 'هیوندای', nameEn: 'Hyundai' },
  { id: 'kia', name: 'کیای', nameEn: 'Kia' },
  { id: 'nissan', name: 'نیسان', nameEn: 'Nissan' },
  { id: 'renault', name: 'رنو', nameEn: 'Renault' },
  { id: 'chery', name: 'چری', nameEn: 'Chery' },
  { id: 'others', name: 'سایر', nameEn: 'Others' },
] as const;

export type PersianManufacturer = typeof PERSIAN_MANUFACTURERS[number];

// Common Persian fuel type labels
export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  gasoline: 'بنزین',
  diesel: 'دیزل',
  cng: 'گاز طبیعی (CNG)',
  hybrid: 'هیبرید',
  electric: 'برقی',
  hydrogen: 'هیدروژن',
  other: 'سایر',
};

// Common Persian transmission type labels
export const TRANSMISSION_TYPE_LABELS: Record<TransmissionType, string> = {
  manual: 'دستی',
  automatic: 'اتوماتیک',
  'semi-automatic': 'نیمه اتوماتیک',
  cvt: 'سی وی تی (CVT)',
  other: 'سایر',
};

// Vehicle status labels
export const VEHICLE_STATUS_LABELS: Record<Status, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  archived: 'بایگانی',
  deleted: 'حذف شده',
};

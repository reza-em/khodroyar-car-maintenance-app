// Parts and Purchases Domain Types

import { UUID, ISODateString, JalaliDateString, Currency } from './common';

// Part category types
export type PartCategory = 
  | 'engine'
  | 'transmission'
  | 'suspension'
  | 'brakes'
  | 'electrical'
  | 'exterior'
  | 'interior'
  | 'fluids'
  | 'filters'
  | 'battery'
  | 'tires'
  | 'lights'
  | 'accessories'
  | 'other';

// Part installation status
export type PartInstallationStatus = 
  | 'purchased'
  | 'not_installed'
  | 'installed'
  | 'returned'
  | 'warranty_expired';

// Part entity
export interface Part {
  id: UUID;
  vehicleId?: UUID; // Optional: part can be vehicle-specific or generic
  
  // Basic info
  name: string;
  nameEn?: string;
  description?: string;
  
  // Categorization
  category: PartCategory;
  customCategory?: string; // For custom categories
  
  // Identification
  brand?: string;
  partNumber?: string;
  oemNumber?: string;
  
  // Specifications
  specifications?: Record<string, string>;
  
  // Pricing
  purchasePrice?: number;
  retailPrice?: number;
  currency: Currency;
  
  // Inventory
  quantity: number;
  minQuantity?: number; // For inventory alerts
  
  // Installation info
  installationStatus: PartInstallationStatus;
  installedAt?: ISODateString;
  installedJalaliDate?: JalaliDateString;
  installedOdometer?: number;
  installedVehicleId?: UUID;
  
  // Warranty
  warrantyDurationDays?: number;
  warrantyExpiration?: ISODateString;
  warrantyExpirationJalali?: JalaliDateString;
  
  // Supplier
  supplier?: string;
  supplierContact?: string;
  
  // Images
  imageUrl?: string;
  attachmentUrls?: string[];
  
  // Maintenance linkage
  linkedServiceIds?: UUID[]; // Services this part was used in
  linkedRepairIds?: UUID[]; // Repairs this part was used in
  
  // Notes
  notes?: string;
  
  // Tracking
  createdAt: ISODateString;
  updatedAt: ISODateString;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Purchase entity
export interface Purchase {
  id: UUID;
  vehicleId?: UUID; // Optional: purchase can be vehicle-specific or generic
  
  // Basic info
  purchaseNumber?: string; // Reference number
  
  // Dates
  jalaliDate: JalaliDateString;
  gregorianDate: ISODateString;
  
  // Items
  items: PurchaseItem[];
  
  // Supplier
  seller: string;
  sellerContact?: string;
  sellerAddress?: string;
  
  // Costs
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  currency: Currency;
  paymentMethod?: string;
  
  // Status
  status: PurchaseStatus;
  
  // Attachments
  invoiceImageUrl?: string;
  attachmentUrls?: string[];
  
  // Notes
  notes?: string;
  
  // Tracking
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// Purchase item
export interface PurchaseItem {
  id: UUID;
  partId?: UUID; // Reference to existing part
  
  // Part details (can be inline if not referencing existing part)
  name: string;
  brand?: string;
  partNumber?: string;
  
  // Quantity and pricing
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  
  // Installation tracking
  installationStatus: PartInstallationStatus;
  installedAt?: ISODateString;
  installedJalaliDate?: JalaliDateString;
  installedOdometer?: number;
  installedVehicleId?: UUID;
  
  // Warranty
  warrantyDurationDays?: number;
  warrantyExpiration?: ISODateString;
  warrantyExpirationJalali?: JalaliDateString;
  
  // Notes
  notes?: string;
}

// Purchase status
export type PurchaseStatus = 
  | 'draft'
  | 'ordered'
  | 'delivered'
  | 'partially_delivered'
  | 'cancelled'
  | 'returned';

// Part creation input
export interface CreatePartInput {
  vehicleId?: UUID;
  name: string;
  nameEn?: string;
  description?: string;
  category: PartCategory;
  customCategory?: string;
  brand?: string;
  partNumber?: string;
  oemNumber?: string;
  specifications?: Record<string, string>;
  purchasePrice?: number;
  retailPrice?: number;
  currency: Currency;
  quantity: number;
  minQuantity?: number;
  installationStatus: PartInstallationStatus;
  installedAt?: ISODateString;
  installedJalaliDate?: JalaliDateString;
  installedOdometer?: number;
  installedVehicleId?: UUID;
  warrantyDurationDays?: number;
  warrantyExpiration?: ISODateString;
  warrantyExpirationJalali?: JalaliDateString;
  supplier?: string;
  supplierContact?: string;
  image?: ImageInfo;
  attachmentUrls?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

// Part update input
export interface UpdatePartInput extends Partial<CreatePartInput> {
  id: UUID;
}

// Purchase creation input
export interface CreatePurchaseInput {
  vehicleId?: UUID;
  purchaseNumber?: string;
  jalaliDate: JalaliDateString;
  gregorianDate?: ISODateString;
  items: Omit<PurchaseItem, 'id' | 'totalPrice'>[];
  seller: string;
  sellerContact?: string;
  sellerAddress?: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  currency: Currency;
  paymentMethod?: string;
  status?: PurchaseStatus;
  invoiceImage?: ImageInfo;
  attachmentUrls?: string[];
  notes?: string;
}

// Purchase update input
export interface UpdatePurchaseInput extends Partial<CreatePurchaseInput> {
  id: UUID;
}

// Part filter types
export interface PartFilter {
  vehicleId?: UUID;
  category?: PartCategory;
  installationStatus?: PartInstallationStatus;
  searchTerm?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

// Purchase filter types
export interface PurchaseFilter {
  vehicleId?: UUID;
  status?: PurchaseStatus;
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
  seller?: string;
  searchTerm?: string;
}

// Part summary for dashboard
export interface PartSummary {
  totalParts: number;
  installedParts: number;
  notInstalledParts: number;
  warrantyExpiringSoon: number;
  lowStockParts: number;
  totalInventoryValue: number;
}

// Persian labels for part categories
export const PART_CATEGORY_LABELS: Record<PartCategory, string> = {
  engine: 'موتور',
  transmission: 'گیربکس',
  suspension: 'سस्पانسیون',
  brakes: 'ترمز',
  electrical: 'برق',
  exterior: 'بدنه خارجی',
  interior: 'فضای داخلی',
  fluids: 'روانکارها',
  filters: 'فیلترها',
  battery: 'باتری',
  tires: 'لاستیک‌ها',
  lights: 'چراغ‌ها',
  accessories: 'لوازم جانبی',
  other: 'سایر',
};

// Persian labels for part installation statuses
export const PART_INSTALLATION_STATUS_LABELS: Record<PartInstallationStatus, string> = {
  purchased: 'خریداری شده',
  not_installed: 'نصب نشده',
  installed: 'نصب شده',
  returned: 'مرجوع شده',
  warranty_expired: 'پایان ضمانت',
};

// Persian labels for purchase statuses
export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: 'پیش‌نویس',
  ordered: 'سفارش داده شده',
  delivered: 'تحویل داده شده',
  partially_delivered: 'جزئی تحویل',
  cancelled: 'لغو شده',
  returned: 'مرجوع شده',
};

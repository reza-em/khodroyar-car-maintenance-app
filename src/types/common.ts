// Common types used across the application

// UUID type
export type UUID = string;

// ISO Date strings
export type ISODateString = string;
export type JalaliDateString = string; // Format: YYYY/MM/DD or YYYY-MM-DD

// Currency types
export type Currency = 'IRR' | 'IRT' | 'USD' | 'EUR' | string;

// Status types
export type Status = 'active' | 'inactive' | 'archived' | 'deleted';

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Filter types
export interface DateRangeFilter {
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
}

export interface OdometerRangeFilter {
  minOdometer?: number;
  maxOdometer?: number;
}

export interface SearchFilter {
  searchTerm?: string;
}

// Sort types
export type SortOrder = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  order: SortOrder;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | string[] | undefined;
}

// Image/Attachment types
export interface ImageInfo {
  uri: string;
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
}

export interface Attachment {
  id: UUID;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: ISODateString;
}

// Address types
export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

// Contact types
export interface Contact {
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
}

// Price types
export interface Price {
  amount: number;
  currency: Currency;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: Currency;
}

// Color palette types (for UI theming)
export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  border: string;
  divider: string;
}

// Theme types
export interface AppTheme {
  colors: ColorPalette;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    fontFamily: string;
    fontSizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      h1: number;
      h2: number;
      h3: number;
    };
    fontWeights: {
      light: string;
      normal: string;
      medium: string;
      bold: string;
      extraBold: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  isDark: boolean;
}

// Expense Domain Types

import { UUID, ISODateString, JalaliDateString, Currency } from './common';

// Expense category types
export type ExpenseCategory = 
  | 'maintenance'
  | 'repair'
  | 'parts'
  | 'fuel'
  | 'third_party_insurance'
  | 'comprehensive_insurance'
  | 'technical_inspection'
  | 'parking'
  | 'fines'
  | 'car_wash'
  | 'depreciation'
  | 'taxes'
  | 'other';

// Expense entity
export interface Expense {
  id: UUID;
  vehicleId: UUID;
  
  // Expense details
  title: string;
  description?: string;
  
  // Categorization
  category: ExpenseCategory;
  customCategory?: string;
  
  // Amount
  amount: number;
  currency: Currency;
  
  // Dates
  expenseDate: JalaliDateString;
  expenseDateISO: ISODateString;
  
  // Odometer at expense
  odometer?: number;
  
  // Related entities (optional)
  maintenanceRecordId?: UUID;
  repairId?: UUID;
  partId?: UUID;
  purchaseId?: UUID;
  
  // Payment info
  paymentMethod?: string;
  paymentReference?: string;
  paidTo?: string; // Person or company
  
  // Tax info
  taxAmount?: number;
  isTaxDeductible?: boolean;
  
  // Attachments
  receiptImageUrl?: string;
  attachmentUrls?: string[];
  
  // Recurring expense
  isRecurring: boolean;
  recurringFrequency?: ExpenseFrequency;
  recurringInterval?: number;
  nextOccurrenceDate?: JalaliDateString;
  nextOccurrenceDateISO?: ISODateString;
  
  // Notes
  notes?: string;
  
  // Tracking
  createdAt: ISODateString;
  updatedAt: ISODateString;
  
  // Metadata
  metadata?: Record<string, unknown>;
}

// Expense frequency for recurring expenses
export type ExpenseFrequency = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'yearly';

// Expense creation input
export interface CreateExpenseInput {
  vehicleId: UUID;
  title: string;
  description?: string;
  category: ExpenseCategory;
  customCategory?: string;
  amount: number;
  currency: Currency;
  jalaliDate: JalaliDateString;
  gregorianDate?: ISODateString;
  odometer?: number;
  maintenanceRecordId?: UUID;
  repairId?: UUID;
  partId?: UUID;
  purchaseId?: UUID;
  paymentMethod?: string;
  paymentReference?: string;
  paidTo?: string;
  taxAmount?: number;
  isTaxDeductible?: boolean;
  receiptImage?: ImageInfo;
  attachmentUrls?: string[];
  isRecurring: boolean;
  recurringFrequency?: ExpenseFrequency;
  recurringInterval?: number;
  nextOccurrenceDate?: JalaliDateString;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// Expense update input
export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: UUID;
}

// Expense filter types
export interface ExpenseFilter {
  vehicleId?: UUID;
  category?: ExpenseCategory;
  startDate?: JalaliDateString;
  endDate?: JalaliDateString;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

// Expense statistics
export interface ExpenseStatistics {
  vehicleId: UUID;
  totalExpenses: number;
  totalAmount: number;
  byCategory: Record<ExpenseCategory, number>;
  byMonth: Record<string, number>; // Jalali month (YYYY/MM) -> amount
  monthlyAverage: number;
  yearlyTotal: number;
  costPerKilometer?: number;
  mostExpensiveCategory: ExpenseCategory;
  mostExpensiveMonth: string;
}

// Monthly expense report
export interface MonthlyExpenseReport {
  jalaliYear: number;
  jalaliMonth: number;
  jalaliMonthName: string;
  totalExpenses: number;
  totalAmount: number;
  expensesByCategory: Record<ExpenseCategory, { count: number; amount: number }>;
  fuelExpenses: number;
  maintenanceExpenses: number;
  repairExpenses: number;
  insuranceExpenses: number;
  otherExpenses: number;
}

// Yearly expense report
export interface YearlyExpenseReport {
  jalaliYear: number;
  totalExpenses: number;
  totalAmount: number;
  totalKilometers?: number;
  costPerKilometer?: number;
  months: MonthlyExpenseReport[];
  categoryBreakdown: Record<ExpenseCategory, { count: number; amount: number; percentage: number }>;
}

// Expense summary for dashboard
export interface ExpenseSummary {
  totalExpenses: number;
  totalAmount: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  monthlyAverage: number;
  costPerKilometer?: number;
  categoryBreakdown: Record<ExpenseCategory, { count: number; amount: number }>;
}

// Cost per kilometer calculation
export interface CostPerKilometerResult {
  vehicleId: UUID;
  totalKilometers: number;
  totalExpenses: number;
  costPerKilometer: number;
  periodStartDate: JalaliDateString;
  periodEndDate: JalaliDateString;
}

// Persian labels for expense categories
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  maintenance: 'نگهداری و سرویس',
  repair: 'تعمیر',
  parts: 'خرید قطعه',
  fuel: 'سوز',
  third_party_insurance: 'بیمه شخص ثالث',
  comprehensive_insurance: 'بیمه بدنه',
  technical_inspection: 'معاینه فنی',
  parking: 'پارکینگ',
  fines: 'جریمه',
  car_wash: 'شستشو',
  depreciation: 'استهلاک',
  taxes: 'مالیات و عوارض',
  other: 'سایر',
};

// Persian labels for expense frequencies
export const EXPENSE_FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  daily: 'روزانه',
  weekly: 'هفتگی',
  biweekly: 'دو هفته یکبار',
  monthly: 'ماهانه',
  quarterly: 'سه ماهه',
  semiannual: 'شش ماهه',
  yearly: 'سالانه',
};

// Common payment methods in Persian
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت بانکی',
  mobile_banking: 'بانکداری موبایلی',
  online: 'آنلاین',
  check: 'چک',
  credit: 'اعتباری',
  other: 'سایر',
};

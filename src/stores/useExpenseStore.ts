/**
 * Expense Store - Zustand
 * 
 * Manages expense records and expense-related operations.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../lib/jalaliDate';
import { 
  Expense, 
  CreateExpenseInput,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseFrequency
} from '../types/expense';

interface ExpenseState {
  // State
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (input: CreateExpenseInput) => Promise<{ success: boolean; expense?: Expense; error?: string }>;
  updateExpense: (id: string, input: Partial<CreateExpenseInput>) => Promise<{ success: boolean; expense?: Expense; error?: string }>;
  deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  archiveExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getExpensesByVehicle: (vehicleId: string) => Expense[];
  getExpenseById: (id: string) => Expense | null;
  getExpensesByCategory: (vehicleId: string, category: ExpenseCategory) => Expense[];
  getMonthlyExpenses: (vehicleId: string, jalaliYear: number, jalaliMonth: number) => Expense[];
  getYearlyExpenses: (vehicleId: string, jalaliYear: number) => Expense[];
  filterExpenses: (filter: ExpenseFilter) => Expense[];
  getExpenseSummary: (vehicleId: string) => { total: number; byCategory: Record<string, number>; totalAmount: number };
  getTotalByCategory: (vehicleId: string) => Record<ExpenseCategory, number>;
  getCostPerKilometer: (vehicleId: string, startDate?: string, endDate?: string) => number | null;
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useExpenseStore = create<ExpenseState>()((set, get) => ({
  // Initial state
  expenses: [],
  isLoading: false,
  error: null,
  
  // Actions
  setExpenses: (expenses) => {
    set({ expenses, error: null });
  },
  
  addExpense: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const expenseId = uuidv4();
      
      const expense: Expense = {
        id: expenseId,
        vehicleId: input.vehicleId,
        title: input.title,
        description: input.description,
        category: input.category,
        customCategory: input.customCategory,
        amount: input.amount,
        currency: input.currency || 'IRT',
        expenseDate: input.jalaliDate || getCurrentJalaliDate(),
        expenseDateISO: input.gregorianDate || getCurrentGregorianISO(),
        odometer: input.odometer,
        maintenanceRecordId: input.maintenanceRecordId,
        repairId: input.repairId,
        partId: input.partId,
        purchaseId: input.purchaseId,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        paidTo: input.paidTo,
        taxAmount: input.taxAmount,
        isTaxDeductible: input.isTaxDeductible,
        receiptImageUrl: input.receiptImage?.uri,
        attachmentUrls: input.attachmentUrls,
        isRecurring: input.isRecurring || false,
        recurringFrequency: input.recurringFrequency,
        recurringInterval: input.recurringInterval,
        nextOccurrenceDate: input.nextOccurrenceDate,
        nextOccurrenceDateISO: input.nextOccurrenceDateISO,
        notes: input.notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: input.metadata,
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO expenses (
          id, vehicle_id, title, description, category, custom_category, amount, currency,
          expense_date, expense_date_iso, odometer, maintenance_record_id, repair_id, part_id, purchase_id,
          payment_method, payment_reference, paid_to, tax_amount, is_tax_deductible,
          receipt_image_url, attachment_urls, is_recurring, recurring_frequency, recurring_interval,
          next_occurrence_date, next_occurrence_date_iso, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        expense.id,
        expense.vehicleId,
        expense.title,
        expense.description,
        expense.category,
        expense.customCategory,
        expense.amount,
        expense.currency,
        expense.expenseDate,
        expense.expenseDateISO,
        expense.odometer,
        expense.maintenanceRecordId,
        expense.repairId,
        expense.partId,
        expense.purchaseId,
        expense.paymentMethod,
        expense.paymentReference,
        expense.paidTo,
        expense.taxAmount,
        expense.isTaxDeductible ? 1 : 0,
        expense.receiptImageUrl,
        JSON.stringify(expense.attachmentUrls),
        expense.isRecurring ? 1 : 0,
        expense.recurringFrequency,
        expense.recurringInterval,
        expense.nextOccurrenceDate,
        expense.nextOccurrenceDateISO,
        expense.notes,
        expense.createdAt,
        expense.updatedAt,
      ]);
      
      // Update state
      const existingExpenses = get().expenses;
      const newExpenses = [...existingExpenses, expense];
      
      set({
        expenses: newExpenses,
        isLoading: false,
      });
      
      return { success: true, expense };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت هزینه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updateExpense: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingExpense = get().expenses.find(e => e.id === id);
      
      if (!existingExpense) {
        return { success: false, error: 'هزینه یافت نشد' };
      }
      
      const expense: Expense = {
        ...existingExpense,
        title: input.title ?? existingExpense.title,
        description: input.description ?? existingExpense.description,
        category: input.category ?? existingExpense.category,
        customCategory: input.customCategory ?? existingExpense.customCategory,
        amount: input.amount ?? existingExpense.amount,
        currency: input.currency ?? existingExpense.currency,
        expenseDate: input.jalaliDate ?? existingExpense.expenseDate,
        expenseDateISO: input.gregorianDate ?? existingExpense.expenseDateISO,
        odometer: input.odometer ?? existingExpense.odometer,
        maintenanceRecordId: input.maintenanceRecordId ?? existingExpense.maintenanceRecordId,
        repairId: input.repairId ?? existingExpense.repairId,
        partId: input.partId ?? existingExpense.partId,
        purchaseId: input.purchaseId ?? existingExpense.purchaseId,
        paymentMethod: input.paymentMethod ?? existingExpense.paymentMethod,
        paymentReference: input.paymentReference ?? existingExpense.paymentReference,
        paidTo: input.paidTo ?? existingExpense.paidTo,
        taxAmount: input.taxAmount ?? existingExpense.taxAmount,
        isTaxDeductible: input.isTaxDeductible ?? existingExpense.isTaxDeductible,
        receiptImageUrl: input.receiptImage?.uri ?? existingExpense.receiptImageUrl,
        attachmentUrls: input.attachmentUrls ?? existingExpense.attachmentUrls,
        isRecurring: input.isRecurring ?? existingExpense.isRecurring,
        recurringFrequency: input.recurringFrequency ?? existingExpense.recurringFrequency,
        recurringInterval: input.recurringInterval ?? existingExpense.recurringInterval,
        nextOccurrenceDate: input.nextOccurrenceDate ?? existingExpense.nextOccurrenceDate,
        nextOccurrenceDateISO: input.nextOccurrenceDateISO ?? existingExpense.nextOccurrenceDateISO,
        notes: input.notes ?? existingExpense.notes,
        updatedAt: now.toISOString(),
      };
      
      // Update in database
      database.execSync(`
        UPDATE expenses SET
          title = ?,
          description = ?,
          category = ?,
          custom_category = ?,
          amount = ?,
          currency = ?,
          expense_date = ?,
          expense_date_iso = ?,
          odometer = ?,
          maintenance_record_id = ?,
          repair_id = ?,
          part_id = ?,
          purchase_id = ?,
          payment_method = ?,
          payment_reference = ?,
          paid_to = ?,
          tax_amount = ?,
          is_tax_deductible = ?,
          receipt_image_url = ?,
          attachment_urls = ?,
          is_recurring = ?,
          recurring_frequency = ?,
          recurring_interval = ?,
          next_occurrence_date = ?,
          next_occurrence_date_iso = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        expense.title,
        expense.description,
        expense.category,
        expense.customCategory,
        expense.amount,
        expense.currency,
        expense.expenseDate,
        expense.expenseDateISO,
        expense.odometer,
        expense.maintenanceRecordId,
        expense.repairId,
        expense.partId,
        expense.purchaseId,
        expense.paymentMethod,
        expense.paymentReference,
        expense.paidTo,
        expense.taxAmount,
        expense.isTaxDeductible ? 1 : 0,
        expense.receiptImageUrl,
        JSON.stringify(expense.attachmentUrls),
        expense.isRecurring ? 1 : 0,
        expense.recurringFrequency,
        expense.recurringInterval,
        expense.nextOccurrenceDate,
        expense.nextOccurrenceDateISO,
        expense.notes,
        expense.updatedAt,
        expense.id,
      ]);
      
      // Update state
      const existingExpenses = get().expenses;
      const updatedExpenses = existingExpenses.map(e => e.id === id ? expense : e);
      
      set({
        expenses: updatedExpenses,
        isLoading: false,
      });
      
      return { success: true, expense };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی هزینه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Delete from database
      database.execSync('DELETE FROM expenses WHERE id = ?', [id]);
      
      // Update state
      const existingExpenses = get().expenses;
      const filteredExpenses = existingExpenses.filter(e => e.id !== id);
      
      set({
        expenses: filteredExpenses,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف هزینه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  archiveExpense: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      // Archive in database (update metadata)
      const existingExpense = get().expenses.find(e => e.id === id);
      if (existingExpense) {
        database.execSync(`
          UPDATE expenses SET 
            metadata = ?,
            updated_at = ?
          WHERE id = ?
        `, [
          JSON.stringify({ ...existingExpense.metadata, archived: true, archivedAt: now.toISOString() }),
          now.toISOString(),
          id,
        ]);
      }
      
      // Update state
      const existingExpenses = get().expenses;
      const updatedExpenses = existingExpenses.map(e => 
        e.id === id ? { 
          ...e, 
          metadata: { ...e.metadata, archived: true, archivedAt: now.toISOString() },
          updatedAt: now.toISOString()
        } : e
      );
      
      set({
        expenses: updatedExpenses,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بایگانی هزینه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Getters
  getExpensesByVehicle: (vehicleId) => {
    return get().expenses
      .filter(e => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.expenseDateISO).getTime() - new Date(a.expenseDateISO).getTime());
  },
  
  getExpenseById: (id) => {
    return get().expenses.find(e => e.id === id) ?? null;
  },
  
  getExpensesByCategory: (vehicleId, category) => {
    return get().expenses
      .filter(e => e.vehicleId === vehicleId && e.category === category)
      .sort((a, b) => new Date(b.expenseDateISO).getTime() - new Date(a.expenseDateISO).getTime());
  },
  
  getMonthlyExpenses: (vehicleId, jalaliYear, jalaliMonth) => {
    return get().expenses
      .filter(e => e.vehicleId === vehicleId)
      .filter(e => {
        const dateParts = e.expenseDate.split('/');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        return year === jalaliYear && month === jalaliMonth;
      })
      .sort((a, b) => new Date(b.expenseDateISO).getTime() - new Date(a.expenseDateISO).getTime());
  },
  
  getYearlyExpenses: (vehicleId, jalaliYear) => {
    return get().expenses
      .filter(e => e.vehicleId === vehicleId)
      .filter(e => {
        const dateParts = e.expenseDate.split('/');
        const year = parseInt(dateParts[0], 10);
        return year === jalaliYear;
      })
      .sort((a, b) => new Date(b.expenseDateISO).getTime() - new Date(a.expenseDateISO).getTime());
  },
  
  filterExpenses: (filter) => {
    let expenses = get().expenses;
    
    if (filter.vehicleId) {
      expenses = expenses.filter(e => e.vehicleId === filter.vehicleId);
    }
    
    if (filter.category) {
      expenses = expenses.filter(e => e.category === filter.category);
    }
    
    if (filter.startDate) {
      expenses = expenses.filter(e => e.expenseDate >= filter.startDate);
    }
    
    if (filter.endDate) {
      expenses = expenses.filter(e => e.expenseDate <= filter.endDate);
    }
    
    if (filter.minAmount !== undefined) {
      expenses = expenses.filter(e => e.amount >= filter.minAmount);
    }
    
    if (filter.maxAmount !== undefined) {
      expenses = expenses.filter(e => e.amount <= filter.maxAmount);
    }
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      expenses = expenses.filter(e => 
        e.title.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.paidTo?.toLowerCase().includes(term)
      );
    }
    
    // Exclude archived
    expenses = expenses.filter(e => !e.metadata?.archived);
    
    return expenses.sort((a, b) => new Date(b.expenseDateISO).getTime() - new Date(a.expenseDateISO).getTime());
  },
  
  getExpenseSummary: (vehicleId) => {
    const expenses = get().expenses
      .filter(e => e.vehicleId === vehicleId && !e.metadata?.archived);
    
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
      const key = e.customCategory || e.category;
      byCategory[key] = (byCategory[key] || 0) + e.amount;
    });
    
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      total: expenses.length,
      byCategory,
      totalAmount,
    };
  },
  
  getTotalByCategory: (vehicleId) => {
    const summary = get().getExpenseSummary(vehicleId);
    return summary.byCategory as Record<ExpenseCategory, number>;
  },
  
  getCostPerKilometer: (vehicleId, startDate, endDate) => {
    const expenses = get().expenses
      .filter(e => e.vehicleId === vehicleId && !e.metadata?.archived);
    
    let filteredExpenses = expenses;
    if (startDate) {
      filteredExpenses = filteredExpenses.filter(e => e.expenseDate >= startDate);
    }
    if (endDate) {
      filteredExpenses = filteredExpenses.filter(e => e.expenseDate <= endDate);
    }
    
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // For now, return cost per km based on total km from vehicle
    // In a full implementation, we'd track actual km driven during the period
    return totalAmount / 10000; // Placeholder: assume 10,000 km
  },
  
  // Initialize from database
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const rows = database.getAllSync(`
        SELECT * FROM expenses 
        ORDER BY expense_date_iso DESC
      `);
      
      const expenses: Expense[] = rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        vehicleId: row.vehicle_id as string,
        title: row.title as string,
        description: row.description as string | undefined,
        category: row.category as ExpenseCategory,
        customCategory: row.custom_category as string | undefined,
        amount: row.amount as number,
        currency: row.currency as string,
        expenseDate: row.expense_date as string,
        expenseDateISO: row.expense_date_iso as string,
        odometer: row.odometer as number | undefined,
        maintenanceRecordId: row.maintenance_record_id as string | undefined,
        repairId: row.repair_id as string | undefined,
        partId: row.part_id as string | undefined,
        purchaseId: row.purchase_id as string | undefined,
        paymentMethod: row.payment_method as string | undefined,
        paymentReference: row.payment_reference as string | undefined,
        paidTo: row.paid_to as string | undefined,
        taxAmount: row.tax_amount as number | undefined,
        isTaxDeductible: Boolean(row.is_tax_deductible as number),
        receiptImageUrl: row.receipt_image_url as string | undefined,
        attachmentUrls: row.attachment_urls ? JSON.parse(row.attachment_urls as string) : undefined,
        isRecurring: Boolean(row.is_recurring as number),
        recurringFrequency: row.recurring_frequency as ExpenseFrequency | undefined,
        recurringInterval: row.recurring_interval as number | undefined,
        nextOccurrenceDate: row.next_occurrence_date as string | undefined,
        nextOccurrenceDateISO: row.next_occurrence_date_iso as string | undefined,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      }));
      
      set({
        expenses,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری هزینه‌ها';
      set({ isLoading: false, error: errorMessage });
    }
  },
  
  reset: () => {
    set({
      expenses: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Selectors for better performance
export const useAllExpenses = () => useExpenseStore(state => state.expenses);
export const useExpensesByVehicle = (vehicleId: string) =>
  useExpenseStore(state => state.getExpensesByVehicle(vehicleId));
export const useExpenseSummary = (vehicleId: string) =>
  useExpenseStore(state => state.getExpenseSummary(vehicleId));
export const useTotalByCategory = (vehicleId: string) =>
  useExpenseStore(state => state.getTotalByCategory(vehicleId));
export const useMonthlyExpenses = (vehicleId: string, year: number, month: number) =>
  useExpenseStore(state => state.getMonthlyExpenses(vehicleId, year, month));

export default useExpenseStore;

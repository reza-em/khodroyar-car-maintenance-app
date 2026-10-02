/**
 * Reminder Store - Zustand
 * 
 * Manages reminders and notifications.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO, addJalaliDays } from '../lib/jalaliDate';
import { Reminder, ReminderType, ReminderStatus, ReminderPriority, CreateReminderInput } from '../types/reminder';

interface ReminderState {
  // State
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (input: CreateReminderInput) => Promise<{ success: boolean; reminder?: Reminder; error?: string }>;
  updateReminder: (id: string, input: Partial<CreateReminderInput>) => Promise<{ success: boolean; reminder?: Reminder; error?: string }>;
  deleteReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  completeReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  snoozeReminder: (id: string, minutes: number) => Promise<{ success: boolean; error?: string }>;
  disableReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  enableReminder: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getRemindersByVehicle: (vehicleId: string) => Reminder[];
  getReminderById: (id: string) => Reminder | null;
  getActiveReminders: (vehicleId: string) => Reminder[];
  getCompletedReminders: (vehicleId: string) => Reminder[];
  getUpcomingReminders: (vehicleId: string) => Reminder[];
  getOverdueReminders: (vehicleId: string) => Reminder[];
  getRemindersByType: (vehicleId: string, type: ReminderType) => Reminder[];
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useReminderStore = create<ReminderState>()((set, get) => ({
  // Initial state
  reminders: [],
  isLoading: false,
  error: null,
  
  // Actions
  setReminders: (reminders) => {
    set({ reminders, error: null });
  },
  
  addReminder: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const reminderId = uuidv4();
      
      const jalaliDate = input.jalaliDate || getCurrentJalaliDate();
      
      const reminder: Reminder = {
        id: reminderId,
        vehicleId: input.vehicleId,
        title: input.title,
        description: input.description,
        type: input.type,
        serviceId: input.serviceId,
        partId: input.partId,
        repairId: input.repairId,
        expenseId: input.expenseId,
        remindAt: input.remindAt || getCurrentGregorianISO(),
        jalaliDate,
        frequency: input.frequency || 'once',
        repeatInterval: input.repeatInterval || 1,
        repeatEndDate: input.repeatEndDate,
        isActive: true,
        status: 'pending',
        notificationId: undefined,
        notifyBeforeDays: input.notifyBeforeDays || 7,
        notifyBeforeKilometers: input.notifyBeforeKilometers || 1000,
        priority: input.priority || 'medium',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: undefined,
        snoozedUntil: undefined,
        snoozeCount: 0,
        metadata: input.metadata,
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO reminders (
          id, vehicle_id, title, description, type, service_id, part_id, repair_id, expense_id,
          remind_at, jalali_date, frequency, repeat_interval, repeat_end_date, is_active, status,
          notification_id, notify_before_days, notify_before_kilometers, priority,
          created_at, updated_at, completed_at, snoozed_until, snooze_count, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        reminder.id,
        reminder.vehicleId,
        reminder.title,
        reminder.description,
        reminder.type,
        reminder.serviceId,
        reminder.partId,
        reminder.repairId,
        reminder.expenseId,
        reminder.remindAt,
        reminder.jalaliDate,
        reminder.frequency,
        reminder.repeatInterval,
        reminder.repeatEndDate,
        reminder.isActive ? 1 : 0,
        reminder.status,
        reminder.notificationId,
        reminder.notifyBeforeDays,
        reminder.notifyBeforeKilometers,
        reminder.priority,
        reminder.createdAt,
        reminder.updatedAt,
        reminder.completedAt,
        reminder.snoozedUntil,
        reminder.snoozeCount,
        JSON.stringify(reminder.metadata),
      ]);
      
      // Update state
      const existingReminders = get().reminders;
      const newReminders = [...existingReminders, reminder];
      
      set({
        reminders: newReminders,
        isLoading: false,
      });
      
      return { success: true, reminder };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updateReminder: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingReminder = get().reminders.find(r => r.id === id);
      
      if (!existingReminder) {
        return { success: false, error: 'یادآوری یافت نشد' };
      }
      
      const reminder: Reminder = {
        ...existingReminder,
        title: input.title ?? existingReminder.title,
        description: input.description ?? existingReminder.description,
        type: input.type ?? existingReminder.type,
        serviceId: input.serviceId ?? existingReminder.serviceId,
        partId: input.partId ?? existingReminder.partId,
        repairId: input.repairId ?? existingReminder.repairId,
        expenseId: input.expenseId ?? existingReminder.expenseId,
        remindAt: input.remindAt ?? existingReminder.remindAt,
        jalaliDate: input.jalaliDate ?? existingReminder.jalaliDate,
        frequency: input.frequency ?? existingReminder.frequency,
        repeatInterval: input.repeatInterval ?? existingReminder.repeatInterval,
        repeatEndDate: input.repeatEndDate ?? existingReminder.repeatEndDate,
        isActive: input.isActive !== undefined ? input.isActive : existingReminder.isActive,
        status: input.status ?? existingReminder.status,
        notifyBeforeDays: input.notifyBeforeDays ?? existingReminder.notifyBeforeDays,
        notifyBeforeKilometers: input.notifyBeforeKilometers ?? existingReminder.notifyBeforeKilometers,
        priority: input.priority ?? existingReminder.priority,
        updatedAt: now.toISOString(),
      };
      
      // Update in database
      database.execSync(`
        UPDATE reminders SET
          title = ?,
          description = ?,
          type = ?,
          service_id = ?,
          part_id = ?,
          repair_id = ?,
          expense_id = ?,
          remind_at = ?,
          jalali_date = ?,
          frequency = ?,
          repeat_interval = ?,
          repeat_end_date = ?,
          is_active = ?,
          status = ?,
          notify_before_days = ?,
          notify_before_kilometers = ?,
          priority = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        reminder.title,
        reminder.description,
        reminder.type,
        reminder.serviceId,
        reminder.partId,
        reminder.repairId,
        reminder.expenseId,
        reminder.remindAt,
        reminder.jalaliDate,
        reminder.frequency,
        reminder.repeatInterval,
        reminder.repeatEndDate,
        reminder.isActive ? 1 : 0,
        reminder.status,
        reminder.notifyBeforeDays,
        reminder.notifyBeforeKilometers,
        reminder.priority,
        reminder.updatedAt,
        reminder.id,
      ]);
      
      // Update state
      const existingReminders = get().reminders;
      const updatedReminders = existingReminders.map(r => r.id === id ? reminder : r);
      
      set({
        reminders: updatedReminders,
        isLoading: false,
      });
      
      return { success: true, reminder };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deleteReminder: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Delete from database
      database.execSync('DELETE FROM reminders WHERE id = ?', [id]);
      
      // Update state
      const existingReminders = get().reminders;
      const filteredReminders = existingReminders.filter(r => r.id !== id);
      
      set({
        reminders: filteredReminders,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  completeReminder: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      // Mark as completed in database
      database.execSync(`
        UPDATE reminders SET 
          status = 'completed',
          completed_at = ?,
          updated_at = ?,
          snoozed_until = NULL,
          snooze_count = 0
        WHERE id = ?
      `, [now.toISOString(), now.toISOString(), id]);
      
      // Update state
      const existingReminders = get().reminders;
      const updatedReminders = existingReminders.map(r => 
        r.id === id ? { 
          ...r, 
          status: 'completed' as ReminderStatus,
          completedAt: now.toISOString(),
          updatedAt: now.toISOString(),
          snoozedUntil: undefined,
          snoozeCount: 0,
        } : r
      );
      
      set({
        reminders: updatedReminders,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در تکمیل یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  snoozeReminder: async (id, minutes) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingReminder = get().reminders.find(r => r.id === id);
      
      if (!existingReminder) {
        return { success: false, error: 'یادآوری یافت نشد' };
      }
      
      // Calculate new snooze time
      const snoozeUntil = new Date(now.getTime() + minutes * 60000);
      const snoozeCount = existingReminder.snoozeCount + 1;
      
      // Update in database
      database.execSync(`
        UPDATE reminders SET 
          snoozed_until = ?,
          snooze_count = ?,
          status = 'snoozed',
          updated_at = ?
        WHERE id = ?
      `, [snoozeUntil.toISOString(), snoozeCount, now.toISOString(), id]);
      
      // Update state
      const existingReminders = get().reminders;
      const updatedReminders = existingReminders.map(r => 
        r.id === id ? { 
          ...r, 
          snoozedUntil: snoozeUntil.toISOString(),
          snoozeCount,
          status: 'snoozed' as ReminderStatus,
          updatedAt: now.toISOString(),
        } : r
      );
      
      set({
        reminders: updatedReminders,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در تاخیر یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  disableReminder: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      // Disable in database
      database.execSync(`
        UPDATE reminders SET 
          is_active = 0,
          status = 'cancelled',
          updated_at = ?
        WHERE id = ?
      `, [now.toISOString(), id]);
      
      // Update state
      const existingReminders = get().reminders;
      const updatedReminders = existingReminders.map(r => 
        r.id === id ? { 
          ...r, 
          isActive: false,
          status: 'cancelled' as ReminderStatus,
          updatedAt: now.toISOString(),
        } : r
      );
      
      set({
        reminders: updatedReminders,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در غیرفعال کردن یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  enableReminder: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      // Enable in database
      database.execSync(`
        UPDATE reminders SET 
          is_active = 1,
          status = 'pending',
          updated_at = ?
        WHERE id = ?
      `, [now.toISOString(), id]);
      
      // Update state
      const existingReminders = get().reminders;
      const updatedReminders = existingReminders.map(r => 
        r.id === id ? { 
          ...r, 
          isActive: true,
          status: 'pending' as ReminderStatus,
          updatedAt: now.toISOString(),
        } : r
      );
      
      set({
        reminders: updatedReminders,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در فعال کردن یادآوری';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Getters
  getRemindersByVehicle: (vehicleId) => {
    return get().reminders
      .filter(r => r.vehicleId === vehicleId)
      .sort((a, b) => {
        const aDate = a.snoozedUntil ? new Date(a.snoozedUntil) : new Date(a.remindAt);
        const bDate = b.snoozedUntil ? new Date(b.snoozedUntil) : new Date(b.remindAt);
        return aDate.getTime() - bDate.getTime();
      });
  },
  
  getReminderById: (id) => {
    return get().reminders.find(r => r.id === id) ?? null;
  },
  
  getActiveReminders: (vehicleId) => {
    return get().reminders
      .filter(r => r.vehicleId === vehicleId && r.isActive && r.status === 'pending')
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
  },
  
  getCompletedReminders: (vehicleId) => {
    return get().reminders
      .filter(r => r.vehicleId === vehicleId && r.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime());
  },
  
  getUpcomingReminders: (vehicleId) => {
    const now = new Date();
    return get().reminders
      .filter(r => {
        if (!r.isActive) return false;
        if (r.status !== 'pending') return false;
        if (r.vehicleId !== vehicleId) return false;
        
        const remindAt = new Date(r.remindAt);
        const snoozedUntil = r.snoozedUntil ? new Date(r.snoozedUntil) : null;
        const targetDate = snoozedUntil || remindAt;
        
        return targetDate > now;
      })
      .sort((a, b) => {
        const aDate = a.snoozedUntil ? new Date(a.snoozedUntil) : new Date(a.remindAt);
        const bDate = b.snoozedUntil ? new Date(b.snoozedUntil) : new Date(b.remindAt);
        return aDate.getTime() - bDate.getTime();
      });
  },
  
  getOverdueReminders: (vehicleId) => {
    const now = new Date();
    return get().reminders
      .filter(r => {
        if (!r.isActive) return false;
        if (r.status !== 'pending') return false;
        if (r.vehicleId !== vehicleId) return false;
        
        const remindAt = new Date(r.remindAt);
        const snoozedUntil = r.snoozedUntil ? new Date(r.snoozedUntil) : null;
        const targetDate = snoozedUntil || remindAt;
        
        return targetDate <= now;
      })
      .sort((a, b) => {
        const aDate = a.snoozedUntil ? new Date(a.snoozedUntil) : new Date(a.remindAt);
        const bDate = b.snoozedUntil ? new Date(b.snoozedUntil) : new Date(b.remindAt);
        return aDate.getTime() - bDate.getTime();
      });
  },
  
  getRemindersByType: (vehicleId, type) => {
    return get().reminders
      .filter(r => r.vehicleId === vehicleId && r.type === type)
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
  },
  
  // Initialize from database
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const rows = database.getAllSync(`
        SELECT * FROM reminders 
        ORDER BY remind_at ASC
      `);
      
      const reminders: Reminder[] = rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        vehicleId: row.vehicle_id as string,
        title: row.title as string,
        description: row.description as string | undefined,
        type: row.type as ReminderType,
        serviceId: row.service_id as string | undefined,
        partId: row.part_id as string | undefined,
        repairId: row.repair_id as string | undefined,
        expenseId: row.expense_id as string | undefined,
        remindAt: row.remind_at as string,
        jalaliDate: row.jalali_date as string,
        frequency: row.frequency as string,
        repeatInterval: row.repeat_interval as number,
        repeatEndDate: row.repeat_end_date as string | undefined,
        isActive: Boolean(row.is_active as number),
        status: row.status as ReminderStatus,
        notificationId: row.notification_id as string | undefined,
        notifyBeforeDays: row.notify_before_days as number,
        notifyBeforeKilometers: row.notify_before_kilometers as number,
        priority: row.priority as ReminderPriority,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        completedAt: row.completed_at as string | undefined,
        snoozedUntil: row.snoozed_until as string | undefined,
        snoozeCount: row.snooze_count as number,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      }));
      
      set({
        reminders,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری یادآوری‌ها';
      set({ isLoading: false, error: errorMessage });
    }
  },
  
  reset: () => {
    set({
      reminders: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Selectors for better performance
export const useAllReminders = () => useReminderStore(state => state.reminders);
export const useRemindersByVehicle = (vehicleId: string) =>
  useReminderStore(state => state.getRemindersByVehicle(vehicleId));
export const useActiveReminders = (vehicleId: string) =>
  useReminderStore(state => state.getActiveReminders(vehicleId));
export const useUpcomingReminders = (vehicleId: string) =>
  useReminderStore(state => state.getUpcomingReminders(vehicleId));
export const useOverdueReminders = (vehicleId: string) =>
  useReminderStore(state => state.getOverdueReminders(vehicleId));

export default useReminderStore;

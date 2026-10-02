/**
 * Odometer Store - Zustand
 * 
 * Manages odometer readings and history.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../lib/jalaliDate';
import { OdometerEntry, CreateOdometerInput } from '../types/odometer';

interface OdometerState {
  // State
  entries: OdometerEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setEntries: (entries: OdometerEntry[]) => void;
  addEntry: (input: CreateOdometerInput) => Promise<{ success: boolean; entry?: OdometerEntry; error?: string }>;
  updateEntry: (id: string, input: Partial<CreateOdometerInput>) => Promise<{ success: boolean; entry?: OdometerEntry; error?: string }>;
  deleteEntry: (id: string) => Promise<{ success: boolean; error?: string }>;
  confirmLowerReading: (id: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getEntriesByVehicle: (vehicleId: string) => OdometerEntry[];
  getLatestOdometer: (vehicleId: string) => OdometerEntry | null;
  getLatestOdometerValue: (vehicleId: string) => number | null;
  getOdometerHistory: (vehicleId: string) => OdometerEntry[];
  hasEntries: (vehicleId: string) => boolean;
  getOdometerAtDate: (vehicleId: string, date: string) => number | null;
  
  // Validation
  validateOdometerEntry: (vehicleId: string, odometer: number) => { valid: boolean; warning?: string; reason?: string };
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useOdometerStore = create<OdometerState>()((set, get) => ({
  // Initial state
  entries: [],
  isLoading: false,
  error: null,
  
  // Actions
  setEntries: (entries) => {
    set({ entries, error: null });
  },
  
  addEntry: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const entryId = uuidv4();
      
      // Validate and check for lower readings
      const latestEntry = get().getLatestOdometer(input.vehicleId);
      const isLower = latestEntry && input.odometer < latestEntry.odometer;
      
      // Create odometer entry
      const entry: OdometerEntry = {
        id: entryId,
        vehicleId: input.vehicleId,
        odometer: input.odometer,
        jalaliDate: input.jalaliDate || getCurrentJalaliDate(),
        gregorianDate: input.gregorianDate || getCurrentGregorianISO(),
        recordedAt: now.toISOString(),
        note: input.note,
        isConfirmed: !isLower,
        confirmedAt: !isLower ? now.toISOString() : undefined,
        confirmedBy: !isLower ? 'system' : undefined,
        isLowerThanPrevious: isLower,
        lowerReadingReason: isLower ? input.reason : undefined,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO odometer_entries (
          id, vehicle_id, odometer, jalali_date, gregorian_date, 
          recorded_at, note, is_confirmed, confirmed_at, confirmed_by,
          is_lower_than_previous, lower_reading_reason, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        entry.id,
        entry.vehicleId,
        entry.odometer,
        entry.jalaliDate,
        entry.gregorianDate,
        entry.recordedAt,
        entry.note,
        entry.isConfirmed ? 1 : 0,
        entry.confirmedAt,
        entry.confirmedBy,
        entry.isLowerThanPrevious ? 1 : 0,
        entry.lowerReadingReason,
        entry.createdAt,
        entry.updatedAt,
      ]);
      
      // Update state
      const existingEntries = get().entries;
      const newEntries = [...existingEntries, entry];
      
      set({
        entries: newEntries,
        isLoading: false,
      });
      
      return { success: true, entry };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت کارکرد';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updateEntry: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingEntry = get().entries.find(e => e.id === id);
      
      if (!existingEntry) {
        return { success: false, error: 'کارکرد یافت نشد' };
      }
      
      const previousOdometer = existingEntry.odometer;
      const newOdometer = input.odometer ?? previousOdometer;
      const isLower = newOdometer < previousOdometer;
      
      const entry: OdometerEntry = {
        ...existingEntry,
        odometer: newOdometer,
        jalaliDate: input.jalaliDate ?? existingEntry.jalaliDate,
        gregorianDate: input.gregorianDate ?? existingEntry.gregorianDate,
        note: input.note ?? existingEntry.note,
        isConfirmed: existingEntry.isConfirmed && !isLower,
        confirmedAt: existingEntry.confirmedAt,
        confirmedBy: existingEntry.confirmedBy,
        isLowerThanPrevious: isLower,
        lowerReadingReason: isLower ? input.reason : existingEntry.lowerReadingReason,
        updatedAt: now.toISOString(),
      };
      
      // Update in database
      database.execSync(`
        UPDATE odometer_entries SET
          odometer = ?,
          jalali_date = ?,
          gregorian_date = ?,
          note = ?,
          is_confirmed = ?,
          is_lower_than_previous = ?,
          lower_reading_reason = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        entry.odometer,
        entry.jalaliDate,
        entry.gregorianDate,
        entry.note,
        entry.isConfirmed ? 1 : 0,
        entry.isLowerThanPrevious ? 1 : 0,
        entry.lowerReadingReason,
        entry.updatedAt,
        entry.id,
      ]);
      
      const existingEntries = get().entries;
      const updatedEntries = existingEntries.map(e => e.id === id ? entry : e);
      
      set({
        entries: updatedEntries,
        isLoading: false,
      });
      
      return { success: true, entry };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی کارکرد';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      database.execSync('DELETE FROM odometer_entries WHERE id = ?', [id]);
      
      const existingEntries = get().entries;
      const filteredEntries = existingEntries.filter(e => e.id !== id);
      
      set({
        entries: filteredEntries,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف کارکرد';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  confirmLowerReading: async (id, reason) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      database.execSync(`
        UPDATE odometer_entries SET
          is_confirmed = 1,
          confirmed_at = ?,
          confirmed_by = 'user',
          is_lower_than_previous = 1,
          lower_reading_reason = ?,
          updated_at = ?
        WHERE id = ?
      `, [now.toISOString(), reason, now.toISOString(), id]);
      
      const existingEntries = get().entries;
      const updatedEntries = existingEntries.map(e => 
        e.id === id ? {
          ...e,
          isConfirmed: true,
          confirmedAt: now.toISOString(),
          confirmedBy: 'user',
          isLowerThanPrevious: true,
          lowerReadingReason: reason,
          updatedAt: now.toISOString(),
        } : e
      );
      
      set({
        entries: updatedEntries,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در تایید کارکرد پایین‌تر';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Getters
  getEntriesByVehicle: (vehicleId) => {
    return get().entries
      .filter(e => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  },
  
  getLatestOdometer: (vehicleId) => {
    const vehicleEntries = get().entries
      .filter(e => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
    return vehicleEntries[0] || null;
  },
  
  getLatestOdometerValue: (vehicleId) => {
    const latest = get().getLatestOdometer(vehicleId);
    return latest?.odometer ?? null;
  },
  
  getOdometerHistory: (vehicleId) => {
    return get().entries
      .filter(e => e.vehicleId === vehicleId)
      .sort((a, b) => new Date(a.gregorianDate).getTime() - new Date(b.gregorianDate).getTime());
  },
  
  hasEntries: (vehicleId) => {
    return get().entries.some(e => e.vehicleId === vehicleId);
  },
  
  getOdometerAtDate: (vehicleId, date) => {
    const entries = get().entries
      .filter(e => e.vehicleId === vehicleId)
      .filter(e => new Date(e.gregorianDate).getTime() <= new Date(date).getTime())
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
    
    return entries[0]?.odometer ?? null;
  },
  
  validateOdometerEntry: (vehicleId, odometer) => {
    const latestEntry = get().getLatestOdometer(vehicleId);
    
    if (!latestEntry) {
      return { valid: true };
    }
    
    if (odometer >= latestEntry.odometer) {
      return { valid: true };
    }
    
    const difference = latestEntry.odometer - odometer;
    return {
      valid: false,
      warning: 'کارکرد وارد شده از آخرین کارکرد ثبت شده کمتر است',
      reason: ` تفاوت ${difference.toLocaleString('fa-IR')} کیلومتر `,
    };
  },
  
  // Initialize from database
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const rows = database.getAllSync(`
        SELECT * FROM odometer_entries 
        ORDER BY gregorian_date DESC
      `);
      
      const entries: OdometerEntry[] = rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        vehicleId: row.vehicle_id as string,
        odometer: row.odometer as number,
        jalaliDate: row.jalali_date as string,
        gregorianDate: row.gregorian_date as string,
        recordedAt: row.recorded_at as string,
        note: row.note as string | undefined,
        isConfirmed: Boolean(row.is_confirmed as number),
        confirmedAt: row.confirmed_at as string | undefined,
        confirmedBy: row.confirmed_by as string | undefined,
        isLowerThanPrevious: Boolean(row.is_lower_than_previous as number),
        lowerReadingReason: row.lower_reading_reason as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      }));
      
      set({
        entries,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری کارکردها';
      set({ isLoading: false, error: errorMessage });
    }
  },
  
  reset: () => {
    set({
      entries: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Selectors for better performance
export const useOdometerEntries = () => useOdometerStore(state => state.entries);
export const useLatestOdometer = (vehicleId: string) =>
  useOdometerStore(state => state.getLatestOdometer(vehicleId));
export const useLatestOdometerValue = (vehicleId: string) =>
  useOdometerStore(state => state.getLatestOdometerValue(vehicleId));
export const useOdometerHistory = (vehicleId: string) =>
  useOdometerStore(state => state.getOdometerHistory(vehicleId));
export const useOdometerByVehicle = (vehicleId: string) =>
  useOdometerStore(state => state.getEntriesByVehicle(vehicleId));

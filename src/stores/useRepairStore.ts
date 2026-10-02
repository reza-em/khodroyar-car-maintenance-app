/**
 * Repair Store - Zustand
 * 
 * Manages repair records.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../lib/jalaliDate';
import { Repair, RepairStatus, CreateRepairInput, RepairFilter } from '../types/repair';

interface RepairState {
  // State
  repairs: Repair[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setRepairs: (repairs: Repair[]) => void;
  addRepair: (input: CreateRepairInput) => Promise<{ success: boolean; repair?: Repair; error?: string }>;
  updateRepair: (id: string, input: Partial<CreateRepairInput>) => Promise<{ success: boolean; repair?: Repair; error?: string }>;
  deleteRepair: (id: string) => Promise<{ success: boolean; error?: string }>;
  archiveRepair: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getRepairsByVehicle: (vehicleId: string) => Repair[];
  getRepairById: (id: string) => Repair | null;
  getCompletedRepairs: (vehicleId: string) => Repair[];
  getPendingRepairs: (vehicleId: string) => Repair[];
  getRepairsByStatus: (vehicleId: string, status: RepairStatus) => Repair[];
  filterRepairs: (filter: RepairFilter) => Repair[];
  getRepairSummary: (vehicleId: string) => { total: number; completed: number; pending: number; needsRevisit: number; totalCost: number };
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useRepairStore = create<RepairState>()((set, get) => ({
  // Initial state
  repairs: [],
  isLoading: false,
  error: null,
  
  // Actions
  setRepairs: (repairs) => {
    set({ repairs, error: null });
  },
  
  addRepair: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const repairId = uuidv4();
      
      const repair: Repair = {
        id: repairId,
        vehicleId: input.vehicleId,
        title: input.title,
        description: input.description,
        symptoms: input.symptoms,
        repairDate: input.jalaliDate || getCurrentJalaliDate(),
        repairDateISO: input.gregorianDate || getCurrentGregorianISO(),
        odometer: input.odometer,
        workshopId: input.workshopId,
        workshopName: input.workshopName,
        workshopContact: input.workshopContact,
        workshopAddress: input.workshopAddress,
        laborCost: input.laborCost,
        partsCost: input.partsCost,
        diagnosticCost: input.diagnosticCost,
        totalCost: input.totalCost || (input.laborCost || 0) + (input.partsCost || 0) + (input.diagnosticCost || 0),
        currency: input.currency || 'IRT',
        partsUsed: input.partsUsed,
        rootCause: input.rootCause,
        repairDescription: input.repairDescription,
        warrantyDurationDays: input.warrantyDurationDays,
        warrantyExpiration: input.warrantyExpiration,
        warrantyExpirationISO: input.warrantyExpiration ? getCurrentGregorianISO() : undefined,
        warrantyNotes: input.warrantyNotes,
        followUpRequired: input.followUpRequired || false,
        followUpDate: input.followUpDate,
        followUpDateISO: input.followUpDateISO,
        followUpNotes: input.followUpNotes,
        attachmentUrls: input.attachmentUrls,
        invoiceImageUrl: input.invoiceImage?.uri,
        status: input.status || 'pending_review',
        completionNotes: input.completionNotes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: input.status === 'completed' ? now.toISOString() : undefined,
        metadata: input.metadata,
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO repairs (
          id, vehicle_id, title, description, symptoms, repair_date, repair_date_iso, odometer,
          workshop_id, workshop_name, workshop_contact, workshop_address, labor_cost, parts_cost,
          diagnostic_cost, total_cost, currency, parts_used, root_cause, repair_description,
          warranty_duration_days, warranty_expiration, warranty_expiration_iso, warranty_notes,
          follow_up_required, follow_up_date, follow_up_date_iso, follow_up_notes,
          attachment_urls, invoice_image_url, status, completion_notes, created_at, updated_at, completed_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        repair.id,
        repair.vehicleId,
        repair.title,
        repair.description,
        JSON.stringify(repair.symptoms),
        repair.repairDate,
        repair.repairDateISO,
        repair.odometer,
        repair.workshopId,
        repair.workshopName,
        repair.workshopContact,
        repair.workshopAddress,
        repair.laborCost,
        repair.partsCost,
        repair.diagnosticCost,
        repair.totalCost,
        repair.currency,
        JSON.stringify(repair.partsUsed),
        repair.rootCause,
        repair.repairDescription,
        repair.warrantyDurationDays,
        repair.warrantyExpiration,
        repair.warrantyExpirationISO,
        repair.warrantyNotes,
        repair.followUpRequired ? 1 : 0,
        repair.followUpDate,
        repair.followUpDateISO,
        repair.followUpNotes,
        JSON.stringify(repair.attachmentUrls),
        repair.invoiceImageUrl,
        repair.status,
        repair.completionNotes,
        repair.createdAt,
        repair.updatedAt,
        repair.completedAt,
        JSON.stringify(repair.metadata),
      ]);
      
      // Update state
      const existingRepairs = get().repairs;
      const newRepairs = [...existingRepairs, repair];
      
      set({
        repairs: newRepairs,
        isLoading: false,
      });
      
      return { success: true, repair };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت تعمیر';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updateRepair: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingRepair = get().repairs.find(r => r.id === id);
      
      if (!existingRepair) {
        return { success: false, error: 'تعمیر یافت نشد' };
      }
      
      const repair: Repair = {
        ...existingRepair,
        title: input.title ?? existingRepair.title,
        description: input.description ?? existingRepair.description,
        symptoms: input.symptoms ?? existingRepair.symptoms,
        repairDate: input.jalaliDate ?? existingRepair.repairDate,
        repairDateISO: input.gregorianDate ?? existingRepair.repairDateISO,
        odometer: input.odometer ?? existingRepair.odometer,
        workshopId: input.workshopId ?? existingRepair.workshopId,
        workshopName: input.workshopName ?? existingRepair.workshopName,
        workshopContact: input.workshopContact ?? existingRepair.workshopContact,
        workshopAddress: input.workshopAddress ?? existingRepair.workshopAddress,
        laborCost: input.laborCost ?? existingRepair.laborCost,
        partsCost: input.partsCost ?? existingRepair.partsCost,
        diagnosticCost: input.diagnosticCost ?? existingRepair.diagnosticCost,
        totalCost: input.totalCost ?? (input.laborCost ?? existingRepair.laborCost) + (input.partsCost ?? existingRepair.partsCost) + (input.diagnosticCost ?? existingRepair.diagnosticCost),
        currency: input.currency ?? existingRepair.currency,
        partsUsed: input.partsUsed ?? existingRepair.partsUsed,
        rootCause: input.rootCause ?? existingRepair.rootCause,
        repairDescription: input.repairDescription ?? existingRepair.repairDescription,
        warrantyDurationDays: input.warrantyDurationDays ?? existingRepair.warrantyDurationDays,
        warrantyExpiration: input.warrantyExpiration ?? existingRepair.warrantyExpiration,
        warrantyExpirationISO: input.warrantyExpirationISO ?? existingRepair.warrantyExpirationISO,
        warrantyNotes: input.warrantyNotes ?? existingRepair.warrantyNotes,
        followUpRequired: input.followUpRequired ?? existingRepair.followUpRequired,
        followUpDate: input.followUpDate ?? existingRepair.followUpDate,
        followUpDateISO: input.followUpDateISO ?? existingRepair.followUpDateISO,
        followUpNotes: input.followUpNotes ?? existingRepair.followUpNotes,
        attachmentUrls: input.attachmentUrls ?? existingRepair.attachmentUrls,
        invoiceImageUrl: input.invoiceImage?.uri ?? existingRepair.invoiceImageUrl,
        status: input.status ?? existingRepair.status,
        completionNotes: input.completionNotes ?? existingRepair.completionNotes,
        updatedAt: now.toISOString(),
        completedAt: input.status === 'completed' ? now.toISOString() : existingRepair.completedAt,
      };
      
      // Update in database
      database.execSync(`
        UPDATE repairs SET
          title = ?,
          description = ?,
          symptoms = ?,
          repair_date = ?,
          repair_date_iso = ?,
          odometer = ?,
          workshop_id = ?,
          workshop_name = ?,
          workshop_contact = ?,
          workshop_address = ?,
          labor_cost = ?,
          parts_cost = ?,
          diagnostic_cost = ?,
          total_cost = ?,
          currency = ?,
          parts_used = ?,
          root_cause = ?,
          repair_description = ?,
          warranty_duration_days = ?,
          warranty_expiration = ?,
          warranty_expiration_iso = ?,
          warranty_notes = ?,
          follow_up_required = ?,
          follow_up_date = ?,
          follow_up_date_iso = ?,
          follow_up_notes = ?,
          attachment_urls = ?,
          invoice_image_url = ?,
          status = ?,
          completion_notes = ?,
          updated_at = ?,
          completed_at = ?
        WHERE id = ?
      `, [
        repair.title,
        repair.description,
        JSON.stringify(repair.symptoms),
        repair.repairDate,
        repair.repairDateISO,
        repair.odometer,
        repair.workshopId,
        repair.workshopName,
        repair.workshopContact,
        repair.workshopAddress,
        repair.laborCost,
        repair.partsCost,
        repair.diagnosticCost,
        repair.totalCost,
        repair.currency,
        JSON.stringify(repair.partsUsed),
        repair.rootCause,
        repair.repairDescription,
        repair.warrantyDurationDays,
        repair.warrantyExpiration,
        repair.warrantyExpirationISO,
        repair.warrantyNotes,
        repair.followUpRequired ? 1 : 0,
        repair.followUpDate,
        repair.followUpDateISO,
        repair.followUpNotes,
        JSON.stringify(repair.attachmentUrls),
        repair.invoiceImageUrl,
        repair.status,
        repair.completionNotes,
        repair.updatedAt,
        repair.completedAt,
        repair.id,
      ]);
      
      // Update state
      const existingRepairs = get().repairs;
      const updatedRepairs = existingRepairs.map(r => r.id === id ? repair : r);
      
      set({
        repairs: updatedRepairs,
        isLoading: false,
      });
      
      return { success: true, repair };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی تعمیر';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deleteRepair: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Delete from database
      database.execSync('DELETE FROM repairs WHERE id = ?', [id]);
      
      // Update state
      const existingRepairs = get().repairs;
      const filteredRepairs = existingRepairs.filter(r => r.id !== id);
      
      set({
        repairs: filteredRepairs,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف تعمیر';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  archiveRepair: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      // Archive in database
      database.execSync(`
        UPDATE repairs SET 
          status = 'cancelled',
          updated_at = ?
        WHERE id = ?
      `, [now.toISOString(), id]);
      
      // Update state
      const existingRepairs = get().repairs;
      const updatedRepairs = existingRepairs.map(r => 
        r.id === id ? { ...r, status: 'cancelled' as RepairStatus, updatedAt: now.toISOString() } : r
      );
      
      set({
        repairs: updatedRepairs,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در لغو تعمیر';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Getters
  getRepairsByVehicle: (vehicleId) => {
    return get().repairs
      .filter(r => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.repairDateISO).getTime() - new Date(a.repairDateISO).getTime());
  },
  
  getRepairById: (id) => {
    return get().repairs.find(r => r.id === id) ?? null;
  },
  
  getCompletedRepairs: (vehicleId) => {
    return get().repairs
      .filter(r => r.vehicleId === vehicleId && r.status === 'completed')
      .sort((a, b) => new Date(b.repairDateISO).getTime() - new Date(a.repairDateISO).getTime());
  },
  
  getPendingRepairs: (vehicleId) => {
    return get().repairs
      .filter(r => r.vehicleId === vehicleId && ['pending_review', 'in_progress'].includes(r.status))
      .sort((a, b) => new Date(b.repairDateISO).getTime() - new Date(a.repairDateISO).getTime());
  },
  
  getRepairsByStatus: (vehicleId, status) => {
    return get().repairs
      .filter(r => r.vehicleId === vehicleId && r.status === status)
      .sort((a, b) => new Date(b.repairDateISO).getTime() - new Date(a.repairDateISO).getTime());
  },
  
  filterRepairs: (filter) => {
    let repairs = get().repairs;
    
    if (filter.vehicleId) {
      repairs = repairs.filter(r => r.vehicleId === filter.vehicleId);
    }
    
    if (filter.status) {
      repairs = repairs.filter(r => r.status === filter.status);
    }
    
    if (filter.workshopId) {
      repairs = repairs.filter(r => r.workshopId === filter.workshopId);
    }
    
    if (filter.startDate) {
      repairs = repairs.filter(r => r.repairDate >= filter.startDate);
    }
    
    if (filter.endDate) {
      repairs = repairs.filter(r => r.repairDate <= filter.endDate);
    }
    
    if (filter.minOdometer !== undefined) {
      repairs = repairs.filter(r => r.odometer >= filter.minOdometer);
    }
    
    if (filter.maxOdometer !== undefined) {
      repairs = repairs.filter(r => r.odometer <= filter.maxOdometer);
    }
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      repairs = repairs.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.workshopName?.toLowerCase().includes(term) ||
        r.rootCause?.toLowerCase().includes(term)
      );
    }
    
    return repairs.sort((a, b) => new Date(b.repairDateISO).getTime() - new Date(a.repairDateISO).getTime());
  },
  
  getRepairSummary: (vehicleId) => {
    const repairs = get().repairs.filter(r => r.vehicleId === vehicleId);
    const completed = repairs.filter(r => r.status === 'completed');
    const pending = repairs.filter(r => ['pending_review', 'in_progress'].includes(r.status));
    const needsRevisit = repairs.filter(r => r.status === 'needs_revisit');
    const totalCost = repairs.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    
    return {
      total: repairs.length,
      completed: completed.length,
      pending: pending.length,
      needsRevisit: needsRevisit.length,
      totalCost,
    };
  },
  
  // Initialize from database
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const rows = database.getAllSync(`
        SELECT * FROM repairs 
        ORDER BY repair_date_iso DESC
      `);
      
      const repairs: Repair[] = rows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        vehicleId: row.vehicle_id as string,
        title: row.title as string,
        description: row.description as string | undefined,
        symptoms: row.symptoms ? JSON.parse(row.symptoms as string) : undefined,
        repairDate: row.repair_date as string,
        repairDateISO: row.repair_date_iso as string,
        odometer: row.odometer as number,
        workshopId: row.workshop_id as string | undefined,
        workshopName: row.workshop_name as string | undefined,
        workshopContact: row.workshop_contact as string | undefined,
        workshopAddress: row.workshop_address as string | undefined,
        laborCost: row.labor_cost as number | undefined,
        partsCost: row.parts_cost as number | undefined,
        diagnosticCost: row.diagnostic_cost as number | undefined,
        totalCost: row.total_cost as number | undefined,
        currency: row.currency as string,
        partsUsed: row.parts_used ? JSON.parse(row.parts_used as string) : undefined,
        rootCause: row.root_cause as string | undefined,
        repairDescription: row.repair_description as string | undefined,
        warrantyDurationDays: row.warranty_duration_days as number | undefined,
        warrantyExpiration: row.warranty_expiration as string | undefined,
        warrantyExpirationISO: row.warranty_expiration_iso as string | undefined,
        warrantyNotes: row.warranty_notes as string | undefined,
        followUpRequired: Boolean(row.follow_up_required as number),
        followUpDate: row.follow_up_date as string | undefined,
        followUpDateISO: row.follow_up_date_iso as string | undefined,
        followUpNotes: row.follow_up_notes as string | undefined,
        attachmentUrls: row.attachment_urls ? JSON.parse(row.attachment_urls as string) : undefined,
        invoiceImageUrl: row.invoice_image_url as string | undefined,
        status: row.status as RepairStatus,
        completionNotes: row.completion_notes as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        completedAt: row.completed_at as string | undefined,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      }));
      
      set({
        repairs,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری تعمیرات';
      set({ isLoading: false, error: errorMessage });
    }
  },
  
  reset: () => {
    set({
      repairs: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Selectors for better performance
export const useAllRepairs = () => useRepairStore(state => state.repairs);
export const useRepairsByVehicle = (vehicleId: string) =>
  useRepairStore(state => state.getRepairsByVehicle(vehicleId));
export const useRepairSummary = (vehicleId: string) =>
  useRepairStore(state => state.getRepairSummary(vehicleId));
export const useCompletedRepairs = (vehicleId: string) =>
  useRepairStore(state => state.getCompletedRepairs(vehicleId));
export const usePendingRepairs = (vehicleId: string) =>
  useRepairStore(state => state.getPendingRepairs(vehicleId));

export default useRepairStore;

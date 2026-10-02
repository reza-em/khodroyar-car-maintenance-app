/**
 * Service Store - Zustand
 * 
 * Manages maintenance records, service types, and service-related operations.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../lib/jalaliDate';
import { 
  MaintenanceRecord, 
  ServiceCategory, 
  CreateMaintenanceInput,
  ServiceStatus,
  ServiceFilter
} from '../types/service';
import { MaintenancePart } from '../types/service';

interface ServiceState {
  // State
  records: MaintenanceRecord[];
  serviceTypes: { id: string; category: ServiceCategory; name: string; nameEn: string; defaultInterval: string }[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setRecords: (records: MaintenanceRecord[]) => void;
  addRecord: (input: CreateMaintenanceInput) => Promise<{ success: boolean; record?: MaintenanceRecord; error?: string }>;
  updateRecord: (id: string, input: Partial<CreateMaintenanceInput>) => Promise<{ success: boolean; record?: MaintenanceRecord; error?: string }>;
  deleteRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  archiveRecord: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getRecordsByVehicle: (vehicleId: string) => MaintenanceRecord[];
  getRecordById: (id: string) => MaintenanceRecord | null;
  getCompletedServices: (vehicleId: string) => MaintenanceRecord[];
  getUpcomingServices: (vehicleId: string) => MaintenanceRecord[];
  getOverdueServices: (vehicleId: string) => MaintenanceRecord[];
  getServicesByCategory: (vehicleId: string, category: ServiceCategory) => MaintenanceRecord[];
  filterRecords: (filter: ServiceFilter) => MaintenanceRecord[];
  getServiceSummary: (vehicleId: string) => { total: number; completed: number; overdue: number; upcoming: number; totalCost: number };
  getLatestServiceDate: (vehicleId: string) => string | null;
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useServiceStore = create<ServiceState>()((set, get) => ({
  // Initial state
  records: [],
  serviceTypes: [],
  isLoading: false,
  error: null,
  
  // Actions
  setRecords: (records) => {
    set({ records, error: null });
  },
  
  addRecord: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const recordId = uuidv4();
      
      const record: MaintenanceRecord = {
        id: recordId,
        vehicleId: input.vehicleId,
        serviceTypeId: input.serviceTypeId,
        category: input.category,
        serviceTypeName: input.serviceTypeId 
          ? get().serviceTypes.find(st => st.id === input.serviceTypeId)?.name || input.category
          : input.customName || input.category,
        customName: input.customName,
        jalaliDate: input.jalaliDate || getCurrentJalaliDate(),
        gregorianDate: input.gregorianDate || getCurrentGregorianISO(),
        odometer: input.odometer,
        laborCost: input.laborCost,
        partsCost: input.partsCost,
        totalCost: input.laborCost && input.partsCost 
          ? input.laborCost + input.partsCost 
          : input.totalCost,
        currency: input.currency || 'IRT',
        workshopName: input.workshopName,
        workshopContact: input.workshopContact,
        workshopAddress: input.workshopAddress,
        partsUsed: input.partsUsed?.map(p => ({
          id: uuidv4(),
          ...p,
        })),
        description: input.description,
        notes: input.notes,
        nextServiceInterval: input.nextServiceInterval,
        nextServiceOdometer: input.nextServiceOdometer,
        nextServiceDate: input.nextServiceDate,
        nextServiceDateISO: input.nextServiceDate ? getCurrentGregorianISO() : undefined,
        warrantyDurationDays: input.warrantyDurationDays,
        warrantyExpirationDate: input.warrantyExpirationDate,
        warrantyExpirationDateISO: input.warrantyExpirationDate ? getCurrentGregorianISO() : undefined,
        invoiceImageUrl: input.invoiceImage?.uri,
        attachmentUrls: input.attachmentUrls,
        status: input.status || 'completed',
        completionNotes: input.completionNotes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: now.toISOString(),
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO maintenance_records (
          id, vehicle_id, service_type_id, category, service_type_name, custom_name,
          jalali_date, gregorian_date, odometer, labor_cost, parts_cost, total_cost, currency,
          workshop_name, workshop_contact, workshop_address, description, notes,
          next_service_interval, next_service_odometer, next_service_date, next_service_date_iso,
          warranty_duration_days, warranty_expiration_date, warranty_expiration_date_iso,
          invoice_image_url, attachment_urls, status, completion_notes, created_at, updated_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.id,
        record.vehicleId,
        record.serviceTypeId,
        record.category,
        record.serviceTypeName,
        record.customName,
        record.jalaliDate,
        record.gregorianDate,
        record.odometer,
        record.laborCost,
        record.partsCost,
        record.totalCost,
        record.currency,
        record.workshopName,
        record.workshopContact,
        record.workshopAddress,
        record.description,
        record.notes,
        JSON.stringify(record.nextServiceInterval),
        record.nextServiceOdometer,
        record.nextServiceDate,
        record.nextServiceDateISO,
        record.warrantyDurationDays,
        record.warrantyExpirationDate,
        record.warrantyExpirationDateISO,
        record.invoiceImageUrl,
        JSON.stringify(record.attachmentUrls),
        record.status,
        record.completionNotes,
        record.createdAt,
        record.updatedAt,
        record.completedAt,
      ]);
      
      // Insert parts used
      if (record.partsUsed && record.partsUsed.length > 0) {
        const partsSql = record.partsUsed.map(part => (
          `INSERT INTO maintenance_parts (
            id, maintenance_record_id, name, brand, part_number, quantity, 
            unit_price, total_price, warranty_days, warranty_expiration, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )).join('; ');
        
        const partsValues: unknown[] = [];
        record.partsUsed.forEach(part => {
          partsValues.push(
            part.id,
            record.id,
            part.name,
            part.brand,
            part.partNumber,
            part.quantity,
            part.unitPrice,
            part.totalPrice,
            part.warrantyDays,
            part.warrantyExpiration,
            part.notes
          );
        });
        
        database.execSync(partsSql, partsValues);
      }
      
      // Update state
      const existingRecords = get().records;
      const newRecords = [...existingRecords, record];
      
      set({
        records: newRecords,
        isLoading: false,
      });
      
      return { success: true, record };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت سرویس';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updateRecord: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingRecord = get().records.find(r => r.id === id);
      
      if (!existingRecord) {
        return { success: false, error: 'سرویس یافت نشد' };
      }
      
      const record: MaintenanceRecord = {
        ...existingRecord,
        serviceTypeId: input.serviceTypeId ?? existingRecord.serviceTypeId,
        category: input.category ?? existingRecord.category,
        serviceTypeName: input.serviceTypeId 
          ? get().serviceTypes.find(st => st.id === input.serviceTypeId)?.name || existingRecord.serviceTypeName
          : input.customName || existingRecord.serviceTypeName,
        customName: input.customName ?? existingRecord.customName,
        jalaliDate: input.jalaliDate ?? existingRecord.jalaliDate,
        gregorianDate: input.gregorianDate ?? existingRecord.gregorianDate,
        odometer: input.odometer ?? existingRecord.odometer,
        laborCost: input.laborCost ?? existingRecord.laborCost,
        partsCost: input.partsCost ?? existingRecord.partsCost,
        totalCost: (input.laborCost ?? existingRecord.laborCost) + (input.partsCost ?? existingRecord.partsCost),
        currency: input.currency ?? existingRecord.currency,
        workshopName: input.workshopName ?? existingRecord.workshopName,
        workshopContact: input.workshopContact ?? existingRecord.workshopContact,
        workshopAddress: input.workshopAddress ?? existingRecord.workshopAddress,
        partsUsed: input.partsUsed ?? existingRecord.partsUsed,
        description: input.description ?? existingRecord.description,
        notes: input.notes ?? existingRecord.notes,
        nextServiceInterval: input.nextServiceInterval ?? existingRecord.nextServiceInterval,
        nextServiceOdometer: input.nextServiceOdometer ?? existingRecord.nextServiceOdometer,
        nextServiceDate: input.nextServiceDate ?? existingRecord.nextServiceDate,
        warrantyDurationDays: input.warrantyDurationDays ?? existingRecord.warrantyDurationDays,
        warrantyExpirationDate: input.warrantyExpirationDate ?? existingRecord.warrantyExpirationDate,
        invoiceImageUrl: input.invoiceImage?.uri ?? existingRecord.invoiceImageUrl,
        attachmentUrls: input.attachmentUrls ?? existingRecord.attachmentUrls,
        status: input.status ?? existingRecord.status,
        completionNotes: input.completionNotes ?? existingRecord.completionNotes,
        updatedAt: now.toISOString(),
      };
      
      // Update in database
      database.execSync(`
        UPDATE maintenance_records SET
          service_type_id = ?,
          category = ?,
          service_type_name = ?,
          custom_name = ?,
          jalali_date = ?,
          gregorian_date = ?,
          odometer = ?,
          labor_cost = ?,
          parts_cost = ?,
          total_cost = ?,
          currency = ?,
          workshop_name = ?,
          workshop_contact = ?,
          workshop_address = ?,
          description = ?,
          notes = ?,
          next_service_interval = ?,
          next_service_odometer = ?,
          next_service_date = ?,
          warranty_duration_days = ?,
          warranty_expiration_date = ?,
          invoice_image_url = ?,
          attachment_urls = ?,
          status = ?,
          completion_notes = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        record.serviceTypeId,
        record.category,
        record.serviceTypeName,
        record.customName,
        record.jalaliDate,
        record.gregorianDate,
        record.odometer,
        record.laborCost,
        record.partsCost,
        record.totalCost,
        record.currency,
        record.workshopName,
        record.workshopContact,
        record.workshopAddress,
        record.description,
        record.notes,
        JSON.stringify(record.nextServiceInterval),
        record.nextServiceOdometer,
        record.nextServiceDate,
        record.warrantyDurationDays,
        record.warrantyExpirationDate,
        record.invoiceImageUrl,
        JSON.stringify(record.attachmentUrls),
        record.status,
        record.completionNotes,
        record.updatedAt,
        record.id,
      ]);
      
      // Update state
      const existingRecords = get().records;
      const updatedRecords = existingRecords.map(r => r.id === id ? record : r);
      
      set({
        records: updatedRecords,
        isLoading: false,
      });
      
      return { success: true, record };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی سرویس';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Delete from database (will cascade to maintenance_parts)
      database.execSync('DELETE FROM maintenance_records WHERE id = ?', [id]);
      
      // Update state
      const existingRecords = get().records;
      const filteredRecords = existingRecords.filter(r => r.id !== id);
      
      set({
        records: filteredRecords,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف سرویس';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  archiveRecord: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      
      // Archive in database
      database.execSync(`
        UPDATE maintenance_records SET 
          status = 'archived',
          updated_at = ?
        WHERE id = ?
      `, [now.toISOString(), id]);
      
      // Update state
      const existingRecords = get().records;
      const updatedRecords = existingRecords.map(r => 
        r.id === id ? { ...r, status: 'archived' as ServiceStatus, updatedAt: now.toISOString() } : r
      );
      
      set({
        records: updatedRecords,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بایگانی سرویس';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Getters
  getRecordsByVehicle: (vehicleId) => {
    return get().records
      .filter(r => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  },
  
  getRecordById: (id) => {
    return get().records.find(r => r.id === id) ?? null;
  },
  
  getCompletedServices: (vehicleId) => {
    return get().records
      .filter(r => r.vehicleId === vehicleId && r.status === 'completed')
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  },
  
  getUpcomingServices: (vehicleId) => {
    return get().records
      .filter(r => r.vehicleId === vehicleId && ['upcoming', 'due'].includes(r.status))
      .sort((a, b) => new Date(a.nextServiceDate || a.gregorianDate).getTime() - new Date(b.nextServiceDate || b.gregorianDate).getTime());
  },
  
  getOverdueServices: (vehicleId) => {
    return get().records
      .filter(r => r.vehicleId === vehicleId && r.status === 'overdue')
      .sort((a, b) => new Date(a.nextServiceDate || a.gregorianDate).getTime() - new Date(b.nextServiceDate || b.gregorianDate).getTime());
  },
  
  getServicesByCategory: (vehicleId, category) => {
    return get().records
      .filter(r => r.vehicleId === vehicleId && r.category === category)
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  },
  
  filterRecords: (filter) => {
    let records = get().records;
    
    if (filter.vehicleId) {
      records = records.filter(r => r.vehicleId === filter.vehicleId);
    }
    
    if (filter.category) {
      records = records.filter(r => r.category === filter.category);
    }
    
    if (filter.status) {
      records = records.filter(r => r.status === filter.status);
    }
    
    if (filter.startDate) {
      records = records.filter(r => r.jalaliDate >= filter.startDate);
    }
    
    if (filter.endDate) {
      records = records.filter(r => r.jalaliDate <= filter.endDate);
    }
    
    if (filter.minOdometer !== undefined) {
      records = records.filter(r => r.odometer >= filter.minOdometer);
    }
    
    if (filter.maxOdometer !== undefined) {
      records = records.filter(r => r.odometer <= filter.maxOdometer);
    }
    
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      records = records.filter(r => 
        r.serviceTypeName.toLowerCase().includes(term) ||
        r.notes?.toLowerCase().includes(term) ||
        r.workshopName?.toLowerCase().includes(term)
      );
    }
    
    return records.sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  },
  
  getServiceSummary: (vehicleId) => {
    const records = get().records.filter(r => r.vehicleId === vehicleId);
    const completed = records.filter(r => r.status === 'completed');
    const overdue = records.filter(r => r.status === 'overdue');
    const upcoming = records.filter(r => ['upcoming', 'due'].includes(r.status));
    const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
    
    return {
      total: records.length,
      completed: completed.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      totalCost,
    };
  },
  
  getLatestServiceDate: (vehicleId) => {
    const records = get().records
      .filter(r => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
    return records[0]?.jalaliDate ?? null;
  },
  
  // Initialize from database
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Load maintenance records
      const recordRows = database.getAllSync(`
        SELECT * FROM maintenance_records 
        ORDER BY gregorian_date DESC
      `);
      
      const records: MaintenanceRecord[] = await Promise.all(recordRows.map(async (row: Record<string, unknown>) => {
        // Load parts for this record
        const partRows = database.getAllSync(`
          SELECT * FROM maintenance_parts WHERE maintenance_record_id = ?
        `, [row.id as string]);
        
        const parts: MaintenancePart[] = partRows.map((partRow: Record<string, unknown>) => ({
          id: partRow.id as string,
          name: partRow.name as string,
          brand: partRow.brand as string | undefined,
          partNumber: partRow.part_number as string | undefined,
          quantity: partRow.quantity as number,
          unitPrice: partRow.unit_price as number | undefined,
          totalPrice: partRow.total_price as number | undefined,
          warrantyDays: partRow.warranty_days as number | undefined,
          warrantyExpiration: partRow.warranty_expiration as string | undefined,
          notes: partRow.notes as string | undefined,
        }));
        
        return {
          id: row.id as string,
          vehicleId: row.vehicle_id as string,
          serviceTypeId: row.service_type_id as string | undefined,
          category: row.category as ServiceCategory,
          serviceTypeName: row.service_type_name as string,
          customName: row.custom_name as string | undefined,
          jalaliDate: row.jalali_date as string,
          gregorianDate: row.gregorian_date as string,
          odometer: row.odometer as number,
          laborCost: row.labor_cost as number | undefined,
          partsCost: row.parts_cost as number | undefined,
          totalCost: row.total_cost as number | undefined,
          currency: row.currency as string,
          workshopName: row.workshop_name as string | undefined,
          workshopContact: row.workshop_contact as string | undefined,
          workshopAddress: row.workshop_address as string | undefined,
          partsUsed: parts,
          description: row.description as string | undefined,
          notes: row.notes as string | undefined,
          nextServiceInterval: row.next_service_interval ? JSON.parse(row.next_service_interval as string) : undefined,
          nextServiceOdometer: row.next_service_odometer as number | undefined,
          nextServiceDate: row.next_service_date as string | undefined,
          nextServiceDateISO: row.next_service_date_iso as string | undefined,
          warrantyDurationDays: row.warranty_duration_days as number | undefined,
          warrantyExpirationDate: row.warranty_expiration_date as string | undefined,
          warrantyExpirationDateISO: row.warranty_expiration_date_iso as string | undefined,
          invoiceImageUrl: row.invoice_image_url as string | undefined,
          attachmentUrls: row.attachment_urls ? JSON.parse(row.attachment_urls as string) : undefined,
          status: row.status as ServiceStatus,
          completionNotes: row.completion_notes as string | undefined,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          completedAt: row.completed_at as string | undefined,
        };
      }));
      
      // Load service types
      const typeRows = database.getAllSync(`
        SELECT id, category, name, name_en, default_interval 
        FROM service_types 
        WHERE is_active = 1
        ORDER BY sort_order
      `);
      
      const serviceTypes = typeRows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        category: row.category as ServiceCategory,
        name: row.name as string,
        nameEn: row.name_en as string,
        defaultInterval: row.default_interval as string,
      }));
      
      set({
        records,
        serviceTypes,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری سرویس‌ها';
      set({ isLoading: false, error: errorMessage });
    }
  },
  
  reset: () => {
    set({
      records: [],
      serviceTypes: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Selectors for better performance
export const useServiceRecords = () => useServiceStore(state => state.records);
export const useServiceTypes = () => useServiceStore(state => state.serviceTypes);
export const useServiceByVehicle = (vehicleId: string) =>
  useServiceStore(state => state.getRecordsByVehicle(vehicleId));
export const useServiceSummary = (vehicleId: string) =>
  useServiceStore(state => state.getServiceSummary(vehicleId));
export const useCompletedServices = (vehicleId: string) =>
  useServiceStore(state => state.getCompletedServices(vehicleId));
export const useUpcomingServices = (vehicleId: string) =>
  useServiceStore(state => state.getUpcomingServices(vehicleId));
export const useOverdueServices = (vehicleId: string) =>
  useServiceStore(state => state.getOverdueServices(vehicleId));

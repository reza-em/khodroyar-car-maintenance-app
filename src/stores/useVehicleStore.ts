/**
 * Vehicle Store - Zustand
 * 
 * Manages vehicle state including the list of vehicles,
 * current vehicle selection, and vehicle-related operations.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../lib/jalaliDate';
import {
  Vehicle,
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleListItem,
  VehicleSummary,
  FuelType,
  PERSIAN_MANUFACTURERS,
  FUEL_TYPE_LABELS,
} from '../types/vehicle';
import { DEFAULT_SETTINGS, AppSettings } from '../types/settings';

interface VehicleState {
  // State
  vehicles: Vehicle[];
  currentVehicleId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setVehicles: (vehicles: Vehicle[]) => void;
  setCurrentVehicleId: (vehicleId: string | null) => void;
  addVehicle: (vehicle: CreateVehicleInput) => Promise<{ success: boolean; vehicle?: Vehicle; error?: string }>;
  updateVehicle: (vehicle: UpdateVehicleInput) => Promise<{ success: boolean; vehicle?: Vehicle; error?: string }>;
  deleteVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
  archiveVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultVehicle: (vehicleId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getCurrentVehicle: () => Vehicle | null;
  getVehicleById: (vehicleId: string) => Vehicle | null;
  getDefaultVehicle: () => Vehicle | null;
  getActiveVehicles: () => Vehicle[];
  getVehicleListItems: () => VehicleListItem[];
  hasVehicles: () => boolean;
  hasDefaultVehicle: () => boolean;
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

// Storage for persistence
const vehicleStorage = createJSONStorage<VehicleState>(() => ({
  getItem: async (name) => {
    const fileUri = `${FileSystem.documentDirectory}vehicle-store.json`;
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileUri);
        return content;
      }
      return null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    const fileUri = `${FileSystem.documentDirectory}vehicle-store.json`;
    try {
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving vehicle store:', error);
    }
  },
  removeItem: async (name) => {
    const fileUri = `${FileSystem.documentDirectory}vehicle-store.json`;
    try {
      await FileSystem.deleteAsync(fileUri);
    } catch (error) {
      console.error('Error deleting vehicle store:', error);
    }
  },
}));

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      // Initial state
      vehicles: [],
      currentVehicleId: null,
      isLoading: false,
      error: null,
      
      // Actions
      setVehicles: (vehicles) => {
        set({ vehicles, error: null });
      },
      
      setCurrentVehicleId: (vehicleId) => {
        set({ currentVehicleId: vehicleId });
      },
      
      addVehicle: async (input) => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          const now = new Date();
          const vehicleId = uuidv4();
          
          // Create vehicle object
          const vehicle: Vehicle = {
            id: vehicleId,
            manufacturer: input.manufacturer,
            manufacturerId: input.manufacturerId,
            model: input.model,
            modelId: input.modelId,
            trim: input.trim,
            trimId: input.trimId,
            licensePlate: input.licensePlate,
            vin: input.vin,
            productionYear: input.productionYear,
            color: input.color,
            fuelType: input.fuelType,
            transmissionType: input.transmissionType,
            engineCapacity: input.engineCapacity,
            currentOdometer: input.currentOdometer,
            lastOdometerUpdate: getCurrentGregorianISO(),
            purchaseDate: input.purchaseDate,
            purchaseDateISO: input.purchaseDate ? getCurrentGregorianISO() : undefined,
            insuranceExpiration: input.insuranceExpiration,
            insuranceExpirationISO: input.insuranceExpiration ? getCurrentGregorianISO() : undefined,
            technicalInspectionExpiration: input.technicalInspectionExpiration,
            technicalInspectionExpirationISO: input.technicalInspectionExpiration ? getCurrentGregorianISO() : undefined,
            warrantyExpiration: input.warrantyExpiration,
            warrantyExpirationISO: input.warrantyExpiration ? getCurrentGregorianISO() : undefined,
            isDefault: get().vehicles.length === 0, // Set as default if first vehicle
            isActive: true,
            status: 'active',
            imageUrl: input.image?.uri,
            thumbnailUrl: input.image?.uri,
            notes: input.notes,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };
          
          // Insert into database
          database.execSync(`
            INSERT INTO vehicles (
              id, user_id, manufacturer, manufacturer_id, model, model_id, 
              trim, trim_id, license_plate, vin, chassis_number, engine_number,
              production_year, color, fuel_type, transmission_type, engine_capacity,
              current_odometer, last_odometer_update, purchase_date, purchase_date_iso,
              insurance_expiration, insurance_expiration_iso, technical_inspection_expiration,
              technical_inspection_expiration_iso, warranty_expiration, warranty_expiration_iso,
              is_default, is_active, status, image_url, thumbnail_url, notes,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            vehicle.id,
            null,
            vehicle.manufacturer,
            vehicle.manufacturerId,
            vehicle.model,
            vehicle.modelId,
            vehicle.trim,
            vehicle.trimId,
            vehicle.licensePlate,
            vehicle.vin,
            null,
            null,
            vehicle.productionYear,
            vehicle.color,
            vehicle.fuelType,
            vehicle.transmissionType,
            vehicle.engineCapacity,
            vehicle.currentOdometer,
            vehicle.lastOdometerUpdate,
            vehicle.purchaseDate,
            vehicle.purchaseDateISO,
            vehicle.insuranceExpiration,
            vehicle.insuranceExpirationISO,
            vehicle.technicalInspectionExpiration,
            vehicle.technicalInspectionExpirationISO,
            vehicle.warrantyExpiration,
            vehicle.warrantyExpirationISO,
            vehicle.isDefault ? 1 : 0,
            vehicle.isActive ? 1 : 0,
            vehicle.status,
            vehicle.imageUrl,
            vehicle.thumbnailUrl,
            vehicle.notes,
            vehicle.createdAt,
            vehicle.updatedAt,
          ]);
          
          // Update state
          const existingVehicles = get().vehicles;
          const newVehicles = [...existingVehicles, vehicle];
          
          set({
            vehicles: newVehicles,
            currentVehicleId: get().currentVehicleId || vehicle.id,
            isLoading: false,
          });
          
          return { success: true, vehicle };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد خودرو';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      updateVehicle: async (input) => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          const now = new Date();
          const existingVehicle = get().getVehicleById(input.id);
          
          if (!existingVehicle) {
            return { success: false, error: 'خودرو یافت نشد' };
          }
          
          // Update vehicle object
          const vehicle: Vehicle = {
            ...existingVehicle,
            manufacturer: input.manufacturer ?? existingVehicle.manufacturer,
            manufacturerId: input.manufacturerId ?? existingVehicle.manufacturerId,
            model: input.model ?? existingVehicle.model,
            modelId: input.modelId ?? existingVehicle.modelId,
            trim: input.trim ?? existingVehicle.trim,
            trimId: input.trimId ?? existingVehicle.trimId,
            licensePlate: input.licensePlate ?? existingVehicle.licensePlate,
            vin: input.vin ?? existingVehicle.vin,
            productionYear: input.productionYear ?? existingVehicle.productionYear,
            color: input.color ?? existingVehicle.color,
            fuelType: input.fuelType ?? existingVehicle.fuelType,
            transmissionType: input.transmissionType ?? existingVehicle.transmissionType,
            engineCapacity: input.engineCapacity ?? existingVehicle.engineCapacity,
            currentOdometer: input.currentOdometer ?? existingVehicle.currentOdometer,
            lastOdometerUpdate: input.currentOdometer ? getCurrentGregorianISO() : existingVehicle.lastOdometerUpdate,
            purchaseDate: input.purchaseDate ?? existingVehicle.purchaseDate,
            purchaseDateISO: input.purchaseDate ? getCurrentGregorianISO() : existingVehicle.purchaseDateISO,
            insuranceExpiration: input.insuranceExpiration ?? existingVehicle.insuranceExpiration,
            insuranceExpirationISO: input.insuranceExpiration ? getCurrentGregorianISO() : existingVehicle.insuranceExpirationISO,
            technicalInspectionExpiration: input.technicalInspectionExpiration ?? existingVehicle.technicalInspectionExpiration,
            technicalInspectionExpirationISO: input.technicalInspectionExpiration ? getCurrentGregorianISO() : existingVehicle.technicalInspectionExpirationISO,
            warrantyExpiration: input.warrantyExpiration ?? existingVehicle.warrantyExpiration,
            warrantyExpirationISO: input.warrantyExpiration ? getCurrentGregorianISO() : existingVehicle.warrantyExpirationISO,
            isDefault: input.isDefault ?? existingVehicle.isDefault,
            isActive: input.isActive ?? existingVehicle.isActive,
            status: input.status ?? existingVehicle.status,
            imageUrl: input.image?.uri ?? existingVehicle.imageUrl,
            thumbnailUrl: input.image?.uri ?? existingVehicle.thumbnailUrl,
            notes: input.notes ?? existingVehicle.notes,
            updatedAt: now.toISOString(),
          };
          
          // Update in database
          database.execSync(`
            UPDATE vehicles SET
              manufacturer = ?,
              manufacturer_id = ?,
              model = ?,
              model_id = ?,
              trim = ?,
              trim_id = ?,
              license_plate = ?,
              vin = ?,
              production_year = ?,
              color = ?,
              fuel_type = ?,
              transmission_type = ?,
              engine_capacity = ?,
              current_odometer = ?,
              last_odometer_update = ?,
              purchase_date = ?,
              purchase_date_iso = ?,
              insurance_expiration = ?,
              insurance_expiration_iso = ?,
              technical_inspection_expiration = ?,
              technical_inspection_expiration_iso = ?,
              warranty_expiration = ?,
              warranty_expiration_iso = ?,
              is_default = ?,
              is_active = ?,
              status = ?,
              image_url = ?,
              thumbnail_url = ?,
              notes = ?,
              updated_at = ?
            WHERE id = ?
          `, [
            vehicle.manufacturer,
            vehicle.manufacturerId,
            vehicle.model,
            vehicle.modelId,
            vehicle.trim,
            vehicle.trimId,
            vehicle.licensePlate,
            vehicle.vin,
            vehicle.productionYear,
            vehicle.color,
            vehicle.fuelType,
            vehicle.transmissionType,
            vehicle.engineCapacity,
            vehicle.currentOdometer,
            vehicle.lastOdometerUpdate,
            vehicle.purchaseDate,
            vehicle.purchaseDateISO,
            vehicle.insuranceExpiration,
            vehicle.insuranceExpirationISO,
            vehicle.technicalInspectionExpiration,
            vehicle.technicalInspectionExpirationISO,
            vehicle.warrantyExpiration,
            vehicle.warrantyExpirationISO,
            vehicle.isDefault ? 1 : 0,
            vehicle.isActive ? 1 : 0,
            vehicle.status,
            vehicle.imageUrl,
            vehicle.thumbnailUrl,
            vehicle.notes,
            vehicle.updatedAt,
            vehicle.id,
          ]);
          
          // Update state
          const existingVehicles = get().vehicles;
          const updatedVehicles = existingVehicles.map(v => v.id === vehicle.id ? vehicle : v);
          
          set({
            vehicles: updatedVehicles,
            isLoading: false,
          });
          
          return { success: true, vehicle };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی خودرو';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      deleteVehicle: async (vehicleId) => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          
          // Delete from database (will cascade to related records)
          database.execSync('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
          
          // Update state
          const existingVehicles = get().vehicles;
          const filteredVehicles = existingVehicles.filter(v => v.id !== vehicleId);
          const currentVehicleId = get().currentVehicleId;
          
          // If we're deleting the current vehicle, set to null or first vehicle
          let newCurrentVehicleId = currentVehicleId;
          if (currentVehicleId === vehicleId) {
            newCurrentVehicleId = filteredVehicles.length > 0 ? filteredVehicles[0].id : null;
          }
          
          set({
            vehicles: filteredVehicles,
            currentVehicleId: newCurrentVehicleId,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در حذف خودرو';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      archiveVehicle: async (vehicleId) => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          const now = new Date();
          
          // Archive in database
          database.execSync(`
            UPDATE vehicles SET 
              status = 'archived',
              is_active = 0,
              archived_at = ?
            WHERE id = ?
          `, [now.toISOString(), vehicleId]);
          
          // Update state
          const existingVehicles = get().vehicles;
          const updatedVehicles = existingVehicles.map(v => 
            v.id === vehicleId ? { ...v, status: 'archived', isActive: false, archivedAt: now.toISOString() } : v
          );
          
          const currentVehicleId = get().currentVehicleId;
          let newCurrentVehicleId = currentVehicleId;
          
          // If we're archiving the current vehicle, switch to another active vehicle
          if (currentVehicleId === vehicleId) {
            const activeVehicles = updatedVehicles.filter(v => v.isActive);
            newCurrentVehicleId = activeVehicles.length > 0 ? activeVehicles[0].id : null;
          }
          
          set({
            vehicles: updatedVehicles,
            currentVehicleId: newCurrentVehicleId,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در بایگانی خودرو';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      setDefaultVehicle: async (vehicleId) => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          
          // Clear all defaults first
          database.execSync('UPDATE vehicles SET is_default = 0');
          
          // Set the new default
          database.execSync('UPDATE vehicles SET is_default = 1 WHERE id = ?', [vehicleId]);
          
          // Update state
          const existingVehicles = get().vehicles;
          const updatedVehicles = existingVehicles.map(v => ({
            ...v,
            isDefault: v.id === vehicleId,
          }));
          
          set({
            vehicles: updatedVehicles,
            currentVehicleId: vehicleId,
            isLoading: false,
          });
          
          return { success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در تنظیم خودرو پیش‌فرض';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },
      
      // Getters
      getCurrentVehicle: () => {
        const currentVehicleId = get().currentVehicleId;
        if (!currentVehicleId) return null;
        return get().vehicles.find(v => v.id === currentVehicleId) ?? null;
      },
      
      getVehicleById: (vehicleId) => {
        return get().vehicles.find(v => v.id === vehicleId) ?? null;
      },
      
      getDefaultVehicle: () => {
        return get().vehicles.find(v => v.isDefault) ?? null;
      },
      
      getActiveVehicles: () => {
        return get().vehicles.filter(v => v.isActive);
      },
      
      getVehicleListItems: () => {
        return get().vehicles.map(v => ({
          id: v.id,
          displayName: `${v.manufacturer} ${v.model}${v.trim ? ` ${v.trim}` : ''}`,
          licensePlate: v.licensePlate,
          imageUrl: v.imageUrl,
          isDefault: v.isDefault,
          currentOdometer: v.currentOdometer,
        }));
      },
      
      hasVehicles: () => {
        return get().vehicles.length > 0;
      },
      
      hasDefaultVehicle: () => {
        return get().vehicles.some(v => v.isDefault);
      },
      
      // Initialize from database
      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const database = getDatabase();
          const rows = database.getAllSync(`
            SELECT * FROM vehicles 
            ORDER BY is_default DESC, created_at DESC
          `);
          
          const vehicles: Vehicle[] = rows.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            userId: row.user_id as string | undefined,
            manufacturer: row.manufacturer as string,
            manufacturerId: row.manufacturer_id as string | undefined,
            model: row.model as string,
            modelId: row.model_id as string | undefined,
            trim: row.trim as string | undefined,
            trimId: row.trim_id as string | undefined,
            licensePlate: row.license_plate as string,
            vin: row.vin as string | undefined,
            chassisNumber: row.chassis_number as string | undefined,
            engineNumber: row.engine_number as string | undefined,
            productionYear: row.production_year as number,
            color: row.color as string | undefined,
            fuelType: row.fuel_type as FuelType,
            transmissionType: row.transmission_type as string | undefined,
            engineCapacity: row.engine_capacity as number | undefined,
            currentOdometer: row.current_odometer as number,
            lastOdometerUpdate: row.last_odometer_update as string,
            purchaseDate: row.purchase_date as string | undefined,
            purchaseDateISO: row.purchase_date_iso as string | undefined,
            insuranceExpiration: row.insurance_expiration as string | undefined,
            insuranceExpirationISO: row.insurance_expiration_iso as string | undefined,
            technicalInspectionExpiration: row.technical_inspection_expiration as string | undefined,
            technicalInspectionExpirationISO: row.technical_inspection_expiration_iso as string | undefined,
            warrantyExpiration: row.warranty_expiration as string | undefined,
            warrantyExpirationISO: row.warranty_expiration_iso as string | undefined,
            isDefault: Boolean(row.is_default as number),
            isActive: Boolean(row.is_active as number),
            status: row.status as string,
            imageUrl: row.image_url as string | undefined,
            thumbnailUrl: row.thumbnail_url as string | undefined,
            notes: row.notes as string | undefined,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            archivedAt: row.archived_at as string | undefined,
          }));
          
          // Set default vehicle
          const defaultVehicle = vehicles.find(v => v.isDefault);
          
          set({
            vehicles,
            currentVehicleId: defaultVehicle?.id || vehicles[0]?.id || null,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری خودروها';
          set({ isLoading: false, error: errorMessage });
        }
      },
      
      reset: () => {
        set({
          vehicles: [],
          currentVehicleId: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'vehicle-store',
      storage: vehicleStorage,
      partialize: (state) => ({
        vehicles: state.vehicles,
        currentVehicleId: state.currentVehicleId,
      }),
    }
  )
);

// Selectors for better performance
export const useCurrentVehicle = () => 
  useVehicleStore(state => state.getCurrentVehicle());

export const useVehicles = () => 
  useVehicleStore(state => state.vehicles);

export const useActiveVehicles = () => 
  useVehicleStore(state => state.getActiveVehicles());

export const useHasVehicles = () => 
  useVehicleStore(state => state.hasVehicles());

export const useVehicleById = (vehicleId: string) =>
  useVehicleStore(state => state.getVehicleById(vehicleId));

export const useCurrentVehicleId = () =>
  useVehicleStore(state => state.currentVehicleId);

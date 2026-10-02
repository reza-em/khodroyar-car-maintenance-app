/**
 * Part Store - Zustand
 * 
 * Manages parts and purchases.
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../lib/database';
import { getCurrentJalaliDate, getCurrentGregorianISO } from '../lib/jalaliDate';
import { Part, PartCategory, PartInstallationStatus, CreatePartInput, Purchase, PurchaseStatus } from '../types/part';

interface PartState {
  // State
  parts: Part[];
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setParts: (parts: Part[]) => void;
  setPurchases: (purchases: Purchase[]) => void;
  addPart: (input: CreatePartInput) => Promise<{ success: boolean; part?: Part; error?: string }>;
  updatePart: (id: string, input: Partial<CreatePartInput>) => Promise<{ success: boolean; part?: Part; error?: string }>;
  deletePart: (id: string) => Promise<{ success: boolean; error?: string }>;
  addPurchase: (input: any) => Promise<{ success: boolean; purchase?: Purchase; error?: string }>;
  updatePurchase: (id: string, input: Partial<any>) => Promise<{ success: boolean; purchase?: Purchase; error?: string }>;
  deletePurchase: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  // Getters
  getPartsByVehicle: (vehicleId: string) => Part[];
  getPartById: (id: string) => Part | null;
  getPartsByCategory: (category: PartCategory) => Part[];
  getPartsByInstallationStatus: (status: PartInstallationStatus) => Part[];
  getInstalledParts: () => Part[];
  getNotInstalledParts: () => Part[];
  getPurchasesByVehicle: (vehicleId: string) => Purchase[];
  getPurchaseById: (id: string) => Purchase | null;
  getPartSummary: (vehicleId: string) => { total: number; installed: number; notInstalled: number; totalValue: number };
  
  // Initialize
  initialize: () => Promise<void>;
  reset: () => void;
}

export const usePartStore = create<PartState>()((set, get) => ({
  // Initial state
  parts: [],
  purchases: [],
  isLoading: false,
  error: null,
  
  // Actions
  setParts: (parts) => {
    set({ parts, error: null });
  },
  
  setPurchases: (purchases) => {
    set({ purchases, error: null });
  },
  
  addPart: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const partId = uuidv4();
      
      const part: Part = {
        id: partId,
        vehicleId: input.vehicleId,
        name: input.name,
        nameEn: input.nameEn,
        description: input.description,
        category: input.category,
        customCategory: input.customCategory,
        brand: input.brand,
        partNumber: input.partNumber,
        oemNumber: input.oemNumber,
        specifications: input.specifications,
        purchasePrice: input.purchasePrice,
        retailPrice: input.retailPrice,
        currency: input.currency || 'IRT',
        quantity: input.quantity || 1,
        minQuantity: input.minQuantity,
        installationStatus: input.installationStatus || 'purchased',
        installedAt: input.installedAt,
        installedJalaliDate: input.installedJalaliDate,
        installedOdometer: input.installedOdometer,
        installedVehicleId: input.installedVehicleId,
        warrantyDurationDays: input.warrantyDurationDays,
        warrantyExpiration: input.warrantyExpiration,
        warrantyExpirationJalali: input.warrantyExpirationJalali,
        supplier: input.supplier,
        supplierContact: input.supplierContact,
        imageUrl: input.image?.uri,
        attachmentUrls: input.attachmentUrls,
        linkedServiceIds: input.linkedServiceIds,
        linkedRepairIds: input.linkedRepairIds,
        notes: input.notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        metadata: input.metadata,
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO parts (
          id, vehicle_id, name, name_en, description, category, custom_category,
          brand, part_number, oem_number, specifications, purchase_price, retail_price, currency,
          quantity, min_quantity, installation_status, installed_at, installed_jalali_date,
          installed_odometer, installed_vehicle_id, warranty_duration_days, warranty_expiration,
          warranty_expiration_jalali, supplier, supplier_contact, image_url, attachment_urls,
          linked_service_ids, linked_repair_ids, notes, created_at, updated_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        part.id,
        part.vehicleId,
        part.name,
        part.nameEn,
        part.description,
        part.category,
        part.customCategory,
        part.brand,
        part.partNumber,
        part.oemNumber,
        JSON.stringify(part.specifications),
        part.purchasePrice,
        part.retailPrice,
        part.currency,
        part.quantity,
        part.minQuantity,
        part.installationStatus,
        part.installedAt,
        part.installedJalaliDate,
        part.installedOdometer,
        part.installedVehicleId,
        part.warrantyDurationDays,
        part.warrantyExpiration,
        part.warrantyExpirationJalali,
        part.supplier,
        part.supplierContact,
        part.imageUrl,
        JSON.stringify(part.attachmentUrls),
        JSON.stringify(part.linkedServiceIds),
        JSON.stringify(part.linkedRepairIds),
        part.notes,
        part.createdAt,
        part.updatedAt,
        JSON.stringify(part.metadata),
      ]);
      
      // Update state
      const existingParts = get().parts;
      const newParts = [...existingParts, part];
      
      set({
        parts: newParts,
        isLoading: false,
      });
      
      return { success: true, part };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت قطعه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updatePart: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingPart = get().parts.find(p => p.id === id);
      
      if (!existingPart) {
        return { success: false, error: 'قطعه یافت نشد' };
      }
      
      const part: Part = {
        ...existingPart,
        name: input.name ?? existingPart.name,
        nameEn: input.nameEn ?? existingPart.nameEn,
        description: input.description ?? existingPart.description,
        category: input.category ?? existingPart.category,
        customCategory: input.customCategory ?? existingPart.customCategory,
        brand: input.brand ?? existingPart.brand,
        partNumber: input.partNumber ?? existingPart.partNumber,
        oemNumber: input.oemNumber ?? existingPart.oemNumber,
        specifications: input.specifications ?? existingPart.specifications,
        purchasePrice: input.purchasePrice ?? existingPart.purchasePrice,
        retailPrice: input.retailPrice ?? existingPart.retailPrice,
        currency: input.currency ?? existingPart.currency,
        quantity: input.quantity ?? existingPart.quantity,
        minQuantity: input.minQuantity ?? existingPart.minQuantity,
        installationStatus: input.installationStatus ?? existingPart.installationStatus,
        installedAt: input.installedAt ?? existingPart.installedAt,
        installedJalaliDate: input.installedJalaliDate ?? existingPart.installedJalaliDate,
        installedOdometer: input.installedOdometer ?? existingPart.installedOdometer,
        installedVehicleId: input.installedVehicleId ?? existingPart.installedVehicleId,
        warrantyDurationDays: input.warrantyDurationDays ?? existingPart.warrantyDurationDays,
        warrantyExpiration: input.warrantyExpiration ?? existingPart.warrantyExpiration,
        warrantyExpirationJalali: input.warrantyExpirationJalali ?? existingPart.warrantyExpirationJalali,
        supplier: input.supplier ?? existingPart.supplier,
        supplierContact: input.supplierContact ?? existingPart.supplierContact,
        imageUrl: input.image?.uri ?? existingPart.imageUrl,
        attachmentUrls: input.attachmentUrls ?? existingPart.attachmentUrls,
        linkedServiceIds: input.linkedServiceIds ?? existingPart.linkedServiceIds,
        linkedRepairIds: input.linkedRepairIds ?? existingPart.linkedRepairIds,
        notes: input.notes ?? existingPart.notes,
        updatedAt: now.toISOString(),
      };
      
      // Update in database
      database.execSync(`
        UPDATE parts SET
          name = ?,
          name_en = ?,
          description = ?,
          category = ?,
          custom_category = ?,
          brand = ?,
          part_number = ?,
          oem_number = ?,
          specifications = ?,
          purchase_price = ?,
          retail_price = ?,
          currency = ?,
          quantity = ?,
          min_quantity = ?,
          installation_status = ?,
          installed_at = ?,
          installed_jalali_date = ?,
          installed_odometer = ?,
          installed_vehicle_id = ?,
          warranty_duration_days = ?,
          warranty_expiration = ?,
          warranty_expiration_jalali = ?,
          supplier = ?,
          supplier_contact = ?,
          image_url = ?,
          attachment_urls = ?,
          linked_service_ids = ?,
          linked_repair_ids = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        part.name,
        part.nameEn,
        part.description,
        part.category,
        part.customCategory,
        part.brand,
        part.partNumber,
        part.oemNumber,
        JSON.stringify(part.specifications),
        part.purchasePrice,
        part.retailPrice,
        part.currency,
        part.quantity,
        part.minQuantity,
        part.installationStatus,
        part.installedAt,
        part.installedJalaliDate,
        part.installedOdometer,
        part.installedVehicleId,
        part.warrantyDurationDays,
        part.warrantyExpiration,
        part.warrantyExpirationJalali,
        part.supplier,
        part.supplierContact,
        part.imageUrl,
        JSON.stringify(part.attachmentUrls),
        JSON.stringify(part.linkedServiceIds),
        JSON.stringify(part.linkedRepairIds),
        part.notes,
        part.updatedAt,
        part.id,
      ]);
      
      // Update state
      const existingParts = get().parts;
      const updatedParts = existingParts.map(p => p.id === id ? part : p);
      
      set({
        parts: updatedParts,
        isLoading: false,
      });
      
      return { success: true, part };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی قطعه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deletePart: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Delete from database
      database.execSync('DELETE FROM parts WHERE id = ?', [id]);
      
      // Update state
      const existingParts = get().parts;
      const filteredParts = existingParts.filter(p => p.id !== id);
      
      set({
        parts: filteredParts,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف قطعه';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  addPurchase: async (input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const purchaseId = uuidv4();
      
      const purchase: Purchase = {
        id: purchaseId,
        vehicleId: input.vehicleId,
        purchaseNumber: input.purchaseNumber,
        jalaliDate: input.jalaliDate || getCurrentJalaliDate(),
        gregorianDate: input.gregorianDate || getCurrentGregorianISO(),
        items: input.items,
        seller: input.seller,
        sellerContact: input.sellerContact,
        sellerAddress: input.sellerAddress,
        subtotal: input.subtotal,
        tax: input.tax,
        discount: input.discount,
        total: input.total,
        currency: input.currency || 'IRT',
        paymentMethod: input.paymentMethod,
        status: input.status || 'delivered',
        invoiceImageUrl: input.invoiceImage?.uri,
        attachmentUrls: input.attachmentUrls,
        notes: input.notes,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      
      // Insert into database
      database.execSync(`
        INSERT INTO purchases (
          id, vehicle_id, purchase_number, jalali_date, gregorian_date,
          subtotal, tax, discount, total, currency, seller, seller_contact, seller_address,
          payment_method, status, invoice_image_url, attachment_urls, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        purchase.id,
        purchase.vehicleId,
        purchase.purchaseNumber,
        purchase.jalaliDate,
        purchase.gregorianDate,
        purchase.subtotal,
        purchase.tax,
        purchase.discount,
        purchase.total,
        purchase.currency,
        purchase.seller,
        purchase.sellerContact,
        purchase.sellerAddress,
        purchase.paymentMethod,
        purchase.status,
        purchase.invoiceImageUrl,
        JSON.stringify(purchase.attachmentUrls),
        purchase.notes,
        purchase.createdAt,
        purchase.updatedAt,
      ]);
      
      // Insert items
      if (purchase.items && purchase.items.length > 0) {
        const itemsSql = purchase.items.map(() => (
          `INSERT INTO purchase_items (
            id, purchase_id, part_id, name, brand, part_number, quantity,
            unit_price, total_price, installation_status, installed_at, installed_jalali_date,
            installed_odometer, installed_vehicle_id, warranty_duration_days, warranty_expiration,
            warranty_expiration_jalali, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )).join('; ');
        
        const itemsValues: unknown[] = [];
        purchase.items.forEach(item => {
          itemsValues.push(
            uuidv4(),
            purchase.id,
            item.partId,
            item.name,
            item.brand,
            item.partNumber,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            item.installationStatus,
            item.installedAt,
            item.installedJalaliDate,
            item.installedOdometer,
            item.installedVehicleId,
            item.warrantyDurationDays,
            item.warrantyExpiration,
            item.warrantyExpirationJalali,
            item.notes
          );
        });
        
        database.execSync(itemsSql, itemsValues);
      }
      
      // Update state
      const existingPurchases = get().purchases;
      const newPurchases = [...existingPurchases, purchase];
      
      set({
        purchases: newPurchases,
        isLoading: false,
      });
      
      return { success: true, purchase };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در ثبت خرید';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  updatePurchase: async (id, input) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      const now = new Date();
      const existingPurchase = get().purchases.find(p => p.id === id);
      
      if (!existingPurchase) {
        return { success: false, error: 'خرید یافت نشد' };
      }
      
      const purchase: Purchase = {
        ...existingPurchase,
        purchaseNumber: input.purchaseNumber ?? existingPurchase.purchaseNumber,
        jalaliDate: input.jalaliDate ?? existingPurchase.jalaliDate,
        gregorianDate: input.gregorianDate ?? existingPurchase.gregorianDate,
        items: input.items ?? existingPurchase.items,
        seller: input.seller ?? existingPurchase.seller,
        sellerContact: input.sellerContact ?? existingPurchase.sellerContact,
        sellerAddress: input.sellerAddress ?? existingPurchase.sellerAddress,
        subtotal: input.subtotal ?? existingPurchase.subtotal,
        tax: input.tax ?? existingPurchase.tax,
        discount: input.discount ?? existingPurchase.discount,
        total: input.total ?? existingPurchase.total,
        currency: input.currency ?? existingPurchase.currency,
        paymentMethod: input.paymentMethod ?? existingPurchase.paymentMethod,
        status: input.status ?? existingPurchase.status,
        invoiceImageUrl: input.invoiceImage?.uri ?? existingPurchase.invoiceImageUrl,
        attachmentUrls: input.attachmentUrls ?? existingPurchase.attachmentUrls,
        notes: input.notes ?? existingPurchase.notes,
        updatedAt: now.toISOString(),
      };
      
      // Update in database
      database.execSync(`
        UPDATE purchases SET
          purchase_number = ?,
          jalali_date = ?,
          gregorian_date = ?,
          subtotal = ?,
          tax = ?,
          discount = ?,
          total = ?,
          currency = ?,
          seller = ?,
          seller_contact = ?,
          seller_address = ?,
          payment_method = ?,
          status = ?,
          invoice_image_url = ?,
          attachment_urls = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?
      `, [
        purchase.purchaseNumber,
        purchase.jalaliDate,
        purchase.gregorianDate,
        purchase.subtotal,
        purchase.tax,
        purchase.discount,
        purchase.total,
        purchase.currency,
        purchase.seller,
        purchase.sellerContact,
        purchase.sellerAddress,
        purchase.paymentMethod,
        purchase.status,
        purchase.invoiceImageUrl,
        JSON.stringify(purchase.attachmentUrls),
        purchase.notes,
        purchase.updatedAt,
        purchase.id,
      ]);
      
      // Update state
      const existingPurchases = get().purchases;
      const updatedPurchases = existingPurchases.map(p => p.id === id ? purchase : p);
      
      set({
        purchases: updatedPurchases,
        isLoading: false,
      });
      
      return { success: true, purchase };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در به‌روزرسانی خرید';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  deletePurchase: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Delete from database (will cascade to purchase_items)
      database.execSync('DELETE FROM purchases WHERE id = ?', [id]);
      
      // Update state
      const existingPurchases = get().purchases;
      const filteredPurchases = existingPurchases.filter(p => p.id !== id);
      
      set({
        purchases: filteredPurchases,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در حذف خرید';
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Getters
  getPartsByVehicle: (vehicleId) => {
    return get().parts
      .filter(p => p.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getPartById: (id) => {
    return get().parts.find(p => p.id === id) ?? null;
  },
  
  getPartsByCategory: (category) => {
    return get().parts
      .filter(p => p.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getPartsByInstallationStatus: (status) => {
    return get().parts
      .filter(p => p.installationStatus === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getInstalledParts: () => {
    return get().parts
      .filter(p => p.installationStatus === 'installed')
      .sort((a, b) => new Date(b.installedAt || b.createdAt).getTime() - new Date(a.installedAt || a.createdAt).getTime());
  },
  
  getNotInstalledParts: () => {
    return get().parts
      .filter(p => p.installationStatus === 'not_installed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  
  getPurchasesByVehicle: (vehicleId) => {
    return get().purchases
      .filter(p => p.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime());
  },
  
  getPurchaseById: (id) => {
    return get().purchases.find(p => p.id === id) ?? null;
  },
  
  getPartSummary: (vehicleId) => {
    const parts = get().parts.filter(p => p.vehicleId === vehicleId);
    const installed = parts.filter(p => p.installationStatus === 'installed');
    const notInstalled = parts.filter(p => p.installationStatus === 'not_installed');
    const totalValue = parts.reduce((sum, p) => sum + (p.purchasePrice || 0) * p.quantity, 0);
    
    return {
      total: parts.length,
      installed: installed.length,
      notInstalled: notInstalled.length,
      totalValue,
    };
  },
  
  // Initialize from database
  initialize: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const database = getDatabase();
      
      // Load parts
      const partRows = database.getAllSync(`
        SELECT * FROM parts 
        ORDER BY created_at DESC
      `);
      
      const parts: Part[] = partRows.map((row: Record<string, unknown>) => ({
        id: row.id as string,
        vehicleId: row.vehicle_id as string | undefined,
        name: row.name as string,
        nameEn: row.name_en as string | undefined,
        description: row.description as string | undefined,
        category: row.category as PartCategory,
        customCategory: row.custom_category as string | undefined,
        brand: row.brand as string | undefined,
        partNumber: row.part_number as string | undefined,
        oemNumber: row.oem_number as string | undefined,
        specifications: row.specifications ? JSON.parse(row.specifications as string) : undefined,
        purchasePrice: row.purchase_price as number | undefined,
        retailPrice: row.retail_price as number | undefined,
        currency: row.currency as string,
        quantity: row.quantity as number,
        minQuantity: row.min_quantity as number | undefined,
        installationStatus: row.installation_status as PartInstallationStatus,
        installedAt: row.installed_at as string | undefined,
        installedJalaliDate: row.installed_jalali_date as string | undefined,
        installedOdometer: row.installed_odometer as number | undefined,
        installedVehicleId: row.installed_vehicle_id as string | undefined,
        warrantyDurationDays: row.warranty_duration_days as number | undefined,
        warrantyExpiration: row.warranty_expiration as string | undefined,
        warrantyExpirationJalali: row.warranty_expiration_jalali as string | undefined,
        supplier: row.supplier as string | undefined,
        supplierContact: row.supplier_contact as string | undefined,
        imageUrl: row.image_url as string | undefined,
        attachmentUrls: row.attachment_urls ? JSON.parse(row.attachment_urls as string) : undefined,
        linkedServiceIds: row.linked_service_ids ? JSON.parse(row.linked_service_ids as string) : undefined,
        linkedRepairIds: row.linked_repair_ids ? JSON.parse(row.linked_repair_ids as string) : undefined,
        notes: row.notes as string | undefined,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      }));
      
      // Load purchases
      const purchaseRows = database.getAllSync(`
        SELECT * FROM purchases 
        ORDER BY gregorian_date DESC
      `);
      
      const purchases: Purchase[] = await Promise.all(purchaseRows.map(async (row: Record<string, unknown>) => {
        // Load items for this purchase
        const itemRows = database.getAllSync(`
          SELECT * FROM purchase_items WHERE purchase_id = ?
        `, [row.id as string]);
        
        const items = itemRows.map((itemRow: Record<string, unknown>) => ({
          id: itemRow.id as string,
          partId: itemRow.part_id as string | undefined,
          name: itemRow.name as string,
          brand: itemRow.brand as string | undefined,
          partNumber: itemRow.part_number as string | undefined,
          quantity: itemRow.quantity as number,
          unitPrice: itemRow.unit_price as number,
          totalPrice: itemRow.total_price as number,
          installationStatus: itemRow.installation_status as PartInstallationStatus,
          installedAt: itemRow.installed_at as string | undefined,
          installedJalaliDate: itemRow.installed_jalali_date as string | undefined,
          installedOdometer: itemRow.installed_odometer as number | undefined,
          installedVehicleId: itemRow.installed_vehicle_id as string | undefined,
          warrantyDurationDays: itemRow.warranty_duration_days as number | undefined,
          warrantyExpiration: itemRow.warranty_expiration as string | undefined,
          warrantyExpirationJalali: itemRow.warranty_expiration_jalali as string | undefined,
          notes: itemRow.notes as string | undefined,
        }));
        
        return {
          id: row.id as string,
          vehicleId: row.vehicle_id as string | undefined,
          purchaseNumber: row.purchase_number as string | undefined,
          jalaliDate: row.jalali_date as string,
          gregorianDate: row.gregorian_date as string,
          subtotal: row.subtotal as number,
          tax: row.tax as number | undefined,
          discount: row.discount as number | undefined,
          total: row.total as number,
          currency: row.currency as string,
          seller: row.seller as string,
          sellerContact: row.seller_contact as string | undefined,
          sellerAddress: row.seller_address as string | undefined,
          paymentMethod: row.payment_method as string | undefined,
          status: row.status as PurchaseStatus,
          invoiceImageUrl: row.invoice_image_url as string | undefined,
          attachmentUrls: row.attachment_urls ? JSON.parse(row.attachment_urls as string) : undefined,
          notes: row.notes as string | undefined,
          items,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
        };
      }));
      
      set({
        parts,
        purchases,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطا در بارگذاری قطعات و خریدها';
      set({ isLoading: false, error: errorMessage });
    }
  },
  
  reset: () => {
    set({
      parts: [],
      purchases: [],
      isLoading: false,
      error: null,
    });
  },
}));

// Selectors for better performance
export const useAllParts = () => usePartStore(state => state.parts);
export const useAllPurchases = () => usePartStore(state => state.purchases);
export const usePartsByVehicle = (vehicleId: string) =>
  usePartStore(state => state.getPartsByVehicle(vehicleId));
export const usePartSummary = (vehicleId: string) =>
  usePartStore(state => state.getPartSummary(vehicleId));
export const useInstalledParts = () =>
  usePartStore(state => state.getInstalledParts());
export const useNotInstalledParts = () =>
  usePartStore(state => state.getNotInstalledParts());
export const usePurchasesByVehicle = (vehicleId: string) =>
  usePartStore(state => state.getPurchasesByVehicle(vehicleId));

export default usePartStore;
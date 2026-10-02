/**
 * Database Service for KhodroYar Application
 * 
 * This module provides the SQLite database connection and initialization
 * for the application. It uses Expo SQLite for local storage.
 */

import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import {
  ServiceCategory,
  DEFAULT_SERVICE_INTERVALS,
  SERVICE_CATEGORY_LABELS,
} from '../types/service';
import { FuelType, TransmissionType, PERSIAN_MANUFACTURERS } from '../types/vehicle';
import { PartCategory, PART_CATEGORY_LABELS } from '../types/part';
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '../types/expense';

// Database singleton
let db: SQLite.SQLiteDatabase | null = null;

// Database name
const DATABASE_NAME = 'khodroyar.db';

/**
 * Get or create the database instance
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DATABASE_NAME);
    // Enable WAL mode for better performance
    db.execSync('PRAGMA journal_mode=WAL;');
    // Enable foreign keys
    db.execSync('PRAGMA foreign_keys=ON;');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.closeAsync().catch(console.error);
    db = null;
  }
}

/**
 * Initialize the database schema
 * Creates all necessary tables if they don't exist
 */
export function initializeDatabase(): { success: boolean; error?: string } {
  const database = getDatabase();
  
  try {
    // Check if database is already initialized
    const tables = getTables();
    if (tables.length > 0) {
      return { success: true };
    }

    // Create all tables in a transaction
    database.execSync(`
      -- Enable foreign keys for this connection
      PRAGMA foreign_keys = ON;
      
      -- Vehicles table
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT,
        manufacturer TEXT NOT NULL,
        manufacturer_id TEXT,
        model TEXT NOT NULL,
        model_id TEXT,
        trim TEXT,
        trim_id TEXT,
        license_plate TEXT NOT NULL,
        vin TEXT,
        chassis_number TEXT,
        engine_number TEXT,
        production_year INTEGER NOT NULL,
        color TEXT,
        fuel_type TEXT NOT NULL,
        transmission_type TEXT,
        engine_capacity INTEGER,
        current_odometer INTEGER NOT NULL,
        last_odometer_update TEXT NOT NULL,
        purchase_date TEXT,
        purchase_date_iso TEXT,
        insurance_expiration TEXT,
        insurance_expiration_iso TEXT,
        technical_inspection_expiration TEXT,
        technical_inspection_expiration_iso TEXT,
        warranty_expiration TEXT,
        warranty_expiration_iso TEXT,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active',
        image_url TEXT,
        thumbnail_url TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      );
      
      -- Odometer entries table
      CREATE TABLE IF NOT EXISTS odometer_entries (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        odometer INTEGER NOT NULL,
        jalali_date TEXT NOT NULL,
        gregorian_date TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        note TEXT,
        is_confirmed INTEGER DEFAULT 1,
        confirmed_at TEXT,
        confirmed_by TEXT,
        is_lower_than_previous INTEGER DEFAULT 0,
        lower_reading_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      );
      
      -- Service types table
      CREATE TABLE IF NOT EXISTS service_types (
        id TEXT PRIMARY KEY NOT NULL,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT NOT NULL,
        short_name TEXT,
        description TEXT,
        default_interval TEXT NOT NULL,
        recommended_for TEXT,
        estimated_cost_min REAL,
        estimated_cost_max REAL,
        estimated_duration_min INTEGER,
        estimated_duration_max INTEGER,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      -- Maintenance records table
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        service_type_id TEXT,
        category TEXT NOT NULL,
        service_type_name TEXT NOT NULL,
        custom_name TEXT,
        jalali_date TEXT NOT NULL,
        gregorian_date TEXT NOT NULL,
        odometer INTEGER NOT NULL,
        labor_cost REAL,
        parts_cost REAL,
        total_cost REAL,
        currency TEXT NOT NULL,
        workshop_id TEXT,
        workshop_name TEXT,
        workshop_contact TEXT,
        workshop_address TEXT,
        description TEXT,
        notes TEXT,
        next_service_interval TEXT,
        next_service_odometer INTEGER,
        next_service_date TEXT,
        next_service_date_iso TEXT,
        warranty_duration_days INTEGER,
        warranty_expiration_date TEXT,
        warranty_expiration_date_iso TEXT,
        invoice_image_url TEXT,
        attachment_urls TEXT,
        status TEXT DEFAULT 'completed',
        completion_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE SET NULL,
        FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL
      );
      
      -- Maintenance parts table (parts used in services)
      CREATE TABLE IF NOT EXISTS maintenance_parts (
        id TEXT PRIMARY KEY NOT NULL,
        maintenance_record_id TEXT NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        part_number TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL,
        total_price REAL,
        warranty_days INTEGER,
        warranty_expiration TEXT,
        notes TEXT,
        FOREIGN KEY (maintenance_record_id) REFERENCES maintenance_records(id) ON DELETE CASCADE
      );
      
      -- Reminders table
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        service_id TEXT,
        part_id TEXT,
        repair_id TEXT,
        expense_id TEXT,
        remind_at TEXT NOT NULL,
        jalali_date TEXT NOT NULL,
        frequency TEXT NOT NULL,
        repeat_interval INTEGER,
        repeat_end_date TEXT,
        is_active INTEGER DEFAULT 1,
        status TEXT DEFAULT 'pending',
        notification_id TEXT,
        notify_before_days INTEGER,
        notify_before_kilometers INTEGER,
        priority TEXT DEFAULT 'medium',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        snoozed_until TEXT,
        snooze_count INTEGER DEFAULT 0,
        metadata TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES maintenance_records(id) ON DELETE CASCADE,
        FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE,
        FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE CASCADE,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
      );
      
      -- Parts table
      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT,
        name TEXT NOT NULL,
        name_en TEXT,
        description TEXT,
        category TEXT NOT NULL,
        custom_category TEXT,
        brand TEXT,
        part_number TEXT,
        oem_number TEXT,
        specifications TEXT,
        purchase_price REAL,
        retail_price REAL,
        currency TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        min_quantity INTEGER,
        installation_status TEXT NOT NULL DEFAULT 'purchased',
        installed_at TEXT,
        installed_jalali_date TEXT,
        installed_odometer INTEGER,
        installed_vehicle_id TEXT,
        warranty_duration_days INTEGER,
        warranty_expiration TEXT,
        warranty_expiration_jalali TEXT,
        supplier TEXT,
        supplier_contact TEXT,
        image_url TEXT,
        attachment_urls TEXT,
        linked_service_ids TEXT,
        linked_repair_ids TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (installed_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
      );
      
      -- Purchases table
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT,
        purchase_number TEXT,
        jalali_date TEXT NOT NULL,
        gregorian_date TEXT NOT NULL,
        subtotal REAL NOT NULL,
        tax REAL,
        discount REAL,
        total REAL NOT NULL,
        currency TEXT NOT NULL,
        seller TEXT NOT NULL,
        seller_contact TEXT,
        seller_address TEXT,
        payment_method TEXT,
        payment_reference TEXT,
        status TEXT DEFAULT 'delivered',
        invoice_image_url TEXT,
        attachment_urls TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      );
      
      -- Purchase items table
      CREATE TABLE IF NOT EXISTS purchase_items (
        id TEXT PRIMARY KEY NOT NULL,
        purchase_id TEXT NOT NULL,
        part_id TEXT,
        name TEXT NOT NULL,
        brand TEXT,
        part_number TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        installation_status TEXT DEFAULT 'purchased',
        installed_at TEXT,
        installed_jalali_date TEXT,
        installed_odometer INTEGER,
        installed_vehicle_id TEXT,
        warranty_duration_days INTEGER,
        warranty_expiration TEXT,
        warranty_expiration_jalali TEXT,
        notes TEXT,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
        FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE SET NULL,
        FOREIGN KEY (installed_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
      );
      
      -- Repairs table
      CREATE TABLE IF NOT EXISTS repairs (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        symptoms TEXT,
        repair_date TEXT NOT NULL,
        repair_date_iso TEXT NOT NULL,
        odometer INTEGER NOT NULL,
        workshop_id TEXT,
        workshop_name TEXT,
        workshop_contact TEXT,
        workshop_address TEXT,
        labor_cost REAL,
        parts_cost REAL,
        diagnostic_cost REAL,
        total_cost REAL,
        currency TEXT NOT NULL,
        parts_used TEXT,
        root_cause TEXT,
        repair_description TEXT,
        warranty_duration_days INTEGER,
        warranty_expiration TEXT,
        warranty_expiration_iso TEXT,
        warranty_notes TEXT,
        follow_up_required INTEGER DEFAULT 0,
        follow_up_date TEXT,
        follow_up_date_iso TEXT,
        follow_up_notes TEXT,
        attachment_urls TEXT,
        invoice_image_url TEXT,
        status TEXT DEFAULT 'pending_review',
        completion_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        metadata TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL
      );
      
      -- Expenses table
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        custom_category TEXT,
        amount REAL NOT NULL,
        currency TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        expense_date_iso TEXT NOT NULL,
        odometer INTEGER,
        maintenance_record_id TEXT,
        repair_id TEXT,
        part_id TEXT,
        purchase_id TEXT,
        payment_method TEXT,
        payment_reference TEXT,
        paid_to TEXT,
        tax_amount REAL,
        is_tax_deductible INTEGER DEFAULT 0,
        receipt_image_url TEXT,
        attachment_urls TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT,
        recurring_interval INTEGER,
        next_occurrence_date TEXT,
        next_occurrence_date_iso TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (maintenance_record_id) REFERENCES maintenance_records(id) ON DELETE SET NULL,
        FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE SET NULL,
        FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE SET NULL,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
      );
      
      -- Workshops table
      CREATE TABLE IF NOT EXISTS workshops (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        name_en TEXT,
        contact_person TEXT,
        phone TEXT,
        mobile TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        province TEXT,
        postal_code TEXT,
        website TEXT,
        specialties TEXT,
        rating REAL,
        notes TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      -- Attachments table
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        related_table TEXT NOT NULL,
        related_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      
      -- Settings table
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY NOT NULL,
        settings TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      
      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
      CREATE INDEX IF NOT EXISTS idx_vehicles_is_default ON vehicles(is_default);
      CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON vehicles(is_active);
      CREATE INDEX IF NOT EXISTS idx_odometer_entries_vehicle_id ON odometer_entries(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_odometer_entries_date ON odometer_entries(gregorian_date);
      CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_maintenance_records_category ON maintenance_records(category);
      CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
      CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON maintenance_records(gregorian_date);
      CREATE INDEX IF NOT EXISTS idx_reminders_vehicle_id ON reminders(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
      CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
      CREATE INDEX IF NOT EXISTS idx_parts_vehicle_id ON parts(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
      CREATE INDEX IF NOT EXISTS idx_parts_installation_status ON parts(installation_status);
      CREATE INDEX IF NOT EXISTS idx_purchases_vehicle_id ON purchases(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(gregorian_date);
      CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
      CREATE INDEX IF NOT EXISTS idx_repairs_vehicle_id ON repairs(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
      CREATE INDEX IF NOT EXISTS idx_repairs_date ON repairs(repair_date_iso);
      CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON expenses(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date_iso);
      CREATE INDEX IF NOT EXISTS idx_attachments_related ON attachments(related_table, related_id);
    `);

    // Insert default service types
    insertDefaultServiceTypes();
    
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get list of all tables in the database
 */
export function getTables(): string[] {
  const database = getDatabase();
  const result = database.getAllSync<string>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%' AND name NOT LIKE '__'"
  );
  return result.map(row => row);
}

/**
 * Insert default service types
 */
function insertDefaultServiceTypes(): void {
  const database = getDatabase();
  
  const serviceTypes = Object.entries(SERVICE_CATEGORY_LABELS).map(([category, name]) => ({
    id: uuidv4(),
    category: category as ServiceCategory,
    name,
    name_en: category.replace(/_/g, ' '),
    short_name: name.split(' ').slice(0, 2).join(' '),
    description: `سرویس ${name}`,
    default_interval: JSON.stringify(DEFAULT_SERVICE_INTERVALS[category as ServiceCategory]),
    recommended_for: JSON.stringify(['gasoline', 'diesel']),
    is_active: 1,
    sort_order: Object.keys(SERVICE_CATEGORY_LABELS).indexOf(category as ServiceCategory),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
  
  // Check if service types already exist
  const existing = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM service_types'
  );
  
  if (!existing || existing.count === 0) {
    // Insert in batches to avoid transaction limits
    const batchSize = 5;
    for (let i = 0; i < serviceTypes.length; i += batchSize) {
      const batch = serviceTypes.slice(i, i + batchSize);
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = batch.flatMap(st => [
        st.id, st.category, st.name, st.name_en, st.short_name,
        st.description, st.default_interval, st.recommended_for,
        st.is_active, st.sort_order, st.created_at, st.updated_at
      ]);
      
      database.execSync(`
        INSERT INTO service_types (
          id, category, name, name_en, short_name,
          description, default_interval, recommended_for,
          is_active, sort_order, created_at, updated_at
        ) VALUES ${placeholders}
      `, values);
    }
  }
}

/**
 * Drop all tables (for testing/reset)
 */
export function dropAllTables(): { success: boolean; error?: string } {
  const database = getDatabase();
  try {
    const tables = getTables();
    
    // Disable foreign keys temporarily
    database.execSync('PRAGMA foreign_keys = OFF;');
    
    for (const table of tables) {
      database.execSync(`DROP TABLE IF EXISTS ${table};`);
    }
    
    // Re-enable foreign keys
    database.execSync('PRAGMA foreign_keys = ON;');
    
    return { success: true };
  } catch (error) {
    console.error('Drop tables error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check if a table exists
 */
export function tableExists(tableName: string): boolean {
  const database = getDatabase();
  const result = database.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return !!result && result.count > 0;
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): { tables: number; rows: Record<string, number> } {
  const database = getDatabase();
  const tables = getTables();
  const rows: Record<string, number> = {};
  
  for (const table of tables) {
    const result = database.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table}`
    );
    rows[table] = result?.count || 0;
  }
  
  return { tables: tables.length, rows };
}

/**
 * Export entire database as JSON
 */
export async function exportDatabase(): Promise<{ success: boolean; data?: Record<string, unknown[]>; error?: string }> {
  const database = getDatabase();
  const tables = getTables();
  const result: Record<string, unknown[]> = {};
  
  try {
    for (const table of tables) {
      const rows = database.getAllSync(`SELECT * FROM ${table}`);
      result[table] = rows;
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Export database error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Import database from JSON
 */
export async function importDatabase(data: Record<string, unknown[]>): Promise<{ success: boolean; error?: string }> {
  const database = getDatabase();
  
  try {
    // Clear existing data
    const tables = getTables();
    for (const table of tables) {
      database.execSync(`DELETE FROM ${table};`);
    }
    
    // Import data
    for (const [table, rows] of Object.entries(data)) {
      if (!tableExists(table)) continue;
      
      const columns = Object.keys((rows as Record<string, unknown>[])[0] || {});
      if (columns.length === 0) continue;
      
      const placeholders = rows.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
      const values: unknown[] = [];
      
      for (const row of rows as Record<string, unknown>[]) {
        for (const col of columns) {
          values.push(row[col]);
        }
      }
      
      database.execSync(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`,
        values
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Import database error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Initialize database on module load
initializeDatabase();

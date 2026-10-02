/**
 * Seed Data Script for KhodroYar Application
 * 
 * This script creates demonstration data for testing and development.
 * It creates sample vehicles, services, expenses, and other entities.
 */

import { getDatabase } from '../src/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentJalaliDate, getCurrentGregorianISO, addJalaliDays, addJalaliMonths } from '../src/lib/jalaliDate';
import { ServiceCategory, SERVICE_CATEGORY_LABELS, DEFAULT_SERVICE_INTERVALS } from '../src/types/service';

// Sample Persian manufacturers and models
const SAMPLE_MANUFACTURERS = [
  { name: 'پژو', nameEn: 'Peugeot', models: ['206', '207', '405', 'پارس'] },
  { name: 'ایران خودرو', nameEn: 'Iran Khodro', models: ['سمند', 'دنا', 'رنا'] },
  { name: 'سایپا', nameEn: 'Saipa', models: ['پrid', 'تیبا', 'شاهد'] },
  { name: 'تویوتا', nameEn: 'Toyota', models: ['Corolla', 'Camry', 'RAV4'] },
  { name: 'هیوندای', nameEn: 'Hyundai', models: ['Tucson', 'Elantra', 'Santa Fe'] },
] as const;

// Sample fuel types
const SAMPLE_FUEL_TYPES = ['gasoline', 'diesel', 'cng', 'hybrid'] as const;

// Create sample vehicle
function createSampleVehicle(overrides: Partial<any> = {}): any {
  const today = getCurrentJalaliDate();
  const manufacturer = SAMPLE_MANUFACTURERS[Math.floor(Math.random() * SAMPLE_MANUFACTURERS.length)];
  const model = manufacturer.models[Math.floor(Math.random() * manufacturer.models.length)];
  const fuelType = SAMPLE_FUEL_TYPES[Math.floor(Math.random() * SAMPLE_FUEL_TYPES.length)];
  
  const baseOdometer = 50000 + Math.floor(Math.random() * 50000);
  const currentOdometer = baseOdometer + Math.floor(Math.random() * 20000);
  
  return {
    id: uuidv4(),
    manufacturer: manufacturer.name,
    manufacturerId: uuidv4(),
    model,
    modelId: uuidv4(),
    trim: ['GLX', 'EX', 'TURBO', 'Base'][Math.floor(Math.random() * 4)],
    licensePlate: generateLicensePlate(),
    vin: generateVIN(),
    productionYear: 2018 + Math.floor(Math.random() * 5),
    color: ['سفید', 'مشکی', 'نقره‌ای', 'آبی', 'قرمز'][Math.floor(Math.random() * 5)],
    fuelType,
    transmissionType: ['manual', 'automatic'][Math.floor(Math.random() * 2)],
    engineCapacity: [1400, 1600, 2000, 2500][Math.floor(Math.random() * 4)],
    currentOdometer,
    lastOdometerUpdate: getCurrentGregorianISO(),
    purchaseDate: addJalaliDays(today, -Math.floor(Math.random() * 365 * 2)),
    purchaseDateISO: getCurrentGregorianISO(),
    insuranceExpiration: addJalaliMonths(today, 6),
    insuranceExpirationISO: getCurrentGregorianISO(),
    technicalInspectionExpiration: addJalaliMonths(today, 12),
    technicalInspectionExpirationISO: getCurrentGregorianISO(),
    isDefault: false,
    isActive: true,
    status: 'active',
    imageUrl: null,
    thumbnailUrl: null,
    notes: null,
    createdAt: getCurrentGregorianISO(),
    updatedAt: getCurrentGregorianISO(),
    ...overrides,
  };
}

// Create sample odometer entry
function createSampleOdometerEntry(vehicleId: string, date: string, odometer: number): any {
  return {
    id: uuidv4(),
    vehicle_id: vehicleId,
    odometer,
    jalali_date: date,
    gregorian_date: getCurrentGregorianISO(),
    recorded_at: getCurrentGregorianISO(),
    note: null,
    is_confirmed: true,
    confirmed_at: getCurrentGregorianISO(),
    confirmed_by: null,
    is_lower_than_previous: false,
    lower_reading_reason: null,
    created_at: getCurrentGregorianISO(),
    updated_at: getCurrentGregorianISO(),
  };
}

// Create sample maintenance record
function createSampleMaintenanceRecord(vehicleId: string, vehicleOdometer: number, date: string): any {
  const categories = Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const interval = DEFAULT_SERVICE_INTERVALS[category];
  
  const baseOdometer = vehicleOdometer - Math.floor(Math.random() * 20000);
  const nextOdometer = vehicleOdometer + (interval.kilometers || 10000);
  
  const statuses = ['completed', 'scheduled', 'upcoming', 'overdue'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: uuidv4(),
    vehicle_id: vehicleId,
    service_type_id: uuidv4(),
    category,
    service_type_name: SERVICE_CATEGORY_LABELS[category],
    custom_name: null,
    jalali_date: date,
    gregorian_date: getCurrentGregorianISO(),
    odometer: baseOdometer,
    labor_cost: Math.floor(Math.random() * 2000000) + 500000,
    parts_cost: Math.floor(Math.random() * 3000000) + 1000000,
    total_cost: null,
    currency: 'IRT',
    workshop_id: null,
    workshop_name: ['کارگاه مهینی', 'سرویس بهمن', 'مرکز تخصصی خودرو'][Math.floor(Math.random() * 3)],
    workshop_contact: null,
    workshop_address: null,
    description: null,
    notes: null,
    next_service_interval: JSON.stringify(interval),
    next_service_odometer: nextOdometer,
    next_service_date: addJalaliMonths(date, interval.months || 12),
    next_service_date_iso: getCurrentGregorianISO(),
    warranty_duration_days: Math.floor(Math.random() * 365) + 90,
    warranty_expiration_date: addJalaliDays(date, 90),
    warranty_expiration_date_iso: getCurrentGregorianISO(),
    invoice_image_url: null,
    attachment_urls: null,
    status,
    completion_notes: null,
    created_at: getCurrentGregorianISO(),
    updated_at: getCurrentGregorianISO(),
    completed_at: status === 'completed' ? getCurrentGregorianISO() : null,
  };
}

// Create sample expense
function createSampleExpense(vehicleId: string, date: string): any {
  const categories = [
    'maintenance', 'repair', 'parts', 'fuel', 'third_party_insurance',
    'comprehensive_insurance', 'technical_inspection', 'parking', 'fines',
    'car_wash', 'other'
  ];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    id: uuidv4(),
    vehicle_id: vehicleId,
    title: ['هزینه سرویس', 'هزینه تعمیر', 'خرید لاستیک', 'بنزین', 'پارکینگ'][Math.floor(Math.random() * 5)],
    description: null,
    category,
    custom_category: null,
    amount: Math.floor(Math.random() * 5000000) + 100000,
    currency: 'IRT',
    expense_date: date,
    expense_date_iso: getCurrentGregorianISO(),
    odometer: null,
    maintenance_record_id: null,
    repair_id: null,
    part_id: null,
    purchase_id: null,
    payment_method: ['cash', 'card', 'online'][Math.floor(Math.random() * 3)],
    payment_reference: null,
    paid_to: null,
    tax_amount: null,
    is_tax_deductible: false,
    receipt_image_url: null,
    attachment_urls: null,
    is_recurring: false,
    recurring_frequency: null,
    recurring_interval: null,
    next_occurrence_date: null,
    next_occurrence_date_iso: null,
    notes: null,
    created_at: getCurrentGregorianISO(),
    updated_at: getCurrentGregorianISO(),
  };
}

// Generate random license plate
function generateLicensePlate(): string {
  const letters = 'ابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی';
  const numbers = '0123456789';
  
  // Common formats: 12 AB 345, 123 AB 45
  const format1 = () => {
    const num1 = numbers[Math.floor(Math.random() * 2) + Math.floor(Math.random() * 2)];
    const num2 = numbers[Math.floor(Math.random() * 10)];
    const letter1 = letters[Math.floor(Math.random() * letters.length)];
    const letter2 = letters[Math.floor(Math.random() * letters.length)];
    const num3 = numbers[Math.floor(Math.random() * 10)];
    const num4 = numbers[Math.floor(Math.random() * 10)];
    const num5 = numbers[Math.floor(Math.random() * 10)];
    return `${num1}${num2} ${letter1}${letter2} ${num3}${num4}${num5}`;
  };
  
  return format1();
}

// Generate random VIN
function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
  }
  return vin;
}

/**
 * Seed the database with demonstration data
 */
export async function seedDatabase(): Promise<{ success: boolean; error?: string }> {
  const database = getDatabase();
  
  try {
    // Clear existing data first
    console.log('Clearing existing data...');
    const tables = ['expenses', 'repairs', 'purchase_items', 'purchases', 
      'maintenance_parts', 'maintenance_records', 'reminders',
      'odometer_entries', 'parts', 'vehicles'];
    
    for (const table of tables) {
      database.execSync(`DELETE FROM ${table};`);
    }
    
    // Create sample vehicles
    console.log('Creating sample vehicles...');
    const today = getCurrentJalaliDate();
    const vehicles: any[] = [];
    
    // Create 3 sample vehicles
    for (let i = 0; i < 3; i++) {
      const vehicle = createSampleVehicle({
        isDefault: i === 0,
        manufacturer: SAMPLE_MANUFACTURERS[i % SAMPLE_MANUFACTURERS.length].name,
        model: SAMPLE_MANUFACTURERS[i % SAMPLE_MANUFACTURERS.length].models[0],
      });
      vehicles.push(vehicle);
      
      // Insert vehicle
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
      
      // Create odometer entries for each vehicle
      const startOdometer = vehicle.currentOdometer - Math.floor(Math.random() * 10000);
      for (let j = 0; j < 3; j++) {
        const date = addJalaliDays(today, -Math.floor(Math.random() * 90) * (j + 1));
        const odometer = startOdometer + Math.floor(Math.random() * 5000) * (j + 1);
        const entry = createSampleOdometerEntry(vehicle.id, date, odometer);
        
        database.execSync(`
          INSERT INTO odometer_entries (
            id, vehicle_id, odometer, jalali_date, gregorian_date,
            recorded_at, note, is_confirmed, confirmed_at, confirmed_by,
            is_lower_than_previous, lower_reading_reason, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.id,
          entry.vehicle_id,
          entry.odometer,
          entry.jalali_date,
          entry.gregorian_date,
          entry.recorded_at,
          entry.note,
          entry.is_confirmed ? 1 : 0,
          entry.confirmed_at,
          entry.confirmed_by,
          entry.is_lower_than_previous ? 1 : 0,
          entry.lower_reading_reason,
          entry.created_at,
          entry.updated_at,
        ]);
      }
      
      // Create maintenance records for each vehicle
      for (let j = 0; j < 5; j++) {
        const date = addJalaliDays(today, -Math.floor(Math.random() * 180));
        const record = createSampleMaintenanceRecord(
          vehicle.id,
          vehicle.currentOdometer,
          date
        );
        
        database.execSync(`
          INSERT INTO maintenance_records (
            id, vehicle_id, service_type_id, category, service_type_name,
            custom_name, jalali_date, gregorian_date, odometer, labor_cost,
            parts_cost, total_cost, currency, workshop_id, workshop_name,
            workshop_contact, workshop_address, description, notes,
            next_service_interval, next_service_odometer, next_service_date,
            next_service_date_iso, warranty_duration_days, warranty_expiration_date,
            warranty_expiration_date_iso, invoice_image_url, attachment_urls,
            status, completion_notes, created_at, updated_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.id,
          record.vehicle_id,
          record.service_type_id,
          record.category,
          record.service_type_name,
          record.custom_name,
          record.jalali_date,
          record.gregorian_date,
          record.odometer,
          record.labor_cost,
          record.parts_cost,
          record.total_cost,
          record.currency,
          record.workshop_id,
          record.workshop_name,
          record.workshop_contact,
          record.workshop_address,
          record.description,
          record.notes,
          record.next_service_interval,
          record.next_service_odometer,
          record.next_service_date,
          record.next_service_date_iso,
          record.warranty_duration_days,
          record.warranty_expiration_date,
          record.warranty_expiration_date_iso,
          record.invoice_image_url,
          record.attachment_urls,
          record.status,
          record.completion_notes,
          record.created_at,
          record.updated_at,
          record.completed_at,
        ]);
        
        // Add parts to some maintenance records
        if (Math.random() > 0.5) {
          const partsCount = Math.floor(Math.random() * 3) + 1;
          for (let k = 0; k < partsCount; k++) {
            const part = {
              id: uuidv4(),
              maintenance_record_id: record.id,
              name: ['فیلتر روغن', 'روغن موتور', 'لنت ترمز', 'دیسک ترمز'][Math.floor(Math.random() * 4)],
              brand: ['بوش', 'مان', 'واگن', 'توتال'][Math.floor(Math.random() * 4)],
              part_number: `PART-${Math.floor(Math.random() * 10000)}`,
              quantity: Math.floor(Math.random() * 3) + 1,
              unit_price: Math.floor(Math.random() * 500000) + 100000,
              total_price: null,
              warranty_days: Math.floor(Math.random() * 365) + 90,
              warranty_expiration: addJalaliDays(record.jalali_date, 90),
              notes: null,
            };
            
            database.execSync(`
              INSERT INTO maintenance_parts (
                id, maintenance_record_id, name, brand, part_number,
                quantity, unit_price, total_price, warranty_days,
                warranty_expiration, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              part.id,
              part.maintenance_record_id,
              part.name,
              part.brand,
              part.part_number,
              part.quantity,
              part.unit_price,
              part.total_price,
              part.warranty_days,
              part.warranty_expiration,
              part.notes,
            ]);
          }
        }
      }
      
      // Create expenses for each vehicle
      for (let j = 0; j < 10; j++) {
        const date = addJalaliDays(today, -Math.floor(Math.random() * 180));
        const expense = createSampleExpense(vehicle.id, date);
        
        database.execSync(`
          INSERT INTO expenses (
            id, vehicle_id, title, description, category, custom_category,
            amount, currency, expense_date, expense_date_iso, odometer,
            maintenance_record_id, repair_id, part_id, purchase_id,
            payment_method, payment_reference, paid_to, tax_amount,
            is_tax_deductible, receipt_image_url, attachment_urls,
            is_recurring, recurring_frequency, recurring_interval,
            next_occurrence_date, next_occurrence_date_iso, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          expense.id,
          expense.vehicle_id,
          expense.title,
          expense.description,
          expense.category,
          expense.custom_category,
          expense.amount,
          expense.currency,
          expense.expense_date,
          expense.expense_date_iso,
          expense.odometer,
          expense.maintenance_record_id,
          expense.repair_id,
          expense.part_id,
          expense.purchase_id,
          expense.payment_method,
          expense.payment_reference,
          expense.paid_to,
          expense.tax_amount,
          expense.is_tax_deductible ? 1 : 0,
          expense.receipt_image_url,
          expense.attachment_urls,
          expense.is_recurring ? 1 : 0,
          expense.recurring_frequency,
          expense.recurring_interval,
          expense.next_occurrence_date,
          expense.next_occurrence_date_iso,
          expense.notes,
          expense.created_at,
          expense.updated_at,
        ]);
      }
    }
    
    console.log(`Created ${vehicles.length} vehicles with sample data`);
    
    // Mark seed data as created
    console.log('Seed data created successfully!');
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطا در ایجاد داده‌های نمونه';
    console.error('Seed error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Remove all seed data
 */
export async function removeSeedData(): Promise<{ success: boolean; error?: string }> {
  const database = getDatabase();
  
  try {
    // Clear all data but keep the schema
    const tables = ['expenses', 'repairs', 'purchase_items', 'purchases', 
      'maintenance_parts', 'maintenance_records', 'reminders',
      'odometer_entries', 'parts', 'vehicles'];
    
    for (const table of tables) {
      database.execSync(`DELETE FROM ${table};`);
    }
    
    console.log('All seed data removed successfully!');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطا در حذف داده‌های نمونه';
    console.error('Remove seed error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if database has seed data
 */
export function hasSeedData(): boolean {
  const database = getDatabase();
  const count = database.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM vehicles'
  );
  return !!count && count.count > 0;
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase().then(result => {
    if (result.success) {
      console.log('Seed completed successfully!');
    } else {
      console.error('Seed failed:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  });
}

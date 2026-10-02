/**
 * PDF Generation Service for KhodroYar Application
 * 
 * This service handles generation of Persian RTL PDF reports using HTML-to-PDF conversion.
 * It supports IranYekan font embedding, Jalali dates, and full RTL layout.
 */

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  getCurrentJalaliDate,
  getCurrentGregorianISO,
  toPersianDigits,
  formatJalaliDate,
  formatPersianNumber,
} from '../lib/jalaliDate';
import {
  Vehicle,
  FuelType,
  PERSIAN_MANUFACTURERS,
  FUEL_TYPE_LABELS,
} from '../types/vehicle';
import {
  MaintenanceRecord,
  ServiceCategory,
  ServiceStatus,
  SERVICE_CATEGORY_LABELS,
  SERVICE_STATUS_LABELS,
} from '../types/service';
import {
  Expense,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from '../types/expense';
import {
  Repair,
  RepairStatus,
  REPAIR_STATUS_LABELS,
} from '../types/repair';
import {
  Part,
  PartInstallationStatus,
  PART_INSTALLATION_STATUS_LABELS,
  PART_CATEGORY_LABELS,
} from '../types/part';
import { OdometerEntry } from '../types/odometer';
import { AppSettings } from '../types/settings';

// Font configuration
// Note: IranYekan is commercial and must be legally obtained
// This service is designed to work with legally placed font files
const FONT_FAMILY = 'IRANYekan';

// Font paths - check both assets directory and document directory
// Priority: 1) assets/fonts/iranyekan/ (bundled with app)
//          2) FileSystem.documentDirectory + 'assets/fonts/iranyekan/' (copied at runtime)
const FONT_PATHS = {
  regular: 'assets/fonts/iranyekan/IRANYekanX-Regular.ttf',
  medium: 'assets/fonts/iranyekan/IRANYekanX-Medium.ttf',
  bold: 'assets/fonts/iranyekan/IRANYekanX-Bold.ttf',
};

// Fallback font for development (open-source Persian font)
const FALLBACK_FONT = 'Vazirmatn';

// Report types
export type ReportType = 
  | 'vehicle_history'
  | 'maintenance_history'
  | 'repair_history'
  | 'parts_purchases'
  | 'expense_report'
  | 'upcoming_maintenance'
  | 'insurance_inspection'
  | 'ownership_report';

// Report configuration
export interface ReportConfig {
  reportType: ReportType;
  vehicleId: string;
  startDate?: string; // Jalali date
  endDate?: string; // Jalali date
  expenseCategories?: ExpenseCategory[];
  serviceCategories?: ServiceCategory[];
  includeAttachments?: boolean;
  includeDetails?: boolean; // true = detailed, false = summary
}

// Report data model
export interface ReportData {
  vehicle: Vehicle;
  odometerEntries: OdometerEntry[];
  maintenanceRecords: MaintenanceRecord[];
  repairRecords: Repair[];
  expenseRecords: Expense[];
  partRecords: Part[];
  settings: AppSettings;
  generatedAt: string; // Jalali date
  generatedAtISO: string; // Gregorian ISO
}

// Generated PDF result
export interface PDFResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

// Share result
export interface ShareResult {
  success: boolean;
  error?: string;
}

/**
 * Get Persian label for report type
 */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  vehicle_history: 'تاریخچه کامل خودرو',
  maintenance_history: 'تاریخچه سرویس‌ها',
  repair_history: 'تاریخچه تعمیرات',
  parts_purchases: 'لیست قطعات و خریدها',
  expense_report: 'گزارش هزینه‌ها',
  upcoming_maintenance: 'سرویس‌های آینده و سررسید گذشته',
  insurance_inspection: 'وضعیت بیمه و معاینه فنی',
  ownership_report: 'گزارش مالکیت خودرو',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>')
    .replace(/\r/g, '');
}

/**
 * Sanitize filename for saving
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

/**
 * Get font CSS based on available fonts
 */
async function getFontCss(): Promise<string> {
  // Check if IranYekan fonts are available
  // First check in the assets directory (bundled fonts)
  // Then check in the document directory (user-provided fonts)
  let fontAvailable = false;
  let regularPath = FONT_PATHS.regular;
  let mediumPath = FONT_PATHS.medium;
  let boldPath = FONT_PATHS.bold;
  
  try {
    // Check bundled assets first
    const regularFont = await FileSystem.getInfoAsync(regularPath);
    const mediumFont = await FileSystem.getInfoAsync(mediumPath);
    const boldFont = await FileSystem.getInfoAsync(boldPath);
    
    if (regularFont.exists && mediumFont.exists && boldFont.exists) {
      fontAvailable = true;
    } else {
      // Try document directory as fallback for user-provided fonts
      const docRegularPath = FileSystem.documentDirectory + 'assets/fonts/iranyekan/IRANYekanX-Regular.ttf';
      const docMediumPath = FileSystem.documentDirectory + 'assets/fonts/iranyekan/IRANYekanX-Medium.ttf';
      const docBoldPath = FileSystem.documentDirectory + 'assets/fonts/iranyekan/IRANYekanX-Bold.ttf';
      
      const docRegularFont = await FileSystem.getInfoAsync(docRegularPath);
      const docMediumFont = await FileSystem.getInfoAsync(docMediumPath);
      const docBoldFont = await FileSystem.getInfoAsync(docBoldPath);
      
      if (docRegularFont.exists && docMediumFont.exists && docBoldFont.exists) {
        fontAvailable = true;
        regularPath = docRegularPath;
        mediumPath = docMediumPath;
        boldPath = docBoldPath;
      }
    }
  } catch {
    // Font check failed, use fallback
    fontAvailable = false;
  }
  
  if (fontAvailable) {
    return `
      @font-face {
        font-family: '${FONT_FAMILY}';
        src: url('${regularPath}') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: '${FONT_FAMILY}';
        src: url('${mediumPath}') format('truetype');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: '${FONT_FAMILY}';
        src: url('${boldPath}') format('truetype');
        font-weight: bold;
        font-style: normal;
      }
      body, .persian-text {
        font-family: '${FONT_FAMILY}', ${FALLBACK_FONT}, sans-serif !important;
      }
    `;
  }
  
  // Fallback to system fonts with Persian support
  return `
    body, .persian-text {
      font-family: ${FALLBACK_FONT}, 'System', sans-serif !important;
    }
  `;
}

/**
 * Get base HTML template with RTL support
 */
async function getBaseHtmlTemplate(title: string, content: string): Promise<string> {
  const fontCss = await getFontCss();
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${fontCss}
    
    @page {
      size: A4;
      margin: 20mm;
      margin-top: 25mm;
      margin-bottom: 20mm;
    }
    
    body {
      direction: rtl;
      text-align: right;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
    }
    
    .header {
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      height: 45mm;
      background-color: #1e3a8a;
      color: white;
      padding: 10mm;
      text-align: right;
      z-index: 100;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
    }
    
    .logo-section {
      flex: 1;
    }
    
    .logo-section img {
      max-height: 25mm;
    }
    
    .title-section {
      flex: 2;
      text-align: right;
    }
    
    .app-title {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 2pt;
    }
    
    .report-title {
      font-size: 14pt;
      font-weight: bold;
    }
    
    .main-content {
      margin-top: 50mm;
      padding: 0;
    }
    
    .section {
      margin-bottom: 20pt;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e3a8a;
      border-bottom: 2pt solid #06b6d4;
      padding-bottom: 6pt;
      margin-bottom: 10pt;
    }
    
    .section-subtitle {
      font-size: 12pt;
      font-weight: 600;
      color: #1e3a8a;
      margin-top: 15pt;
      margin-bottom: 8pt;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
      font-size: 10pt;
    }
    
    th, td {
      border: 1pt solid #e2e8f0;
      padding: 8pt;
      text-align: right;
    }
    
    th {
      background-color: #1e3a8a;
      color: white;
      font-weight: bold;
    }
    
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    tr:hover {
      background-color: #e2e8f0;
    }
    
    .footer {
      position: fixed;
      bottom: 0;
      right: 0;
      left: 0;
      height: 15mm;
      background-color: #f8fafc;
      border-top: 1pt solid #e2e8f0;
      padding: 5mm;
      text-align: center;
      font-size: 8pt;
      color: #64748b;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150pt, 1fr));
      gap: 10pt;
      margin: 10pt 0;
    }
    
    .info-item {
      break-inside: avoid;
    }
    
    .info-label {
      font-size: 9pt;
      color: #64748b;
      font-weight: normal;
    }
    
    .info-value {
      font-size: 11pt;
      font-weight: 600;
      color: #1e293b;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15pt;
      margin: 15pt 0;
    }
    
    .summary-card {
      background-color: #f8fafc;
      border: 1pt solid #e2e8f0;
      border-radius: 8pt;
      padding: 12pt;
    }
    
    .summary-label {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 4pt;
    }
    
    .summary-value {
      font-size: 14pt;
      font-weight: bold;
      color: #1e3a8a;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4pt 8pt;
      border-radius: 4pt;
      font-size: 8pt;
      font-weight: bold;
    }
    
    .status-completed {
      background-color: #10b981;
      color: white;
    }
    
    .status-upcoming {
      background-color: #f59e0b;
      color: white;
    }
    
    .status-overdue {
      background-color: #ef4444;
      color: white;
    }
    
    .status-pending {
      background-color: #3b82f6;
      color: white;
    }
    
    .cost-amount {
      font-family: 'Tahoma', monospace;
      font-size: 10pt;
    }
    
    .no-data {
      text-align: center;
      padding: 20pt;
      color: #64748b;
      font-style: italic;
    }
    
    .vehicle-info {
      display: flex;
      gap: 20pt;
      margin-bottom: 20pt;
      page-break-inside: avoid;
    }
    
    .vehicle-image {
      width: 100pt;
      height: 80pt;
      object-fit: contain;
      border: 1pt solid #e2e8f0;
      border-radius: 8pt;
    }
    
    .vehicle-details {
      flex: 1;
    }
    
    .total-row {
      font-weight: bold;
      background-color: #f0f9ff !important;
    }
    
    @media print {
      .header {
        position: fixed;
        top: 0;
      }
      .footer {
        position: fixed;
        bottom: 0;
      }
      body {
        margin-top: 50mm;
        margin-bottom: 20mm;
      }
    }
    
    @media screen {
      body {
        max-width: 800px;
        margin: 20px auto;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-content">
      <div class="logo-section">
        <img src="khodroyar-logo" alt="خودرویار" />
      </div>
      <div class="title-section">
        <div class="app-title">خودرویار</div>
        <div class="report-title">${escapeHtml(title)}</div>
      </div>
    </div>
  </div>
  
  <div class="main-content">
    ${content}
  </div>
  
  <div class="footer">
    <div class="footer-content">
      <span>تولید شده توسط خودرویار</span>
      <span id="page-number">صفحه <span class="page-number"></span> از <span class="total-pages"></span></span>
      <span id="generation-date">تاریخ تولید: ${toPersianDigits(getCurrentJalaliDate())}</span>
    </div>
  </div>
  
  <script>
    // Add page numbers
    const totalPages = Math.ceil(document.body.scrollHeight / (297 * 3.7795275591));
    document.querySelectorAll('.page-number').forEach(el => el.textContent = String(window.printPageNumber || 1));
    document.querySelectorAll('.total-pages').forEach(el => el.textContent = String(totalPages));
    
    // Ensure RTL direction
    document.querySelectorAll('table').forEach(table => {
      table.dir = 'rtl';
    });
  </script>
</body>
</html>
  `;
}

/**
 * Format currency with Persian digits
 */
export function formatCurrency(amount: number | undefined, currency: string = 'IRT'): string {
  if (amount === undefined || amount === null) return '۰';
  
  const formatted = new Intl.NumberFormat('fa-IR').format(Math.round(amount));
  const persianFormatted = toPersianDigits(formatted);
  
  if (currency === 'IRT') {
    return `${persianFormatted} تومان`;
  } else if (currency === 'IRR') {
    return `${persianFormatted} ریال`;
  }
  return `${persianFormatted} ${currency}`;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status: ServiceStatus | RepairStatus | PartInstallationStatus): string {
  const statusLabels: Record<string, string> = {
    ...SERVICE_STATUS_LABELS,
    ...REPAIR_STATUS_LABELS,
    ...PART_INSTALLATION_STATUS_LABELS,
  };
  
  const label = statusLabels[status] || status;
  const persianLabel = toPersianDigits(label);
  
  let className = 'status-badge';
  if (['completed', 'installed', 'purchased'].includes(status)) {
    className += ' status-completed';
  } else if (['overdue', 'needs_revisit', 'not_installed'].includes(status)) {
    className += ' status-overdue';
  } else if (['upcoming', 'due', 'pending_review', 'warranty_expired'].includes(status)) {
    className += ' status-upcoming';
  } else {
    className += ' status-pending';
  }
  
  return `<span class="${className}">${escapeHtml(persianLabel)}</span>`;
}

/**
 * Get service category label
 */
function getServiceCategoryLabel(category: ServiceCategory): string {
  return SERVICE_CATEGORY_LABELS[category] || category;
}

/**
 * Get expense category label
 */
function getExpenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_LABELS[category] || category;
}

/**
 * Get fuel type label
 */
function getFuelTypeLabel(fuelType: FuelType): string {
  return FUEL_TYPE_LABELS[fuelType] || fuelType;
}

/**
 * Generate vehicle information section
 */
function generateVehicleInfoHtml(vehicle: Vehicle): string {
  const manufacturer = PERSIAN_MANUFACTURERS.find(m => m.id === vehicle.manufacturerId)?.name || vehicle.manufacturer;
  
  return `
<div class="vehicle-info">
  <div class="vehicle-details">
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">سازنده</div>
        <div class="info-value">${escapeHtml(toPersianDigits(manufacturer))}</div>
      </div>
      <div class="info-item">
        <div class="info-label">مدل</div>
        <div class="info-value">${escapeHtml(toPersianDigits(vehicle.model))}</div>
      </div>
      <div class="info-item">
        <div class="info-label">سال تولید</div>
        <div class="info-value">${escapeHtml(toPersianDigits(String(vehicle.productionYear)))}</div>
      </div>
      <div class="info-item">
        <div class="info-label">پلاک</div>
        <div class="info-value">${escapeHtml(toPersianDigits(vehicle.licensePlate))}</div>
      </div>
      ${vehicle.trim ? `
      <div class="info-item">
        <div class="info-label">تریم</div>
        <div class="info-value">${escapeHtml(toPersianDigits(vehicle.trim))}</div>
      </div>
      ` : ''}
      <div class="info-item">
        <div class="info-label">نوع سوخت</div>
        <div class="info-value">${escapeHtml(toPersianDigits(getFuelTypeLabel(vehicle.fuelType)))}</div>
      </div>
      <div class="info-item">
        <div class="info-label">کارکرد فعلی</div>
        <div class="info-value">${escapeHtml(toPersianDigits(Math.round(vehicle.currentOdometer).toLocaleString('fa-IR')))} کیلومتر</div>
      </div>
      ${vehicle.vin ? `
      <div class="info-item">
        <div class="info-label">شاسی</div>
        <div class="info-value">${escapeHtml(toPersianDigits(vehicle.vin))}</div>
      </div>
      ` : ''}
    </div>
  </div>
</div>
  `;
}

/**
 * Generate maintenance history table
 */
function generateMaintenanceTableHtml(
  records: MaintenanceRecord[],
  includeDetails: boolean
): string {
  if (records.length === 0) {
    return '<div class="no-data">اطلاعاتی ثبت نشده است</div>';
  }
  
  const headers = includeDetails ? `
    <tr>
      <th>ردیف</th>
      <th>عنوان سرویس</th>
      <th>تاریخ</th>
      <th>کارکرد</th>
      <th>کارگاه</th>
      <th>هزینه کل</th>
      <th>کارکرد بعدی</th>
      <th>تاریخ بعدی</th>
      <th>وضعیت</th>
    </tr>
  ` : `
    <tr>
      <th>عنوان سرویس</th>
      <th>تاریخ</th>
      <th>کارکرد</th>
      <th>هزینه کل</th>
      <th>وضعیت</th>
    </tr>
  `;
  
  const rows = records.map((record, index) => {
    const categoryLabel = getServiceCategoryLabel(record.category);
    const serviceName = record.customName || categoryLabel;
    const totalCost = formatCurrency(record.totalCost, record.currency);
    
    if (includeDetails) {
      return `
      <tr>
        <td>${toPersianDigits(String(index + 1))}</td>
        <td>${escapeHtml(toPersianDigits(serviceName))}</td>
        <td>${escapeHtml(toPersianDigits(record.jalaliDate))}</td>
        <td>${escapeHtml(toPersianDigits(record.odometer.toLocaleString('fa-IR')))}</td>
        <td>${escapeHtml(record.workshopName || '-')}</td>
        <td class="cost-amount">${totalCost}</td>
        <td>${record.nextServiceOdometer ? escapeHtml(toPersianDigits(record.nextServiceOdometer.toLocaleString('fa-IR'))) : '-'}</td>
        <td>${record.nextServiceDate ? escapeHtml(toPersianDigits(record.nextServiceDate)) : '-'}</td>
        <td>${getStatusBadge(record.status)}</td>
      </tr>
      ${record.notes ? `
      <tr>
        <td colspan="9" style="padding: 4pt 8pt !important;">
          <small style="color: #64748b;">${escapeHtml(toPersianDigits(record.notes))}</small>
        </td>
      </tr>
      ` : ''}
      `;
    }
    
    return `
    <tr>
      <td>${escapeHtml(toPersianDigits(serviceName))}</td>
      <td>${escapeHtml(toPersianDigits(record.jalaliDate))}</td>
      <td>${escapeHtml(toPersianDigits(record.odometer.toLocaleString('fa-IR')))}</td>
      <td class="cost-amount">${totalCost}</td>
      <td>${getStatusBadge(record.status)}</td>
    </tr>
    `;
  }).join('\n');
  
  const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalCostFormatted = formatCurrency(totalCost, records[0]?.currency || 'IRT');
  
  return `
<table>
  <thead>${headers}</thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="${includeDetails ? '4' : '2'}"><strong>جمع کل</strong></td>
      <td colspan="${includeDetails ? '5' : '3'}" style="text-align: left;"><strong>${totalCostFormatted}</strong></td>
    </tr>
  </tfoot>
</table>
  `;
}

/**
 * Generate repair history table
 */
function generateRepairTableHtml(
  records: Repair[],
  includeDetails: boolean
): string {
  if (records.length === 0) {
    return '<div class="no-data">اطلاعاتی ثبت نشده است</div>';
  }
  
  const headers = includeDetails ? `
    <tr>
      <th>ردیف</th>
      <th>عنوان مشکل</th>
      <th>تاریخ تعمیر</th>
      <th>کارکرد</th>
      <th>کارگاه</th>
      <th>هزینه دستمزد</th>
      <th>هزینه قطعات</th>
      <th>هزینه کل</th>
      <th>وضعیت</th>
    </tr>
  ` : `
    <tr>
      <th>عنوان مشکل</th>
      <th>تاریخ تعمیر</th>
      <th>کارکرد</th>
      <th>هزینه کل</th>
      <th>وضعیت</th>
    </tr>
  `;
  
  const rows = records.map((record, index) => {
    const totalCost = formatCurrency(record.totalCost, record.currency);
    const laborCost = formatCurrency(record.laborCost, record.currency);
    const partsCost = formatCurrency(record.partsCost, record.currency);
    
    if (includeDetails) {
      return `
      <tr>
        <td>${toPersianDigits(String(index + 1))}</td>
        <td>${escapeHtml(toPersianDigits(record.title))}</td>
        <td>${escapeHtml(toPersianDigits(record.repairDate))}</td>
        <td>${escapeHtml(toPersianDigits(record.odometer.toLocaleString('fa-IR')))}</td>
        <td>${escapeHtml(record.workshopName || '-')}</td>
        <td class="cost-amount">${laborCost}</td>
        <td class="cost-amount">${partsCost}</td>
        <td class="cost-amount">${totalCost}</td>
        <td>${getStatusBadge(record.status)}</td>
      </tr>
      ${record.repairDescription ? `
      <tr>
        <td colspan="9" style="padding: 4pt 8pt !important;">
          <small style="color: #64748b;">${escapeHtml(toPersianDigits(record.repairDescription))}</small>
        </td>
      </tr>
      ` : ''}
      `;
    }
    
    return `
    <tr>
      <td>${escapeHtml(toPersianDigits(record.title))}</td>
      <td>${escapeHtml(toPersianDigits(record.repairDate))}</td>
      <td>${escapeHtml(toPersianDigits(record.odometer.toLocaleString('fa-IR')))}</td>
      <td class="cost-amount">${totalCost}</td>
      <td>${getStatusBadge(record.status)}</td>
    </tr>
    `;
  }).join('\n');
  
  const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalCostFormatted = formatCurrency(totalCost, records[0]?.currency || 'IRT');
  
  return `
<table>
  <thead>${headers}</thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="${includeDetails ? '4' : '2'}"><strong>جمع کل</strong></td>
      <td colspan="${includeDetails ? '5' : '3'}" style="text-align: left;"><strong>${totalCostFormatted}</strong></td>
    </tr>
  </tfoot>
</table>
  `;
}

/**
 * Generate expense table
 */
function generateExpenseTableHtml(
  records: Expense[],
  includeDetails: boolean
): string {
  if (records.length === 0) {
    return '<div class="no-data">اطلاعاتی ثبت نشده است</div>';
  }
  
  const headers = includeDetails ? `
    <tr>
      <th>ردیف</th>
      <th>عنوان</th>
      <th>دسته‌بندی</th>
      <th>تاریخ</th>
      <th>کارکرد</th>
      <th>مبلغ</th>
      <th>روش پرداخت</th>
      <th>توضیحات</th>
    </tr>
  ` : `
    <tr>
      <th>عنوان</th>
      <th>دسته‌بندی</th>
      <th>تاریخ</th>
      <th>مبلغ</th>
    </tr>
  `;
  
  const rows = records.map((record, index) => {
    const categoryLabel = getExpenseCategoryLabel(record.category);
    const amount = formatCurrency(record.amount, record.currency);
    
    if (includeDetails) {
      return `
      <tr>
        <td>${toPersianDigits(String(index + 1))}</td>
        <td>${escapeHtml(toPersianDigits(record.title))}</td>
        <td>${escapeHtml(toPersianDigits(categoryLabel))}</td>
        <td>${escapeHtml(toPersianDigits(record.expenseDate))}</td>
        <td>${record.odometer ? escapeHtml(toPersianDigits(record.odometer.toLocaleString('fa-IR'))) : '-'}</td>
        <td class="cost-amount">${amount}</td>
        <td>${escapeHtml(record.paymentMethod || '-')}</td>
        <td>${escapeHtml(toPersianDigits(record.notes || '-'))}</td>
      </tr>
      `;
    }
    
    return `
    <tr>
      <td>${escapeHtml(toPersianDigits(record.title))}</td>
      <td>${escapeHtml(toPersianDigits(categoryLabel))}</td>
      <td>${escapeHtml(toPersianDigits(record.expenseDate))}</td>
      <td class="cost-amount">${amount}</td>
    </tr>
    `;
  }).join('\n');
  
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  const totalFormatted = formatCurrency(totalAmount, records[0]?.currency || 'IRT');
  
  return `
<table>
  <thead>${headers}</thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="${includeDetails ? '5' : '2'}"><strong>جمع کل</strong></td>
      <td colspan="${includeDetails ? '3' : '2'}" style="text-align: left;"><strong>${totalFormatted}</strong></td>
    </tr>
  </tfoot>
</table>
  `;
}

/**
 * Generate parts table
 */
function generatePartsTableHtml(
  records: Part[],
  includeDetails: boolean
): string {
  if (records.length === 0) {
    return '<div class="no-data">اطلاعاتی ثبت نشده است</div>';
  }
  
  const headers = includeDetails ? `
    <tr>
      <th>ردیف</th>
      <th>نام قطعه</th>
      <th>برند</th>
      <th>شماره قطعه</th>
      <th>دسته‌بندی</th>
      <th>تاریخ خرید</th>
      <th>قیمت</th>
      <th>وضعیت نصب</th>
    </tr>
  ` : `
    <tr>
      <th>نام قطعه</th>
      <th>برند</th>
      <th>شماره قطعه</th>
      <th>قیمت</th>
      <th>وضعیت نصب</th>
    </tr>
  `;
  
  const rows = records.map((record, index) => {
    const categoryLabel = PART_CATEGORY_LABELS[record.category] || record.category;
    const installationLabel = PART_INSTALLATION_STATUS_LABELS[record.installationStatus] || record.installationStatus;
    const price = formatCurrency(record.purchasePrice, record.currency);
    
    if (includeDetails) {
      return `
      <tr>
        <td>${toPersianDigits(String(index + 1))}</td>
        <td>${escapeHtml(toPersianDigits(record.name))}</td>
        <td>${escapeHtml(toPersianDigits(record.brand || '-'))}</td>
        <td>${escapeHtml(toPersianDigits(record.partNumber || '-'))}</td>
        <td>${escapeHtml(toPersianDigits(categoryLabel))}</td>
        <td>${escapeHtml(toPersianDigits(record.installedJalaliDate || '-'))}</td>
        <td class="cost-amount">${price}</td>
        <td>${getStatusBadge(record.installationStatus as PartInstallationStatus)}</td>
      </tr>
      ${record.notes ? `
      <tr>
        <td colspan="8" style="padding: 4pt 8pt !important;">
          <small style="color: #64748b;">${escapeHtml(toPersianDigits(record.notes))}</small>
        </td>
      </tr>
      ` : ''}
      `;
    }
    
    return `
    <tr>
      <td>${escapeHtml(toPersianDigits(record.name))}</td>
      <td>${escapeHtml(toPersianDigits(record.brand || '-'))}</td>
      <td>${escapeHtml(toPersianDigits(record.partNumber || '-'))}</td>
      <td class="cost-amount">${price}</td>
      <td>${getStatusBadge(record.installationStatus as PartInstallationStatus)}</td>
    </tr>
    `;
  }).join('\n');
  
  const totalPrice = records.reduce((sum, r) => sum + (r.purchasePrice || 0), 0);
  const totalFormatted = formatCurrency(totalPrice, records[0]?.currency || 'IRT');
  
  return `
<table>
  <thead>${headers}</thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="${includeDetails ? '5' : '3'}"><strong>جمع کل</strong></td>
      <td colspan="${includeDetails ? '3' : '2'}" style="text-align: left;"><strong>${totalFormatted}</strong></td>
    </tr>
  </tfoot>
</table>
  `;
}

/**
 * Generate summary cards
 */
function generateSummaryCardsHtml(
  vehicle: Vehicle,
  maintenanceRecords: MaintenanceRecord[],
  repairRecords: Repair[],
  expenseRecords: Expense[]
): string {
  const totalMaintenance = maintenanceRecords.filter(r => r.status === 'completed').length;
  const totalRepairs = repairRecords.filter(r => r.status === 'completed').length;
  const totalUpcoming = maintenanceRecords.filter(r => ['upcoming', 'due'].includes(r.status)).length;
  const totalOverdue = maintenanceRecords.filter(r => r.status === 'overdue').length;
  
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalRepairCost = repairRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalExpenseCost = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const grandTotal = totalMaintenanceCost + totalRepairCost + totalExpenseCost;
  
  return `
<div class="summary-grid">
  <div class="summary-card">
    <div class="summary-label">تعداد سرویس‌های انجام شده</div>
    <div class="summary-value">${toPersianDigits(String(totalMaintenance))}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">تعداد تعمیرات انجام شده</div>
    <div class="summary-value">${toPersianDigits(String(totalRepairs))}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">سرویس‌های نزدیک به موعد</div>
    <div class="summary-value">${toPersianDigits(String(totalUpcoming))}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">سرویس‌های سررسید گذشته</div>
    <div class="summary-value">${toPersianDigits(String(totalOverdue))}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">هزینه سرویس‌ها</div>
    <div class="summary-value">${formatCurrency(totalMaintenanceCost, 'IRT')}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">هزینه تعمیرات</div>
    <div class="summary-value">${formatCurrency(totalRepairCost, 'IRT')}</div>
  </div>
  <div class="summary-card">
    <div class="summary-label">هزینه‌ها</div>
    <div class="summary-value">${formatCurrency(totalExpenseCost, 'IRT')}</div>
  </div>
  <div class="summary-card" style="grid-column: 1 / -1;">
    <div class="summary-label">جمع کل هزینه‌ها</div>
    <div class="summary-value" style="font-size: 16pt;">${formatCurrency(grandTotal, 'IRT')}</div>
  </div>
</div>
  `;
}

/**
 * Generate expense by category summary
 */
function generateExpenseByCategoryHtml(expenses: Expense[]): string {
  const byCategory: Record<string, { count: number; amount: number }> = {};
  
  expenses.forEach(e => {
    const category = e.customCategory || e.category;
    const label = getExpenseCategoryLabel(e.category);
    const key = category;
    
    if (!byCategory[key]) {
      byCategory[key] = { count: 0, amount: 0 };
    }
    byCategory[key].count++;
    byCategory[key].amount += e.amount;
  });
  
  const categories = Object.entries(byCategory).map(([key, data]) => ({
    key,
    label: getExpenseCategoryLabel(key as ExpenseCategory),
    ...data,
  }));
  
  if (categories.length === 0) {
    return '<div class="no-data">داده‌ای برای نمایش وجود ندارد</div>';
  }
  
  const rows = categories.map(({ label, count, amount }) => `
    <tr>
      <td>${escapeHtml(toPersianDigits(label))}</td>
      <td>${toPersianDigits(String(count))}</td>
      <td class="cost-amount">${formatCurrency(amount, 'IRT')}</td>
    </tr>
  `).join('\n');
  
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);
  const totalAmount = categories.reduce((sum, c) => sum + c.amount, 0);
  
  return `
<div class="section-subtitle">هزینه‌ها بر اساس دسته‌بندی</div>
<table>
  <thead>
    <tr>
      <th>دسته‌بندی</th>
      <th>تعداد</th>
      <th>مبلغ کل</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td><strong>جمع</strong></td>
      <td><strong>${toPersianDigits(String(totalCount))}</strong></td>
      <td class="cost-amount" style="text-align: left;"><strong>${formatCurrency(totalAmount, 'IRT')}</strong></td>
    </tr>
  </tfoot>
</table>
  `;
}

/**
 * Generate upcoming maintenance section
 */
function generateUpcomingMaintenanceHtml(records: MaintenanceRecord[]): string {
  const upcoming = records.filter(r => ['upcoming', 'due'].includes(r.status));
  const overdue = records.filter(r => r.status === 'overdue');
  
  if (upcoming.length === 0 && overdue.length === 0) {
    return '<div class="no-data">سرویس نزدیکی برای نمایش وجود ندارد</div>';
  }
  
  const all = [...upcoming, ...overdue];
  
  const rows = all.map((record, index) => {
    const categoryLabel = getServiceCategoryLabel(record.category);
    const serviceName = record.customName || categoryLabel;
    const nextKm = record.nextServiceOdometer 
      ? toPersianDigits(Math.max(0, record.nextServiceOdometer - record.odometer).toLocaleString('fa-IR'))
      : '-';
    
    return `
    <tr>
      <td>${toPersianDigits(String(index + 1))}</td>
      <td>${escapeHtml(toPersianDigits(serviceName))}</td>
      <td>${record.nextServiceOdometer ? escapeHtml(toPersianDigits(record.nextServiceOdometer.toLocaleString('fa-IR'))) : '-'}</td>
      <td>${nextKm} کیلومتر مانده</td>
      <td>${record.nextServiceDate ? escapeHtml(toPersianDigits(record.nextServiceDate)) : '-'}</td>
      <td>${getStatusBadge(record.status as ServiceStatus)}</td>
    </tr>
    `;
  }).join('\n');
  
  return `
<div class="section-subtitle">سرویس‌های آینده و سررسید گذشته</div>
<table>
  <thead>
    <tr>
      <th>ردیف</th>
      <th>عنوان سرویس</th>
      <th>کارکرد بعدی</th>
      <th>کشورد باقی‌مانده</th>
      <th>تاریخ بعدی</th>
      <th>وضعیت</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
<p style="font-size: 9pt; color: #64748b; margin-top: 10pt;">
  هر زمان که کارکرد جدیدی ثبت می‌کنید، یادآوری‌های کیلومتری مجدداً محاسبه می‌شوند.
</p>
  `;
}

/**
 * Generate insurance and inspection status section
 */
function generateInsuranceInspectionHtml(vehicle: Vehicle): string {
  const info = [
    {
      label: 'بیمه شخص ثالث',
      date: vehicle.insuranceExpiration,
      type: 'insurance' as const,
    },
    {
      label: 'بیمه بدنه',
      date: vehicle.warrantyExpiration,
      type: 'warranty' as const,
    },
    {
      label: 'معاینه فنی',
      date: vehicle.technicalInspectionExpiration,
      type: 'inspection' as const,
    },
  ].filter(item => item.date);
  
  if (info.length === 0) {
    return '<div class="no-data">تاریخ‌های بیمه و معاینه ثبت نشده است</div>';
  }
  
  const rows = info.map((item, index) => {
    const jalaliDate = formatJalaliDate(item.date!);
    const persianDate = toPersianDigits(jalaliDate);
    
    // Calculate days remaining (simplified)
    const today = new Date();
    const expDate = new Date(item.date!);
    const daysRemaining = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysText = daysRemaining > 0 
      ? `${toPersianDigits(String(daysRemaining))} روز مانده`
      : `${toPersianDigits(String(Math.abs(daysRemaining)))} روز گذشته`;
    
    const statusClass = daysRemaining > 30 ? 'status-completed' : 
                      daysRemaining > 0 ? 'status-upcoming' : 'status-overdue';
    
    return `
    <tr>
      <td>${toPersianDigits(String(index + 1))}</td>
      <td><strong>${escapeHtml(toPersianDigits(item.label))}</strong></td>
      <td>${escapeHtml(persianDate)}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(toPersianDigits(daysText))}</span></td>
    </tr>
    `;
  }).join('\n');
  
  return `
<div class="section-subtitle">وضعیت بیمه و معاینه فنی</div>
<table>
  <thead>
    <tr>
      <th>ردیف</th>
      <th>عنوان</th>
      <th>تاریخ انقضا</th>
      <th>وضعیت</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
  `;
}

/**
 * Generate complete vehicle history report
 */
export async function generateVehicleHistoryReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const {
    vehicle,
    maintenanceRecords,
    repairRecords,
    expenseRecords,
    partRecords,
    settings,
  } = data;
  
  const includeDetails = config.includeDetails !== false;
  
  // Filter records by date range if specified
  const filteredMaintenance = config.startDate && config.endDate
    ? maintenanceRecords.filter(r => 
        r.jalaliDate >= config.startDate! && r.jalaliDate <= config.endDate!
      )
    : maintenanceRecords;
  
  const filteredRepairs = config.startDate && config.endDate
    ? repairRecords.filter(r => 
        r.repairDate >= config.startDate! && r.repairDate <= config.endDate!
      )
    : repairRecords;
  
  const filteredExpenses = config.startDate && config.endDate
    ? expenseRecords.filter(r => 
        r.expenseDate >= config.startDate! && r.expenseDate <= config.endDate!
      )
    : expenseRecords;
  
  const filteredParts = config.startDate && config.endDate && partRecords.length > 0
    ? partRecords.filter(r => 
        r.installedJalaliDate && 
        r.installedJalaliDate >= config.startDate! && 
        r.installedJalaliDate <= config.endDate!
      )
    : partRecords;
  
  const dateRangeText = config.startDate && config.endDate
    ? ` از ${toPersianDigits(config.startDate)} تا ${toPersianDigits(config.endDate)}`
    : '';
  
  const title = `گزارش کامل خودرو ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}${dateRangeText}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">خلاصه</div>
  ${generateSummaryCardsHtml(vehicle, filteredMaintenance, filteredRepairs, filteredExpenses)}
</div>

<div class="section">
  <div class="section-title">تاریخچه سرویس‌ها</div>
  ${generateMaintenanceTableHtml(filteredMaintenance, includeDetails)}
</div>

<div class="section">
  <div class="section-title">تاریخچه تعمیرات</div>
  ${generateRepairTableHtml(filteredRepairs, includeDetails)}
</div>

<div class="section">
  <div class="section-title">هزینه‌ها</div>
  ${generateExpenseByCategoryHtml(filteredExpenses)}
  ${generateExpenseTableHtml(filteredExpenses, includeDetails)}
</div>

<div class="section">
  <div class="section-title">قطعات و خریدها</div>
  ${generatePartsTableHtml(filteredParts, includeDetails)}
</div>

<div class="section">
  <div class="section-title">برنامه سرویس‌های آینده</div>
  ${generateUpcomingMaintenanceHtml(maintenanceRecords)}
</div>

<div class="section">
  <div class="section-title">وضعیت بیمه و معاینه</div>
  ${generateInsuranceInspectionHtml(vehicle)}
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate maintenance history report
 */
export async function generateMaintenanceReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const { vehicle, maintenanceRecords, settings } = data;
  const includeDetails = config.includeDetails !== false;
  
  const filtered = config.startDate && config.endDate
    ? maintenanceRecords.filter(r => 
        r.jalaliDate >= config.startDate! && r.jalaliDate <= config.endDate!
      )
    : maintenanceRecords;
  
  const dateRangeText = config.startDate && config.endDate
    ? ` از ${toPersianDigits(config.startDate)} تا ${toPersianDigits(config.endDate)}`
    : '';
  
  const title = `تاریخچه سرویس‌ها - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}${dateRangeText}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">تاریخچه سرویس‌ها</div>
  ${generateMaintenanceTableHtml(filtered, includeDetails)}
</div>

<div class="section">
  <div class="section-title">سرویس‌های آینده</div>
  ${generateUpcomingMaintenanceHtml(maintenanceRecords)}
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate repair history report
 */
export async function generateRepairReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const { vehicle, repairRecords, settings } = data;
  const includeDetails = config.includeDetails !== false;
  
  const filtered = config.startDate && config.endDate
    ? repairRecords.filter(r => 
        r.repairDate >= config.startDate! && r.repairDate <= config.endDate!
      )
    : repairRecords;
  
  const dateRangeText = config.startDate && config.endDate
    ? ` از ${toPersianDigits(config.startDate)} تا ${toPersianDigits(config.endDate)}`
    : '';
  
  const title = `تاریخچه تعمیرات - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}${dateRangeText}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">تاریخچه تعمیرات</div>
  ${generateRepairTableHtml(filtered, includeDetails)}
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate expense report
 */
export async function generateExpenseReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const { vehicle, expenseRecords, settings } = data;
  const includeDetails = config.includeDetails !== false;
  
  const filtered = config.startDate && config.endDate
    ? expenseRecords.filter(r => 
        r.expenseDate >= config.startDate! && r.expenseDate <= config.endDate!
      )
    : expenseRecords;
  
  const dateRangeText = config.startDate && config.endDate
    ? ` از ${toPersianDigits(config.startDate)} تا ${toPersianDigits(config.endDate)}`
    : '';
  
  const title = `گزارش هزینه‌ها - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}${dateRangeText}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">خلاصه هزینه‌ها</div>
  ${generateExpenseByCategoryHtml(filtered)}
</div>

<div class="section">
  <div class="section-title">لیست هزینه‌ها</div>
  ${generateExpenseTableHtml(filtered, includeDetails)}
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate parts and purchases report
 */
export async function generatePartsReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const { vehicle, partRecords, settings } = data;
  const includeDetails = config.includeDetails !== false;
  
  const filtered = config.startDate && config.endDate
    ? partRecords.filter(r => 
        r.installedJalaliDate && 
        r.installedJalaliDate >= config.startDate! && 
        r.installedJalaliDate <= config.endDate!
      )
    : partRecords;
  
  const dateRangeText = config.startDate && config.endDate
    ? ` از ${toPersianDigits(config.startDate)} تا ${toPersianDigits(config.endDate)}`
    : '';
  
  const title = `لیست قطعات و خریدها - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}${dateRangeText}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">لیست قطعات</div>
  ${generatePartsTableHtml(filtered, includeDetails)}
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate upcoming maintenance report
 */
export async function generateUpcomingReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const { vehicle, maintenanceRecords, settings } = data;
  
  const title = `سرویس‌های آینده - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">سرویس‌های آینده</div>
  ${generateUpcomingMaintenanceHtml(maintenanceRecords)}
</div>

<div class="section">
  <div class="section-title">وضعیت بیمه و معاینه</div>
  ${generateInsuranceInspectionHtml(vehicle)}
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate insurance and inspection report
 */
export async function generateInsuranceReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const { vehicle, settings } = data;
  
  const title = `وضعیت بیمه و معاینه فنی - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}`;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">وضعیت بیمه و معاینه فنی</div>
  ${generateInsuranceInspectionHtml(vehicle)}
</div>

<div class="section">
  <div class="section-title">یادآوری مهم</div>
  <p style="font-size: 10pt; line-height: 1.6; color: #64748b;">
    لطفاً تاریخ‌های انقضا را به صورت دوره‌ای بررسی کرده و قبل از سررسید نسبت به تمدید اقدام نمایید.
    این گزارش تنها تاریخ‌های ثبت شده توسط شما را نمایش می‌دهد.
  </p>
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate combined ownership report
 */
export async function generateOwnershipReport(
  data: ReportData,
  config: ReportConfig
): Promise<string> {
  const {
    vehicle,
    odometerEntries,
    maintenanceRecords,
    repairRecords,
    expenseRecords,
    partRecords,
    settings,
  } = data;
  
  const title = `گزارش مالکیت خودرو - ${toPersianDigits(vehicle.manufacturer)} ${toPersianDigits(vehicle.model)}`;
  
  // Calculate statistics
  const totalKm = odometerEntries.length > 0 
    ? Math.max(...odometerEntries.map(o => o.odometer)) - Math.min(...odometerEntries.map(o => o.odometer))
    : vehicle.currentOdometer;
  
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalRepairCost = repairRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalExpenseCost = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const grandTotal = totalMaintenanceCost + totalRepairCost + totalExpenseCost;
  const costPerKm = totalKm > 0 ? grandTotal / totalKm : 0;
  
  const purchaseDateText = vehicle.purchaseDate ? toPersianDigits(vehicle.purchaseDate) : 'ثبت نشده';
  const daysOwned = vehicle.purchaseDateISO 
    ? Math.floor((new Date().getTime() - new Date(vehicle.purchaseDateISO).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const content = `
${generateVehicleInfoHtml(vehicle)}

<div class="section">
  <div class="section-title">خلاصه مالکیت</div>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">تاریخ خرید</div>
      <div class="info-value">${escapeHtml(purchaseDateText)}</div>
    </div>
    <div class="info-item">
      <div class="info-label">روزهای مالکیت</div>
      <div class="info-value">${escapeHtml(toPersianDigits(String(daysOwned)))} روز</div>
    </div>
    <div class="info-item">
      <div class="info-label">کیلومتر پیموده شده</div>
      <div class="info-value">${escapeHtml(toPersianDigits(Math.round(totalKm).toLocaleString('fa-IR')))} کیلومتر</div>
    </div>
    <div class="info-item">
      <div class="info-label">هزینه هر کیلومتر</div>
      <div class="info-value">${formatCurrency(costPerKm, 'IRT')}</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">آمار سرویس‌ها و تعمیرات</div>
  ${generateSummaryCardsHtml(vehicle, maintenanceRecords, repairRecords, expenseRecords)}
</div>

<div class="section">
  <div class="section-title">تاریخچه کارکرد</div>
  ${generateOdometerTableHtml(odometerEntries)}
</div>

<div class="section">
  <div class="section-title">برنامه سرویس‌های آینده</div>
  ${generateUpcomingMaintenanceHtml(maintenanceRecords)}
</div>

<div class="section">
  <div class="section-title">وضعیت بیمه و معاینه</div>
  ${generateInsuranceInspectionHtml(vehicle)}
</div>

<div class="section">
  <div class="section-title">یادداشت‌ها</div>
  <p style="font-size: 10pt; line-height: 1.6; color: #64748b;">
    این گزارش در تاریخ ${toPersianDigits(getCurrentJalaliDate())} تولید شده است.
    تمام اطلاعات ثبت شده توسط شما در این گزارش گنجانده شده است.
  </p>
</div>
  `;
  
  return await getBaseHtmlTemplate(title, content);
}

/**
 * Generate odometer history table
 */
function generateOdometerTableHtml(entries: OdometerEntry[]): string {
  if (entries.length === 0) {
    return '<div class="no-data">کارکردی ثبت نشده است</div>';
  }
  
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.gregorianDate).getTime() - new Date(a.gregorianDate).getTime()
  );
  
  const rows = sortedEntries.map((entry, index) => `
    <tr>
      <td>${toPersianDigits(String(index + 1))}</td>
      <td>${escapeHtml(toPersianDigits(entry.jalaliDate))}</td>
      <td>${escapeHtml(toPersianDigits(entry.odometer.toLocaleString('fa-IR')))} کیلومتر</td>
      <td>${escapeHtml(toPersianDigits(entry.note || '-'))}</td>
      <td>${entry.isConfirmed ? '<span style="color: #10b981;">تایید شده</span>' : '<span style="color: #f59e0b;">در انتظار تایید</span>'}</td>
    </tr>
  `).join('\n');
  
  return `
<table>
  <thead>
    <tr>
      <th>ردیف</th>
      <th>تاریخ</th>
      <th>کارکرد</th>
      <th>توضیحات</th>
      <th>وضعیت</th>
    </tr>
  </thead>
  <tbody>
    ${rows}
  </tbody>
</table>
  `;
}

/**
 * Generate PDF from HTML
 */
export async function generatePdf(
  reportType: ReportType,
  data: ReportData,
  config: ReportConfig
): Promise<PDFResult> {
  try {
    let html: string;
    
    switch (reportType) {
      case 'vehicle_history':
        html = await generateVehicleHistoryReport(data, config);
        break;
      case 'maintenance_history':
        html = await generateMaintenanceReport(data, config);
        break;
      case 'repair_history':
        html = await generateRepairReport(data, config);
        break;
      case 'parts_purchases':
        html = await generatePartsReport(data, config);
        break;
      case 'expense_report':
        html = await generateExpenseReport(data, config);
        break;
      case 'upcoming_maintenance':
        html = await generateUpcomingReport(data, config);
        break;
      case 'insurance_inspection':
        html = await generateInsuranceReport(data, config);
        break;
      case 'ownership_report':
        html = await generateOwnershipReport(data, config);
        break;
      default:
        html = await generateVehicleHistoryReport(data, config);
    }
    
    // Generate PDF file
    const fileId = uuidv4();
    const sanitizedVehicleName = sanitizeFilename(
      `${data.vehicle.manufacturer} ${data.vehicle.model}`.replace(/\s+/g, '_')
    );
    const sanitizedReportType = sanitizeFilename(REPORT_TYPE_LABELS[reportType].replace(/\s+/g, '_'));
    const datePart = sanitizeFilename(getCurrentJalaliDate().replace(/\//g, '-'));
    
    const filename = `khodroyar_${sanitizedVehicleName}_${sanitizedReportType}_${datePart}_${fileId}.pdf`;
    const fileUri = FileSystem.documentDirectory + filename;
    
    // Use expo-print to generate PDF
    const pdf = await Print.printToFileAsync({
      html,
      width: 595, // A4 width in points (210mm * 2.83465)
      height: 842, // A4 height in points (297mm * 2.83465)
      base64: false,
    });
    
    // Save the PDF to a permanent location
    await FileSystem.copyAsync({
      from: pdf.uri,
      to: fileUri,
    });
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    return {
      success: true,
      filePath: fileUri,
      fileSize: fileInfo.size || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطا در تولید PDF';
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Save PDF to a specific location
 */
export async function savePdf(
  filePath: string,
  targetPath?: string
): Promise<PDFResult> {
  try {
    const finalPath = targetPath || filePath;
    
    // If target is different, copy the file
    if (targetPath && targetPath !== filePath) {
      await FileSystem.copyAsync({
        from: filePath,
        to: targetPath,
      });
    }
    
    const fileInfo = await FileSystem.getInfoAsync(finalPath);
    
    return {
      success: true,
      filePath: finalPath,
      fileSize: fileInfo.size || 0,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره فایل';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Preview PDF using expo-print
 */
export async function previewPdf(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      return {
        success: false,
        error: 'فایل یافت نشد',
      };
    }
    
    // Use expo-print to preview the PDF
    // Note: This may not work on all platforms without additional configuration
    // For Android, we can use the system PDF viewer
    await Print.printAsync({
      uri: filePath,
      mimeType: 'application/pdf',
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطا در پیش‌نمایش PDF';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Share PDF using native share sheet
 */
export async function sharePdf(filePath: string): Promise<ShareResult> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      return {
        success: false,
        error: 'فایل یافت نشد',
      };
    }
    
    // Share the file
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/pdf',
      dialogTitle: 'اشتراک گذاری گزارش خودرویار',
      UTI: 'com.adobe.pdf',
    });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطا در اشتراک گذاری';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete temporary PDF file
 */
export async function deletePdf(filePath: string): Promise<boolean> {
  try {
    await FileSystem.deleteAsync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cached PDF files
 */
export async function getCachedPdfs(): Promise<string[]> {
  try {
    const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
    return files.filter(f => f.endsWith('.pdf'));
  } catch {
    return [];
  }
}

/**
 * Clear all cached PDFs
 */
export async function clearPdfCache(): Promise<boolean> {
  try {
    const cachedPdfs = await getCachedPdfs();
    await Promise.all(
      cachedPdfs.map(async (file) => {
        await FileSystem.deleteAsync(FileSystem.documentDirectory + file);
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if IranYekan font is available
 */
export async function isIranYekanAvailable(): Promise<boolean> {
  try {
    const regularFont = await FileSystem.getInfoAsync(FONT_PATHS.regular);
    const mediumFont = await FileSystem.getInfoAsync(FONT_PATHS.medium);
    const boldFont = await FileSystem.getInfoAsync(FONT_PATHS.bold);
    
    return regularFont.exists && mediumFont.exists && boldFont.exists;
  } catch {
    return false;
  }
}

/**
 * Get IranYekan font directory path
 */
export function getIranYekanFontDirectory(): string {
  return FileSystem.documentDirectory + 'assets/fonts/iranyekan/';
}

/**
 * Create IranYekan font directory with README
 */
export async function initializeIranYekanFont(): Promise<boolean> {
  try {
    const fontDir = getIranYekanFontDirectory();
    
    // Check if directory exists
    const dirInfo = await FileSystem.getInfoAsync(fontDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(fontDir, { intermediates: true });
      
      // Create README file
      const readmeContent = `
# فونت ایران یکان

برای استفاده از فونت ایران یکان در گزارش‌های PDF، لطفاً فایل‌های فونت را در این پوشه قرار دهید:

فایل‌های مورد نیاز:
- IRANYekanX-Regular.ttf
- IRANYekanX-Medium.ttf  
- IRANYekanX-Bold.ttf

## نکات مهم:

1. ایران یکان یک فونت تجاری است. لطفاً آن را از منابع قانونی تهیه نمایید.

2. بعد از قرار دادن فایل‌ها، برنامه به صورت خودکار آن‌ها را شناسایی و در گزارش‌ها استفاده می‌کند.

3. بدون این فایل‌ها، برنامه از فونت پیش‌فرض سیستم استفاده خواهد کرد.

4. برای اطلاعات بیشتر در مورد مجوز ایران یکان، به سایت رسمی سازنده مراجعه نمایید.

## منابع قانونی:
- سایت رسمی ایران یکان: https://iranyekan.com
- فروشگاه‌های معتبر فونت فارسی

## alternatives (فونت‌های رایگان):
- Vazirmatn
- Sahel
- Samim
- Dana

این فونت‌ها در اغلب سیستم‌ها به صورت پیش‌فرض نصب هستند.
`.trim();
      
      await FileSystem.writeAsStringAsync(
        fontDir + 'README.txt',
        readmeContent
      );
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrapper functions that match the signatures expected by pdf-report.tsx
 * These convert the old parameter style to the new ReportData structure
 */
export async function generateVehicleReportPDF(params: {
  vehicle: Vehicle;
  startDate?: string;
  endDate?: string;
  includeAttachments?: boolean;
  includeDetails?: boolean;
}): Promise<string> {
  // For vehicle history, we need to get all related data
  // This is a simplified wrapper - in a real implementation, you'd pass all data
  const reportData: Partial<ReportData> = {
    vehicle: params.vehicle,
    generatedAt: getCurrentJalaliDate(),
    generatedAtISO: getCurrentGregorianISO(),
  };
  
  const config: ReportConfig = {
    reportType: 'vehicle_history',
    vehicleId: params.vehicle.id,
    startDate: params.startDate,
    endDate: params.endDate,
    includeAttachments: params.includeAttachments,
    includeDetails: params.includeDetails,
  };
  
  // Generate with empty arrays for data we don't have
  const html = await generateVehicleHistoryReport(
    { ...reportData as ReportData, 
      odometerEntries: [],
      maintenanceRecords: [],
      repairRecords: [],
      expenseRecords: [],
      partRecords: [],
      settings: {} as AppSettings,
    } as ReportData,
    config
  );
  return html;
}

export async function generateMaintenanceReportPDF(params: {
  vehicle: Vehicle;
  services: MaintenanceRecord[];
  startDate?: string;
  endDate?: string;
  includeDetails?: boolean;
}): Promise<string> {
  const reportData: Partial<ReportData> = {
    vehicle: params.vehicle,
    maintenanceRecords: params.services,
    generatedAt: getCurrentJalaliDate(),
    generatedAtISO: getCurrentGregorianISO(),
  };
  
  const config: ReportConfig = {
    reportType: 'maintenance_history',
    vehicleId: params.vehicle.id,
    startDate: params.startDate,
    endDate: params.endDate,
    includeDetails: params.includeDetails,
  };
  
  const html = await generateMaintenanceReport(
    { ...reportData as ReportData,
      odometerEntries: [],
      repairRecords: [],
      expenseRecords: [],
      partRecords: [],
      settings: {} as AppSettings,
    } as ReportData,
    config
  );
  return html;
}

export async function generateRepairReportPDF(params: {
  vehicle: Vehicle;
  repairs: Repair[];
  startDate?: string;
  endDate?: string;
  includeDetails?: boolean;
}): Promise<string> {
  const reportData: Partial<ReportData> = {
    vehicle: params.vehicle,
    repairRecords: params.repairs,
    generatedAt: getCurrentJalaliDate(),
    generatedAtISO: getCurrentGregorianISO(),
  };
  
  const config: ReportConfig = {
    reportType: 'repair_history',
    vehicleId: params.vehicle.id,
    startDate: params.startDate,
    endDate: params.endDate,
    includeDetails: params.includeDetails,
  };
  
  const html = await generateRepairReport(
    { ...reportData as ReportData,
      odometerEntries: [],
      maintenanceRecords: [],
      expenseRecords: [],
      partRecords: [],
      settings: {} as AppSettings,
    } as ReportData,
    config
  );
  return html;
}

export async function generatePartsReportPDF(params: {
  vehicle: Vehicle;
  parts: Part[];
  startDate?: string;
  endDate?: string;
  includeDetails?: boolean;
}): Promise<string> {
  const reportData: Partial<ReportData> = {
    vehicle: params.vehicle,
    partRecords: params.parts,
    generatedAt: getCurrentJalaliDate(),
    generatedAtISO: getCurrentGregorianISO(),
  };
  
  const config: ReportConfig = {
    reportType: 'parts_purchases',
    vehicleId: params.vehicle.id,
    startDate: params.startDate,
    endDate: params.endDate,
    includeDetails: params.includeDetails,
  };
  
  const html = await generatePartsReport(
    { ...reportData as ReportData,
      odometerEntries: [],
      maintenanceRecords: [],
      repairRecords: [],
      expenseRecords: [],
      settings: {} as AppSettings,
    } as ReportData,
    config
  );
  return html;
}

export async function generateExpenseReportPDF(params: {
  vehicle: Vehicle;
  expenses: Expense[];
  startDate?: string;
  endDate?: string;
  includeDetails?: boolean;
}): Promise<string> {
  const reportData: Partial<ReportData> = {
    vehicle: params.vehicle,
    expenseRecords: params.expenses,
    generatedAt: getCurrentJalaliDate(),
    generatedAtISO: getCurrentGregorianISO(),
  };
  
  const config: ReportConfig = {
    reportType: 'expense_report',
    vehicleId: params.vehicle.id,
    startDate: params.startDate,
    endDate: params.endDate,
    includeDetails: params.includeDetails,
  };
  
  const html = await generateExpenseReport(
    { ...reportData as ReportData,
      odometerEntries: [],
      maintenanceRecords: [],
      repairRecords: [],
      partRecords: [],
      settings: {} as AppSettings,
    } as ReportData,
    config
  );
  return html;
}

export async function generateCombinedReportPDF(params: {
  vehicle: Vehicle;
  odometerEntries?: OdometerEntry[];
  maintenanceRecords?: MaintenanceRecord[];
  repairRecords?: Repair[];
  expenseRecords?: Expense[];
  partRecords?: Part[];
  startDate?: string;
  endDate?: string;
  includeAttachments?: boolean;
  includeDetails?: boolean;
}): Promise<string> {
  const reportData: ReportData = {
    vehicle: params.vehicle,
    odometerEntries: params.odometerEntries || [],
    maintenanceRecords: params.maintenanceRecords || [],
    repairRecords: params.repairRecords || [],
    expenseRecords: params.expenseRecords || [],
    partRecords: params.partRecords || [],
    settings: {} as AppSettings,
    generatedAt: getCurrentJalaliDate(),
    generatedAtISO: getCurrentGregorianISO(),
  };
  
  const config: ReportConfig = {
    reportType: 'ownership_report',
    vehicleId: params.vehicle.id,
    startDate: params.startDate,
    endDate: params.endDate,
    includeAttachments: params.includeAttachments,
    includeDetails: params.includeDetails,
  };
  
  const html = await generateOwnershipReport(reportData, config);
  return html;
}

export default {
  generatePdf,
  savePdf,
  sharePdf,
  deletePdf,
  getCachedPdfs,
  clearPdfCache,
  isIranYekanAvailable,
  getIranYekanFontDirectory,
  initializeIranYekanFont,
  generateVehicleHistoryReport,
  generateMaintenanceReport,
  generateRepairReport,
  generatePartsReport,
  generateExpenseReport,
  generateUpcomingReport,
  generateInsuranceReport,
  generateOwnershipReport,
  formatCurrency,
  escapeHtml,
  sanitizeFilename,
  // Alias exports
  generateVehicleReportPDF,
  generateMaintenanceReportPDF,
  generateRepairReportPDF,
  generatePartsReportPDF,
  generateExpenseReportPDF,
  generateCombinedReportPDF,
};

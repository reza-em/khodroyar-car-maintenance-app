# سیستم گزارش‌گذاری PDF فارسی

## مقدمه

این سند نحوه کار با سیستم گزارش‌گیری PDF در اپلیکیشن خودرویار را شرح می‌دهد. این سیستم امکان تولید گزارش‌های حرفه‌ای با قالب‌بندی RTL فارسی، فونت ایران یکان، و پشتیبانی کامل از تقویم جلالی را فراهم می‌کند.

## ویژگی‌ها

### انواع گزارش‌ها

1. **تاریخچه کامل خودرو** (`vehicle_history`)
   - شامل تمام سرویس‌ها، تعمیرات، هزینه‌ها و قطعات
   - خلاصه مالی و آمار
   - وضعیت بیمه و معاینه فنی

2. **تاریخچه سرویس‌ها** (`maintenance_history`)
   - لیست کامل سرویس‌های انجام شده
   - سرویس‌های آینده و سررسید گذشته

3. **تاریخچه تعمیرات** (`repair_history`)
   - لیست کامل تعمیرات انجام شده
   - جزئیات هر تعمیر

4. **قطعات و خریدها** (`parts_purchases`)
   - لیست تمام قطعات خریداری شده
   - وضعیت نصب و گارانتی

5. **گزارش مالی** (`expense_report`)
   - هزینه‌ها بر اساس دسته‌بندی
   - خلاصه مالی دوره‌ای

6. **گزارش جامع مالکیت خودرو** (`ownership_report`)
   - گزارش کامل از تمام جنبه‌های مالکیت خودرو
   - شامل تمام داده‌ها و آمار

### ویژگی‌های کلی

- **قالب‌بندی RTL کامل**: پشتیبانی کامل از جهت‌دار بودن فارسی
- **فونت ایران یکان**: استفاده از فونت ایران یکان با لایسنس قانونی
- **تقویم جلالی**: تمام تاریخ‌ها به صورت شمسی نمایش داده می‌شوند
- **فرمت ارز فارسی**: نمایش مبلغ به تومان و ریال با فرمت فارسی
- **পشتیبانی از ضمیمه‌ها**: امکان گنجاندن تصاویر در گزارش
- **سطح جزئیات**: امکان انتخاب بین خلاصه و جزئیات کامل
- **فیلتر کردن**: فیلتر بر اساس تاریخ، دسته‌بندی، و دیگر معیارها

## راه‌اندازی فونت ایران یکان

### نکات قانونی

**اعلامیه مهم**: فونت ایران یکان یک فونت تجاری است. برای استفاده قانونی از آن:

1. باید از منابع رسمی تهیه شود
2. لایسنس معتبر داشته باشید
3. بدون لایسنس، استفاده غیرقانونی است

### محل قرارگیری فایل‌ها

فایل‌های فونت را در مسیر زیر قرار دهید:

```
assets/fonts/iranyekan/
├── IRANYekanX-Regular.ttf
├── IRANYekanX-Medium.ttf
└── IRANYekanX-Bold.ttf
```

### منابع رسمی

- سایت رسمی ایران یکان: [https://iranyekan.com](https://iranykan.com)
- فروشگاه‌های معتبر فونت فارسی

### فونت‌های جایگزین رایگان

در صورت عدم دسترسی به ایران یکان، برنامه از فونت‌های زیر به عنوان جایگزین استفاده می‌کند:

- **Vazirmatn** - فونت اوپن سورس کامل فارسی
- **Sahel** - فونت سبک و خوانا
- **Samim** - فونت مدرن فارسی
- **Dana** - فونت همه‌کاره فارسی

### بررسی در دسترس بودن فونت

```typescript
import { isIranYekanAvailable } from '../src/services/pdfService';

const available = await isIranYekanAvailable();
console.log('IranYekan available:', available);
```

## استفاده از سیستم گزارش‌گیری

### ابتدهایی ترین استفاده

```typescript
import {
  generatePdf,
  generateVehicleHistoryReport,
  ReportType,
  ReportConfig,
  ReportData
} from '../src/services/pdfService';

// تنظیمات گزارش
const config: ReportConfig = {
  reportType: 'vehicle_history',
  vehicleId: 'vehicle-123',
  startDate: '1405/01/01',
  endDate: '1405/12/29',
  includeAttachments: false,
  includeDetails: true,
};

// تولید گزارش
const result = await generatePdf('vehicle_history', reportData, config);

if (result.success) {
  console.log('PDF generated:', result.filePath);
  // ذخیره یا به اشتراک گذاری فایل
}
```

### تولید گزارش سفارشی

```typescript
// تولید گزارش تاریخچه خودرو
const html = await generateVehicleHistoryReport(reportData, config);

// تولید گزارش سرویس‌ها
const html = await generateMaintenanceReport(reportData, config);

// تولید گزارش تعمیرات
const html = await generateRepairReport(reportData, config);
```

### ذخیره و به اشتراک گذاری

```typescript
import { savePdf, sharePdf, previewPdf } from '../src/services/pdfService';

// پیش‌نمایش PDF
const previewResult = await previewPdf(filePath);

// ذخیره PDF
const saveResult = await savePdf(filePath, targetPath);

// به اشتراک گذاری PDF
const shareResult = await sharePdf(filePath);
```

## ساختار داده‌ها

### ReportData

```typescript
interface ReportData {
  vehicle: Vehicle;
  odometerEntries: OdometerEntry[];
  maintenanceRecords: MaintenanceRecord[];
  repairRecords: Repair[];
  expenseRecords: Expense[];
  partRecords: Part[];
  settings: AppSettings;
  generatedAt: string; // تاریخ جلالی تولید
  generatedAtISO: string; // تاریخ میلادی تولید
}
```

### ReportConfig

```typescript
interface ReportConfig {
  reportType: ReportType;
  vehicleId: string;
  startDate?: string; // تاریخ جلالی
  endDate?: string; // تاریخ جلالی
  expenseCategories?: ExpenseCategory[];
  serviceCategories?: ServiceCategory[];
  includeAttachments?: boolean;
  includeDetails?: boolean; // true = جزئیات کامل, false = خلاصه
}
```

### ReportType

```typescript
type ReportType = 
  | 'vehicle_history'
  | 'maintenance_history'
  | 'repair_history'
  | 'parts_purchases'
  | 'expense_report'
  | 'upcoming_maintenance'
  | 'insurance_inspection'
  | 'ownership_report';
```

## قالب‌بندی PDF

### ساختار کلی گزارش

1. **سربرگ**
   - لوگو خودرویار
   - عنوان گزارش
   - اطلاعات خودرو (نام، مدل، پلاک)
   - بازه زمانی
   - تاریخ تولید

2. **خلاصه اجرایی**
   - هزینه‌های کل
   - تعداد سرویس‌ها
   - تعداد تعمیرات
   - سررسیدهای آینده

3. **اطلاعات خودرو**
   - سازنده، مدل، سال تولید
   - پلاک، VIN
   - نوع سوخت، کارکرد فعلی

4. **جدول‌ها**
   - جدول سرویس‌ها
   - جدول تعمیرات
   - جدول هزینه‌ها
   - جدول قطعات

5. **پاورقی**
   - نام برنامه
   - تاریخ تولید
   - شماره صفحه

### استایل‌ها

- **فونت اصلی**: ایران یکان (در صورت در دسترس بودن)
- **فونت جایگزین**: Vazirmatn
- **رنگ‌های اصلی**:
  - رنگ اصلی: #1e3a8a (نavy)
  - رنگ ثانویه: #06b6d4 (turquoise)
  - رنگ پس‌زمینه: #ffffff
  - رنگ متن: #1e293b
- **اندازه صفحه**: A4 (210mm × 297mm)
- **حاشیه‌ها**: 20mm از تمام طرفین

### جدول‌ها

- **هدر جدول**: رنگ پس‌زمینه #1e3a8a، متن سفید
- **ردیف‌های زوج**: رنگ پس‌زمینه #f8fafc
- **ردیف‌های فرد**: رنگ پس‌زمینه سفید
- **ردیف جمع**: رنگ پس‌زمینه #f0f9ff

## نام‌گذاری فایل‌ها

فایل‌های PDF با فرمت زیر نام‌گذاری می‌شوند:

```
khodroyar-{vehicleName}-{reportType}-{dateRange}.pdf
```

مثال:
```
khodroyar-Peugeot-207-vehicle_history-1405-01-01-to-1405-12-29.pdf
```

### پاک‌سازی کاراکترهای خطرناک

```typescript
import { sanitizeFilename } from '../src/services/pdfService';

const safeFilename = sanitizeFilename('test<>:"|?*file.pdf');
// نتیجه: testfile.pdf
```

## امنیت

### محافظت در برابر XSS

تمام متن‌های وارد شده توسط کاربر قبل از قرار گرفتن در HTML اسکیپ می‌شوند:

```typescript
import { escapeHtml } from '../src/services/pdfService';

const safeText = escapeHtml(userInput);
// <script>alert('xss')</script> → &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;
```

### حفاظت از اطلاعات خصوصی

- VIN خودرو به صورت پیش‌فرض در فایل‌ها گنجانده نمی‌شود
- اطلاعات بایگانی شده از گزارش‌ها حذف می‌شوند
- رکوردهای حذف شده در گزارش‌ها نمایش داده نمی‌شوند

###ذخیره‌سازی موقت

فایل‌های PDF موقت در حافظه cache دستگاه ذخیره می‌شوند و می‌توانند:
- پیش‌نمایش شوند
- ذخیره شوند
- به اشتراک گذاشته شوند
- حذف شوند

## تست

### تست خودکار

```bash
# اجرای تست‌های PDF
npm test -- pdfService.test.ts
```

### تست دستی

1. اپلیکیشن را روی دستگاه اندروید نصب کنید
2. یک خودرو اضافه کنید
3. رکوردهای سرویس، تعمیر، هزینه و قطعه اضافه کنید
4. به صفحه گزارش PDF بروید
5. یک گزارش تولید کنید
6. PDF را باز کنید و بررسی کنید:
   - جهت متن (RTL)
   - فونت ایران یکان
   - تاریخ‌های جلالی
   - اعداد فارسی
   - قالب‌بندی جدول‌ها

### رشته‌های تست

برای اطمینان از نمایش صحیح، این رشته‌ها را تست کنید:

- `پژو ۲۰۷ پانوراما`
- `تعویض روغن و فیلتر روغن`
- `تعمیر جلوبندی خودرو`
- `مبلغ ۲٬۵۰۰٬۰۰۰ تومان`
- `تاریخ ۱۴۰۵/۰۶/۱۵`
- `کارکرد ۸۵٬۰۰۰ کیلومتر`
- `قطعه Bosch مدل FR7DC+`
- `کیلومتر بعدی: ۹۰٬۰۰۰`

## عیب‌یابی

### فونت ایران یکان نمایش داده نمی‌شود

1. اطمینان حاصل کنید فایل‌های فونت در مسیر صحیح قرار دارند
2. فایل‌ها باید نام دقیق `IRANYekanX-Regular.ttf`, `IRANYekanX-Medium.ttf`, `IRANYekanX-Bold.ttf` داشته باشند
3. برنامه را مجدداً راه‌اندازی کنید

### متن فارسی به درستی نمایش داده نمی‌شود

1. اطمینان حاصل کنید HTML دارای `dir="rtl"` و `lang="fa"` است
2. فونت‌های فارسی در CSS تعریف شده باشند
3. متن قبل از قرار گرفتن در HTML اسکیپ شده باشد

### جدول‌ها شکسته نمایش داده می‌شوند

1. اطمینان حاصل کنید عرض جدول‌ها روی 100% تنظیم شده باشد
2. از `border-collapse: collapse` استفاده شود
3. سلول‌ها دارای `text-align: right` باشند

### PDF تولید نمی‌شود

1. اطمینان حاصل کنید `expo-print` نصب باشد
2. مجوزهای ذخیره‌سازی را بررسی کنید
3. فضای کافی روی دستگاه وجود داشته باشد

## API مرجع

### توابع اصلی

#### `generatePdf(reportType, data, config)`
تولید PDF از نوع مشخص شده

#### `generateVehicleHistoryReport(data, config)`
تولید گزارش تاریخچه کامل خودرو

#### `generateMaintenanceReport(data, config)`
تولید گزارش تاریخچه سرویس‌ها

#### `generateRepairReport(data, config)`
تولید گزارش تاریخچه تعمیرات

#### `generatePartsReport(data, config)`
تولید گزارش قطعات و خریدها

#### `generateExpenseReport(data, config)`
تولید گزارش هزینه‌ها

#### `generateUpcomingReport(data, config)`
تولید گزارش سرویس‌های آینده

#### `generateInsuranceReport(data, config)`
تولید گزارش وضعیت بیمه و معاینه

#### `generateOwnershipReport(data, config)`
تولید گزارش جامع مالکیت خودرو

### توابع کمکی

#### `escapeHtml(text)`
اسکیپ کردن کاراکترهای HTML

#### `sanitizeFilename(name)`
پاک‌سازی نام فایل

#### `formatCurrency(amount, currency)`
فرمت کردن ارز

#### `isIranYekanAvailable()`
بررسی در دسترس بودن فونت ایران یکان

#### `previewPdf(filePath)`
پیش‌نمایش PDF

#### `savePdf(filePath, targetPath)`
ذخیره PDF

#### `sharePdf(filePath)`
به اشتراک گذاری PDF

#### `deletePdf(filePath)`
حذف PDF

#### `clearPdfCache()`
پاک کردن کش PDF

---

**توجه**: این سیستم برای استفاده در اپلیکیشن خودرویار طراحی شده است. برای اطلاعات بیشتر به [مستندات اصلی](../README.md) مراجعه کنید.

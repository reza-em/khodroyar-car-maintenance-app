# راهنمای سریع شروع با خودرویار

## نصب و راه‌اندازی

### 1. نصب Dependencies

```bash
cd khodroyar
npm install
```

**نکته:** نصب dependencies ممکن است چند دقیقه طول بکشد.

### 2. اجرای اپلیکیشن

```bash
npm start
```

یا

```bash
npx expo start
```

پس از اجرا، یک مرورگر باز می‌شود و سرور توسعه شروع به کار می‌کند.

### 3. اجرا روی دستگاه

#### روی اندروید:
- اطمینان حاصل کنید که دستگاه اندروید به کامپیوتر متصل است
- یا اپ Expo Go را روی دستگاه نصب کنید
- در ترمینال، حرف **a** را فشار دهید

#### روی iOS ( سیمولاتور):
- Xcode را نصب کنید
- یک سیمولاتور iOS ایجاد کنید
- در ترمینال، حرف **i** را فشار دهید

#### روی وب:
- در ترمینال، حرف **w** را فشار دهید

## کار با داده‌های نمونه

### ایجاد داده‌های نمونه

```bash
npm run db:seed
```

این دستور:
- 3 خودرو نمونه ایجاد می‌کند
- برای هر خودرو:
  - 3 رکورد کارکرد (اودمتر)
  - 5 رکورد سرویس و تعمیر
  - 10 رکورد هزینه
  - قطعات استفاده شده

### حذف داده‌های نمونه

```bash
# در حال حاضر، می‌توانید از کد زیر استفاده کنید:
node -e "require('./scripts/seed.ts').then(m => m.removeSeedData())"
```

## ساختار فایل‌های کنونی

### فایل‌های اصلی ایجاد شده:

```
khodroyar/
├── app/
│   ├── _layout.tsx        # Layout اصلی با PaperProvider
│   └── index.tsx          # نقطه ورود اصلی (قصد دارد به Onboarding redirect کند)
├── src/
│   ├── lib/
│   │   ├── database.ts    # ✅ کامل - اتصال SQLite و توابع دیتابیس
│   │   ├── jalaliDate.ts  # ✅ کامل - تمام توابع تقویم جلالی
│   │   └── reminderEngine.ts # ✅ کامل - موتور محاسبه یادآوری‌ها
│   ├── stores/
│   │   ├── index.ts       # Export همه stores
│   │   ├── useVehicleStore.ts    # ✅ کامل - مدیریت خودروها
│   │   ├── useSettingsStore.ts  # ✅ کامل - مدیریت تنظیمات
│   │   ├── useServiceStore.ts    # ⏳ Placeholder
│   │   ├── useOdometerStore.ts   # ⏳ Placeholder
│   │   ├── useReminderStore.ts   # ⏳ Placeholder
│   │   ├── useExpenseStore.ts    # ⏳ Placeholder
│   │   ├── usePartStore.ts       # ⏳ Placeholder
│   │   ├── useRepairStore.ts     # ⏳ Placeholder
│   │   ├── useUiStore.ts          # ⏳ Placeholder
│   │   └── useNotificationStore.ts # ⏳ Placeholder
│   ├── theme/
│   │   └── index.ts       # ✅ تم اصلی (Light/Dark)
│   └── types/
│       ├── index.ts       # Export همه types
│       ├── common.ts      # ✅ Type‌های عمومی
│       ├── vehicle.ts     # ✅ Type‌های خودرو
│       ├── odometer.ts    # ✅ Type‌های اودمتر
│       ├── service.ts     # ✅ Type‌های سرویس
│       ├── reminder.ts    # ✅ Type‌های یادآوری
│       ├── part.ts        # ✅ Type‌های قطعات
│       ├── repair.ts      # ✅ Type‌های تعمیرات
│       ├── expense.ts     # ✅ Type‌های هزینه‌ها
│       ├── settings.ts    # ✅ Type‌های تنظیمات
│       └── database.ts    # ✅ Type‌های دیتابیس
└── scripts/
    └── seed.ts            # ✅ اسکریپت ایجاد داده‌های نمونه
```

## چه چیزهایی تا کنون کار می‌کنند

### ✅ کامل و قابل استفاده:

1. **سیستم Type کامل**
   - تمام Domain Models تعریف شده‌اند
   - Type Safety کامل در تمام پروژه
   - Type‌های وصول به دیتابیس

2. **دیتابیس SQLite**
   - اتصال به Expo SQLite
   - ایجاد تمام جداول با Foreign Keys
   - ایندکس‌های بهینه‌سازی شده
   - توابع Export/Import
   - توابع Seed/Reset

3. **تقویم جلالی کامل**
   - تبدیل تاریخ میلادی ↔ جلالی
   - اضافه کردن روز/ماه/سال
   - محاسبه اختلاف بین تاریخ‌ها
   - فرمت‌های مختلف نمایش
   - تبدیل اعداد به حروف فارسی
   - بررسی سال کبیسه

4. **موتور محاسبه یادآوری‌ها**
   - محاسبه زمان سررسید سرویس‌ها
   - حمایت از هر دو معیار تاریخ و کارکرد
   - منطق "هر کدام زودتر فرا رسد"
   - محاسبه وضعیت (زمان‌بندی شده، نزدیک به موعد، سررسید گذشته)
   - اعتبارسنجی خواندن اودمتر

5. **-management State با Zustand**
   - useVehicleStore - مدیریت خودروها ✅ کامل
   - useSettingsStore - مدیریت تنظیمات ✅ کامل
   - بقیه stores به صورت Placeholder

6. **Theme سفارشی**
   - رنگ‌های برند (Navy, Blue, Turquoise)
   - رنگ‌های وضعیت (Success, Warning, Error)
   - پشتیبانی از Light/Dark Mode
   - ادغام با React Native Paper

### ⏳ در حال توسعه (Placeholder):

- بقیه Stores (Service, Odometer, Reminder, etc.)
- Repositories
- کامپوننت‌های UI
- صفحات اپلیکیشن
- Navigation
- نوتیفیکیشن‌ها

## چگونگی ادامه توسعه

### قدم‌های بعدی:

1. **تکمیل Stores**
   ```bash
   # فایل‌های زیر را تکمیل کنید:
   src/stores/useServiceStore.ts
   src/stores/useOdometerStore.ts
   src/stores/useReminderStore.ts
   src/stores/useExpenseStore.ts
   src/stores/usePartStore.ts
   src/stores/useRepairStore.ts
   src/stores/useUiStore.ts
   src/stores/useNotificationStore.ts
   ```

2. **ایجاد Repositories**
   ```bash
   mkdir -p src/repositories
   # فایل‌های زیر را ایجاد کنید:
   src/repositories/VehicleRepository.ts
   src/repositories/OdometerRepository.ts
   src/repositories/ServiceRepository.ts
   # ... بقیه
   ```

3. **ایجاد کامپوننت‌های پایه**
   ```bash
   mkdir -p src/components/ui
   mkdir -p src/components/forms
   mkdir -p src/components/lists
   ```

4. **ایجاد صفحات**
   ```bash
   # در دایرکتوری app/:
   app/(tabs)/_layout.tsx
   app/(tabs)/index.tsx
   app/(tabs)/services.tsx
   app/(tabs)/expenses.tsx
   app/(tabs)/calendar.tsx
   app/(tabs)/more.tsx
   app/onboarding.tsx
   app/vehicle/_layout.tsx
   app/vehicle/index.tsx
   app/vehicle/add.tsx
   app/vehicle/[id].tsx
   ```

5. **پیاده‌سازی Navigation**
   ```bash
   mkdir -p src/navigation
   # فایل‌های زیر را ایجاد کنید:
   src/navigation/RootNavigation.tsx
   src/navigation/TabNavigation.tsx
   src/navigation/StackNavigation.tsx
   ```

## تست کدهای کنونی

شما می‌توانید کدهای کنونی را تست کنید:

### تست توابع تقویم جلالی:

```typescript
import {
  getCurrentJalaliDate,
  jalaliToGregorian,
  gregorianToJalali,
  toPersianDigits,
  formatJalaliDateLong
} from './src/lib/jalaliDate';

// دریافت تاریخ کنونی جلالی
console.log('Today:', getCurrentJalaliDate());

// تبدیل جلالی به میلادی
const gDate = jalaliToGregorian('1403/01/01');
console.log('Gregorian:', gDate);

// تبدیل میلادی به جلالی
const jDate = gregorianToJalali(new Date());
console.log('Jalali:', jDate);

// تبدیل اعداد به حروف فارسی
console.log('Persian digits:', toPersianDigits(123456));

// فرمت تاریخ بلند
console.log('Long date:', formatJalaliDateLong('1403/02/15'));
```

### تست موتور یادآوری‌ها:

```typescript
import {
  calculateServiceDue,
  calculateVehicleReminders,
  getServiceStatusDisplay
} from './src/lib/reminderEngine';

const currentDate = '1403/05/15';
const currentOdometer = 82500;
const lastServiceDate = '1403/02/01';
const lastServiceOdometer = 80000;
const interval = {
  kilometers: 10000,
  months: 6,
  useWhicheverComesFirst: true
};

const result = calculateServiceDue(
  currentDate,
  currentOdometer,
  lastServiceDate,
  lastServiceOdometer,
  interval,
  { days: 7, kilometers: 1000 }
);

console.log('Service due result:', result);
```

### تست Vehicle Store:

```typescript
import { useVehicleStore } from './src/stores/useVehicleStore';

const store = useVehicleStore.getState();

// اضافه کردن یک خودرو
const result = await store.addVehicle({
  manufacturer: 'پژو',
  model: '207',
  licensePlate: '12 AB 345',
  productionYear: 2020,
  fuelType: 'gasoline',
  currentOdometer: 82500,
});

console.log('Add vehicle result:', result);

// دریافت تمام خودروها
console.log('All vehicles:', store.vehicles);

// دریافت خودرو جاری
console.log('Current vehicle:', store.getCurrentVehicle());
```

## مشکلات احتمالی و راه‌حل‌ها

### 1. خطا: "Cannot find module 'expo-sqlite'"

```bash
npm install expo-sqlite
```

### 2. خطا: "Cannot find module 'jalali-moment'"

```bash
npm install jalali-moment moment-jalaali
```

### 3. خطا: "Cannot find module 'react-native-paper'"

```bash
npm install react-native-paper
```

### 4. خطا: "Cannot find module 'zustand'"

```bash
npm install zustand
```

### 5. خطا در اندروید: "Task :app:bundleReleaseJsAndAssets FAILED"

```bash
# پاک کردن cache و نصب مجدد
npm start -- --clear
rm -rf node_modules package-lock.json
npm install
```

### 6. خطا: "Metro Bundler encountered an error"

```bash
npm start -- --reset-cache
```

## خلاصه

پروژه **خودرویار** با یک پایه بسیار قوی ایجاد شده است:

✅ **سیستم Type کامل** - تمام مدل‌ها و type‌ها تعریف شده‌اند
✅ **دیتابیس SQLite** - اتصال و ساختار کامل
✅ **تقویم جلالی** - تمام توابع مورد نیاز
✅ **موتور یادآوری‌ها** - منطق کسب‌وکار اصلی
✅ **State Management** - با Zustand
✅ **Theme سفارشی** - با رنگ‌های برند
✅ **Seed Data** - داده‌های نمونه برای تست

**تکمیل کلی: ~30%**

برای تکمیل پروژه، نیاز به پیاده‌سازی:
- بقیه Stores (10%)
- Repositories (10%)
- کامپوننت‌ها و صفحات (30%)
- Navigation (5%)
- نوتیفیکیشن‌ها (5%)
- تنظیمات نهایی (10%)

با توجه به پایه قوی ایجاد شده، پیش‌بینی می‌شود که ادامه پروژه نسبتاً سریع باشد.

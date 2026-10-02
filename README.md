# Khodroyar — Car Maintenance & Expense Tracker App (React Native / Expo, Persian RTL)

> Persian RTL car maintenance, repair, expense and reminder app built with React Native (Expo), TypeScript and SQLite. Multiple vehicles, odometer log, insurance and inspection reminders, PDF reports.

## 🌐 فارسی

**خودرویار** — همدم هوشمند نگهداری خودرو: اپ موبایل (React Native / Expo) برای مدیریت چند خودرو، ثبت کارکرد، تعمیرات و هزینه‌ها، یادآور بیمه و معاینه فنی و گزارش PDF. رابط فارسی راست‌چین.

**کلیدواژه‌ها:** اپلیکیشن نگهداری خودرو، یادآور بیمه، معاینه فنی، ثبت هزینه خودرو، تعمیرات خودرو، اپ اندروید فارسی، ری‌اکت نیتیو

## 🇬🇧 English

**Khodroyar** is a Persian (RTL) **car maintenance and expense tracker** for Android/iOS built with **React Native (Expo)**, TypeScript and SQLite: multiple vehicles, odometer history, service and repair records, insurance and technical-inspection reminders, cost reports and PDF export.

**Keywords:** car maintenance app, vehicle expense tracker, React Native Expo app, service reminders, Persian RTL mobile app, Android build

## 🇷🇺 Русский

**Khodroyar** — мобильное приложение (персидский RTL) для **обслуживания автомобиля и учёта расходов** на **React Native (Expo)**: несколько авто, пробег, ремонты, напоминания о страховке и техосмотре, отчёты PDF.

**Ключевые слова:** приложение для обслуживания автомобиля, учёт расходов на авто, React Native Expo, напоминания о ТО

## 🇩🇪 Deutsch

**Khodroyar** ist eine persische (RTL) App für **Fahrzeugwartung und Kostenverfolgung** mit **React Native (Expo)**: mehrere Fahrzeuge, Kilometerstand, Reparaturen, Erinnerungen für Versicherung und TÜV, Kostenberichte und PDF-Export.

**Stichwörter:** Auto Wartung App, Fahrzeugkosten Tracker, React Native Expo, Wartungserinnerung, TÜV Erinnerung

---

## Features

- Multiple vehicles with odometer history
- Service/repair records and cost tracking
- Insurance and inspection reminders
- PDF reports
- Persian RTL UI (Iranyekan/Vazirmatn fonts; see font licenses)
- Jest tests, EAS / Android build docs

## Setup

```bash
npm install
npx expo start              # or: npm run android
# Android build instructions: see ANDROID_BUILD.md
```

## Usage

Open your bot in the messenger and send `/start`. See the detailed documentation below for commands, admin panel and platform-specific notes.

## License

Code released under the [MIT License](LICENSE).

---

## Detailed documentation

# خودرویار - همدم هوشمند نگهداری خودرو

## مقدمه

خودرویار یک اپلیکیشن موبایل پیشرفته برای مدیریت کامل نگهداری، تعمیرات، هزینه‌ها و یادآوری‌های خودرو است. این اپلیکیشن به طور اختصاصی برای کاربران فارسی‌زبان طراحی شده و از تقویم جلالی (شمسی) به طور کامل پشتیبانی می‌کند.

## ویژگی‌ها

### مدیریت خودرو
- ثبت چندین خودرو با مشخصات کامل
- ثبت کارکرد (اودمتر) و تاریخچه تغییرات
- مدیریت بیمه و معاینه فنی
- ذخیره عکس خودرو

### سرویس‌ها و تعمیرات
- ثبت سرویس‌های دوره‌ای با intervals سفارشی
- یادآوری خودکار بر اساس تاریخ و کارکرد
- مدیریت تعمیرات و علل آن‌ها
- ثبت قطعات استفاده شده در سرویس‌ها

### هزینه‌ها
- ثبت هزینه‌های مختلف (سوز، پارکینگ، تعمیرات و...)
- گزارش‌گیری ماهانه و سالانه
- محاسبه هزینه به ازای هر کیلومتر
- دسته‌بندی هزینه‌ها

### قطعات
- ثبت خرید قطعات
- مدیریت گارانتی قطعات
- پیگیری نصب قطعات
- مدیریت موجودی

### یادآوری‌ها
- یادآوری سرویس‌های دوره‌ای
- یادآوری بیمه و معاینه فنی
- یادآوری‌های سفارشی
- ارسال نوتیفیکیشن محلی

## تکنولوژی‌های مورد استفاده

- **React Native** - فریمورک اصلی
- **Expo** - پلتفرم توسعه
- **TypeScript** - تایپ اسکریپت با mode استریکت
- **Expo Router** - مسیریابی
- **SQLite** - ذخیره‌سازی محلی
- **Zustand** - مدیریت state
- **React Hook Form + Zod** - فرم‌ها و اعتبارسنجی
- **Expo Notifications** - نوتیفیکیشن‌ها
- **jalali-moment + moment-jalaali** - تقویم جلالی
- **React Native Chart Kit** - نمودارها
- **ESLint + Prettier** - لینتینگ و فرمت کد

## ساختار پروژه

```
khodroyar/
├── app/                   # فایل‌های Expo Router
│   └── _layout.tsx        # Layout اصلی
│   └── index.tsx          # صفحه اصلی
│   └── (tabs)/            # Tab Navigation
│       ├── index.tsx      # Dashboard
│       ├── services.tsx   # سرویس‌ها
│       ├── expenses.tsx   # هزینه‌ها
│       ├── calendar.tsx   # تقویم
│       └── more.tsx       # بیشتر
├── assets/                # فایل‌های استاتیک
│   ├── icon.png
│   ├── splash.png
│   └── fonts/             # فونت‌ها
├── src/
│   ├── components/        # کامپوننت‌های React
│   │   ├── ui/            # کامپوننت‌های UI (دکمه، کارت و...)
│   │   ├── forms/         # فرم‌ها
│   │   └── ...
│   ├── hooks/             # React Hooks سفارشی
│   ├── lib/               # کتابخانه‌ها و یوتیلیتی‌ها
│   │   ├── database.ts    # اتصال به SQLite
│   │   ├── jalaliDate.ts  # توابع تقویم جلالی
│   │   └── reminderEngine.ts # موتور محاسبه یادآوری‌ها
│   ├── models/            # مدل‌های دامنه
│   ├── repositories/      # ریپازیتوری‌های دیتابیس
│   ├── services/          # سرویس‌های کسب‌وکار
│   ├── stores/            # Zustand Stores
│   ├── types/             # TypeScript Types
│   ├── utils/             # توابع کمکی
│   ├── constants/         # ثابت‌ها
│   ├── theme/             # تم و استایل‌ها
│   └── i18n/              # ترجمه‌ها
├── scripts/               # اسکریپت‌های کمکی
│   └── seed.ts            # ایجاد داده‌های نمونه
├── .eslintrc.json
├── .prettierrc
├── app.json              # تنظیمات Expo
├── babel.config.js
├── jest.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

## راه‌اندازی پروژه

### پیش‌نیازها

- Node.js 18 یا بالاتر
- npm یا yarn
- Expo CLI (`npm install -g expo-cli`)
- یک دستگاه اندروید یا iOS برای تست

### نصب Dependencies

```bash
# رفتن به دایرکتوری پروژه
cd khodroyar

# نصب dependencies
npm install

# یا با yarn
yarn install
```

### نصب Dependencies توسعه (برای لینت و تست)

```bash
npm install -D
# یا
yarn install -D
```

### راه‌اندازی اپلیکیشن

```bash
# استارت سرور توسعه
npm start

# یا
npx expo start
```

بعد از اجرای دستورات بالا، یک مرورگر باز می‌شود. می‌توانید:
- روی **a** کلیک کنید یا **Android** را بزنید تا اپ روی دستگاه اندروید اجرا شود
- روی **i** کلیک کنید یا **iOS** را بزنید تا اپ روی سیمولاتور iOS اجرا شود
- روی **w** کلیک کنید تا نسخه وب باز شود

### اجرا روی دستگاه فیزیکی

1. اپ **Expo Go** را از استور مربوطه نصب کنید
2. سرور توسعه را اجرا کنید (`npm start`)
3. در Expo Go، QR کد نمایش داده شده در ترمینال را اسکن کنید

## دستورات مفید

| دستور | شرح |
|--------|------|
| `npm start` | استارت سرور توسعه |
| `npm run android` | اجرا روی دستگاه اندروید |
| `npm run ios` | اجرا روی سیمولاتور iOS |
| `npm run web` | اجرا در مرورگر وب |
| `npm run lint` | بررسی کد با ESLint |
| `npm run lint:fix` | اصلاح خودکار خطاهای lint |
| `npm run format` | فرمت کد با Prettier |
| `npm run type-check` | بررسی type های TypeScript |
| `npm test` | اجرا تست‌ها |
| `npm run db:seed` | ایجاد داده‌های نمونه |

## ایجاد داده‌های نمونه

برای ایجاد داده‌های نمونه جهت تست:

```bash
# اجرا اسکریپت seed
npm run db:seed
```

این دستور:
- 3 خودرو نمونه ایجاد می‌کند
- برای هر خودرو، چند رکورد اودمتر، سرویس و هزینه ایجاد می‌کند
- یک خودرو را به عنوان خودرو پیش‌فرض تنظیم می‌کند

برای حذف داده‌های نمونه:

```bash
# حذف تمام داده‌ها
npm run db:seed -- --remove
```

## معماری اپلیکیشن

### لایه‌ها

1. **Presentation Layer** (`src/components/`)
   - کامپوننت‌های UI
   - صفحات و نمایش داده‌ها
   - فرم‌ها

2. **Application Layer** (`src/hooks/`, `src/stores/`)
   - مدیریت state با Zustand
   - React Hooks سفارشی
   - منطق UI

3. **Domain Layer** (`src/models/`, `src/types/`)
   - مدل‌های دامنه (Vehicle, Service, Expense, etc.)
   - TypeScript Types
   - Business Rules

4. **Data Layer** (`src/repositories/`, `src/lib/database.ts`)
   - اتصال به SQLite
   - ریپازیتوری‌ها
   - دستکاری داده‌ها

5. **Service Layer** (`src/services/`)
   - سرویس‌های کسب‌وکار
   - موتور محاسبه یادآوری‌ها
   - تبدیل تاریخ‌ها
   - Export/Import

### flows اصلی

1. **Onboarding Flow**: ثبت خودرو اولیه
2. **Dashboard Flow**: نمایش خلاصه وضعیت خودرو
3. **Service Flow**: ثبت و مدیریت سرویس‌ها
4. **Expense Flow**: ثبت هزینه‌ها و گزارش‌گیری
5. **Reminder Flow**: مدیریت یادآوری‌ها

## کار با تقویم جلالی

اپلیکیشن از تقویم جلالی (شمسی) به طور کامل پشتیبانی می‌کند:

```typescript
import { 
  getCurrentJalaliDate,
  jalaliToGregorian,
  gregorianToJalali,
  addJalaliDays,
  addJalaliMonths,
  formatJalaliDateLong,
  toPersianDigits
} from '../lib/jalaliDate';

// دریافت تاریخ کنونی جلالی
const today = getCurrentJalaliDate(); // "1403/05/15"

// تبدیل جلالی به میلادی
const gregorianDate = jalaliToGregorian('1403/01/01'); // Date object

// تبدیل میلادی به جلالی
const jalaliDate = gregorianToJalali(new Date()); // "1403/05/15"

// اضافه کردن روز به تاریخ جلالی
const nextWeek = addJalaliDays(today, 7); // "1403/05/22"

// اضافه کردن ماه به تاریخ جلالی
const nextMonth = addJalaliMonths(today, 1); // "1403/06/15"

// فرمت تاریخ با حروف فارسی
const formattedDate = formatJalaliDateLong(today); // "۱۵ اردیبهشت ۱۴۰۳"

// تبدیل اعداد به حروف فارسی
const persianNumber = toPersianDigits(123456); // "۱۲۳۴۵۶"
```

## کار با یادآوری‌ها

موتور محاسبه یادآوری‌ها به صورت خودکار وضعیت سرویس‌ها را بر اساس تاریخ و کارکرد محاسبه می‌کند:

```typescript
import {
  calculateServiceDue,
  calculateVehicleReminders,
  getServiceStatusDisplay,
  validateOdometerReading
} from '../lib/reminderEngine';

// محاسبه وضعیت یک سرویس
const dueResult = calculateServiceDue(
  currentJalaliDate,
  currentOdometer,
  lastServiceJalaliDate,
  lastServiceOdometer,
  serviceInterval
);

// دریافت لیست یادآوری‌ها برای یک خودرو
const reminders = calculateVehicleReminders(
  vehicle,
  maintenanceRecords,
  currentJalaliDate,
  { days: 7, kilometers: 1000 }
);

// دریافت وضعیت نمایشی سرویس
const statusDisplay = getServiceStatusDisplay(
  maintenanceRecord,
  vehicle,
  currentJalaliDate
);

// اعتبارسنجی خواندن اودمتر
const validation = validateOdometerReading(
  odometerEntries,
  newOdometerValue,
  vehicleId
);
```

## مدیریت State با Zustand

```typescript
import { useVehicleStore, useCurrentVehicle } from '../stores/useVehicleStore';

// دریافت تمام خودروها
const vehicles = useVehicleStore(state => state.vehicles);

// دریافت خودرو جاری
const currentVehicle = useCurrentVehicle();

// اضافه کردن خودرو
const { addVehicle, isLoading, error } = useVehicleStore();

const handleAddVehicle = async (input) => {
  const result = await addVehicle(input);
  if (result.success) {
    // موفقیت‌آمیز بود
  } else {
    // خطا رخ داد
    console.error(result.error);
  }
};
```

## کار با دیتابیس SQLite

```typescript
import { getDatabase } from '../lib/database';

const database = getDatabase();

// Query ساده
const vehicles = database.getAllSync('SELECT * FROM vehicles');

// Query با پارامتر
const vehicle = database.getFirstSync(
  'SELECT * FROM vehicles WHERE id = ?',
  [vehicleId]
);

// Insert
const vehicleId = uuidv4();
database.execSync(`
  INSERT INTO vehicles (id, manufacturer, model, license_plate)
  VALUES (?, ?, ?, ?)
`, [vehicleId, 'پژو', '207', '12 AB 345']);

// Update
database.execSync(`
  UPDATE vehicles SET current_odometer = ? WHERE id = ?
`, [newOdometer, vehicleId]);

// Delete
database.execSync('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
```

## تست اپلیکیشن

### تست روی دستگاه اندروید

1. دستگاه اندروید خود را به کامپیوتر وصل کنید
2. USB Debugging را در تنظیمات توسعه‌دهنده فعال کنید
3. سرور توسعه را اجرا کنید: `npm start`
4. در ترمینال، **a** را فشار دهید یا `npm run android` اجرا کنید

### تست روی سیمولاتور iOS

1. Xcode را نصب کنید
2. سیمولاتور iOS را باز کنید
3. سرور توسعه را اجرا کنید: `npm start`
4. در ترمینال، **i** را فشار دهید یا `npm run ios` اجرا کنید

### تست روی وب

```bash
npm run web
```

 پس از باز شدن مرورگر، می‌توانید اپ را در نسخه وب مشاهده کنید.

## استقرار (Build)

### Build برای اندروید

```bash
# نصب Expo Build Properties
npx expo install expo-build-properties

# Build APK
npx eas build -p android --profile preview
```

برای اطلاعات بیشتر به [Expo EAS Documentation](https://docs.expo.dev/eas/) مراجعه کنید.

### Build برای iOS

```bash
# Build IPA
npx eas build -p ios --profile preview
```

## مسائلی که ممکن است رخ دهند

### خطا: "Unable to resolve module"

اگر با خطای "Unable to resolve module" مواجه شدید:

```bash
# پاک کردن cache
npm start -- --clear

# نصب مجدد dependencies
rm -rf node_modules package-lock.json
npm install
```

### خطا در اندروید: "JAVA_HOME not set"

1. JDK را نصب کنید
2. متغیر محیطی JAVA_HOME را تنظیم کنید

### خطا در iOS: "No simulator found"

1. Xcode را نصب کنید
2. یک سیمولاتور ایجاد کنید:
   ```bash
   npx expo install expo-device
   ```

### نوتیفیکیشن‌ها کار نمی‌کنند

1. مطمئن شوید که Permission برای نوتیفیکیشن‌ها درخواست شده
2. در دستگاه فیزیکی، اپ Expo Go را نصب کنید
3. در تنظیمات دستگاه، اجازه نوتیفیکیشن به Expo Go بدهید

## ساخت و توسعه

### افزودن ویژگی جدید

1. Type های جدید را در `src/types/` تعریف کنید
2. اگر نیاز به داده جدید در دیتابیس است، Migration ایجاد کنید
3. Repository جدید در `src/repositories/` ایجاد کنید
4. State جدید در store مربوطه اضافه کنید
5. کامپوننت‌های جدید در `src/components/` ایجاد کنید
6. صفحه جدید در `app/` اضافه کنید

### کار با تقویم جلالی در فرم‌ها

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  date: z.string().regex(/^\d{4}\/\d{2}\/\d{2}$/, 'فرمت تاریخ نامعتبر است'),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

// در JSX
<Controller
  control={control}
  name="date"
  render={({ field }) => (
    <JalaliDatePicker
      value={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

## کمک و پشتیبانی

در صورت مواجهه با مشکلات:

1. documentation Expo را بررسی کنید: [https://docs.expo.dev/](https://docs.expo.dev/)
2. issues این پروژه را بررسی کنید
3. با توسعه‌دهنده پروژه تماس بگیرید

## لایسنس

این پروژه تحت لایسنس MIT منتشر می‌شود.

---

**توسعه داده شده با عشق برای جامعه فارسی‌زبان**

"خودرویار - همدم هوشمند نگهداری خودرو"


# ساخت APK اندروید برای خودرویار

## مقدمه

این سند نحوه ساخت و استقرار اپلیکیشن خودرویار روی دستگاه‌های اندروید را شرح می‌دهد. شامل ساخت با EAS Build، ساخت محلی، و راه‌اندازی روی دستگاه فیزیکی می‌باشد.

## پیش‌نیازها

### نرم‌افزارهای لازم

| نرم‌افزار | نسخه مورد نیاز | توضیحات |
|-----------|----------------|----------|
| Node.js | 18+ | محیط اجرا جاوااسکریپت |
| npm | 9+ | مدیر بسته‌ها |
| Expo CLI | آخرین نسخه | ابزار خط فرمان Expo |
| EAS CLI | آخرین نسخه | ابزار ساخت Expo |
| Java JDK | 11+ | برای ساخت اندروید |
| Android Studio | آخرین نسخه | برای SDK اندروید |
| Android SDK | 33+ | کیت توسعه اندروید |

### پیکربندی محیط

#### نصب Expo CLI

```bash
npm install -g expo-cli eas-cli
```

#### ورود به حساب Expo

```bash
expo login
# یا
eas login
```

#### تنظیم متغیرهای محیطی اندروید

```bash
# در فایل ~/.bashrc یا ~/.zshrc
 export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## ساختار پروژه

```
khodroyar/
├── app.json              # تنظیمات اصلی Expo
├── eas.json              # تنظیمات EAS Build
├── package.json          # وابستگی‌ها
├── assets/               # فایل‌های استاتیک
│   ├── icon.png          # آیکون اپ
│   ├── adaptive-icon.png # آیکون سازگار
│   ├── splash.png        # صفحه اسپلش
│   └── fonts/            # فونت‌ها
└── src/                 # کد منبع
```

## تنظیمات Build

### app.json

```json
{
  "expo": {
    "name": "خودرویار",
    "slug": "khodroyar",
    "version": "1.0.0",
    "android": {
      "package": "com.khodroyar.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0a1a2a"
      }
    }
  }
}
```

### eas.json

```json
{
  "cli": {
    "version": ">= 0.52.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "NODE_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "NODE_ENV": "production"
      }
    },
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## ساخت با EAS Build (پیشنهادی)

### مرحله 1: نصب وابستگی‌ها

```bash
cd khodroyar
npm install
```

### مرحله 2: بررسی سلامت پروژه

```bash
npx expo-doctor
```

### مرحله 3: پیکربندی پروژه EAS

```bash
npx eas-cli build:configure
```

### مرحله 4: ساخت APK پیش‌نمایش

```bash
npx eas-cli build --platform android --profile preview
```

### مرحله 5: دریافت لینک دانلود

پس از اتمام ساخت، لینک دانلود APK در خروجی نمایش داده می‌شود:

```
✅ Build finished!
📦 Artifact: https://expo.dev/artifacts/...
```

### پروفایل‌های ساخت

| پروفایل | نوع | استفاده |
|--------|-----|---------|
| development | APK | توسعه و تست |
| preview | APK | تست نهایی |
| production | AAB | انتشار در استور |

## ساخت محلی (Local Build)

### پیش‌نیازها

- Android Studio نصب باشد
- SDK اندروید تنظیم شده باشد
- AVD (Android Virtual Device) یا دستگاه فیزیکی متصل باشد

### مرحله 1: prebuild

```bash
npx expo prebuild
```

> ⚠️ **توجه**: این دستور فایل‌های بومی اندروید را ایجاد می‌کند. اگر قبلا این کار را کرده‌اید، از انجام مجدد آن خودداری کنید.

### مرحله 2: رفتن به دایرکتوری اندروید

```bash
cd android
```

### مرحله 3: ساخت APK

#### روی ویندوز

```powershell
.\gradlew.bat assembleRelease
```

#### روی مک/لینوکس

```bash
./gradlew assembleRelease
```

### مرحله 4: یافتن فایل APK

فایل APK در مسیر زیر ایجاد می‌شود:

```
android/app/build/outputs/apk/release/app-release.apk
```

## نصب APK

### نصب روی دستگاه فیزیکی

#### با ADB

```bash
# بررسی دستگاه‌های متصل
adb devices

# نصب APK
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

#### با دست

1. فایل `app-release.apk` را به دستگاه اندروید منتقل کنید
2. فایل را باز کنید
3. نصب را تأیید کنید

### نصب روی شبيه‌ساز

```bash
# لیست دستگاه‌های موجود
adb devices

# نصب روی شبيه‌ساز
adb -e install -r android/app/build/outputs/apk/release/app-release.apk
```

## بررسی APK

### بررسی امضای APK

```bash
# دریافت SHA-256
keytool -printcert -file META-INF/CERT.RSA -v

# یا برای APK
apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
```

### بررسی اطلاعات بسته

```bash
# اندروید
 aapt dump badging android/app/build/outputs/apk/release/app-release.apk | grep "package:\|version"
```

### اندازه فایل

```bash
# ویندوز
 dir android\app\build\outputs\apk\release\app-release.apk

# مک/لینوکس
 ls -lh android/app/build/outputs/apk/release/app-release.apk
```

## راه‌اندازی روی دستگاه

### اجازه‌های لازم

اپلیکیشن به اجازه‌های زیر نیاز دارد:

- **دسترسی به دوربین**: برای اسکن QR کد و عکس‌برداری
- **دسترسی به ذخیره‌سازی**: برای ذخیره و خواندن داده‌ها
- **ارسال نوتیفیکیشن**: برای یادآوری‌ها
- **دسترسی به مکان**: برای برخی ویژگی‌ها (اختیاری)

### راه‌اندازی اولیه

1. اپ را اجرا کنید
2. اجازه‌های درخواست شده را اعطا کنید
3. خودرو خود را اضافه کنید
4. از ویژگی‌ها استفاده کنید

## تست روی دستگاه فیزیکی

### سناریوهای تست

#### 1. نصب و راه‌اندازی

- [ ] اپ با موفقیت نصب می‌شود
- [ ] آپ را بدون crash باز می‌کند
- [ ] صفحه خوش‌آمدگویی نمایش داده می‌شود
- [ ] می‌توان خودرو اضافه کرد

#### 2. گزارش PDF

- [ ] می‌توان به صفحه گزارش PDF رفت
- [ ] می‌توان خودرو انتخاب کرد
- [ ] می‌توان نوع گزارش را انتخاب کرد
- [ ] می‌توان بازه زمانی را تنظیم کرد
- [ ] می‌توان گزارش تولید کرد
- [ ] PDF به درستی باز می‌شود
- [ ] متن فارسی به درستی نمایش داده می‌شود
- [ ] تاریخ‌های جلالی صحیح هستند
- [ ] اعداد فارسی به درستی نمایش داده می‌شوند

#### 3. تست‌های خاص

**تست 1: نصب و افزودن خودرو**
```
actions:
  1. اپ را نصب کنید
  2. اپ را باز کنید
  3. روی "افزودن خودرو" ضربه بزنید
  4. مشخصات خودرو را وارد کنید
  5. ذخیره کنید
expected:
  - خودرو در لیست نمایش داده می‌شود
  - می‌توان آن را انتخاب کرد
failure:
  - اپ crash می‌کند
  - خودرو ذخیره نمی‌شود
```

**تست 2: ثبت کارکرد و سرویس**
```
actions:
  1. یک خودرو انتخاب کنید
  2. به صفحه سرویس‌ها بروید
  3. سرویس جدید اضافه کنید
  4. کارکرد را ثبت کنید
expected:
  - سرویس در لیست نمایش داده می‌شود
  - کارکرد به درستی ذخیره می‌شود
failure:
  - داده‌ها ذخیره نمی‌شوند
  - اپ crash می‌کند
```

**تست 3: تولید گزارش PDF**
```
actions:
  1. به صفحه گزارش PDF بروید
  2. خودرو را انتخاب کنید
  3. نوع گزارش را انتخاب کنید
  4. تاریخ شروع و پایان را تنظیم کنید
  5. روی "ایجاد گزارش" ضربه بزنید
  6. صبر کنید تا گزارش تولید شود
  7. روی "پیش‌نمایش" ضربه بزنید
expected:
  - گزارش با موفقیت تولید می‌شود
  - PDF باز می‌شود
  - متن فارسی RTL است
  - تاریخ‌ها جلالی هستند
  - اعداد فارسی هستند
failure:
  - گزارش تولید نمی‌شود
  - PDF باز نمی‌شود
  - متن به درستی نمایش داده نمی‌شود
```

**تست 4: به اشتراک گذاری PDF**
```
actions:
  1. یک گزارش تولید کنید
  2. روی "به اشتراک گذاری" ضربه بزنید
  3. اپلیکیشن مقصد (WhatsApp, Telegram, etc.) را انتخاب کنید
expected:
  - منوی اشتراک گذاری باز می‌شود
  - PDF ارسال می‌شود
failure:
  - منوی اشتراک گذاری باز نمی‌شود
  - PDF ارسال نمی‌شود
```

**تست 5: نوتیفیکیشن‌ها**
```
actions:
  1. یک سرویس با تاریخ سررسید آینده اضافه کنید
  2. اپ را ببندید
  3. صبر کنید تا زمان سررسید برسد
expected:
  - نوتیفیکیشن نمایش داده می‌شود
failure:
  - نوتیفیکیشن نمایش داده نمی‌شود
```

## عیب‌یابی

### خطاهای رایج

#### 1. `Unable to resolve module`

**راه‌حل**:
```bash
# پاک کردن cache
npm start -- --clear

# نصب مجدد وابستگی‌ها
rm -rf node_modules package-lock.json
npm install
```

#### 2. `JAVA_HOME not set`

**راه‌حل**:
1. JDK را نصب کنید
2. متغیر محیطی JAVA_HOME را تنظیم کنید

#### 3. `Android SDK not found`

**راه‌حل**:
1. Android Studio را نصب کنید
2. SDK را از طریق SDK Manager نصب کنید
3. متغیر ANDROID_HOME را تنظیم کنید

#### 4. `Keystore file not found`

**راه‌حل**:
```bash
# ایجاد keystore جدید
keytool -genkey -v -keystore my-release-key.keystore \
    -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# قرار دادن در مسیر پروژه
mv my-release-key.keystore android/app/
```

#### 5. `Build failed: Gradle build failed`

**راه‌حل**:
```bash
# پاک کردن build
cd android
./gradlew clean

# تلاش مجدد
./gradlew assembleRelease
```

#### 6. `EAS Build: Project not configured`

**راه‌حل**:
```bash
npx eas-cli build:configure
npx eas-cli build:init
```

### بررسی لاگ‌ها

#### EAS Build لاگ‌ها

```bash
npx eas-cli build:list
npx eas-cli build:logs --build-id YOUR_BUILD_ID
```

#### لاگ‌های اندروید

```bash
# اتصال به دستگاه
adb logcat | grep khodroyar

# فیلتر کردن
adb logcat *:S khodroyar:V
```

## بهینه‌سازی

### کاهش اندازه APK

1. **فایل‌های فونت**: تنها فونت‌های ضروری را قرار دهید
2. **تصاویر**: از تصویر با کیفیت مناسب استفاده کنید
3. **کد**: کدهای استفاده نشده را حذف کنید
4. **ProGuard**: برای production build فعال باشد

### بهبود عملکرد

1. **Lazy Loading**: کامپوننت‌ها را به صورت تنبل بارگذاری کنید
2. **Optimized Images**: از تصاویر بهینه شده استفاده کنید
3. **Caching**: از کش برای داده‌ها استفاده کنید

## انتشار در استور

### آماده‌سازی برای انتشار

1. **Version Code** را افزایش دهید
2. **Version Name** را به‌روز کنید
3. **Changelog** را بنویسید
4. **Screenshots** تهیه کنید
5. **Description** بنویسید

### ساخت AAB

```bash
npx eas-cli build --platform android --profile production
```

### آپلود به Google Play Console

1. به [Google Play Console](https://play.google.com/console) بروید
2. اپ جدید ایجاد کنید یا اپ موجود را انتخاب کنید
3. فایل AAB را آپلود کنید
4. اطلاعات را تکمیل کنید
5. برای بررسی ارسال کنید

## چک لیست قبل از انتشار

- [ ] تمام ویژگی‌ها تست شده‌اند
- [ ] گزارش PDF به درستی کار می‌کند
- [ ] نوتیفیکیشن‌ها کار می‌کنند
- [ ] ذخیره‌سازی داده‌ها کار می‌کند
- [ ] قول‌ها و شرایط بررسی شده‌اند
- [ ] سیاست حریم خصوصی وجود دارد
- [ ] آیکون و اسکرین‌شات‌ها آماده هستند
- [ ] توضیحات اپ کامل است
- [ ] دسته‌بندی مناسب انتخاب شده است
- [ ] امتیاز سنی مناسب انتخاب شده است

## اطلاعات تماس

برای گزارش مشکلات یا سوال:
- Issues: [GitHub Issues](https://github.com/your-org/khodroyar/issues)
- ایمیل: support@khodroyar.com

---

**آخرین به‌روزرسانی**: 1405/06/15

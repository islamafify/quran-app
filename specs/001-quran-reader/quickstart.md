# Quickstart: شاشة قراءة القرآن (001-quran-reader)

**Date**: 2026-02-27

## ملخص سريع

شاشة قراءة القرآن الكريم باستخدام مكتبة `@quranjs/api` مع دعم التفاعل مع الآيات وأشرطة تحكم ديناميكية ودعم الوضع الداكن (Dark Mode).

## المتطلبات المسبقة

- جميع المكتبات مثبتة مسبقاً في المشروع ما عدا المذكورة:
  - `@quranjs/api` v2.1.0
  - `@shopify/flash-list` 
  - `@react-native-async-storage/async-storage` v2.2.0
  - `@react-native-community/netinfo` v11.4.1
  - `react-native-safe-area-context` v5.6.0
  - `react-native-reanimated` v4.1.1
  - `react-native-toast-message` v2.3.3
  - `react-native-gesture-handler` v2.28.0

- متغيرات البيئة مطلوبة:
  - `QURAN_CLIENT_ID`
  - `QURAN_CLIENT_SECRET`

## هيكل الملفات الجديدة

```
app/
└── quran-reader.tsx              # شاشة القارئ الرئيسية (Expo Router)

components/quran-reader/
├── QuranPage.tsx                 # عرض صفحة واحدة من المصحف (آيات نصية)
├── TopBar.tsx                    # شريط علوي (الجزء - الساعة - السورة)
├── BottomBar.tsx                 # شريط سفلي (ربع الحزب - رقم الصفحة)
└── AyahOptionsMenu.tsx           # قائمة خيارات الآية (سماع - تفسير - فاصل - مشاركة)

hooks/
└── useQuranReader.ts             # Hook لإدارة حالة القارئ وجلب البيانات

services/
└── quranClient.ts                # إعداد وتصدير QuranClient singleton

constants/
└── theme.ts                      # (تحديث) إضافة ألوان القارئ لكلا الوضعين
```

## الملفات المعدلة

```
app/(tabs)/index.tsx              # إضافة رابط للشاشة الجديدة (إن لم يكن موجوداً)
constants/theme.ts                # إضافة ألوان خاصة بالقارئ (light + dark)
```

## خطوات التشغيل

```bash
# 1. إعداد متغيرات البيئة
echo "QURAN_CLIENT_ID=your_id" >> .env
echo "QURAN_CLIENT_SECRET=your_secret" >> .env

# 2. تشغيل التطبيق
npx expo start
```

## نقاط الوصول

| المسار | الوصف |
|--------|-------|
| `/quran-reader` | شاشة قراءة القرآن الكريم |
| `/quran-reader?page=254` | فتح صفحة محددة مباشرة |

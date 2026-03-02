# Implementation Plan: شاشة قراءة القرآن

**Branch**: `001-quran-reader` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-quran-reader/spec.md`

## Summary

إنشاء شاشة قراءة قرآن تفاعلية باستخدام مكتبة `@quranjs/api` مع أشرطة تحكم ديناميكية (علوي وسفلي)، قائمة خيارات للآيات (سماع، تفسير، فاصل، مشاركة)، حفظ واستعادة آخر صفحة، فحص الاتصال بالإنترنت، ودعم كامل للوضع الداكن (Dark Mode).

## Technical Context

**Language/Version**: TypeScript 5.9.2 / React 19.1.0
**Primary Dependencies**: 
- `@quranjs/api` v2.1.0 (جلب بيانات القرآن)
- `react-native` v0.81.5 + `expo` v54
- `@shopify/flash-list` (بديل FlatList أسرع بـ 5x)
- `react-native-reanimated` v4.1.1 (حركات سلسة)
- `react-native-gesture-handler` v2.28.0 (التفاعلات)
- `react-native-safe-area-context` v5.6.0 (المناطق الآمنة)
- `@react-native-community/netinfo` v11.4.1 (فحص الاتصال)
- `@react-native-async-storage/async-storage` v2.2.0 (تخزين محلي)
- `react-native-toast-message` v2.3.3 (رسائل التنبيه)

**Storage**: AsyncStorage (تخزين محلي للصفحة الحالية والفواصل)
**Testing**: Manual testing + Expo development builds
**Target Platform**: iOS 15+ / Android (React Native via Expo)
**Project Type**: Mobile App (Expo Router)
**Performance Goals**: < 300ms لتحميل الصفحة وانتقال التصفح
**Constraints**: يتطلب اتصال إنترنت لجلب البيانات من API (السماع والتفسير)
**Scale/Scope**: 604 صفحة، 6236 آية، 114 سورة

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Code Quality**: الحل يتبع مبادئ الكود النظيف مع فصل واضح بين المكونات (Service → Hook → Component). لا تكرار في الكود (DRY) مع إنشاء Hook مشترك `useQuranReader` و service مستقل `quranClient.ts`.
- [x] **Testing Standards**: استراتيجية اختبار واضحة تشمل: اختبار يدوي لكل سيناريو قبول + التحقق من صحة البيانات من API.
- [x] **UX Consistency**: التصميم يستخدم نظام الألوان الموجود في `theme.ts` مع توسيعه ليشمل ألوان القارئ. مكونات `Toast` الموجودة تُعاد استخدامها. **دعم كامل للدارك مود** باستخدام نفس البنية المتبعة في المشروع (`useColorScheme`).
- [x] **Performance**: استخدام `@shopify/flash-list` (أسرع 5x من FlatList) مع `estimatedItemSize` للأداء الأمثل. عرض النص بحقل `textUthmani` (الرسم العثماني التقليدي - مصحف المدينة). التحميل الكسول للصفحات. حفظ آخر صفحة لاستعادة سريعة.
- [x] **Security**: جميع المدخلات يتم التحقق منها (pageNumber: 1-604, verseKey format). مفاتيح API تُخزن في متغيرات البيئة وليس في الكود.

## Project Structure

### Documentation (this feature)

```text
specs/001-quran-reader/
├── plan.md              # هذا الملف
├── spec.md              # مواصفات الميزة
├── research.md          # البحث والقرارات التقنية
├── data-model.md        # نموذج البيانات
├── quickstart.md        # دليل من البدء السريع
├── contracts/           # عقود الواجهات
│   └── interfaces.md   # واجهات المكونات والخدمات
├── checklists/          # قوائم التحقق
│   └── requirements.md # قائمة تحقق المواصفات
└── tasks.md             # (يُنشأ لاحقاً بواسطة /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── quran-reader.tsx                    # شاشة القارئ (Expo Router page)

components/quran-reader/
├── QuranPage.tsx                       # عرض صفحة واحدة (آيات نصية تفاعلية)
├── TopBar.tsx                          # شريط علوي (الجزء - الساعة - السورة)
├── BottomBar.tsx                       # شريط سفلي (ربع الحزب - رقم الصفحة)
└── AyahOptionsMenu.tsx                 # قائمة خيارات الآية

hooks/
└── useQuranReader.ts                   # Hook لإدارة الحالة والبيانات

services/
└── quranClient.ts                      # QuranClient singleton

constants/
└── theme.ts                            # (تحديث) ألوان القارئ light + dark
```

**Structure Decision**: اتباع نمط المشروع الحالي (Expo Router + components/ + hooks/) مع إضافة مجلد `services/` للفصل النظيف و `components/quran-reader/` لتجميع مكونات الميزة.

## Complexity Tracking

> لا توجد انتهاكات للدستور تتطلب تبريراً.

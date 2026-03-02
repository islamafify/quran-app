# Contracts: شاشة قراءة القرآن (001-quran-reader)

**Date**: 2026-02-27

## 1. QuranClient Service Interface

```typescript
// services/quranClient.ts

import { QuranClient, Language } from '@quranjs/api';

// Singleton instance - يتم إنشاؤه مرة واحدة
export function getQuranClient(): QuranClient;

// واجهات الاستخدام المتوقعة:

// جلب آيات صفحة معينة
// Returns: { verses: Verse[], pagination: Pagination }
await client.verses.findByPage(pageNumber: string, options?: {
  translations?: number[];
  words?: boolean;
  reciter?: number;
  tafsirs?: number[];
});

// جلب بيانات السور
// Returns: Chapter[]
await client.chapters.findAll({ language: Language.ARABIC });

// جلب صوت آية معينة
// Returns: { audioFiles: VerseRecitation[] }
await client.audio.findVerseRecitationsByKey(
  verseKey: string,  // e.g. "2:255"
  reciterId: string  // e.g. "2" (Mishari Alafasy)
);
```

## 2. useQuranReader Hook Interface

```typescript
// hooks/useQuranReader.ts

interface UseQuranReaderReturn {
  // حالة الصفحة
  currentPage: number;              // رقم الصفحة الحالية (1-604)
  verses: Verse[];                  // آيات الصفحة الحالية
  isLoading: boolean;               // حالة التحميل
  error: string | null;             // رسالة الخطأ

  // بيانات وصفية
  pageMeta: {
    juzNumber: number;              // رقم الجزء
    rubElHizbNumber: number;        // ربع الحزب
    surahName: string;              // اسم السورة
  } | null;

  // إجراءات
  goToPage: (page: number) => void; // الانتقال لصفحة محددة
  nextPage: () => void;             // الصفحة التالية
  prevPage: () => void;             // الصفحة السابقة

  // تخزين
  savedPage: number | null;         // آخر صفحة محفوظة
}

function useQuranReader(initialPage?: number): UseQuranReaderReturn;
```

## 3. Component Props Interfaces

```typescript
// components/quran-reader/QuranPage.tsx
interface QuranPageProps {
  verses: Verse[];
  pageNumber: number;
  onTap: () => void;                           // نقرة واحدة → toggle أشرطة التحكم
  onLongPress: (verseKey: string) => void;     // نقرة مطولة → قائمة الآية
  isDarkMode: boolean;                         // دعم الدارك مود
}

// components/quran-reader/TopBar.tsx
interface TopBarProps {
  juzNumber: number;                // الجزء ١٣
  surahName: string;                // الرعد
  visible: boolean;                 // حالة الظهور
  isDarkMode: boolean;              // دعم الدارك مود
}

// components/quran-reader/BottomBar.tsx
interface BottomBarProps {
  rubElHizbNumber: number;          // ربع الحزب ٣٦
  pageNumber: number;               // ٣٥٤
  visible: boolean;                 // حالة الظهور
  isDarkMode: boolean;              // دعم الدارك مود
}

// components/quran-reader/AyahOptionsMenu.tsx
interface AyahOptionsMenuProps {
  verseKey: string;                 // "13:35"
  visible: boolean;
  onClose: () => void;
  onListen: (verseKey: string) => void;         // سماع الآية
  onTafsir: (verseKey: string) => void;         // عرض التفسير
  onBookmark: (verseKey: string, color: string) => void;  // حفظ فاصل
  onShare: (verseKey: string) => void;          // مشاركة الآية
  isDarkMode: boolean;              // دعم الدارك مود
}
```

## 4. AsyncStorage Contracts

```typescript
// مفاتيح التخزين
const STORAGE_KEYS = {
  LAST_PAGE: '@quran_reader_last_page',
  BOOKMARKS: '@quran_reader_bookmarks',
} as const;

// أشكال البيانات المخزنة
interface StoredReadingProgress {
  lastPage: number;
  updatedAt: number;  // Unix timestamp
}

interface StoredBookmark {
  verseKey: string;
  color: string;      // hex color
  timestamp: number;
  pageNumber: number;
}
```

## 5. Navigation Contract

```typescript
// app/quran-reader.tsx
// Route: /quran-reader
// Query Params (optional):
//   - page: number (1-604) → فتح صفحة محددة
//
// مثال: router.push('/quran-reader?page=254')
```

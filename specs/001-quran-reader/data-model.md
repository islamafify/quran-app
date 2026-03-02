# Data Model: شاشة قراءة القرآن (001-quran-reader)

**Date**: 2026-02-27

## الكيانات

### 1. Verse (الآية)
مصدر البيانات: `@quranjs/api` → `client.verses.findByPage()`

| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | number | المعرف الفريد للآية |
| verseNumber | number | رقم الآية داخل السورة |
| verseKey | string | مفتاح الآية بصيغة `chapter:verse` مثل `2:255` |
| chapterId | number | رقم السورة |
| pageNumber | number | رقم الصفحة في المصحف |
| juzNumber | number | رقم الجزء |
| hizbNumber | number | رقم الحزب |
| rubElHizbNumber | number | رقم ربع الحزب |
| textUthmani | string | نص الآية بالرسم العثماني |

### 2. Chapter (السورة)
مصدر البيانات: `@quranjs/api` → `client.chapters.findAll()`

| الحقل | النوع | الوصف |
|-------|-------|-------|
| id | number | رقم السورة (1-114) |
| nameArabic | string | اسم السورة بالعربية |
| nameSimple | string | اسم السورة بصيغة بسيطة |
| versesCount | number | عدد آيات السورة |
| pages | number[] | أرقام الصفحات التي تحتويها السورة |

### 3. PageMeta (بيانات الصفحة الوصفية)
كيان مشتق يتم حسابه من بيانات الآيات في الصفحة

| الحقل | النوع | الوصف |
|-------|-------|-------|
| pageNumber | number | رقم الصفحة (1-604) |
| juzNumber | number | رقم الجزء المستخلص من أول آية |
| rubElHizbNumber | number | رقم ربع الحزب المستخلص من آخر آية |
| surahName | string | اسم السورة الرئيسية في الصفحة |
| verses | Verse[] | قائمة الآيات في الصفحة |

### 4. Bookmark (الفاصل)
يتم تخزينه محلياً عبر AsyncStorage

| الحقل | النوع | الوصف |
|-------|-------|-------|
| verseKey | string | مفتاح الآية المحفوظة مثل `2:255` |
| color | string | لون الفاصل (hex value) |
| timestamp | number | وقت الإنشاء (Unix timestamp) |
| pageNumber | number | رقم الصفحة للرجوع السريع |

### 5. ReadingProgress (تقدم القراءة)
يتم تخزينه محلياً عبر AsyncStorage

| الحقل | النوع | الوصف |
|-------|-------|-------|
| lastPage | number | رقم آخر صفحة تمت قراءتها |
| updatedAt | number | وقت آخر تحديث (Unix timestamp) |

---

## العلاقات

```
Page (1) ──contains──► Verse (many)
Chapter (1) ──contains──► Verse (many)
Verse (1) ◄──references── Bookmark (many)
```

## مفاتيح التخزين المحلي (AsyncStorage Keys)

| المفتاح | القيمة | الغرض |
|---------|--------|-------|
| `@quran_reader_last_page` | `{ lastPage: number, updatedAt: number }` | حفظ آخر صفحة |
| `@quran_reader_bookmarks` | `Bookmark[]` | قائمة الفواصل المحفوظة |

## قواعد التحقق (Validation Rules)

- `pageNumber`: يجب أن يكون بين 1 و 604.
- `verseKey`: يجب أن يطابق الصيغة `{1-114}:{1-286}`.
- `color` في Bookmark: يجب أن يكون قيمة hex صالحة.
- عند فشل جلب البيانات من API، يجب عرض رسالة خطأ مناسبة دون تعطل التطبيق.

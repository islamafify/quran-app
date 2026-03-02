# Research: شاشة قراءة القرآن (001-quran-reader)

**Date**: 2026-02-27

## R1: مكتبة @quranjs/api - واجهات البرمجة المتاحة

### القرار
استخدام `@quranjs/api` v2.1.0 (مثبتة مسبقاً في المشروع) لجلب بيانات الآيات، السور، والصوتيات.

### النتائج
- **جلب الآيات حسب الصفحة**: `client.verses.findByPage("1")` - يجلب جميع آيات صفحة معينة مع بيانات وصفية (juzNumber, hizbNumber, rubElHizbNumber, pageNumber, chapterId).
- **جلب الآيات حسب السورة**: `client.verses.findByChapter("1")`.
- **جلب آية بمفتاح**: `client.verses.findByKey("2:255")`.
- **الحصول على التفسيير**: `client.verses.findByKey("1:1", { tafsirs: [171] })` - رقم 171 هو تفسير ابن كثير.
- **جلب الصوت**: `client.audio.findVerseRecitationsByKey("2:255", "2")` - يعيد URL الصوت و segments.
- **بيانات السور**: `client.chapters.findAll({ language: Language.ARABIC })` - تعيد nameArabic, nameSimple, nameComplex, pages, versesCount.
- **Verse Type Fields**: id, verseNumber, verseKey, chapterId, pageNumber, juzNumber, hizbNumber, rubElHizbNumber, textUthmani, textImlaei, words, translations, tafsirs, audio.

### البدائل المدروسة
- REST API مباشرة: مرفوض لأن المكتبة توفر type-safety و caching.
- تخزين البيانات محلياً: غير مطلوب حالياً لأن المشروع يحتوي بالفعل على `OfflineQuranReader` يعتمد على صور محلية.

---

## R2: إدارة حالة الاتصال بالإنترنت

### القرار
استخدام `@react-native-community/netinfo` v11.4.1 (مثبتة مسبقاً) للتحقق من الاتصال قبل عمليات السماع والتفسير.

### النتائج
- المشروع يستخدمها بالفعل في `quran-web.tsx` بنمط `NetInfo.addEventListener`.
- يمكن استخدام `NetInfo.fetch()` كـ one-shot check قبل أي عملية تتطلب الإنترنت.
- عرض رسالة Toast باستخدام `react-native-toast-message` المثبت والموجود بالفعل مع `toastConfig` في `components/ui/Toast.tsx`.

### البدائل المدروسة
- `expo-network`: موجودة في المشروع لكن `netinfo` أكثر نضجاً ومستخدمة بالفعل.

---

## R3: التخزين المحلي لآخر صفحة

### القرار
استخدام `@react-native-async-storage/async-storage` v2.2.0 (مثبتة مسبقاً) لتخزين رقم الصفحة الحالية.

### النتائج
- المشروع يستخدمها بالفعل في `OfflineQuranReader.tsx` بمفتاح `@last_quran_page_v1`.
- سنستخدم مفتاح مختلف `@quran_reader_last_page` للشاشة الجديدة لتجنب التعارض.
- نمط الاستخدام: `AsyncStorage.setItem` / `AsyncStorage.getItem`.

### البدائل المدروسة
- Expo SecureStore: مبالغ فيه لهذا الغرض (مخصص للبيانات الحساسة).
- SQLite: تعقيد غير مبرر لتخزين رقم واحد.

---

## R4: هيكل واجهة المستخدم والتفاعلات

### القرار
إنشاء شاشة جديدة `app/quran-reader.tsx` مع مكونات فرعية في `components/quran-reader/`.

### النتائج
- **FlatList أفقي مع RTL**: كما في `OfflineQuranReader` لكن ببيانات مباشرة من API بدل صور.
- **Pressable مع onLongPress**: لالتقاط النقرة المطولة على الآيات.
- **Animated API أو Reanimated**: لتحريك أشرطة التحكم (slide in/out). المشروع يحتوي على `react-native-reanimated` v4.1.1.
- **SafeAreaView**: من `react-native-safe-area-context` v5.6.0 المثبتة.
- **تصميم الأشرطة**: مستوحى من الصور المرفقة - شريط علوي شفاف مع خلفية وأيقونات، وشريط سفلي مع كنترول الصوت.

### البدائل المدروسة
- ScrollView بدل FlatList: مرفوض لأن FlatList يقدم أداء أفضل مع التحميل الكسول.
- PagerView: خيار جيد لكن FlatList أبسط ومستخدم بالفعل في المشروع.

---

## R5: الرسم العثماني (textUthmani)

### القرار
استخدام حقل `textUthmani` من API وهو الرسم العثماني التقليدي المطابق لمصحف المدينة النبوية. هذا هو الخيار الأمثل لعرض نص القرآن بشكل أصيل.

### النتائج
- API توفر عدة حقول نصية:
  - `textUthmani`: **الرسم العثماني التقليدي (مصحف المدينة)** ← المختار
  - `textUthmaniSimple`: رسم عثماني مبسط
  - `textUthmaniTajweed`: رسم عثماني مع علامات التجويد
  - `textImlaei`: الرسم الإملائي الحديث
- `textUthmani` هو الأنسب لعرض نص المصحف لأنه يطابق ما اعتاد عليه القراء.
- خط `ReadexPro` المستخدم في المشروع يدعم العربية لكنه ليس خط مصحفي.
- يمكن استخدام `KFGQPC Uthmanic Script HAFS` أو خط مشابه لعرض نص المصحف بشكل صحيح.

### البدائل المرفوضة
- `textImlaei`: الرسم الإملائي لا يناسب قراءة المصحف التقليدية.
- `codeV1/codeV2`: تتطلب خطوط خاصة من Quran.com وهي أكثر تعقيداً.
- عرض صور بدلاً من نصوص: موجود بالفعل في `OfflineQuranReader` لكن لا يدعم التفاعل مع الآيات الفردية.

---

## R6: مكتبة FlashList بدلاً من FlatList

### القرار
استخدام `@shopify/flash-list` بدلاً من FlatList الافتراضية لتحسين أداء عرض صفحات القرآن.

### النتائج
- FlashList أسرع بـ 5 مرات من FlatList خاصة مع المحتوى النصي الغني.
- Drop-in replacement: نفس الـ API تقريباً مع تغييرات بسيطة.
- تستخدم `estimatedItemSize` بدلاً من `getItemLayout`.
- أفضل في recycling العناصر مما يقلل استهلاك الذاكرة مع 604 صفحة.
- تدعم `inverted` للعرض من اليمين لليسار (RTL).

### البدائل المرفوضة
- FlatList: أبطأ بكثير مع القوائم الطويلة والمحتوى النصي الغني.
- ScrollView: لا يدعم التحميل الكسول (lazy loading).

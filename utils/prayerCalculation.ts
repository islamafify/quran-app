import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';
import * as Location from 'expo-location';

export const ARAB_COUNTRIES: Record<string, { name: string, lat: number, lng: number, iso: string, country: string, city: string }> = {
    egypt: { name: 'مصر (القاهرة)', lat: 30.0444, lng: 31.2357, iso: 'EG', country: 'مصر', city: 'القاهرة' },
    ksa: { name: 'السعودية (مكة المكرمة)', lat: 21.4225, lng: 39.8262, iso: 'SA', country: 'السعودية', city: 'مكة المكرمة' },
    uae: { name: 'الإمارات (أبو ظبي)', lat: 24.4539, lng: 54.3773, iso: 'AE', country: 'الإمارات', city: 'أبو ظبي' },
    morocco: { name: 'المغرب (الدار البيضاء)', lat: 33.5731, lng: -7.5898, iso: 'MA', country: 'المغرب', city: 'الدار البيضاء' },
    algeria: { name: 'الجزائر (الجزائر)', lat: 36.7538, lng: 3.0588, iso: 'DZ', country: 'الجزائر', city: 'الجزائر' },
    tunisia: { name: 'تونس (تونس)', lat: 36.8065, lng: 10.1815, iso: 'TN', country: 'تونس', city: 'تونس' },
    libya: { name: 'ليبيا (طرابلس)', lat: 32.8802, lng: 13.1900, iso: 'LY', country: 'ليبيا', city: 'طرابلس' },
    sudan: { name: 'السودان (الخرطوم)', lat: 15.5007, lng: 32.5599, iso: 'SD', country: 'السودان', city: 'الخرطوم' },
    palestine: { name: 'فلسطين (القدس)', lat: 31.7683, lng: 35.2137, iso: 'PS', country: 'فلسطين', city: 'القدس' },
    jordan: { name: 'الأردن (عمان)', lat: 31.9454, lng: 35.9284, iso: 'JO', country: 'الأردن', city: 'عمان' },
    lebanon: { name: 'لبنان (بيروت)', lat: 33.8938, lng: 35.5018, iso: 'LB', country: 'لبنان', city: 'بيروت' },
    syria: { name: 'سوريا (دمشق)', lat: 33.5138, lng: 36.2765, iso: 'SY', country: 'سوريا', city: 'دمشق' },
    iraq: { name: 'العراق (بغداد)', lat: 33.3128, lng: 44.3615, iso: 'IQ', country: 'العراق', city: 'بغداد' },
    kuwait: { name: 'الكويت (الكويت)', lat: 29.3759, lng: 47.9774, iso: 'KW', country: 'الكويت', city: 'الكويت' },
    qatar: { name: 'قطر (الدوحة)', lat: 25.2854, lng: 51.5310, iso: 'QA', country: 'قطر', city: 'الدوحة' },
    bahrain: { name: 'البحرين (المنامة)', lat: 26.2285, lng: 50.5860, iso: 'BH', country: 'البحرين', city: 'المنامة' },
    oman: { name: 'عُمان (مسقط)', lat: 23.5859, lng: 58.4059, iso: 'OM', country: 'عُمان', city: 'مسقط' },
    yemen: { name: 'اليمن (صنعاء)', lat: 15.3694, lng: 44.1910, iso: 'YE', country: 'اليمن', city: 'صنعاء' },
    mauritania: { name: 'موريتانيا (نواكشوط)', lat: 18.0735, lng: -15.9582, iso: 'MR', country: 'موريتانيا', city: 'نواكشوط' },
    somalia: { name: 'الصومال (مقديشو)', lat: 2.0469, lng: 45.3182, iso: 'SO', country: 'الصومال', city: 'مقديشو' },
    djibouti: { name: 'جيبوتي (جيبوتي)', lat: 11.5880, lng: 43.1456, iso: 'DJ', country: 'جيبوتي', city: 'جيبوتي' },
    comoros: { name: 'جزر القمر (موروني)', lat: -11.7022, lng: 43.2551, iso: 'KM', country: 'جزر القمر', city: 'موروني' },
};

/**
 * تحديد طريقة الحساب المناسبة بناءً على كود الدولة.
 */
export function getCalculationMethodByCountryCode(isoCountryCode?: string | null) {
    const methodId = getDefaultCalcMethodId(isoCountryCode);
    return getCalcMethodParams(methodId);
}

/**
 * إرجاع معرف طريقة الحساب الافتراضية بناءً على كود الدولة.
 */
function getDefaultCalcMethodId(isoCountryCode?: string | null): string {
    if (!isoCountryCode) return 'Egyptian';

    // السعودية والخليج → UmmAlQura
    const gulfCountries = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE'];
    if (gulfCountries.includes(isoCountryCode)) return 'UmmAlQura';

    // مصر والسودان → Egyptian
    const egyptianCountries = ['EG', 'SD'];
    if (egyptianCountries.includes(isoCountryCode)) return 'Egyptian';

    // أمريكا وكندا → ISNA
    const northAmericaCountries = ['US', 'CA'];
    if (northAmericaCountries.includes(isoCountryCode)) return 'ISNA';

    // باقي الدول العربية وأوروبا وأفريقيا → MWL
    const mwlCountries = [
        'MA', 'DZ', 'TN', 'LY', 'MR', 'SO', 'DJ', 'KM', // شمال أفريقيا
        'PS', 'JO', 'LB', 'SY', 'IQ', // الشام والعراق
        'TR', 'MY', 'ID', 'PK', 'BD', // دول إسلامية أخرى
        'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'AT', 'CH', // أوروبا
    ];
    if (mwlCountries.includes(isoCountryCode)) return 'MWL';

    // افتراضي: Egyptian
    return 'Egyptian';
}

/**
 * تحويل معرف الطريقة إلى كائن CalculationParameters.
 */
function getCalcMethodParams(methodId: string) {
    switch (methodId) {
        case 'UmmAlQura': return CalculationMethod.UmmAlQura();
        case 'MWL': return CalculationMethod.MuslimWorldLeague();
        case 'ISNA': return CalculationMethod.NorthAmerica();
        case 'Egyptian':
        default: return CalculationMethod.Egyptian();
    }
}

/**
 * محاولة الحصول على الموقع مع timeout لمنع التعلق.
 */
async function getPositionWithTimeout(timeoutMs: number = 10000): Promise<Location.LocationObject> {
    return new Promise(async (resolve, reject) => {
        // Timer للـ timeout
        const timer = setTimeout(() => {
            reject(new Error(`Location request timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // توازن بين السرعة والدقة
            });
            clearTimeout(timer);
            resolve(location);
        } catch (e) {
            clearTimeout(timer);
            reject(e);
        }
    });
}

/**
 * دالة مساعدة للحصول على الموقع وطريقة الحساب في خطوة واحدة.
 * تستخدم آخر موقع معروف أولاً للسرعة، ثم تحاول الحصول على موقع جديد.
 */
export async function getLocationAndMethod() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Permission denied');
    }

    let latitude: number;
    let longitude: number;

    // محاولة 1: آخر موقع معروف (سريع جداً)
    try {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
            latitude = lastKnown.coords.latitude;
            longitude = lastKnown.coords.longitude;
            console.log('✅ Using last known position:', latitude, longitude);
        } else {
            throw new Error('No last known position');
        }
    } catch (e) {
        console.log('⏳ No last known position, requesting GPS...');
        // محاولة 2: طلب GPS مع timeout
        try {
            const location = await getPositionWithTimeout(15000); // 15 ثانية timeout
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
            console.log('✅ Got GPS position:', latitude, longitude);
        } catch (gpsError) {
            console.error('❌ Failed to get location, using fallback:', gpsError);
            const fallbackLoc = await AsyncStorage.getItem('@settings_fallback_location') || 'egypt';
            const countryData = ARAB_COUNTRIES[fallbackLoc] || ARAB_COUNTRIES['egypt'];
            latitude = countryData.lat;
            longitude = countryData.lng;
        }
    }

    // محاولة تحديث بموقع أدق في الخلفية (لا تمنع العرض)
    getPositionWithTimeout(15000).then((freshLocation) => {
        // هذا الموقع الأحدث سيتم استخدامه في المرة القادمة
        console.log('🔄 Location updated:', freshLocation.coords.latitude, freshLocation.coords.longitude);
    }).catch(() => {
        // لا مشكلة، استخدمنا الموقع السابق
    });

    // الحصول على اسم المدينة والدولة
    let city = '';
    let country = '';
    let isoCountryCode: string | null = null;

    try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address && address.length > 0) {
            const addr = address[0];
            city = addr.city || addr.region || addr.country || '';
            country = addr.country || '';
            isoCountryCode = addr.isoCountryCode || null;
            console.log('📍 Location:', city, '-', country);
        }
    } catch (e) {
        console.log('⚠️ Failed to reverse geocode, using fallback names if available', e);
        // Fallback names if network fails to reverse geocode
        const fallbackLoc = await AsyncStorage.getItem('@settings_fallback_location') || 'egypt';
        const countryData = ARAB_COUNTRIES[fallbackLoc];

        if (countryData && latitude === countryData.lat) {
            city = countryData.city;
            country = countryData.country;
            isoCountryCode = countryData.iso;
        } else {
            city = 'آلية تحديد الموقع'; country = 'لم تعمل جيداً';
        }
    }

    // تحديد طريقة الحساب بناءً على إعدادات المستخدم أو اختيار تلقائي حسب الدولة
    const savedMethod = await AsyncStorage.getItem('@settings_calc_method');
    // إذا لم يختر المستخدم طريقة، نحددها تلقائياً حسب دولته
    let calcMethodId = savedMethod || getDefaultCalcMethodId(isoCountryCode);
    let params = getCalcMethodParams(calcMethodId);
    console.log('🕌 Calculation method:', calcMethodId);

    // Log prayer times for today
    const coordinates = new Coordinates(latitude, longitude);
    const todayTimes = new PrayerTimes(coordinates, new Date(), params);
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    console.log(`🕐 Prayer times → Fajr: ${fmt(todayTimes.fajr)}, Dhuhr: ${fmt(todayTimes.dhuhr)}, Asr: ${fmt(todayTimes.asr)}, Maghrib: ${fmt(todayTimes.maghrib)}, Isha: ${fmt(todayTimes.isha)}`);

    return {
        coords: { latitude, longitude },
        params,
        city,
        country
    };
}

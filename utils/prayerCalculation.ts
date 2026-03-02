import { CalculationMethod } from 'adhan';
import * as Location from 'expo-location';

/**
 * تحديد طريقة الحساب المناسبة بناءً على كود الدولة.
 * يُعيد UmmAlQura افتراضياً، ويتحول لـ Egyptian لمصر.
 */
export function getCalculationMethodByCountryCode(isoCountryCode?: string | null) {
    if (isoCountryCode === 'EG') {
        return CalculationMethod.Egyptian();
    }
    // يمكن إضافة دول أخرى هنا
    // if (isoCountryCode === 'US') return CalculationMethod.NorthAmerica();
    return CalculationMethod.UmmAlQura();
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
            console.log('✅ استخدام آخر موقع معروف:', latitude, longitude);
        } else {
            throw new Error('No last known position');
        }
    } catch (e) {
        console.log('⏳ لا يوجد موقع سابق، جاري طلب GPS...');
        // محاولة 2: طلب GPS مع timeout
        try {
            const location = await getPositionWithTimeout(15000); // 15 ثانية timeout
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
            console.log('✅ تم الحصول على موقع GPS:', latitude, longitude);
        } catch (gpsError) {
            console.error('❌ فشل الحصول على الموقع:', gpsError);
            throw new Error('Failed to get location');
        }
    }

    // محاولة تحديث بموقع أدق في الخلفية (لا تمنع العرض)
    getPositionWithTimeout(15000).then((freshLocation) => {
        // هذا الموقع الأحدث سيتم استخدامه في المرة القادمة
        console.log('🔄 تم تحديث الموقع:', freshLocation.coords.latitude, freshLocation.coords.longitude);
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
            console.log('📍 الموقع:', city, '-', country);
        }
    } catch (e) {
        console.log('⚠️ فشل تحديد اسم المدينة، سيتم استخدام طريقة الحساب الافتراضية', e);
    }

    // تحديد طريقة الحساب بناءً على كود الدولة (بدون طلب reverseGeocode مرة ثانية)
    const params = getCalculationMethodByCountryCode(isoCountryCode);

    return {
        coords: { latitude, longitude },
        params,
        city,
        country
    };
}

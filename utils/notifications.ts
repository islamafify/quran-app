import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationParameters, Coordinates, PrayerTimes } from 'adhan';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const formatTime = (date: Date) => {
    const time = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);

    return time.replace('AM', 'ص').replace('PM', 'م');
};

// تهيئة إعدادات التنبيهات - حسب توثيق Expo الرسمي
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function requestPermissionsAsync() {
    if (Platform.OS === 'android') {
        // إنشاء قناة الإشعارات لـ Android (مطلوب من Android 8+)
        await Notifications.setNotificationChannelAsync('prayers', {
            name: 'أوقات الصلاة',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#fbbf24',
            sound: 'default',
        });
    }

    const settings = await Notifications.getPermissionsAsync();

    // التحقق من حالة الصلاحيات على iOS بشكل دقيق
    if (Platform.OS === 'ios') {
        if (
            settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
            settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
        ) {
            return true;
        }
    } else if (settings.granted) {
        return true;
    }

    // طلب الصلاحيات مع تحديد خيارات iOS صراحةً حسب التوثيق
    const response = await Notifications.requestPermissionsAsync({
        ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
        },
    });

    if (Platform.OS === 'ios') {
        return (
            response.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
            response.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
        );
    }

    return response.granted;
}

/**
 * جدولة تنبيهات لصلوات اليوم والأيام القادمة.
 * سيتم إلغاء التنبيهات القديمة لإنشاء جديدة لضمان عدم التكرار.
 */
export async function schedulePrayerNotifications(prayers: { id: string, name: string, time: Date }[]) {
    // إلغاء جميع التنبيهات المجدولة مسبقاً لمنع التكرار
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    // قراءة إعدادات التنبيهات لكل صلاة
    const settingsStr = await AsyncStorage.getItem('@prayer_notifications_settings_v1');
    let settings: Record<string, boolean> = {};
    if (settingsStr) {
        settings = JSON.parse(settingsStr);
    }

    for (const prayer of prayers) {
        // التحقق مما إذا كانت التنبيهات مفعلة لهذه الصلاة (الافتراضي مفعل)
        const isEnabled = settings[prayer.id] !== false;

        // التحقق من أن وقت الصلاة لم يمر بعد
        if (isEnabled && prayer.time.getTime() > now.getTime()) {
            // 1. تنبيه قبل الصلاة بـ 5 دقائق
            const before5Mins = new Date(prayer.time.getTime() - 5 * 60000);
            if (before5Mins.getTime() > now.getTime()) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'اقترب وقت الصلاة',
                        body: `بقي 5 دقائق على رفع أذان ${prayer.name} (${formatTime(prayer.time)})`,
                        sound: true,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: before5Mins,
                        channelId: Platform.OS === 'android' ? 'prayers' : undefined
                    } as any, // fallback for Expo TS definitions
                });
            }

            // 2. تنبيه وقت الصلاة بالضبط
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `حان الآن وقت الصلاة`,
                    body: `حان الآن موعد أذان ${prayer.name} (${formatTime(prayer.time)})`,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: prayer.time,
                    channelId: Platform.OS === 'android' ? 'prayers' : undefined
                } as any,
            });
        }
    }
}

const PRAYER_NAMES = {
    fajr: 'الفجر',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء'
};

export async function scheduleDailyPrayers(coords: any, params: any) {
    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const now = new Date();
    let calcParams = params;
    if (params && !(params instanceof CalculationParameters)) {
        calcParams = Object.create(CalculationParameters.prototype);
        Object.assign(calcParams, params);
    }

    const prayersToSchedule = [];
    for (let i = 0; i < 3; i++) {
        const day = new Date(now);
        day.setDate(day.getDate() + i);
        const times = new PrayerTimes(coordinates, day, calcParams);
        prayersToSchedule.push(
            { id: 'fajr', name: PRAYER_NAMES.fajr, time: times.fajr },
            { id: 'dhuhr', name: PRAYER_NAMES.dhuhr, time: times.dhuhr },
            { id: 'asr', name: PRAYER_NAMES.asr, time: times.asr },
            { id: 'maghrib', name: PRAYER_NAMES.maghrib, time: times.maghrib },
            { id: 'isha', name: PRAYER_NAMES.isha, time: times.isha }
        );
    }

    await schedulePrayerNotifications(prayersToSchedule);
}

export async function scheduleTestNotification() {
    const triggerDate = new Date(Date.now() + 5 * 1000); // 5 seconds from now

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'تنبيه تجريبي',
            body: `هذا تنبيه للتجربة (${formatTime(triggerDate)})`,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: Platform.OS === 'android' ? 'prayers' : undefined
        } as any,
    });
}

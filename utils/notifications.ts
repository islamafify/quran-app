import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationParameters, Coordinates, PrayerTimes } from 'adhan';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

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

export async function setupAndroidNotificationChannels() {
    if (Platform.OS === 'android') {
        // تنظيف القنوات القديمة إذا وُجدت
        try {
            const allChannels = await Notifications.getNotificationChannelsAsync();
            for (const ch of allChannels) {
                if (ch.id === 'prayers' || ch.id === 'prayers_adhan2' || (ch.id.startsWith('zikr_') && ch.id !== 'zikr_1' && ch.id !== 'zikr_2')) {
                    await Notifications.deleteNotificationChannelAsync(ch.id);
                }
            }
        } catch (_) { /* ignore */ }

        // إنشاء قنوات الإشعارات الثابتة لـ Android
        await Notifications.setNotificationChannelAsync('prayers_adhan', {
            name: 'أوقات الصلاة (أذان)',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#fbbf24',
            sound: 'adhan', // بدون امتداد لدعم أندرويد بشكل مثالي
        });
        await Notifications.setNotificationChannelAsync('prayers_default', {
            name: 'أوقات الصلاة (تنبيه عادي)',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#fbbf24',
            sound: 'default',
        });
        await Notifications.setNotificationChannelAsync('zikr_1', {
            name: 'تذكير الذكر (صوت 1)',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#fbbf24',
            sound: 'zikr1', // بدون امتداد
        });
        await Notifications.setNotificationChannelAsync('zikr_2', {
            name: 'تذكير الذكر (صوت 2)',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#fbbf24',
            sound: 'zikr2', // بدون امتداد
        });
    }
}

export async function requestPermissionsAsync() {
    await setupAndroidNotificationChannels();

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
    // إلغاء إشعارات الصلوات فقط (بدون المساس بإشعارات الذكر)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
        if (!notif.identifier.startsWith('ZIKR_')) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
    }

    const now = new Date();

    // قراءة إعدادات التنبيهات لكل صلاة
    const settingsStr = await AsyncStorage.getItem('@prayer_notifications_settings_v1');
    let settings: Record<string, string | boolean> = {};
    if (settingsStr) {
        settings = JSON.parse(settingsStr);
    }

    for (const prayer of prayers) {
        const currentSetting = settings[prayer.id];
        const state = typeof currentSetting === 'boolean' ? (currentSetting ? 'adhan' : 'silent') : (currentSetting || 'adhan');
        const isEnabled = state !== 'silent';

        let playSoundConfig: string | boolean = false;
        let channelId = Platform.OS === 'android' ? 'prayers_default' : undefined;

        if (state === 'adhan') {
            playSoundConfig = 'adhan.mp3';
            channelId = Platform.OS === 'android' ? 'prayers_adhan' : undefined;
        } else if (state === 'notification') {
            playSoundConfig = true;
            channelId = Platform.OS === 'android' ? 'prayers_default' : undefined;
        }

        // التحقق من أن وقت الصلاة لم يمر بعد
        if (isEnabled && prayer.time.getTime() > now.getTime()) {
            // 1. تنبيه قبل الصلاة بـ 5 دقائق (دائماً بصوت الإشعار العادي فقط)
            const before5Mins = new Date(prayer.time.getTime() - 5 * 60000);
            if (before5Mins.getTime() > now.getTime()) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `اقترب وقت صلاة ${prayer.name}`,
                        body: `بقي 5 دقائق على رفع أذان ${prayer.name} (${formatTime(prayer.time)})`,
                        sound: true, // صوت إشعار عادي فقط (بدون أذان)
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: before5Mins,
                        channelId: Platform.OS === 'android' ? 'prayers_default' : undefined
                    } as any, // fallback for Expo TS definitions
                });
            }

            // 2. تنبيه وقت الصلاة بالضبط
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `حان الآن وقت صلاة ${prayer.name} (${formatTime(prayer.time)})`,
                    body: PRAYER_BODIES[prayer.id] || `حان الآن موعد أذان ${prayer.name} (${formatTime(prayer.time)})`,
                    sound: playSoundConfig,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: prayer.time,
                    channelId: channelId
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

const PRAYER_BODIES: Record<string, string> = {
    fajr: 'نور يومك يبدأ من سجدة؛ كن الآن في ذمة الله.',
    dhuhr: 'فصلٌ بين انشغالك بالدنيا ووصالك مع الآخرة؛ أرح قلبك بصلاة الظهر.',
    asr: '﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ﴾؛ لا تدع بركة يومك تفوتك الآن.',
    maghrib: 'اجعل أولى خطوات ليلك بين يدي الرحمن، واختم نهارك بذكره.',
    isha: 'من صلى العشاء في جماعة فهو في ذمة الله؛ اختم يومك بصفاء الروح.',
};

export async function scheduleDailyPrayers(coords: any, params: any) {
    const coordinates = new Coordinates(coords.latitude, coords.longitude);
    const now = new Date();
    let calcParams = params;
    if (params && !(params instanceof CalculationParameters)) {
        calcParams = Object.create(CalculationParameters.prototype);
        Object.assign(calcParams, params);
    }

    // جدولة لمدة محدودة لتجنب حد النظام للإشعارات (iOS: 64, Android: 500)
    // 5 صلوات × 2 إشعار (قبل 5 دقائق + وقت الصلاة) = 10 إشعارات/يوم
    // 6 أيام × 10 = 60 إشعار (آمن جداً لكل الأنظمة)
    const maxDays = 6;

    const prayersToSchedule = [];
    for (let i = 0; i < maxDays; i++) {
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

export async function scheduleTestNotification(soundType: 'adhan' | 'notification' | 'silent' = 'notification') {
    // التأكد من خلق القنوات حتى وإن تم استخدام hot-reload
    await setupAndroidNotificationChannels();

    const triggerDate = new Date(Date.now() + 6 * 1000); // 6 seconds from now

    let playSoundConfig: string | boolean = false;
    let channelId = Platform.OS === 'android' ? 'prayers_default' : undefined;

    if (soundType === 'adhan') {
        playSoundConfig = 'adhan.mp3';
        channelId = Platform.OS === 'android' ? 'prayers_adhan' : undefined;
    } else if (soundType === 'notification') {
        playSoundConfig = true;
        channelId = Platform.OS === 'android' ? 'prayers_default' : undefined;
    }

    await Notifications.scheduleNotificationAsync({
        identifier: 'TEST_NOTIFICATION_' + Date.now().toString(),
        content: {
            title: 'تنبيه صلاة تجريبي',
            body: `هذا تنبيه للتجربة حان الآن وقت الصلاة المحددة (${formatTime(triggerDate)})`,
            sound: playSoundConfig,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: channelId
        } as any,
    });
}

/**
 * جدولة تذكير "الصلاة على النبي" بشكل متكرر مستندة إلى الدقائق المحددة
 */
export async function scheduleZikrNotification(enabled: boolean, intervalMins: number, audioFile: string = '1') {
    // إلغاء الإشعارات السابقة الخاصة بالذكر
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
        if (notif.identifier.startsWith('ZIKR_')) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
    }

    if (!enabled || intervalMins <= 0) return;

    const soundName = audioFile === '2' ? 'zikr2.mp3' : 'zikr1.mp3';
    const channelId = Platform.OS === 'android' ? (audioFile === '2' ? 'zikr_2' : 'zikr_1') : undefined;

    await Notifications.scheduleNotificationAsync({
        identifier: `ZIKR_INTERVAL`,
        content: {
            title: 'صَلِّ على محمد',
            body: 'من صلى على النبي ﷺ مرة، صلى الله عليه بها عشراً',
            sound: soundName,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: intervalMins * 60,
            repeats: true,
            channelId: channelId,
        } as any,
    });
}

/**
 * دالة للاستماع لحالة التطبيق والضغط على الإشعارات
 * بمجرد فتح التطبيق أو الضغط على الإشعار، سيتم مسح الإشعارات وبالتالي يتوقف صوت الأذان فوراً
 */
export function setupNotificationListeners() {
    // إيقاف الصوت عند الضغط على الإشعار
    Notifications.addNotificationResponseReceivedListener(response => {
        Notifications.dismissAllNotificationsAsync();
    });

    // إيقاف الصوت عند فتح التطبيق (الرجوع من الخلفية)
    AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
            Notifications.dismissAllNotificationsAsync();
        }
    });
}

/**
 * جدولة جميع الإشعارات تلقائياً عند فتح التطبيق:
 * 1. إشعارات الصلوات (30 يوم على Android، 6 أيام على iOS)
 * 2. إشعار الذكر (الصلاة على النبي) إذا كان مُفعَّلاً
 */
export async function initAllNotifications() {
    try {
        // 1. طلب الصلاحيات
        const hasPermission = await requestPermissionsAsync();
        if (!hasPermission) {
            console.log('⚠️ لا توجد صلاحية للإشعارات');
            return;
        }

        // 2. جدولة إشعارات الصلوات
        try {
            // Dynamic import لتجنب circular dependency
            const { getLocationAndMethod } = require('@/utils/prayerCalculation');
            const { coords, params } = await getLocationAndMethod();
            await scheduleDailyPrayers(coords, params);
            console.log('✅ تم جدولة إشعارات الصلوات تلقائياً');
        } catch (e) {
            console.log('⚠️ فشل جدولة الصلوات (قد يكون الموقع غير متاح):', e);
        }

        // 3. جدولة إشعار الذكر إذا كان مُفعَّلاً
        try {
            const zikrEnabled = await AsyncStorage.getItem('@settings_zikr_enabled');
            // افتراضياً مفعل (null أو 'true' = مفعل)
            if (zikrEnabled !== 'false') {
                const zikrInterval = await AsyncStorage.getItem('@settings_zikr_interval');
                const zikrAudio = await AsyncStorage.getItem('@settings_zikr_audio');
                const interval = zikrInterval ? Number(zikrInterval) : 15;
                const audio = zikrAudio || '1';

                // تحقق إذا كان الذكر مجدول بالفعل
                const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                const hasZikr = scheduled.some(n => n.identifier.startsWith('ZIKR_'));
                if (!hasZikr) {
                    await scheduleZikrNotification(true, interval, audio);
                    console.log('✅ تم جدولة إشعار الذكر تلقائياً');
                }
            }
        } catch (e) {
            console.log('⚠️ فشل جدولة الذكر:', e);
        }

        // 4. تفعيل مستمعي الإيقاف
        setupNotificationListeners();
    } catch (e) {
        console.error('❌ فشل تهيئة الإشعارات:', e);
    }
}

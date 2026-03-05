
import { GradientBackground } from '@/components/home/GradientBackground';
import { initAllNotifications, scheduleTestNotification, scheduleZikrNotification } from '@/utils/notifications';
import { ARAB_COUNTRIES } from '@/utils/prayerCalculation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, BellRing, ChevronLeft, PlayCircle, Settings2, ShieldCheck, Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // States
    const [zikrEnabled, setZikrEnabled] = useState(true);
    const [zikrInterval, setZikrInterval] = useState(60); // minutes default
    const [intervalInputStr, setIntervalInputStr] = useState('60');
    const [zikrAudio, setZikrAudio] = useState('1'); // '1' or '2'
    const [calcMethod, setCalcMethod] = useState('Egyptian');
    const [prayerNotifs, setPrayerNotifs] = useState<Record<string, string>>({
        fajr: 'adhan',
        dhuhr: 'adhan',
        asr: 'adhan',
        maghrib: 'adhan',
        isha: 'adhan',
    });
    const [fallbackLocation, setFallbackLocation] = useState('egypt');
    const [gpsAvailable, setGpsAvailable] = useState(false);

    // Modal states
    const [calcModalVisible, setCalcModalVisible] = useState(false);
    const [fallbackModalVisible, setFallbackModalVisible] = useState(false);

    const player = useAudioPlayer(null);
    const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        loadSettings();
        checkGpsAvailability();
    }, []);

    const checkGpsAvailability = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            if (status === 'granted') {
                const lastKnown = await Location.getLastKnownPositionAsync();
                setGpsAvailable(!!lastKnown);
            }
        } catch (e) {
            setGpsAvailable(false);
        }
    };

    const loadSettings = async () => {
        try {
            const zikrE = await AsyncStorage.getItem('@settings_zikr_enabled');
            if (zikrE !== null) setZikrEnabled(zikrE === 'true');

            const zikrI = await AsyncStorage.getItem('@settings_zikr_interval');
            if (zikrI !== null) {
                setZikrInterval(Number(zikrI));
                setIntervalInputStr(zikrI);
            }

            const zikrA = await AsyncStorage.getItem('@settings_zikr_audio');
            if (zikrA !== null) setZikrAudio(zikrA);

            const calc = await AsyncStorage.getItem('@settings_calc_method');
            if (calc !== null) {
                setCalcMethod(calc);
            } else {
                // تحديد الطريقة الافتراضية تلقائياً حسب دولة المستخدم
                try {
                    const { status } = await Location.getForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const lastKnown = await Location.getLastKnownPositionAsync();
                        if (lastKnown) {
                            const [addr] = await Location.reverseGeocodeAsync({
                                latitude: lastKnown.coords.latitude,
                                longitude: lastKnown.coords.longitude,
                            });
                            if (addr?.isoCountryCode) {
                                const gulf = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE'];
                                const egyptian = ['EG', 'SD'];
                                const na = ['US', 'CA'];
                                const mwl = ['MA', 'DZ', 'TN', 'LY', 'MR', 'SO', 'DJ', 'KM', 'PS', 'JO', 'LB', 'SY', 'IQ', 'TR'];
                                const code = addr.isoCountryCode;
                                if (gulf.includes(code)) setCalcMethod('UmmAlQura');
                                else if (egyptian.includes(code)) setCalcMethod('Egyptian');
                                else if (na.includes(code)) setCalcMethod('ISNA');
                                else if (mwl.includes(code)) setCalcMethod('MWL');
                            }
                        }
                    }
                } catch (e) {
                    // فشل — نبقى على Egyptian الافتراضي
                }
            }

            const fallback = await AsyncStorage.getItem('@settings_fallback_location');
            if (fallback !== null) setFallbackLocation(fallback);

            // Using the same key from prayers.tsx to keep it synced, but migrating to strings if needed
            const notifs = await AsyncStorage.getItem('@prayer_notifications_settings_v1');
            if (notifs) {
                const parsed = JSON.parse(notifs);
                const updated: Record<string, string> = {};
                Object.keys(parsed).forEach(k => {
                    if (typeof parsed[k] === 'boolean') {
                        updated[k] = parsed[k] ? 'adhan' : 'silent';
                    } else {
                        updated[k] = parsed[k];
                    }
                });
                setPrayerNotifs(prev => ({ ...prev, ...updated }));
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const saveSetting = async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.error('Failed to save setting', e);
        }
    };

    const toggleZikr = async (val: boolean) => {
        setZikrEnabled(val);
        saveSetting('@settings_zikr_enabled', val.toString());
        await scheduleZikrNotification(val, zikrInterval, zikrAudio);
        Toast.show({ type: 'success', text1: val ? 'تم التفعيل' : 'تم الإيقاف', text2: 'تم حفظ إعداد الذكر التلقائي', position: 'bottom' });
    };

    const handleIntervalChange = (text: string) => {
        const num = text.replace(/[^0-9]/g, '');
        setIntervalInputStr(num);
    };

    const saveInterval = async () => {
        let val = parseInt(intervalInputStr, 10);
        if (isNaN(val) || val <= 0) {
            val = 15; // fallback
            setIntervalInputStr('15');
        }
        setZikrInterval(val);
        saveSetting('@settings_zikr_interval', val.toString());
        if (zikrEnabled) {
            await scheduleZikrNotification(true, val, zikrAudio);
            Toast.show({ type: 'success', text1: 'تم التحديث', text2: "تم تحديث التكرار إلى " + val + " دقيقة", position: 'bottom' });
        }
    };

    const changeZikrAudio = async (val: string) => {
        setZikrAudio(val);
        saveSetting('@settings_zikr_audio', val);
        if (zikrEnabled) {
            await scheduleZikrNotification(true, zikrInterval, val);
        }

        // تشغيل الصوت عند النقر
        try {
            if (playTimeoutRef.current) {
                clearTimeout(playTimeoutRef.current);
                playTimeoutRef.current = null;
            }
            try { player.pause(); } catch (_) { }

            if (val === '2') {
                player.replace(require('../assets/audio/zikr2.mp3'));
            } else {
                player.replace(require('../assets/audio/zikr1.mp3'));
            }
            setTimeout(() => {
                try { player.play(); } catch (_) { }
            }, 300);
        } catch (e) {
            console.error('Failed to play sound', e);
        }

        Toast.show({ type: 'success', text1: 'تم التحديث', text2: 'تم تغيير مقطع التنبيه الصوتي', position: 'bottom' });
    };

    const changeCalcMethod = async (val: string) => {
        setCalcMethod(val);
        saveSetting('@settings_calc_method', val);
        setCalcModalVisible(false);
        Toast.show({ type: 'success', text1: 'تم الحفظ', text2: 'تم تحديث طريقة الحساب (ستتغير أوقات الصلاة وفقاً لذلك)', position: 'bottom' });
        // إعادة جدولة الإشعارات بالأوقات الجديدة
        await initAllNotifications();
    };

    const changeFallbackLocation = async (val: string) => {
        setFallbackLocation(val);
        saveSetting('@settings_fallback_location', val);
        setFallbackModalVisible(false);
        Toast.show({ type: 'success', text1: 'تم الحفظ', text2: 'تم تحديد الموقع الافتراضي لحالات عدم توفر GPS', position: 'bottom' });
        // إعادة جدولة الإشعارات بالموقع الجديد
        await initAllNotifications();
    };

    const updatePrayerNotif = async (prayerId: string, val: string) => {
        const updated = { ...prayerNotifs, [prayerId]: val };
        setPrayerNotifs(updated);
        saveSetting('@prayer_notifications_settings_v1', JSON.stringify(updated));

        // إيقاف أي صوت شغال حاليا
        if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
        }
        try { player.pause(); } catch (_) { }

        try {
            if (val === 'adhan') {
                player.replace(require('../assets/audio/adhan.mp3'));
                setTimeout(() => {
                    try { player.play(); } catch (_) { }
                }, 300);

                playTimeoutRef.current = setTimeout(() => {
                    try { player.pause(); } catch (_) { }
                }, 5300);
            } else if (val === 'notification') {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'تجربة الإشعار',
                        body: 'هذا هو صوت الإشعار الافتراضي لجهازك',
                        sound: true,
                    },
                    trigger: null
                });
            }
        } catch (e) {
            console.error('Failed to play preview sound', e);
        }

        // إعادة جدولة الإشعارات لتطبيق الإعداد الجديد فوراً
        await initAllNotifications();
        Toast.show({ type: 'success', text1: 'تم التحديث', text2: `تم تحديث تنبيه صلاة ${prayersList.find(p => p.id === prayerId)?.name || ''}`, position: 'bottom' });
    };

    const getPrayerNotifIcon = (state: string, isActive: boolean) => {
        const iconColor = isActive ? '#D4AF37' : 'rgba(255,255,255,0.4)';
        if (state === 'adhan') return <Volume2 size={16} color={iconColor} />;
        if (state === 'notification') return <BellRing size={16} color={iconColor} />;
        return <VolumeX size={16} color={iconColor} />;
    };

    const getPrayerNotifLabel = (state: string) => {
        if (state === 'adhan') return 'أذان';
        if (state === 'notification') return 'إشعار';
        return 'صامت';
    };

    const prayersList = [
        { id: 'fajr', name: 'الفجر' },
        { id: 'dhuhr', name: 'الظهر' },
        { id: 'asr', name: 'العصر' },
        { id: 'maghrib', name: 'المغرب' },
        { id: 'isha', name: 'العشاء' },
    ];

    const calcMethods = [
        { id: 'UmmAlQura', name: 'أم القرى (مكة المكرمة)' },
        { id: 'Egyptian', name: 'الهيئة المصرية العامة للمساحة' },
        { id: 'MWL', name: 'رابطة العالم الإسلامي' },
        { id: 'ISNA', name: 'الجمعية الإسلامية لأمريكا الشمالية' },
    ];

    const fallbackLocations = Object.entries(ARAB_COUNTRIES).map(([key, data]) => ({
        id: key,
        name: data.name
    }));

    return (
        <GradientBackground>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View style={{ width: 40 }} />

                <Text style={styles.headerTitle}>الإعدادات</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Zikr Auto Setting */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <ShieldCheck size={20} color="#D4AF37" />
                        <Text style={styles.sectionTitle}>التذكير التلقائي</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.rowTextContainer}>
                                <Text style={styles.rowTitle}>تذكير "صَلِّ على محمد"</Text>
                                <Text style={styles.rowSub}>تشغيل تنبيه صوتي للتذكير بالصلاة على النبي</Text>
                            </View>
                            <Switch
                                value={zikrEnabled}
                                onValueChange={toggleZikr}
                                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#D4AF37' }}
                                thumbColor={zikrEnabled ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        {zikrEnabled && (
                            <>
                                <View style={styles.divider} />
                                <View style={styles.intervalContainer}>
                                    <Text style={styles.rowTitle}>التكرار بمعدل (دقائق):</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.textInput}
                                            value={intervalInputStr}
                                            onChangeText={handleIntervalChange}
                                            onEndEditing={saveInterval}
                                            keyboardType="number-pad"
                                            returnKeyType="done"
                                            maxLength={3}
                                            textAlign="center"
                                        />
                                        <Text style={styles.rowSub}>دقيقة</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />
                                <View style={styles.intervalContainer}>
                                    <Text style={styles.rowTitle}>الصوت:</Text>
                                    <View style={styles.chipsContainer}>
                                        <TouchableOpacity
                                            style={[styles.chip, zikrAudio === '1' && styles.chipActive]}
                                            onPress={() => changeZikrAudio('1')}
                                        >
                                            <Text style={[styles.chipText, zikrAudio === '1' && styles.chipTextActive]}>الصوت 1</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.chip, zikrAudio === '2' && styles.chipActive]}
                                            onPress={() => changeZikrAudio('2')}
                                        >
                                            <Text style={[styles.chipText, zikrAudio === '2' && styles.chipTextActive]}>الصوت 2</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Prayer Times Rules */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Settings2 size={20} color="#D4AF37" />
                        <Text style={styles.sectionTitle}>مواقيت الصلاة</Text>
                    </View>

                    <TouchableOpacity style={styles.card} onPress={() => setCalcModalVisible(true)}>
                        <View style={styles.row}>
                            <ChevronLeft size={20} color="rgba(255,255,255,0.4)" />
                            <View style={styles.rowTextContainer}>
                                <Text style={styles.rowTitle}>طريقة الحساب المعتمدة</Text>
                                <Text style={styles.rowSub}>{calcMethods.find(m => m.id === calcMethod)?.name || 'غير محدد'}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Fallback Location */}
                <View style={[styles.section, gpsAvailable && { opacity: 0.5 }]}>
                    <View style={styles.sectionHeader}>
                        <ShieldCheck size={20} color="#D4AF37" />
                        <Text style={styles.sectionTitle}>الموقع الافتراضي (عند تعذر GPS)</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => {
                            if (gpsAvailable) {
                                Toast.show({ type: 'info', text1: 'GPS مفعل', text2: 'يتم استخدام موقعك الحالي تلقائياً. هذا الخيار يعمل فقط عند تعذر تحديد الموقع.', position: 'bottom' });
                            } else {
                                setFallbackModalVisible(true);
                            }
                        }}
                    >
                        <View style={styles.row}>
                            <ChevronLeft size={20} color="rgba(255,255,255,0.4)" />
                            <View style={styles.rowTextContainer}>
                                <Text style={styles.rowTitle}>الدولة الافتراضية</Text>
                                <Text style={styles.rowSub}>
                                    {gpsAvailable
                                        ? '✅ يتم استخدام الموقع الجغرافي تلقائياً'
                                        : (fallbackLocations.find(l => l.id === fallbackLocation)?.name || 'غير محدد')}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Prayer Notifications Setting */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <BellRing size={20} color="#D4AF37" />
                        <Text style={styles.sectionTitle}>تنبيهات الصلوات</Text>
                    </View>

                    <View style={styles.card}>
                        {prayersList.map((prayer, index) => {
                            const state = prayerNotifs[prayer.id] || 'adhan';
                            return (
                                <View key={prayer.id} style={[styles.prayerNotifRow, index !== prayersList.length - 1 && styles.borderBottom]}>
                                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <Text style={styles.prayerNotifName}>{prayer.name}</Text>

                                        <View style={styles.prayerNotifOptionsContainer}>
                                            {['adhan', 'notification', 'silent'].map((s) => (
                                                <TouchableOpacity
                                                    key={s}
                                                    style={[
                                                        styles.prayerNotifOption,
                                                        state === s && styles.prayerNotifOptionActive
                                                    ]}
                                                    onPress={() => updatePrayerNotif(prayer.id, s)}
                                                >
                                                    {getPrayerNotifIcon(s, state === s)}
                                                    <Text style={[
                                                        styles.prayerNotifOptionText,
                                                        state === s && styles.prayerNotifOptionTextActive
                                                    ]}>
                                                        {getPrayerNotifLabel(s)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Test Notifications */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <PlayCircle size={20} color="#D4AF37" />
                        <Text style={styles.sectionTitle}>تجارب الإشعارات (بعد 6 ثوانٍ)</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={[styles.rowSub, { textAlign: 'right', marginBottom: 16, lineHeight: 20 }]}>
                            اضغط لتجربة التنبيه، ثم قم بوضع التطبيق في الخلفية (أو اغلق شاشة الهاتف) وانتظر 6 ثوانٍ للتأكد من وصول الإشعار.
                        </Text>
                        <View style={{ flexDirection: 'row-reverse', gap: 12, justifyContent: 'center' }}>
                            <TouchableOpacity
                                style={[styles.chip, styles.chipActive, { flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 1 }]}
                                onPress={() => {
                                    scheduleTestNotification('adhan');
                                    Toast.show({ type: 'success', text1: 'تم جدولة الأذان التجريبي', text2: 'اخرج من التطبيق الآن وانتظر 6 ثوانٍ', position: 'bottom' });
                                }}
                            >
                                <Volume2 size={24} color="#D4AF37" style={{ marginBottom: 8 }} />
                                <Text style={styles.chipTextActive}>تجربة الأذان</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.chip, { flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={() => {
                                    scheduleTestNotification('notification');
                                    Toast.show({ type: 'success', text1: 'تم جدولة الإشعار التجريبي', text2: 'اخرج من التطبيق الآن وانتظر 6 ثوانٍ', position: 'bottom' });
                                }}
                            >
                                <BellRing size={24} color="#fff" style={{ marginBottom: 8 }} />
                                <Text style={styles.chipText}>تجربة إشعار</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modals */}
            <Modal
                visible={calcModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCalcModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setCalcModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>تحديد طريقة الحساب</Text>
                            <View style={{ width: 24 }} />
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {calcMethods.map((method, index) => (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[styles.radioRow, index !== calcMethods.length - 1 && styles.borderBottom]}
                                    onPress={() => changeCalcMethod(method.id)}
                                >
                                    <View style={styles.radioOuter}>
                                        {calcMethod === method.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioText}>{method.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={fallbackModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFallbackModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setFallbackModalVisible(false)} style={styles.closeBtn}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>اختار الدولة الافتراضية</Text>
                            <View style={{ width: 24 }} />
                        </View>
                        <Text style={[styles.rowSub, { marginBottom: 12, textAlign: 'right' }]}>سيتم الاستناد لهذه الإحداثيات عند تعذر الوصول لـ GPS</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {fallbackLocations.map((loc, index) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[styles.radioRow, index !== fallbackLocations.length - 1 && styles.borderBottom]}
                                    onPress={() => changeFallbackLocation(loc.id)}
                                >
                                    <View style={styles.radioOuter}>
                                        {fallbackLocation === loc.id && <View style={styles.radioInner} />}
                                    </View>
                                    <Text style={styles.radioText}>{loc.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'ReadexPro_600SemiBold',
        color: '#fff',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'ReadexPro_600SemiBold',
        color: '#fff',
    },
    card: {
        backgroundColor: 'rgba(4, 4, 4, 0.09)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    row: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowTextContainer: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 12,
    },
    rowTitle: {
        fontSize: 16,
        fontFamily: 'ReadexPro_500Medium',
        color: '#fff',
        marginBottom: 4,
    },
    rowSub: {
        fontSize: 12,
        fontFamily: 'ReadexPro_300Light',
        color: 'rgba(255, 255, 255, 1)',
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 16,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    intervalContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    chipsContainer: {
        flexDirection: 'row-reverse',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: '#D4AF37',
    },
    chipText: {
        fontSize: 12,
        color: '#fff',
        fontFamily: 'ReadexPro_400Regular',
    },
    chipTextActive: {
        color: '#D4AF37',
        fontFamily: 'ReadexPro_500Medium',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderRadius: 8,
        color: '#D4AF37',
        fontFamily: 'ReadexPro_500Medium',
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: 60,
    },
    radioRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: 12,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#D4AF37',
    },
    radioText: {
        fontSize: 15,
        fontFamily: 'ReadexPro_400Regular',
        color: '#fff',
    },
    prayerNotifRow: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        paddingVertical: 16,
    },
    prayerNotifName: {
        fontSize: 16,
        fontFamily: 'ReadexPro_500Medium',
        color: '#fff',
    },
    prayerNotifOptionsContainer: {
        flexDirection: 'row-reverse',
        gap: 8,
    },
    prayerNotifOption: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    prayerNotifOptionActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: '#D4AF37',
    },
    prayerNotifOptionText: {
        fontSize: 12,
        fontFamily: 'ReadexPro_400Regular',
        color: 'rgba(255, 255, 255, 1)',
    },
    prayerNotifOptionTextActive: {
        color: '#ffffffff',
        fontFamily: 'ReadexPro_500Medium',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#1E1528',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'ReadexPro_600SemiBold',
        color: '#fff',
    },
    closeBtn: {
        padding: 4,
    }
});

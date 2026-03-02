import { GradientBackground } from '@/components/nusuk/GradientBackground';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { scheduleDailyPrayers } from '@/utils/notifications';
import { getLocationAndMethod } from '@/utils/prayerCalculation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationParameters, Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { BellRing, ChevronUp, Volume2, VolumeX } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// Kaaba Coordinates
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export default function PrayerTimesScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const [prayerTimes, setPrayerTimes] = useState<any>(null);
    const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
    const [country, setCountry] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [distanceToKaaba, setDistanceToKaaba] = useState(0);
    const [isUsingCache, setIsUsingCache] = useState(false);

    // Notification logic
    const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({});
    const [latestCoords, setLatestCoords] = useState<any>(null);
    const [latestParams, setLatestParams] = useState<any>(null);

    // Custom notification testing state
    const [isTestModalVisible, setTestModalVisible] = useState(false);
    const [testNotifName, setTestNotifName] = useState('');
    const [testNotifDate, setTestNotifDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [testNotifTime, setTestNotifTime] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 1); // Default target time 1 min ahead
        let hours = d.getHours();
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${String(hours).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    const [testNotifAmPm, setTestNotifAmPm] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 1);
        return d.getHours() >= 12 ? 'PM' : 'AM';
    });

    const STORAGE_KEY = '@prayer_screen_data_v1';

    // Initial Location & Prayer Times
    React.useEffect(() => {
        (async () => {
            try {
                // 0. Load Notification Settings
                const settingsStr = await AsyncStorage.getItem('@prayer_notifications_settings_v1');
                if (settingsStr) {
                    setNotificationSettings(JSON.parse(settingsStr));
                }

                // 1. Try Cache First
                const cached = await AsyncStorage.getItem(STORAGE_KEY);
                if (cached) {
                    const data = JSON.parse(cached);
                    // Use cached data to populate UI immediately
                    updateState(data.coords, data.params, data.city, data.country);
                    setIsUsingCache(true);
                }

                // 2. Fetch Fresh Data
                const { coords, params, city, country } = await getLocationAndMethod();

                // 3. Update UI & Cache
                updateState(coords, params, city, country);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ coords, params, city, country }));
                setIsUsingCache(false);

            } catch (error) {
                // If fetch fails (offline), we already loaded cache if available.
                // If no cache, then show error.
                const cached = await AsyncStorage.getItem(STORAGE_KEY);
                if (!cached) {
                    setErrorMsg('حدث خطأ أثناء تحديد الموقع');
                }
                console.error(error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const updateState = (coords: any, params: any, city: string, country: string) => {
        setLatestCoords(coords);
        setLatestParams(params);
        const coordinates = new Coordinates(coords.latitude, coords.longitude);
        setLocationName(city || 'Unknown');
        setCountry(country || '');

        const dist = calculateDistance(coords.latitude, coords.longitude, KAABA_LAT, KAABA_LNG);
        setDistanceToKaaba(dist);

        const now = new Date();

        // Rehydrate params if it's a plain object (from cache)
        let calcParams = params;
        if (params && !(params instanceof CalculationParameters)) {
            calcParams = Object.create(CalculationParameters.prototype);
            Object.assign(calcParams, params);
        }

        const times = new PrayerTimes(coordinates, now, calcParams);
        setPrayerTimes(times);
        setLoading(false);
    };

    // Haversine Formula for distance
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    const formatTime = (date: Date) => {
        const time = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);

        return time.replace('AM', 'ص').replace('PM', 'م');
    };

    const toggleNotification = async (prayerId: string) => {
        const newSettings = {
            ...notificationSettings,
            [prayerId]: notificationSettings[prayerId] === false ? true : false
        };
        setNotificationSettings(newSettings);
        await AsyncStorage.setItem('@prayer_notifications_settings_v1', JSON.stringify(newSettings));

        Toast.show({
            type: 'success',
            text1: 'تنبيه',
            text2: newSettings[prayerId] !== false ? 'تم تفعيل التنبيه لهذه الصلاة' : 'تم إيقاف التنبيه',
            position: 'bottom',
            visibilityTime: 2000,
        });

        if (latestCoords && latestParams) {
            scheduleDailyPrayers(latestCoords, latestParams).catch(err => {
                console.log('Error scheduling in prayers page:', err);
            });
        }
    };

    const handleScheduleCustom = async () => {
        try {
            const [year, month, day] = testNotifDate.split('-');
            const [hourStr, minuteStr] = testNotifTime.split(':');
            let hour = Number(hourStr);
            const minute = Number(minuteStr);

            if (testNotifAmPm === 'PM' && hour < 12) hour += 12;
            if (testNotifAmPm === 'AM' && hour === 12) hour = 0;

            const triggerDate = new Date();
            triggerDate.setFullYear(Number(year), Number(month) - 1, Number(day));
            triggerDate.setHours(hour, minute, 0, 0);

            if (triggerDate.getTime() < Date.now()) {
                Toast.show({ type: 'error', text1: 'خطأ', text2: 'الوقت المختار قد مضى', position: 'bottom' });
                return;
            }

            // Schedule via Expo Notifications
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'تنبيهات ورد المؤمن',
                    body: testNotifName,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                    channelId: Platform.OS === 'android' ? 'prayers' : undefined
                } as any,
            });

            Toast.show({ type: 'success', text1: 'نجاح', text2: 'تمت إضافة التنبيه وجدولته بنجاح', position: 'bottom' });
            setTestModalVisible(false);
        } catch (e) {
            Toast.show({ type: 'error', text1: 'خطأ', text2: 'تأكد من إدخال صيغة وقت وتاريخ صحيحة', position: 'bottom' });
        }
    };

    const corePrayers = prayerTimes ? [
        { id: 'fajr', name: 'الفجر', time: prayerTimes.fajr },
        { id: 'sunrise', name: 'الشروق', time: prayerTimes.sunrise },
        { id: 'dhuhr', name: 'الظهر', time: prayerTimes.dhuhr },
        { id: 'asr', name: 'العصر', time: prayerTimes.asr },
        { id: 'maghrib', name: 'المغرب', time: prayerTimes.maghrib },
        { id: 'isha', name: 'العشاء', time: prayerTimes.isha },
    ] : [];

    const extraPrayers: any[] = [];
    if (prayerTimes) {
        const sunnahTimes = new SunnahTimes(prayerTimes);
        extraPrayers.push(
            { id: 'dhuha', name: 'الضحى', time: new Date(prayerTimes.sunrise.getTime() + 20 * 60000) }, // Approx 20 mins after sunrise
            { id: 'midnight', name: 'منتصف الليل', time: sunnahTimes.middleOfTheNight },
            { id: 'lastThird', name: 'الثلث الأخير', time: sunnahTimes.lastThirdOfTheNight }
        );
    }

    // Hijri Date Formatter
    const getHijriDate = () => {
        const today = new Date();
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };

        try {
            return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options).format(today);
        } catch (e) {
            try {
                return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', options).format(today);
            } catch (e2) {
                return new Intl.DateTimeFormat('ar-SA', options).format(today);
            }
        }
    };

    const getGregorianDate = () => {
        return new Intl.DateTimeFormat('ar-EG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'

        }).format(new Date());
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
            </View>
        );
    }

    return (
        <>
            <GradientBackground>
                <Stack.Screen
                    options={{
                        headerShown: false,
                    }}
                />

                <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>

                    {/* Header Top Section (Replaces Compass) */}
                    <View style={styles.topSection}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            {/* Placeholder for alignment */}
                            <View style={{ width: 36 }} />

                            {/* Title */}
                            <Text style={styles.pageTitle}>مواقيت الصلاة</Text>

                            {/* Test Notification Button */}
                            <TouchableOpacity
                                onPress={() => setTestModalVisible(true)}
                                activeOpacity={0.7}
                                style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}
                            >
                                <BellRing size={20} color="#fbbf24" />
                            </TouchableOpacity>
                        </View>

                        {/* Location */}
                        <View style={styles.locationBadge}>
                            <Text style={styles.locationText}>{locationName} , {country}</Text>
                            {isUsingCache && <Text style={styles.cacheText}> (محفوظ)</Text>}
                        </View>
                    </View>

                    {/* Content Section */}
                    <View style={styles.contentSection}>
                        {/* Date Header */}
                        <View style={styles.dateContainer}>
                            <Text style={styles.hijriDate}>{getHijriDate()}</Text>
                            <Text style={styles.gregorianDate}>{getGregorianDate()}</Text>
                        </View>

                        {/* Core Prayers List */}
                        <View style={styles.listContainer}>
                            {corePrayers.map((item, index) => (
                                <View key={item.id} style={styles.prayerRow}>
                                    {/* Name */}
                                    <Text style={styles.prayerName}>{item.name}</Text>

                                    {/* Icon (Speaker) */}
                                    {/* Icon (Speaker) */}
                                    <TouchableOpacity
                                        style={styles.iconContainer}
                                        onPress={() => toggleNotification(item.id)}
                                    >
                                        {notificationSettings[item.id] !== false ? (
                                            <Volume2 size={20} color="#ffffff" />
                                        ) : (
                                            <VolumeX size={20} color="rgba(255, 255, 255, 0.5)" />
                                        )}
                                    </TouchableOpacity>

                                    {/* Time */}
                                    <Text style={styles.prayerTime}>{formatTime(item.time)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Separator / Extra Times Header */}
                        <View style={styles.separatorContainer}>
                            <View style={styles.separatorLine} />
                            <View style={styles.separatorContent}>
                                <Text style={styles.separatorText}>أوقات أخرى</Text>
                                <ChevronUp size={14} color="#ffffff" />
                            </View>
                            <View style={styles.separatorLine} />
                        </View>

                        {/* Extra Prayers List */}
                        <View style={styles.listContainer2}>
                            {extraPrayers.map((item, index) => (
                                <View key={item.id} style={styles.prayerRow}>
                                    {/* Name */}
                                    <Text style={styles.prayerName2} >{item.name}</Text>

                                    {/* Empty Icon Placeholder for alignment or just empty */}
                                    <View style={styles.iconContainer} />

                                    {/* Time */}
                                    <Text style={styles.prayerTime2}>{formatTime(item.time)}</Text>
                                </View>
                            ))}
                        </View>

                    </View>

                </ScrollView>
            </GradientBackground>

            {/* Custom Notification Modal outside GradientBackground */}
            <Modal
                visible={isTestModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setTestModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#f3f4f6' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <TouchableOpacity onPress={handleScheduleCustom} style={{ backgroundColor: '#D4AF37', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                                    <Text style={{ color: '#ffffff', fontFamily: 'ReadexPro_500Medium', fontSize: 14 }}>جدولة</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setTestModalVisible(false)} style={{ paddingHorizontal: 8 }}>
                                    <Text style={{ color: '#4b5563', fontFamily: 'ReadexPro_500Medium', fontSize: 14 }}>إلغاء</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.modalTitle}>تنبيه مخصص</Text>
                            </View>


                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>الرسالة</Text>
                            <TextInput
                                style={styles.input}
                                value={testNotifName}
                                onChangeText={setTestNotifName}
                                placeholder="مثال: اقرأ اذكار الصباح"
                                placeholderTextColor="#999"
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>التاريخ (سنة-شهر-يوم)</Text>
                            <TextInput
                                style={styles.input}
                                value={testNotifDate}
                                onChangeText={setTestNotifDate}
                                placeholder="2025-10-15"
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>الوقت (دقيقة:ساعة)</Text>
                            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                                <TextInput
                                    style={[styles.input, { flex: 1, textAlign: 'center' }]}
                                    value={testNotifTime}
                                    onChangeText={setTestNotifTime}
                                    placeholder="02:30"
                                    placeholderTextColor="#999"
                                    keyboardType="number-pad"
                                />
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: testNotifAmPm === 'AM' ? '#D4AF37' : '#f9fafb', justifyContent: 'center' }}
                                    onPress={() => setTestNotifAmPm('AM')}
                                >
                                    <Text style={{ fontFamily: 'ReadexPro_500Medium', fontSize: 16, color: testNotifAmPm === 'AM' ? '#fff' : '#1a1a1a' }}>ص</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{ paddingHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, backgroundColor: testNotifAmPm === 'PM' ? '#D4AF37' : '#f9fafb', justifyContent: 'center' }}
                                    onPress={() => setTestNotifAmPm('PM')}
                                >
                                    <Text style={{ fontFamily: 'ReadexPro_500Medium', fontSize: 16, color: testNotifAmPm === 'PM' ? '#fff' : '#1a1a1a' }}>م</Text>
                                </TouchableOpacity>
                            </View>
                        </View>


                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        // paddingTop: 60, // Handled inline
        // paddingBottom: 40, // Handled inline
    },
    topSection: {
        marginBottom: 30,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    pageTitle: {
        fontSize: 28,
        fontFamily: 'ReadexPro_700Bold',
        color: '#fff',
        marginBottom: 10,
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 40,
    },
    locationBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    locationText: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'ReadexPro_600SemiBold',
        textAlign: 'center',
        lineHeight: 24,
    },
    contentSection: {
        paddingHorizontal: 24,
    },
    dateContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    gregorianDate: {
        fontSize: 16,
        color: '#ffffff',
        fontFamily: 'ReadexPro_300Light',
        textAlign: 'center',
    },
    hijriDate: {
        fontSize: 22,
        fontFamily: 'ReadexPro_300Light',
        color: '#ffffffff',
        marginBottom: 4,
        textAlign: 'center',
        lineHeight: 34,
    },
    listContainer: {
        marginTop: 10,
    },
    listContainer2: {
        marginTop: 10,
        marginBottom: 50,
    },
    prayerRow: {
        flexDirection: 'row-reverse', // RTL
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        alignItems: 'center',
        paddingVertical: 15,
        // Removed borders/backgrounds to match the clean look of the image
        // Maybe minimal separation?
        marginBottom: 8,
    },
    prayerName: {
        fontSize: 20,
        fontFamily: 'ReadexPro_500Medium',
        color: '#ffffff',
        width: 100,
        textAlign: 'right',
    },
    prayerName2: {
        fontSize: 16,
        fontFamily: 'ReadexPro_500Medium',
        color: '#ffffff',
        width: 100,
        textAlign: 'right',
    },
    prayerTime: {
        fontSize: 20,
        fontFamily: 'ReadexPro_400Regular',
        color: '#ffffff',
        width: 100,
        textAlign: 'left',
    },
    prayerTime2: {
        fontSize: 16,
        fontFamily: 'ReadexPro_400Regular',
        color: '#ffffff',
        width: 100,
        textAlign: 'left',
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
    },
    separatorContainer: {
        flexDirection: 'row-reverse', // RTL
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        gap: 10,
    },
    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ffffff', // Gray-200
    },
    separatorContent: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 4,
    },
    separatorText: {
        fontSize: 14,
        color: '#ffffff',
        fontFamily: 'ReadexPro_400Regular',
    },
    cacheText: {
        fontSize: 12,
        color: '#fbbf24',
        fontFamily: 'ReadexPro_400Regular',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'ReadexPro_600SemiBold',
        color: '#1a1a1a',
        textAlign: 'right',
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: 'ReadexPro_400Regular',
        color: '#555',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        fontFamily: 'ReadexPro_400Regular',
        color: '#1a1a1a',
        backgroundColor: '#f9fafb',
    },
});

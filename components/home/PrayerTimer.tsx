import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestPermissionsAsync } from '@/utils/notifications';
import { getLocationAndMethod } from '@/utils/prayerCalculation';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationParameters, Coordinates, PrayerTimes } from 'adhan';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PrayerTimer() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].nusuk;

    const [nextPrayer, setNextPrayer] = useState<{ name: string, time: Date, isIqamah: boolean, iqamahTime?: Date } | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('00:00');
    const [loading, setLoading] = useState(true);
    const [isUsingCache, setIsUsingCache] = useState(false);

    // تخزين بيانات الموقع لإعادة الحساب بدون طلب GPS كل دقيقة
    const cachedCoordsRef = useRef<any>(null);
    const cachedParamsRef = useRef<any>(null);

    const PRAYER_NAMES: { [key: string]: string } = {
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء',
        none: 'انتظار'
    };

    const STORAGE_KEY = '@prayer_timer_config_v1';

    const calculate = useCallback((coords: any, params: any) => {
        try {
            const coordinates = new Coordinates(coords.latitude, coords.longitude);
            const now = new Date();

            // إعادة بناء params إذا كانت من الكاش (plain object)
            let calcParams = params;
            if (params && !(params instanceof CalculationParameters)) {
                calcParams = Object.create(CalculationParameters.prototype);
                Object.assign(calcParams, params);
            }

            const prayerTimes = new PrayerTimes(coordinates, now, calcParams);
            const current = prayerTimes.currentPrayer();
            const next = prayerTimes.nextPrayer();

            let iqamahActive = false;

            // تحقق من فترة الإقامة للصلاة الحالية
            if (current !== 'none' && current !== 'sunrise') {
                const currentPrayerTime = prayerTimes.timeForPrayer(current);
                if (currentPrayerTime) {
                    // مدد الإقامة التقريبية (بالدقائق)
                    const IQAMAH_DURATIONS: Record<string, number> = {
                        fajr: 20,
                        dhuhr: 15,
                        asr: 15,
                        maghrib: 10,
                        isha: 15
                    };

                    const iqamahDuration = IQAMAH_DURATIONS[current] || 20;
                    const iqamahTime = new Date(currentPrayerTime.getTime() + iqamahDuration * 60000);

                    if (now < iqamahTime) {
                        // في وقت الإقامة
                        setNextPrayer({
                            name: PRAYER_NAMES[current],
                            time: currentPrayerTime, // نحتفظ بوقت الأذان الأساسي للعرض
                            isIqamah: true,
                            iqamahTime: iqamahTime // الوقت المستهدف للعد التنازلي
                        });
                        iqamahActive = true;
                    }
                }
            }

            if (!iqamahActive) {
                if (next === 'none') {
                    // بعد العشاء — الصلاة التالية هي فجر الغد
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowPrayerTimes = new PrayerTimes(coordinates, tomorrow, calcParams);
                    setNextPrayer({
                        name: PRAYER_NAMES['fajr'],
                        time: tomorrowPrayerTimes.fajr,
                        isIqamah: false
                    });
                } else {
                    const time = prayerTimes.timeForPrayer(next);
                    if (time) {
                        setNextPrayer({
                            name: PRAYER_NAMES[next],
                            time: time,
                            isIqamah: false
                        });
                    }
                }
            } // Close if (!iqamahActive)
            setLoading(false);
        } catch (e) {
            console.error('❌ خطأ في حساب أوقات الصلاة:', e);
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            let recalcInterval: any;

            const updatePrayerTimes = async () => {
                try {
                    // 1. تحميل الكاش أولاً للعرض السريع
                    const cached = await AsyncStorage.getItem(STORAGE_KEY);
                    if (cached) {
                        try {
                            const { coords, params } = JSON.parse(cached);
                            cachedCoordsRef.current = coords;
                            cachedParamsRef.current = params;
                            calculate(coords, params);
                            setIsUsingCache(true);
                        } catch (parseError) {
                            console.error('Error parsing cache:', parseError);
                        }
                    }

                    // 2. محاولة جلب بيانات جديدة
                    const { coords, params, city, country } = await getLocationAndMethod();

                    // 3. حفظ الكاش
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ coords, params }));

                    // 4. تحديث بالبيانات الجديدة
                    cachedCoordsRef.current = coords;
                    cachedParamsRef.current = params;
                    calculate(coords, params);
                    setIsUsingCache(false);

                } catch (e) {
                    console.log('PrayerTimer: Failed to update, using cache if available', e);
                    if (!cachedCoordsRef.current) {
                        setLoading(false);
                    }
                }
            };

            requestPermissionsAsync().then(() => {
                updatePrayerTimes();
            });

            // إعادة حساب الأوقات كل دقيقة بدون طلب GPS جديد
            recalcInterval = setInterval(() => {
                if (cachedCoordsRef.current && cachedParamsRef.current) {
                    calculate(cachedCoordsRef.current, cachedParamsRef.current);
                }
            }, 60000);

            return () => clearInterval(recalcInterval);
        }, [calculate])
    );

    // مؤقت العد التنازلي
    useEffect(() => {
        if (!nextPrayer) return;

        const timer = setInterval(() => {
            const now = new Date();
            // إذا كان وقت الإقامة، نعد تنازلياً لوقت الإقامة، وإلا لوقت الصلاة القادمة
            const targetTime = nextPrayer.isIqamah && nextPrayer.iqamahTime ? nextPrayer.iqamahTime : nextPrayer.time;
            const diff = targetTime.getTime() - now.getTime();

            if (diff <= 0) {
                // انتهى الوقت — إعادة الحساب
                if (cachedCoordsRef.current && cachedParamsRef.current) {
                    calculate(cachedCoordsRef.current, cachedParamsRef.current);
                }
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (nextPrayer.isIqamah) {
                    // عرض الدقائق والثواني للإقامة
                    setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                } else {
                    if (hours > 0) {
                        setTimeLeft(`${hours} ساعة و ${minutes.toString().padStart(2, '0')} دقيقة`);
                    } else {
                        setTimeLeft(`${minutes} دقيقة`);
                    }
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextPrayer, calculate]);



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

    return (
        <View style={styles.container}>
            {/* Kaaba Icon Circle */}
            <View style={styles.kaabaContainer}>
                <View style={styles.kaabaCircle}>
                    <FontAwesome5 name="mosque" size={32} color={colors.gradientStart} />
                </View>
            </View>

            {/* Date */}
            <View style={styles.datesContainer}>
                <Text style={styles.dateText}>{getHijriDate()}</Text>
                <View style={styles.gregorianContainer}>
                    <Text style={styles.gregorianDateText}>{
                        new Intl.DateTimeFormat('ar-EG', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            weekday: 'long'
                        }).format(new Date())
                    }</Text>
                    {isUsingCache && (
                        <View style={styles.cacheDot} />
                    )}
                </View>
            </View>

            <TouchableOpacity
                onPress={() => router.push('/(tabs)/prayers')}
                activeOpacity={0.9}
                style={{ alignItems: 'center' }}
            >
                {/* Next Prayer Time Display */}
                <View style={styles.timeContainer}>
                    <Text style={styles.prayerName}>{nextPrayer ? nextPrayer.name : '...'}</Text>
                    <Text style={styles.timeText}>
                        {nextPrayer ?
                            new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                .format(nextPrayer.time)
                                .replace('AM', '')
                                .replace('PM', '')
                                .trim()
                            : '--:--'}
                    </Text>
                    <Text style={styles.ampm}>
                        {nextPrayer ?
                            new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                .format(nextPrayer.time)
                                .includes('AM') ? 'ص' : 'م'
                            : ''}
                    </Text>
                </View>

                {/* Countdown / Remaining Time */}
                <View style={[styles.nextPrayerContainer, nextPrayer?.isIqamah && styles.iqamahContainer]}>
                    <Text style={[styles.nextPrayerText, nextPrayer?.isIqamah && styles.iqamahText]}>
                        {nextPrayer?.isIqamah ? 'الإقامة بعد' : 'متبقي'}
                    </Text>
                    <Text style={[styles.countdownText, nextPrayer?.isIqamah && styles.iqamahCountdownText]}>{timeLeft}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 35,
        marginBottom: 15,
    },
    kaabaContainer: {
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    kaabaCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        // elevation: 10,
    },
    datesContainer: {
        alignItems: 'center',
        marginBottom: 5,
        gap: 4,
    },
    dateText: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'ReadexPro_600SemiBold',
    },
    gregorianDateText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: 'ReadexPro_400Regular',
    },
    timeContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'baseline',
        gap: 8,
    },
    prayerName: {
        fontSize: 32,
        color: '#fff',
        fontFamily: 'ReadexPro_300Light',
    },
    timeText: {
        fontSize: 64,
        color: '#fff',
        lineHeight: 80,
        fontFamily: 'ReadexPro_300Light',
    },
    ampm: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'ReadexPro_300Light',
    },
    nextPrayerContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginTop: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    nextPrayerText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'ReadexPro_400Regular',
    },
    countdownText: {
        color: '#fbbf24', // Gold/Yellow for countdown
        fontSize: 18,
        fontFamily: 'ReadexPro_600SemiBold',
        marginHorizontal: 4,
        minWidth: 80, // Prevent jitter
        textAlign: 'center',
    },
    iqamahContainer: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)', // Light gold background
        borderColor: 'rgba(251, 191, 36, 0.4)',
        borderWidth: 1,
    },
    iqamahText: {
        color: '#fbbf24', // Gold
    },
    iqamahCountdownText: {
        fontSize: 20,
        color: '#fff',
        letterSpacing: 1, // Space out minutes:seconds heavily
    },
    gregorianContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cacheDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fbbf24',
    }
});

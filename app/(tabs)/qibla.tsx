import { GradientBackground } from '@/components/nusuk/GradientBackground';
import ModernCompass from '@/components/nusuk/ModernCompass';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates } from 'adhan';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Stack, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COMPASS_SIZE = Dimensions.get('window').width * 0.8;
// Kaaba Coordinates
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export default function QiblaScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const [heading, setHeading] = useState(0);
    // ...
    const [qiblaDirection, setQiblaDirection] = useState(0);
    const [locationName, setLocationName] = useState('جاري تحديد الموقع...');
    const [country, setCountry] = useState<string | undefined>(undefined);
    const [distanceToKaaba, setDistanceToKaaba] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isUsingCache, setIsUsingCache] = useState(false);

    const STORAGE_KEY = '@qibla_data_v1';

    // Haptic feedback ref
    const lastAligned = useRef(false);

    // Haptics Effect
    useEffect(() => {
        if (qiblaDirection !== 0) {
            const diff = Math.abs(heading - qiblaDirection);
            // Handle wrap-around (360)? 
            // Compass heading is usually 0-360.
            // If heading 359 and qibla 1, diff is 358. Shortest diff is 2.
            const absDiff = Math.abs(heading - qiblaDirection);
            const shortestDiff = absDiff > 180 ? 360 - absDiff : absDiff;

            if (shortestDiff < 5) { // 5 degrees tolerance
                if (!lastAligned.current) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    lastAligned.current = true;
                }
            } else {
                lastAligned.current = false;
            }
        }
    }, [heading, qiblaDirection]);

    useFocusEffect(
        useCallback(() => {
            let subscription: Location.LocationSubscription | null = null;
            let headingSubscription: any = null;

            const loadCache = async () => {
                try {
                    const cached = await AsyncStorage.getItem(STORAGE_KEY);
                    if (cached) {
                        const data = JSON.parse(cached);
                        setQiblaDirection(data.qiblaDirection);
                        setLocationName(data.locationName);
                        setCountry(data.country);
                        setDistanceToKaaba(data.distanceToKaaba);
                        setLoading(false);
                        setIsUsingCache(true);
                    }
                } catch (e) {
                    console.log('Failed to load qibla cache');
                }
            };

            const startCompass = async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('تم رفض إذن الوصول للموقع');
                    setLoading(false);
                    return;
                }

                headingSubscription = await Location.watchHeadingAsync((obj) => {
                    setHeading(obj.magHeading);
                });
            };

            // Load cache then start fetching
            loadCache().then(() => {
                startCompass();
                getLocation();
            });

            return () => {
                // subscription?.remove(); // Fixed: subscription is not used for heading here in original code, it was 'headingSubscription' conceptual mixup, watchHeadingAsync returns a subscription object
                if (headingSubscription) headingSubscription.remove();
            };
        }, [])
    );

    const getLocation = async () => {
        try {
            let location = await Location.getCurrentPositionAsync({});
            const coords = new Coordinates(location.coords.latitude, location.coords.longitude);

            // Calculate Distance
            const dist = calculateDistance(location.coords.latitude, location.coords.longitude, KAABA_LAT, KAABA_LNG);
            setDistanceToKaaba(dist);

            // Calculate Qibla
            const { Qibla } = require('adhan');
            const qibla = Qibla(coords);
            setQiblaDirection(qibla);

            // Get address
            let address = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            let cityName = locationName;
            let countryName = country;

            if (address && address.length > 0) {
                const addr = address[0];
                cityName = addr.city || addr.region || '';
                countryName = addr.country || '';

                setLocationName(cityName);
                setCountry(countryName);
            }

            // Save to Cache
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
                qiblaDirection: qibla,
                locationName: cityName,
                country: countryName,
                distanceToKaaba: dist
            }));

            setIsUsingCache(false);

        } catch (error) {
            // setErrorMsg('حدث خطأ أثناء تحديد الموقع'); // Don't show error if we have cache, or maybe show silent error
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    // Haversine Formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d;
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.loadingText}>جاري إعداد القبلة...</Text>
            </View>
        );
    }

    if (errorMsg) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity onPress={getLocation} style={styles.retryButton}>
                    <Text style={styles.retryText}>إعادة المحاولة</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <GradientBackground>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />
            <View style={[styles.contentContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 90 }]}>
                <Text style={styles.pageTitle}>اتجاه القبلة</Text>
                {isUsingCache && (
                    <View style={styles.cacheIndicator}>
                        <Text style={styles.cacheText}>آخر موقع محفوظ (غير متصل)</Text>
                    </View>
                )}
                <ModernCompass
                    heading={heading}
                    qiblaDirection={qiblaDirection}
                    city={locationName}
                    country={country}
                    distanceKm={distanceToKaaba}
                />
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        // paddingTop: 60, // Handled inline
        // Remove justifyContent: 'center' to allow title at top and compass below
    },
    pageTitle: {
        fontSize: 32,
        fontFamily: 'ReadexPro_700Bold',
        color: '#fff',
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        fontFamily: 'ReadexPro_400Regular',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'ReadexPro_400Regular',
    },
    retryButton: {
        padding: 10,
        backgroundColor: '#333',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontFamily: 'ReadexPro_500Medium',
    },
    cacheIndicator: {
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 165, 0, 0.5)',
    },
    cacheText: {
        color: '#FFA500',
        fontSize: 12,
        fontFamily: 'ReadexPro_400Regular',
    },
});

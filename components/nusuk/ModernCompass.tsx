import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { ArrowLeft, ArrowRight, Navigation } from 'lucide-react-native';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.75;

interface ModernCompassProps {
    heading: number;
    qiblaDirection: number;
    city: string;
    country?: string;
    distanceKm: number;
}

export default function ModernCompass({ heading, qiblaDirection, city, country, distanceKm }: ModernCompassProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].nusuk;

    // Normalization to 0-360
    const normalize = (deg: number) => {
        if (isNaN(deg)) return 0;
        let n = deg % 360;
        if (n < 0) n += 360;
        return n;
    };

    const shortestDiff = (() => {
        let diff = Math.abs(normalize(heading) - normalize(qiblaDirection));
        return diff > 180 ? 360 - diff : diff;
    })();

    const isAligned = shortestDiff < 5;

    return (
        <View style={styles.container}>
            {/* Header Info */}
            <View style={styles.header}>
                <Text style={styles.locationTitle}>
                    {city || "جاري تحديد الموقع..."}
                    {country ? `, ${country}` : ''}
                </Text>
            </View>

            {/* Compass Section */}
            <View style={styles.compassWrapper}>
                {/* Rotating Dial (Cardinal Directions) - Bottom Layer */}
                <View
                    style={[
                        styles.dialContainer,
                        { transform: [{ rotate: `${-heading}deg` }] }
                    ]}
                    pointerEvents="none"
                >
                    <View style={styles.ring}>
                        {/* Empty ring or add N/S/E/W in future */}
                    </View>
                </View>

                {/* Fixed Kaaba at Top (Target) - Middle Layer */}
                <View style={[styles.kaabaContainer, { zIndex: 20 }]}>
                    <View style={styles.kaabaIconWrapper}>
                        <View style={styles.iconCircle}>
                            <FontAwesome5 name="kaaba" size={24} color="#000" />
                        </View>
                    </View>
                    <View style={styles.guideline} />
                </View>

                {/* Arrow Pointing to Qibla - Top-most Layer */}
                <View style={[
                    styles.arrowContainer,
                    {
                        zIndex: 999,
                        // elevation: 20,
                        transform: [{ rotate: `${normalize(qiblaDirection - heading - 45)}deg` }],
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                    }
                ]}>
                    <Navigation
                        size={44}
                        color={isAligned ? colors.gold : "#ffffff"}
                        fill={isAligned ? colors.gold : "#ffffff"}
                    />
                </View>
            </View>

            {/* Directional Guidance + Status Text */}
            <View style={styles.statusContainer}>
                {isAligned ? (
                    <View style={[
                        styles.alignedBox,
                        {
                            backgroundColor: 'rgba(212, 175, 55, 0.25)', // Gold with opacity
                            borderColor: colors.gold,
                            shadowColor: colors.gold,
                        }
                    ]}>
                        <Text style={styles.alignedText}>استقبال القبلة</Text>
                    </View>
                ) : (
                    <View style={styles.guidanceBox}>
                        <View style={styles.instructionRow}>
                            {(() => {
                                let delta = normalize(qiblaDirection) - normalize(heading);
                                if (delta > 180) delta -= 360;
                                if (delta < -180) delta += 360;

                                if (delta > 0) {
                                    return (
                                        <>
                                            <Text style={styles.guidanceText}>در لليمين</Text>
                                            <ArrowRight size={24} color="#fff" />
                                        </>
                                    );
                                } else {
                                    return (
                                        <>
                                            <ArrowLeft size={24} color="#fff" />
                                            <Text style={styles.guidanceText}>در لليسار</Text>
                                        </>
                                    );
                                }
                            })()}
                        </View>
                        <Text style={styles.distanceText}>إلى الكعبة {Math.round(distanceKm)} كم</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        overflow: 'visible',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    locationTitle: {
        fontSize: 20,
        fontFamily: 'ReadexPro_700Bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
        lineHeight: 30, // Prevent clipping
    },
    compassWrapper: {
        marginTop: 20,
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible', // Critical for ensuring arrow isn't clipped
    },
    dialContainer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    ring: {
        width: '100%',
        height: '100%',
        borderRadius: COMPASS_SIZE / 2,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 44,
        height: 44,
        marginTop: -22,
        marginLeft: -22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    kaabaContainer: {
        position: 'absolute',
        top: -24,
        width: 44,
        height: '50%',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    guideline: {
        width: 2,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        position: 'absolute',
        top: 22,
    },
    kaabaIconWrapper: {
        zIndex: 50,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        // elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    statusContainer: {
        marginTop: 60,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    alignedBox: {
        // backgroundColor, borderColor, and shadowColor set dynamically in render
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 35,
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        // elevation: 5,
    },
    alignedText: {
        fontSize: 22,
        fontFamily: 'ReadexPro_700Bold',
        color: '#ffffff',
        textAlign: 'center',
    },
    guidanceBox: {
        alignItems: 'center',
        gap: 10,
    },
    instructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    guidanceText: {
        fontSize: 20,
        fontFamily: 'ReadexPro_500Medium',
        color: '#fff',
        textAlign: 'center',
    },
    distanceText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'ReadexPro_400Regular',
        textAlign: 'center',
        lineHeight: 24, // Prevent clipping
    }
});

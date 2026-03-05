import { FontAwesome5 } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

const QuickAction = ({ iconName, label, onPress }: { iconName: string; label: string; onPress: () => void }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.actionItem}>
            <View style={styles.circle}>
                <FontAwesome5 name={iconName} size={24} color="#fff" />
            </View>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
        </TouchableOpacity>
    );
};

const RadioAction = () => {
    const [player, setPlayer] = useState<AudioPlayer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('stop_all_audio', (sourceId) => {
            if (sourceId !== 'radio') {
                if (isPlaying && player) {
                    player.pause();
                    setIsPlaying(false);
                    if (typeof player.setActiveForLockScreen === 'function') {
                        player.setActiveForLockScreen(false);
                    }
                }
            }
        });
        return () => sub.remove();
    }, [isPlaying, player]);

    async function handleToggle() {
        if (isLoading) return;

        try {
            if (isPlaying) {
                if (player) {
                    player.pause();
                    if (typeof player.setActiveForLockScreen === 'function') {
                        player.setActiveForLockScreen(false);
                    }
                    setIsPlaying(false);
                }
            } else {
                const networkState = await NetInfo.fetch();
                if (!networkState.isConnected) {
                    Toast.show({
                        type: 'error',
                        text1: 'تنبيه',
                        text2: 'تأكد من اتصالك بالإنترنت لتشغيل الإذاعة',
                        position: 'bottom',
                    });
                    return;
                }

                DeviceEventEmitter.emit('stop_all_audio', 'radio');
                setIsLoading(true);
                if (player) {
                    if (typeof player.setActiveForLockScreen === 'function') {
                        player.setActiveForLockScreen(true, {
                            title: 'إذاعة القرآن الكريم',
                        });
                    }
                    player.play();
                    setIsPlaying(true);
                } else {
                    await setAudioModeAsync({
                        playsInSilentMode: true,
                        shouldPlayInBackground: true,
                        interruptionMode: 'doNotMix',
                    });
                    const newPlayer = createAudioPlayer(
                        'https://n01.radiojar.com/8s5u5tpdtwzuv?rj-ttl=5&rj-tok=AAABnIB1lK4ApqMl2vLfq9nV7g'
                    );
                    if (typeof newPlayer.setActiveForLockScreen === 'function') {
                        newPlayer.setActiveForLockScreen(true, {
                            title: 'إذاعة القرآن الكريم',
                        });
                    }
                    newPlayer.play();
                    setPlayer(newPlayer);
                    setIsPlaying(true);
                }
                setIsLoading(false);
            }
        } catch (error) {
            console.log('Error playing radio: ', error);
            setIsLoading(false);
        }
    }

    useEffect(() => {
        return player
            ? () => {
                player.remove();
            }
            : undefined;
    }, [player]);

    return (
        <TouchableOpacity onPress={handleToggle} style={styles.actionItem}>
            <View style={[styles.circle, isPlaying && { borderColor: '#D4AF37', backgroundColor: 'rgba(212, 175, 55, 0.4)' }]}>
                {isLoading ? (
                    <ActivityIndicator color={isPlaying ? "#D4AF37" : "#fff"} />
                ) : (
                    <FontAwesome5 name={isPlaying ? "pause" : "broadcast-tower"} size={24} color={isPlaying ? "#D4AF37" : "#fff"} />
                )}
            </View>
            <Text style={styles.label} numberOfLines={1}>إذاعة القرآن</Text>
        </TouchableOpacity>
    );
};

export function QuickAccess() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <QuickAction
                    iconName="headphones"
                    label="الاستماع للقرآن"
                    onPress={() => router.push('/(tabs)/listen')}
                />
                <QuickAction
                    iconName="praying-hands"
                    label="الأذكار"
                    onPress={() => router.push('/azkar')}
                />
                <QuickAction
                    iconName="book-open"
                    label="القرآن الكريم"
                    onPress={() => router.push('/quran-web')}
                />

                <QuickAction
                    iconName="book-reader"
                    label="تفسير القرآن"
                    onPress={() => router.push('/tafsir' )}
                />

            </View>

            <View style={styles.row}>
                <RadioAction />
                {/* <QuickAction
                    iconName="kaaba"
                    label="القبلة"
                    onPress={() => router.push('/(tabs)/qibla')}
                /> */}
                <QuickAction
                    iconName="mosque"
                    label="الصلاة"
                    onPress={() => router.push('/(tabs)/prayers')}
                />
                <QuickAction
                    iconName="stopwatch"
                    label="السبحة"
                    onPress={() => router.push('/tasbih')}
                />
                <QuickAction
                    iconName="bell"
                    label="التنبيهات"
                    onPress={() => router.push('/settings')}
                />

                {/* <View style={{ flex: 1 }} /> */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginTop: 20,
        paddingHorizontal: 20,
        gap: 25,
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',

    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
        flex: 1,

    },
    circle: {
        width: 56,
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        // elevation: 0,
    },
    label: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'ReadexPro_400Regular',
        lineHeight: 20,
    },
});

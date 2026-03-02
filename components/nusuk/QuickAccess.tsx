import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleToggle() {
        if (isLoading) return;

        try {
            if (isPlaying) {
                if (sound) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                }
            } else {
                setIsLoading(true);
                if (sound) {
                    await sound.playAsync();
                    setIsPlaying(true);
                } else {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                        playsInSilentModeIOS: true,
                        staysActiveInBackground: true,
                    });
                    const { sound: newSound } = await Audio.Sound.createAsync(
                        { uri: 'https://n01.radiojar.com/8s5u5tpdtwzuv?rj-ttl=5&rj-tok=AAABnIB1lK4ApqMl2vLfq9nV7g' },
                        { shouldPlay: true }
                    );
                    setSound(newSound);
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
        return sound
            ? () => {
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);

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
            <RadioAction />
            <QuickAction
                iconName="praying-hands"
                label="الأذكار"
                onPress={() => router.push('/azkar')}
            />
            {/* <QuickAction
                iconName="kaaba"
                label="القبلة"
                onPress={() => router.push('/(tabs)/qibla')}
            /> */}

            <QuickAction
                iconName="book-open"
                label="القرآن الكريم"
                onPress={() => router.push('/quran-web')}
            />

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



        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 30,
        paddingHorizontal: 20,
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
    },
});

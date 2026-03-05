import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const { width } = Dimensions.get('window');

export function QuranSheet() {
    const router = useRouter();

    const handlePress = () => {
        router.push('/quran-web');
    };

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.9} onPress={handlePress}>
            <View style={styles.handleContainer}>
                <View style={styles.handle} />
            </View>

            <View style={styles.header}>
                <Text style={styles.title}>القرآن الكريم</Text>
                <FontAwesome5 name="book-open" size={24} color="#D4AF37" />
            </View>

            <View style={styles.content}>
                <Text style={styles.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
                <Text style={styles.verses}>
                    ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ۝ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ مَٰلِكِ يَوْمِ ٱلدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ
                </Text>
            </View>

            {/* Fade effect at bottom */}
            <View style={styles.fadeOverlay} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        // paddingBottom: 40,
        marginTop: 20,
        width: width,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // elevation: 20,
        // flex: 1, // Removed flex: 1 as it might cause layout issues in ScrollView
    },
    handleContainer: {
        alignItems: 'center',
        // marginBottom: 16,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        // marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontFamily: 'hafssmart', // Updated font
        color: '#374151',
    },
    content: {
        alignItems: 'center',
    },
    bismillah: {
        fontSize: 20,
        fontFamily: 'hafssmart', // Updated font
        marginBottom: 5,
        color: '#1F2937',
    },
    verses: {
        fontSize: 18,
        fontFamily: 'hafssmart', // Updated font
        lineHeight: 32,
        textAlign: 'center',
        color: '#4B5563',
    },
    fadeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        // Linear gradient white to transparent needed here really, but regular View with opacity works for now
        backgroundColor: 'rgba(255,255,255,0.8)',
    }
});

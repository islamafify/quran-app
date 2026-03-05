import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
    variant?: 'light' | 'dark';
}

export function Header({ variant = 'dark' }: HeaderProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].nusuk;

    const iconColor = variant === 'dark' ? '#fff' : colors.textPrimary;
    const avatarBg = variant === 'dark' ? colors.gold : '#E8AF8C';

    const handleShareApp = async () => {
        try {
            const androidLink = 'https://play.google.com/store/apps/details?id=com.wirdalmuomin.app';
            const iosLink = 'https://apps.apple.com/app/6759333147'; // استبدله برقم التطبيق الفعلي

            const message = `تطبيق ورد المؤمن  - رفيقك اليومي للقرآن والأذكار ومواقيت الصلاة.\nشارك التطبيق بنية الصدقة الجارية.\n\nللأندرويد:\n${androidLink}\n\nللأيفون:\n${iosLink}`;

            await Share.share({
                message: message,
                // url: Platform.OS === 'ios' ? iosLink : androidLink,
                title: 'تطبيق ورد المؤمن'

            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
            <View style={styles.content}>
                {/* Left: User Avatar */}
                {/* <TouchableOpacity style={[styles.avatar, { backgroundColor: avatarBg }]}>
                    <Text style={styles.avatarText}>I</Text>
                </TouchableOpacity> */}
                <TouchableOpacity onPress={() => router.push('/contact-us')}>
                    <View style={styles.kaabaContainer}>
                        <View style={styles.kaabaCircle}>
                            <FontAwesome5 name='comment' size={20} color={'#fff'} />
                        </View>
                    </View>
                </TouchableOpacity>



                {/* Right: Actions */}
                {/* Right: Actions - Sadaqah Jariyah Share */}
                <TouchableOpacity style={styles.shareBtn} onPress={handleShareApp}>
                    <Text style={styles.shareBtnText}>شارك كصدقة جارية</Text>
                    <Share2 size={16} color="#fff" strokeWidth={2} />
                </TouchableOpacity>

                {/* <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Bell size={24} color={iconColor} strokeWidth={1.5} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Grid size={24} color={iconColor} strokeWidth={1.5} />
                    </TouchableOpacity>
                </View> */}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    kaabaContainer: {
        // marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    kaabaCircle: {
        width: 40,
        height: 40,
        borderRadius: 32,
        backgroundColor: '#EAB308',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        // elevation: 10,
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'ReadexPro_600SemiBold', // Updated font
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontFamily: 'ReadexPro_500Medium', // Updated font
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAB308',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    shareBtnText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: 'ReadexPro_600SemiBold',
    },
});

import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- Types ---
interface Azkar_text1Category {
    id: string;
    title: string;
    subtitle: string;
    iconName: string;
    count?: number;
    total?: number;
}

const CATEGORIES: Azkar_text1Category[] = [
    { id: 'evening', title: 'أذكار المساء', subtitle: 'Evening Adhkar', iconName: 'cloud-moon' },
    { id: 'morning', title: 'أذكار الصباح', subtitle: 'Morning Adhkar', iconName: 'cloud-sun' },
    { id: 'prophetic', title: 'أدعية نبوية', subtitle: 'Prophetic Duas', iconName: 'praying-hands' },
    { id: 'quranic', title: 'أدعية قرآنية', subtitle: 'Quranic Duas', iconName: 'quran' },
    { id: 'comprehensive', title: 'جوامع الدعاء', subtitle: 'Comprehensive Duas', iconName: 'layer-group' },
    { id: 'ruqyah', title: 'الرقية الشرعية', subtitle: 'Ruqyah Shariyah', iconName: 'shield-alt' },
    { id: 'istighfar', title: 'أدعية الاستغفار', subtitle: 'Forgiveness Duas', iconName: 'hand-holding-heart' },
    { id: 'prayer', title: 'أذكار الصلاة', subtitle: 'Prayer Adhkar', iconName: 'mosque' },
    { id: 'sleep', title: 'أذكار النوم', subtitle: 'Sleep Adhkar', iconName: 'bed' },
    { id: 'waking', title: 'أذكار الاستيقاظ', subtitle: 'Waking Adhkar', iconName: 'sun' },
    { id: 'travel', title: 'دعاء السفر', subtitle: 'Travel Adhkar', iconName: 'plane-departure' },
    { id: 'hajj', title: 'الحج والعمرة', subtitle: 'Hajj & Umrah', iconName: 'kaaba' },
    { id: 'quran_khatm', title: 'دعاء ختم القران', subtitle: 'Quran Khatm Dua', iconName: 'book-open' },
    { id: 'dead', title: 'أدعية للميت', subtitle: 'Duas for Deceased', iconName: 'dove' },
];

export default function Azkar_text1Screen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const renderItem = ({ item }: { item: Azkar_text1Category }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/azkar/[id]', params: { id: item.id } })}
        >
            <View style={styles.iconContainer}>
                <FontAwesome5 name={item.iconName} size={24} color="#EAB308" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={['#4A1C40', '#E8AF8C']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>


                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>الأذكار والأدعية</Text>
                    <Text style={styles.headerSubtitle}>حصن المسلم اليومي</Text>
                </View>

                <View style={styles.placeholderIcon} />
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(tabs)')}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Grid */}
            <FlatList
                data={CATEGORIES}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 25,
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    placeholderIcon: {
        width: 45,
    },
    headerTitleContainer: {
        alignItems: 'center',

    },
    headerTitle: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'ReadexPro_700Bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(234, 179, 8, 0.9)', // Gold accent
        fontFamily: 'ReadexPro_400Regular',
    },
    progressSection: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressTitle: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'ReadexPro_600SemiBold',
    },
    progressCounter: {
        fontSize: 16,
        color: '#EAB308',
        fontFamily: 'ReadexPro_700Bold',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#EAB308',
        borderRadius: 4,
    },
    progressLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'ReadexPro_400Regular',
        textAlign: 'right',
    },
    listContent: {
        paddingHorizontal: 15,

    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,

    },
    card: {
        backgroundColor: 'rgba(10, 10, 10, 0.2)',
        width: (width - 50) / 2,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    textContainer: {
        gap: 4,
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        color: '#fff',
        fontFamily: 'ReadexPro_600SemiBold',
        lineHeight: 30,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'ReadexPro_400Regular',
        textAlign: 'center',

    },
});
